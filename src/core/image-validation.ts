import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Image magic bytes for validation
 */
const MAGIC_BYTES = {
  png: [0x89, 0x50, 0x4e, 0x47], // PNG: 89 50 4E 47
  jpg: [0xff, 0xd8, 0xff], // JPEG: FF D8 FF
  webp: [0x52, 0x49, 0x46, 0x46], // WebP: RIFF (52 49 46 46)
};

/**
 * Maximum image size before resize (2MB)
 */
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

/**
 * Maximum total images to process
 */
export const MAX_IMAGES = 100;

/**
 * Validate path is within project root (prevent traversal)
 */
export function validateReferencesPath(refsPath: string, projectRoot: string = process.cwd()): string {
  const resolved = path.resolve(refsPath);
  const resolvedRoot = path.resolve(projectRoot);

  if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
    throw new Error(`References path "${refsPath}" is outside project root`);
  }

  return resolved;
}

/**
 * Check if path is a symlink (not allowed)
 */
export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Validate image file via magic bytes
 * Returns the detected format or null if invalid
 */
export async function validateImageMagicBytes(
  filePath: string
): Promise<'png' | 'jpg' | 'webp' | null> {
  try {
    const handle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    await handle.close();

    // Check PNG
    if (MAGIC_BYTES.png.every((byte, i) => buffer[i] === byte)) {
      return 'png';
    }

    // Check JPEG
    if (MAGIC_BYTES.jpg.every((byte, i) => buffer[i] === byte)) {
      return 'jpg';
    }

    // Check WebP (RIFF....WEBP)
    if (
      MAGIC_BYTES.webp.every((byte, i) => buffer[i] === byte) &&
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50 // P
    ) {
      return 'webp';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Rasterize SVG to PNG using Sharp
 */
export async function rasterizeSvg(svgPath: string): Promise<Buffer> {
  const svgBuffer = await fs.readFile(svgPath);
  return sharp(svgBuffer).png().toBuffer();
}

/**
 * Resize image if larger than MAX_IMAGE_SIZE
 */
export async function resizeIfNeeded(imageBuffer: Buffer): Promise<Buffer> {
  if (imageBuffer.length <= MAX_IMAGE_SIZE) {
    return imageBuffer;
  }

  // Resize to reduce file size (reduce dimensions by ~30%)
  const metadata = await sharp(imageBuffer).metadata();
  const newWidth = Math.round((metadata.width || 1000) * 0.7);

  return sharp(imageBuffer).resize({ width: newWidth }).jpeg({ quality: 85 }).toBuffer();
}

/**
 * Load and validate an image file
 * Returns buffer ready for API, or null if invalid
 */
export async function loadValidatedImage(
  filePath: string
): Promise<{ buffer: Buffer; format: string } | null> {
  const ext = path.extname(filePath).toLowerCase();

  // Handle SVG (rasterize first)
  if (ext === '.svg') {
    try {
      const buffer = await rasterizeSvg(filePath);
      const resized = await resizeIfNeeded(buffer);
      return { buffer: resized, format: 'png' };
    } catch {
      return null;
    }
  }

  // Validate magic bytes for raster images
  const format = await validateImageMagicBytes(filePath);
  if (!format) {
    return null;
  }

  // Load and resize if needed
  const buffer = await fs.readFile(filePath);
  const resized = await resizeIfNeeded(buffer);

  return { buffer: resized, format };
}
