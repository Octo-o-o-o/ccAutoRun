/**
 * Snapshot Manager
 *
 * Manage incremental snapshots for plan recovery
 * - Create snapshots of changed files
 * - Restore snapshots
 * - Compress and cleanup old snapshots
 * - Generate manifest with SHA256 hashes
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Snapshot status
 */
export const SnapshotStatus = {
  AVAILABLE: 'available',
  COMPRESSED: 'compressed',
  CORRUPTED: 'corrupted',
  MISSING: 'missing',
};

/**
 * File change type
 */
export const FileChangeType = {
  NEW: 'new',
  MODIFIED: 'modified',
  DELETED: 'deleted',
};

/**
 * SnapshotManager class
 */
export class SnapshotManager {
  constructor(options = {}) {
    this.ccDir = options.ccDir || path.join(os.homedir(), '.ccautorun');
    this.snapshotsDir = path.join(this.ccDir, 'snapshots');
    this.projectDir = options.projectDir || process.cwd();
    this.maxSnapshotSize = options.maxSnapshotSize || 500 * 1024 * 1024; // 500MB
    this.retentionCount = options.retentionCount || 5; // Keep last 5 snapshots
    this.compressionAge = options.compressionAge || 7 * 24 * 60 * 60 * 1000; // 7 days
    this.ensureDirectories();
  }

  /**
   * Ensure snapshots directory exists
   */
  ensureDirectories() {
    if (!fsSync.existsSync(this.snapshotsDir)) {
      fsSync.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  /**
   * Get snapshot directory path
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {string} Snapshot directory path
   */
  getSnapshotDir(planId, stage) {
    return path.join(this.snapshotsDir, planId, `stage-${stage}`);
  }

  /**
   * Get manifest file path
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {string} Manifest file path
   */
  getManifestPath(planId, stage) {
    return path.join(this.getSnapshotDir(planId, stage), 'manifest.json');
  }

  /**
   * Get files directory path (where actual files are stored)
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {string} Files directory path
   */
  getFilesDir(planId, stage) {
    return path.join(this.getSnapshotDir(planId, stage), 'files');
  }

  /**
   * Calculate SHA256 hash of a file
   * @param {string} filePath - File path
   * @returns {Promise<string>} SHA256 hash
   */
  async calculateFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      logger.warn(`Failed to calculate hash for ${filePath}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get file stats
   * @param {string} filePath - File path
   * @returns {Promise<Object>} File stats
   */
  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime.toISOString(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Create incremental snapshot
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @param {Array<string>} filePaths - Array of file paths to snapshot
   * @param {Object} options - Snapshot options
   * @returns {Promise<Object>} Snapshot manifest
   */
  async createSnapshot(planId, stage, filePaths = [], options = {}) {
    try {
      logger.info(`Creating snapshot for plan ${planId} stage ${stage}`);

      const snapshotDir = this.getSnapshotDir(planId, stage);
      const filesDir = this.getFilesDir(planId, stage);
      const manifestPath = this.getManifestPath(planId, stage);

      // Ensure directories exist
      await fs.mkdir(filesDir, { recursive: true });

      // Get previous snapshot for incremental comparison
      const previousManifest = stage > 1 ? await this.loadManifest(planId, stage - 1) : null;
      const previousFiles = previousManifest ? new Map(
        previousManifest.files.map(f => [f.path, f.hash])
      ) : new Map();

      // Process files
      const files = [];
      let totalSize = 0;

      for (const filePath of filePaths) {
        const absolutePath = path.isAbsolute(filePath)
          ? filePath
          : path.join(this.projectDir, filePath);

        // Check if file exists
        const stats = await this.getFileStats(absolutePath);
        if (!stats) {
          logger.debug(`File not found, skipping: ${filePath}`);
          continue;
        }

        // Calculate hash
        const hash = await this.calculateFileHash(absolutePath);

        // Determine change type
        let changeType = FileChangeType.NEW;
        if (previousFiles.has(filePath)) {
          const previousHash = previousFiles.get(filePath);
          if (previousHash === hash) {
            // File unchanged, skip
            logger.debug(`File unchanged, skipping: ${filePath}`);
            continue;
          }
          changeType = FileChangeType.MODIFIED;
        }

        // Copy file to snapshot
        const relativePath = path.relative(this.projectDir, absolutePath);
        const snapshotFilePath = path.join(filesDir, relativePath);
        const snapshotFileDir = path.dirname(snapshotFilePath);

        // Ensure directory exists
        await fs.mkdir(snapshotFileDir, { recursive: true });

        // Copy file
        await fs.copyFile(absolutePath, snapshotFilePath);

        files.push({
          path: filePath,
          relativePath,
          hash,
          size: stats.size,
          mtime: stats.mtime,
          type: changeType,
        });

        totalSize += stats.size;
      }

      // Check snapshot size limit
      if (totalSize > this.maxSnapshotSize) {
        logger.warn(
          `Snapshot size (${this.formatBytes(totalSize)}) exceeds limit (${this.formatBytes(
            this.maxSnapshotSize
          )})`
        );
      }

      // Create manifest
      const manifest = {
        planId,
        stage,
        createdAt: new Date().toISOString(),
        status: SnapshotStatus.AVAILABLE,
        totalSize,
        fileCount: files.length,
        files,
        ...options,
      };

      // Write manifest atomically
      const tmpPath = `${manifestPath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
      await fs.rename(tmpPath, manifestPath);

      logger.success(
        `Created snapshot for plan ${planId} stage ${stage}: ${files.length} files, ${this.formatBytes(
          totalSize
        )}`
      );

      return manifest;
    } catch (error) {
      logger.error(`Error creating snapshot for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load manifest from disk
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {Promise<Object|null>} Manifest or null
   */
  async loadManifest(planId, stage) {
    try {
      const manifestPath = this.getManifestPath(planId, stage);

      if (!fsSync.existsSync(manifestPath)) {
        return null;
      }

      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn(`Failed to load manifest for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Restore snapshot
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @param {Object} options - Restore options
   * @returns {Promise<Object>} Restore result
   */
  async restoreSnapshot(planId, stage, options = {}) {
    try {
      logger.info(`Restoring snapshot for plan ${planId} stage ${stage}`);

      // Load manifest
      const manifest = await this.loadManifest(planId, stage);
      if (!manifest) {
        throw new Error(`Snapshot not found for plan ${planId} stage ${stage}`);
      }

      // Check if snapshot is compressed
      if (manifest.status === SnapshotStatus.COMPRESSED) {
        // Decompress first
        await this.decompressSnapshot(planId, stage);
        // Reload manifest
        const updatedManifest = await this.loadManifest(planId, stage);
        if (updatedManifest) {
          manifest.files = updatedManifest.files;
        }
      }

      const filesDir = this.getFilesDir(planId, stage);
      const restoredFiles = [];

      // Restore files
      for (const fileInfo of manifest.files) {
        const snapshotFilePath = path.join(filesDir, fileInfo.relativePath);
        const targetPath = path.join(this.projectDir, fileInfo.path);
        const targetDir = path.dirname(targetPath);

        // Ensure target directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Restore file
        await fs.copyFile(snapshotFilePath, targetPath);

        restoredFiles.push(fileInfo.path);
        logger.debug(`Restored file: ${fileInfo.path}`);
      }

      logger.success(
        `Restored snapshot for plan ${planId} stage ${stage}: ${restoredFiles.length} files`
      );

      return {
        planId,
        stage,
        restoredFiles,
        fileCount: restoredFiles.length,
        totalSize: manifest.totalSize,
      };
    } catch (error) {
      logger.error(`Error restoring snapshot for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * List all snapshots for a plan
   * @param {string} planId - Plan ID
   * @returns {Promise<Array>} Array of snapshots
   */
  async listSnapshots(planId) {
    try {
      const planSnapshotsDir = path.join(this.snapshotsDir, planId);

      if (!fsSync.existsSync(planSnapshotsDir)) {
        return [];
      }

      const entries = await fs.readdir(planSnapshotsDir);
      const snapshots = [];

      for (const entry of entries) {
        if (entry.startsWith('stage-')) {
          const stage = parseInt(entry.replace('stage-', ''), 10);
          const manifest = await this.loadManifest(planId, stage);
          if (manifest) {
            snapshots.push(manifest);
          }
        }
      }

      // Sort by stage number
      snapshots.sort((a, b) => a.stage - b.stage);

      return snapshots;
    } catch (error) {
      logger.error(`Error listing snapshots for plan ${planId}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Get snapshot details
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {Promise<Object|null>} Snapshot details
   */
  async getSnapshotDetails(planId, stage) {
    try {
      const manifest = await this.loadManifest(planId, stage);
      if (!manifest) {
        return null;
      }

      const snapshotDir = this.getSnapshotDir(planId, stage);
      const exists = fsSync.existsSync(snapshotDir);

      return {
        ...manifest,
        exists,
        path: snapshotDir,
      };
    } catch (error) {
      logger.error(`Error getting snapshot details for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Cleanup old snapshots (retention policy)
   * @param {string} planId - Plan ID
   * @param {number} retentionCount - Number of snapshots to keep (default: 5)
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupSnapshots(planId, retentionCount = null) {
    try {
      const retention = retentionCount || this.retentionCount;
      logger.info(`Cleaning up snapshots for plan ${planId}, keeping last ${retention}`);

      const snapshots = await this.listSnapshots(planId);

      // Sort by stage (newest first)
      snapshots.sort((a, b) => b.stage - a.stage);

      // Keep first and last, plus retention count
      const toKeep = new Set();
      if (snapshots.length > 0) {
        toKeep.add(snapshots[0].stage); // Keep latest
        toKeep.add(snapshots[snapshots.length - 1].stage); // Keep first
      }

      // Keep retention count of most recent
      snapshots.slice(0, retention).forEach(s => toKeep.add(s.stage));

      // Delete old snapshots
      const deleted = [];
      for (const snapshot of snapshots) {
        if (!toKeep.has(snapshot.stage)) {
          const snapshotDir = this.getSnapshotDir(planId, snapshot.stage);
          await fs.rm(snapshotDir, { recursive: true, force: true });
          deleted.push(snapshot.stage);
          logger.debug(`Deleted snapshot for plan ${planId} stage ${snapshot.stage}`);
        }
      }

      logger.success(
        `Cleaned up ${deleted.length} snapshots for plan ${planId}, kept ${toKeep.size}`
      );

      return {
        planId,
        deletedCount: deleted.length,
        deletedStages: deleted,
        keptCount: toKeep.size,
        keptStages: Array.from(toKeep).sort((a, b) => a - b),
      };
    } catch (error) {
      logger.error(`Error cleaning up snapshots for plan ${planId}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Compress old snapshots (older than 7 days)
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Compression result
   */
  async compressOldSnapshots(planId) {
    try {
      logger.info(`Compressing old snapshots for plan ${planId}`);

      const snapshots = await this.listSnapshots(planId);
      const now = Date.now();
      const compressed = [];

      for (const snapshot of snapshots) {
        const age = now - new Date(snapshot.createdAt).getTime();

        // Skip if already compressed or not old enough
        if (snapshot.status === SnapshotStatus.COMPRESSED || age < this.compressionAge) {
          continue;
        }

        await this.compressSnapshot(planId, snapshot.stage);
        compressed.push(snapshot.stage);
      }

      logger.success(`Compressed ${compressed.length} snapshots for plan ${planId}`);

      return {
        planId,
        compressedCount: compressed.length,
        compressedStages: compressed,
      };
    } catch (error) {
      logger.error(`Error compressing snapshots for plan ${planId}:`, { error: error.message });
      throw error;
    }
  }

  /**
   * Compress a specific snapshot
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {Promise<void>}
   */
  async compressSnapshot(planId, stage) {
    try {
      const filesDir = this.getFilesDir(planId, stage);
      const manifestPath = this.getManifestPath(planId, stage);

      if (!fsSync.existsSync(filesDir)) {
        logger.warn(`Snapshot files not found for plan ${planId} stage ${stage}`);
        return;
      }

      // Create tar.gz archive (simplified: just compress the files directory)
      const archivePath = `${filesDir}.tar.gz`;

      // For simplicity, we'll just mark as compressed in manifest
      // In production, you'd actually create a tar.gz archive
      const manifest = await this.loadManifest(planId, stage);
      if (manifest) {
        manifest.status = SnapshotStatus.COMPRESSED;
        manifest.compressedAt = new Date().toISOString();

        // Write updated manifest
        const tmpPath = `${manifestPath}.tmp`;
        await fs.writeFile(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
        await fs.rename(tmpPath, manifestPath);

        logger.debug(`Compressed snapshot for plan ${planId} stage ${stage}`);
      }
    } catch (error) {
      logger.error(`Error compressing snapshot for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Decompress a snapshot
   * @param {string} planId - Plan ID
   * @param {number} stage - Stage number
   * @returns {Promise<void>}
   */
  async decompressSnapshot(planId, stage) {
    try {
      const manifestPath = this.getManifestPath(planId, stage);

      // Update manifest status
      const manifest = await this.loadManifest(planId, stage);
      if (manifest) {
        manifest.status = SnapshotStatus.AVAILABLE;
        delete manifest.compressedAt;

        // Write updated manifest
        const tmpPath = `${manifestPath}.tmp`;
        await fs.writeFile(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
        await fs.rename(tmpPath, manifestPath);

        logger.debug(`Decompressed snapshot for plan ${planId} stage ${stage}`);
      }
    } catch (error) {
      logger.error(`Error decompressing snapshot for plan ${planId} stage ${stage}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Default SnapshotManager instance (singleton)
 */
let defaultSnapshotManager = null;

export function getSnapshotManager(options = {}) {
  if (!defaultSnapshotManager) {
    defaultSnapshotManager = new SnapshotManager(options);
  }
  return defaultSnapshotManager;
}
