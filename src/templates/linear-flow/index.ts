import type { Template, BrandConfig } from '../../core/types.js';
import { escapeHtml } from '../../core/sanitize.js';

interface FlowNode {
  id: string;
  label: string;
  type?: 'default' | 'accent' | 'start' | 'end';
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

/**
 * Linear Flow Template
 * Simple linear flowchart from structured data
 * Note: Constrained to linear chains only - no branching/cycles
 */
export const linearFlow: Template = {
  name: 'linear-flow',
  description: 'Simple linear flowchart diagram from nodes and edges',
  category: 'diagram',
  defaultSize: { width: 1200, height: 400 },
  props: {
    nodes: {
      type: 'array',
      required: true,
      description: 'Array of nodes with id, label, and optional type',
    },
    edges: {
      type: 'array',
      required: true,
      description: 'Array of edges connecting nodes (from, to)',
    },
    title: {
      type: 'string',
      required: false,
      default: '',
      description: 'Optional diagram title',
    },
  },
  render: (props: Record<string, unknown>, brand: BrandConfig): string => {
    const nodes = (props['nodes'] as FlowNode[]) || [];
    const edges = (props['edges'] as FlowEdge[]) || [];
    const title = props['title'] ? escapeHtml(String(props['title'])) : '';

    // Validate: max 10 nodes, linear only
    if (nodes.length > 10) {
      throw new Error('linear-flow: Maximum 10 nodes allowed');
    }

    // Build ordered node list from edges (linear chain)
    const orderedNodes = buildLinearOrder(nodes, edges);

    const bgColor = brand.colors['background']?.value || '#FFFFFF';
    const textColor = brand.colors['text']?.value || '#1A1A2E';
    const fontFamily = brand.typography['body']?.family || 'Inter';
    const spacing = brand.spacing.scales;
    const diagramConfig = brand.diagram || {
      nodeColors: { default: '#E8F0FE', accent: '#FFF3E0' },
      edgeColor: '#6B7280',
      borderRadius: 8,
    };

    const nodeWidth = Math.min(180, Math.floor(1000 / Math.max(orderedNodes.length, 1)));

    const nodesHtml = orderedNodes
      .map((node, index) => {
        const nodeColor =
          node.type === 'accent'
            ? diagramConfig.nodeColors['accent'] || '#FFF3E0'
            : diagramConfig.nodeColors['default'] || '#E8F0FE';

        return `
          <div style="display: flex; flex-direction: row; align-items: center;">
            <div style="display: flex; justify-content: center; align-items: center; width: ${nodeWidth}px; height: 60px; padding: ${spacing['sm'] || 8}px ${spacing['md'] || 16}px; background-color: ${nodeColor}; border-radius: ${diagramConfig.borderRadius}px; border: 2px solid ${diagramConfig.edgeColor}40;">
              <div style="display: flex; font-family: ${fontFamily}; font-weight: 500; font-size: 14px; color: ${textColor}; text-align: center;">
                ${escapeHtml(node.label)}
              </div>
            </div>
            ${index < orderedNodes.length - 1 ? `
            <div style="display: flex; flex-direction: row; align-items: center; width: 50px;">
              <div style="display: flex; width: 35px; height: 2px; background-color: ${diagramConfig.edgeColor};"></div>
              <div style="display: flex; width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 10px solid ${diagramConfig.edgeColor};"></div>
            </div>
            ` : ''}
          </div>
        `;
      })
      .join('');

    return `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: ${spacing['xl'] || 32}px; background-color: ${bgColor};">
        ${title ? `
        <div style="display: flex; font-family: ${fontFamily}; font-weight: 700; font-size: 24px; color: ${textColor}; margin-bottom: ${spacing['lg'] || 24}px;">
          ${title}
        </div>
        ` : ''}
        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
          ${nodesHtml}
        </div>
      </div>
    `;
  },
};

/**
 * Build linear order from nodes and edges
 * Validates that the graph is a simple linear chain (no branching)
 */
function buildLinearOrder(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return nodes;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outEdges = new Map<string, string>();
  const inEdges = new Map<string, string>();

  for (const edge of edges) {
    if (outEdges.has(edge.from)) {
      throw new Error('linear-flow: Branching not allowed (node has multiple outgoing edges)');
    }
    if (inEdges.has(edge.to)) {
      throw new Error('linear-flow: Merging not allowed (node has multiple incoming edges)');
    }
    outEdges.set(edge.from, edge.to);
    inEdges.set(edge.to, edge.from);
  }

  // Find start node (no incoming edges)
  let startNode: FlowNode | undefined;
  for (const node of nodes) {
    if (!inEdges.has(node.id)) {
      if (startNode) {
        throw new Error('linear-flow: Multiple start nodes found');
      }
      startNode = node;
    }
  }

  if (!startNode) {
    // Cycle detected or no clear start
    return nodes;
  }

  // Build ordered list
  const ordered: FlowNode[] = [startNode];
  let current = startNode.id;

  while (outEdges.has(current)) {
    const nextId = outEdges.get(current)!;
    const nextNode = nodeMap.get(nextId);
    if (!nextNode) break;
    ordered.push(nextNode);
    current = nextId;
  }

  return ordered;
}
