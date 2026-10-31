/**
 * PocketLab Image Import
 * 
 * Handles importing photos from the device gallery.
 * - Copies original to app sandbox
 * - Extracts EXIF metadata
 * - Generates proxy image for editing
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import type { SourceImage, ColorSpace } from '../../model/types';

// ============================================================================
// Types
// ============================================================================

export interface ImportResult {
  success: boolean;
  source?: SourceImage;
  proxyPath?: string;
  error?: string;
}

export interface ImportOptions {
  /** Maximum long edge for proxy image (default: 2048) */
  proxyLongEdge?: number;
  /** Allow editing multiple images (default: false) */
  allowsMultipleSelection?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PROXY_LONG_EDGE = 2048;
const PROJECTS_DIR = `${FileSystem.documentDirectory}projects/`;
const PROXY_DIR = `${FileSystem.documentDirectory}proxies/`;

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Request permissions and launch image picker.
 */
export async function pickImage(
  options: ImportOptions = {}
): Promise<ImportResult> {
  const { proxyLongEdge = DEFAULT_PROXY_LONG_EDGE } = options;

  // Request permissions
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    return {
      success: false,
      error: 'Permission to access media library was denied',
    };
  }

  // Launch picker
  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: false,
    quality: 1.0, // Full quality
    exif: true,
  });

  if (pickerResult.canceled) {
    return {
      success: false,
      error: 'Image selection was canceled',
    };
  }

  const asset = pickerResult.assets[0];
  if (!asset) {
    return {
      success: false,
      error: 'No image asset returned',
    };
  }

  try {
    // Ensure directories exist
    await FileSystem.makeDirectoryAsync(PROJECTS_DIR, { intermediates: true });
    await FileSystem.makeDirectoryAsync(PROXY_DIR, { intermediates: true });

    // Generate unique ID for this import
    const projectId = `project_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Determine file extension
    const uri = asset.uri;
    const extension = getFileExtension(uri);
    
    // Copy original to sandbox
    const originalPath = `${PROJECTS_DIR}${projectId}_original${extension}`;
    await FileSystem.copyAsync({
      from: uri,
      to: originalPath,
    });

    // Extract EXIF data
    const exif = asset.exif ?? {};
    const orientation = exif.Orientation ?? 1;
    const colorSpace = detectColorSpace(exif, extension);

    // Get image dimensions
    const dimensions = await getImageDimensions(originalPath);

    // Create source image metadata
    const source: SourceImage = {
      path: originalPath,
      width: dimensions.width,
      height: dimensions.height,
      orientation,
      colorSpace,
      originalAssetId: asset.assetId,
    };

    // Generate proxy
    const proxyPath = await generateProxy(originalPath, projectId, proxyLongEdge);

    return {
      success: true,
      source,
      proxyPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during import',
    };
  }
}

/**
 * Get file extension from URI.
 */
function getFileExtension(uri: string): string {
  const match = uri.match(/\.([^.]+)$/);
  if (match) {
    return `.${match[1].toLowerCase()}`;
  }
  return '.jpg'; // Default
}

/**
 * Detect color space from EXIF data and file extension.
 */
function detectColorSpace(exif: Record<string, unknown>, extension: string): ColorSpace {
  // HEIC files from iPhone are typically Display P3
  if (extension === '.heic' || extension === '.heif') {
    return 'display-p3';
  }

  // Check EXIF for color space info
  // Note: EXIF color space detection is not always reliable
  const colorSpace = exif.ColorSpace as number | undefined;
  if (colorSpace === 2) {
    return 'srgb';
  }
  if (colorSpace === 65535) {
    return 'display-p3';
  }

  return 'unknown';
}

/**
 * Get image dimensions from file.
 */
async function getImageDimensions(path: string): Promise<{ width: number; height: number }> {
  // Use Image.getSize or a native module
  // For now, return a placeholder - this needs actual implementation
  // with expo-image-manipulator or similar
  
  // TODO: Implement actual dimension detection
  // This is a placeholder that will be replaced with actual implementation
  return { width: 4000, height: 3000 };
}

/**
 * Generate a proxy image for editing.
 * Downscaled to proxyLongEdge on the long side.
 */
async function generateProxy(
  originalPath: string,
  projectId: string,
  proxyLongEdge: number
): Promise<string> {
  const proxyPath = `${PROXY_DIR}${projectId}_proxy.jpg`;

  // TODO: Implement actual proxy generation
  // This needs expo-image-manipulator or similar to resize the image
  // For now, just copy the original as a placeholder
  
  await FileSystem.copyAsync({
    from: originalPath,
    to: proxyPath,
  });

  return proxyPath;
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Delete all files associated with a project.
 */
export async function deleteProjectFiles(projectId: string): Promise<void> {
  try {
    // Delete original
    const originalPattern = `${PROJECTS_DIR}${projectId}_original`;
    // Note: FileSystem doesn't support glob patterns, so we need to track files
    // This is a simplified version
    
    // Delete proxy
    const proxyPattern = `${PROXY_DIR}${projectId}_proxy`;
    
    // In practice, you'd want to track all file paths in the project metadata
    // and delete them explicitly
  } catch (error) {
    console.error('Failed to delete project files:', error);
  }
}

/**
 * Check if a file exists.
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}
