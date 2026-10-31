/**
 * PocketLab Persistence — Project Storage
 * 
 * Handles saving and loading project files.
 * Uses atomic writes (write to temp, then rename).
 */

import * as FileSystem from 'expo-file-system';
import type { ProjectFile, EditState, SourceImage } from '../model/types';
import { SCHEMA_VERSION } from '../model/types';
import { migrateProjectFile } from '../model/migrations';
import { getDatabase } from '../database/database';

// ============================================================================
// Constants
// ============================================================================

const PROJECTS_DIR = `${FileSystem.documentDirectory}projects/`;

// ============================================================================
// Types
// ============================================================================

export interface SaveProjectOptions {
  /** Project ID */
  projectId: string;
  /** Project name */
  name: string;
  /** Source image metadata */
  source: SourceImage;
  /** Current edit state */
  editState: EditState;
  /** Path to thumbnail image */
  thumbnailPath?: string;
}

export interface LoadProjectResult {
  success: boolean;
  project?: ProjectFile;
  error?: string;
}

// ============================================================================
// Save Project
// ============================================================================

/**
 * Save a project to disk.
 * Uses atomic write: write to temp file, then rename.
 */
export async function saveProject(options: SaveProjectOptions): Promise<{ success: boolean; error?: string }> {
  const { projectId, name, source, editState, thumbnailPath } = options;

  try {
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(PROJECTS_DIR, { intermediates: true });

    // Create project file
    const now = new Date().toISOString();
    const projectFile: ProjectFile = {
      schemaVersion: SCHEMA_VERSION,
      projectId,
      name,
      source,
      edit: editState,
      createdAt: now,
      updatedAt: now,
    };

    // Write to temp file first
    const projectPath = getProjectPath(projectId);
    const tempPath = `${projectPath}.tmp`;
    
    await FileSystem.writeAsStringAsync(
      tempPath,
      JSON.stringify(projectFile, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    // Atomic rename
    await FileSystem.moveAsync({
      from: tempPath,
      to: projectPath,
    });

    // Update database index
    const db = await getDatabase();
    const existing = await db.getProject(projectId);
    
    if (existing) {
      await db.updateProject({
        ...existing,
        name,
        thumbnailPath: thumbnailPath ?? existing.thumbnailPath,
        updatedAt: now,
      });
    } else {
      await db.insertProject({
        projectId,
        name,
        thumbnailPath: thumbnailPath ?? '',
        schemaVersion: SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving project',
    };
  }
}

/**
 * Update an existing project's edit state.
 * More efficient than full save for autosave.
 */
export async function updateProjectEditState(
  projectId: string,
  editState: EditState
): Promise<{ success: boolean; error?: string }> {
  try {
    const projectPath = getProjectPath(projectId);
    
    // Check if file exists
    const info = await FileSystem.getInfoAsync(projectPath);
    if (!info.exists) {
      return { success: false, error: 'Project not found' };
    }

    // Read existing project
    const content = await FileSystem.readAsStringAsync(projectPath);
    const project = JSON.parse(content) as ProjectFile;

    // Update edit state and timestamp
    project.edit = editState;
    project.updatedAt = new Date().toISOString();

    // Atomic write
    const tempPath = `${projectPath}.tmp`;
    await FileSystem.writeAsStringAsync(
      tempPath,
      JSON.stringify(project, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );
    await FileSystem.moveAsync({ from: tempPath, to: projectPath });

    // Update database timestamp
    const db = await getDatabase();
    const existing = await db.getProject(projectId);
    if (existing) {
      await db.updateProject({
        ...existing,
        updatedAt: project.updatedAt,
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating project',
    };
  }
}

// ============================================================================
// Load Project
// ============================================================================

/**
 * Load a project from disk.
 */
export async function loadProject(projectId: string): Promise<LoadProjectResult> {
  try {
    const projectPath = getProjectPath(projectId);
    
    // Check if file exists
    const info = await FileSystem.getInfoAsync(projectPath);
    if (!info.exists) {
      return { success: false, error: 'Project not found' };
    }

    // Read file
    const content = await FileSystem.readAsStringAsync(projectPath);
    const rawProject = JSON.parse(content);

    // Migrate if needed
    const project = migrateProjectFile(rawProject);

    return { success: true, project };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error loading project',
    };
  }
}

// ============================================================================
// Delete Project
// ============================================================================

/**
 * Delete a project and all associated files.
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const projectPath = getProjectPath(projectId);
    
    // Delete project file
    const info = await FileSystem.getInfoAsync(projectPath);
    if (info.exists) {
      await FileSystem.deleteAsync(projectPath);
    }

    // Delete from database
    const db = await getDatabase();
    await db.deleteProject(projectId);

    // Note: Original image and proxy are not deleted here
    // They should be cleaned up separately if needed

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting project',
    };
  }
}

// ============================================================================
// List Projects
// ============================================================================

/**
 * Get all projects from the database index.
 */
export async function listProjects(): Promise<ProjectFile[]> {
  const db = await getDatabase();
  const entries = await db.getAllProjects();
  
  // Load full project data for each entry
  const projects: ProjectFile[] = [];
  for (const entry of entries) {
    const result = await loadProject(entry.projectId);
    if (result.success && result.project) {
      projects.push(result.project);
    }
  }
  
  return projects;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get the file path for a project.
 */
function getProjectPath(projectId: string): string {
  return `${PROJECTS_DIR}${projectId}.json`;
}

/**
 * Check if a project exists.
 */
export async function projectExists(projectId: string): Promise<boolean> {
  const projectPath = getProjectPath(projectId);
  const info = await FileSystem.getInfoAsync(projectPath);
  return info.exists;
}
