/**
 * PocketLab Database — SQLite Index
 * 
 * Manages the project and preset index in SQLite.
 * Stores metadata only; actual project data is in JSON files.
 */

import * as SQLite from 'expo-sqlite';
import type { ProjectIndexEntry, PresetIndexEntry } from '../model/types';

// ============================================================================
// Types
// ============================================================================

export interface Database {
  // Project operations
  getAllProjects(): Promise<ProjectIndexEntry[]>;
  getProject(projectId: string): Promise<ProjectIndexEntry | null>;
  insertProject(project: ProjectIndexEntry): Promise<void>;
  updateProject(project: ProjectIndexEntry): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
  
  // Preset operations
  getAllPresets(): Promise<PresetIndexEntry[]>;
  getPresetsByCategory(category: string): Promise<PresetIndexEntry[]>;
  insertPreset(preset: PresetIndexEntry): Promise<void>;
  deletePreset(name: string): Promise<void>;
  
  // Lifecycle
  close(): Promise<void>;
}

// ============================================================================
// Database Implementation
// ============================================================================

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables if needed.
 */
export async function initDatabase(): Promise<Database> {
  if (db) {
    return createDatabaseApi(db);
  }

  db = await SQLite.openDatabaseAsync('pocketlab.db');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS projects (
      projectId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      thumbnailPath TEXT NOT NULL,
      schemaVersion INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS presets (
      name TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      schemaVersion INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updatedAt DESC);
    CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category);
  `);

  return createDatabaseApi(db);
}

/**
 * Create the database API object.
 */
function createDatabaseApi(database: SQLite.SQLiteDatabase): Database {
  return {
    // Project operations
    async getAllProjects(): Promise<ProjectIndexEntry[]> {
      const rows = await database.getAllAsync<ProjectIndexEntry>(
        'SELECT * FROM projects ORDER BY updatedAt DESC'
      );
      return rows;
    },

    async getProject(projectId: string): Promise<ProjectIndexEntry | null> {
      const row = await database.getFirstAsync<ProjectIndexEntry>(
        'SELECT * FROM projects WHERE projectId = ?',
        [projectId]
      );
      return row ?? null;
    },

    async insertProject(project: ProjectIndexEntry): Promise<void> {
      await database.runAsync(
        `INSERT INTO projects (projectId, name, thumbnailPath, schemaVersion, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          project.projectId,
          project.name,
          project.thumbnailPath,
          project.schemaVersion,
          project.createdAt,
          project.updatedAt,
        ]
      );
    },

    async updateProject(project: ProjectIndexEntry): Promise<void> {
      await database.runAsync(
        `UPDATE projects SET name = ?, thumbnailPath = ?, updatedAt = ?
         WHERE projectId = ?`,
        [project.name, project.thumbnailPath, project.updatedAt, project.projectId]
      );
    },

    async deleteProject(projectId: string): Promise<void> {
      await database.runAsync(
        'DELETE FROM projects WHERE projectId = ?',
        [projectId]
      );
    },

    // Preset operations
    async getAllPresets(): Promise<PresetIndexEntry[]> {
      const rows = await database.getAllAsync<PresetIndexEntry>(
        'SELECT * FROM presets ORDER BY category, name'
      );
      return rows;
    },

    async getPresetsByCategory(category: string): Promise<PresetIndexEntry[]> {
      const rows = await database.getAllAsync<PresetIndexEntry>(
        'SELECT * FROM presets WHERE category = ? ORDER BY name',
        [category]
      );
      return rows;
    },

    async insertPreset(preset: PresetIndexEntry): Promise<void> {
      await database.runAsync(
        `INSERT INTO presets (name, category, schemaVersion)
         VALUES (?, ?, ?)`,
        [preset.name, preset.category, preset.schemaVersion]
      );
    },

    async deletePreset(name: string): Promise<void> {
      await database.runAsync(
        'DELETE FROM presets WHERE name = ?',
        [name]
      );
    },

    // Lifecycle
    async close(): Promise<void> {
      if (db) {
        await db.closeAsync();
        db = null;
      }
    },
  };
}

// ============================================================================
// Singleton Access
// ============================================================================

let databaseInstance: Database | null = null;

/**
 * Get the database instance (initializes if needed).
 */
export async function getDatabase(): Promise<Database> {
  if (!databaseInstance) {
    databaseInstance = await initDatabase();
  }
  return databaseInstance;
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (databaseInstance) {
    await databaseInstance.close();
    databaseInstance = null;
  }
}
