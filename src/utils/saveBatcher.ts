/**
 * Smart batching and debouncing for Firestore writes
 * Collects state changes and writes them in batches
 *
 * Strategy:
 * - Accumulate changes in memory
 * - Trigger write when: 10+ changes OR 5 seconds elapsed (whichever first)
 * - Use setDoc with merge:true to avoid read-before-write
 * - Reduce writes by ~70-80%
 *
 * FUTURE CONCERNS:
 * - Race conditions if user loses connection mid-batch: handled by retry queue
 * - Stale data in UI if write fails: need optimistic update + rollback
 * - Pending writes lost on page refresh: consider using IndexedDB for pending queue
 */

import type { FeatureToggles } from "../types";

interface SaveBatch {
  startDateStr?: string;
  holidays?: string[];
  minStaff?: Record<string, number>;
  requiredLangs?: string[];
  weekendDays?: number[];
  legends?: Record<string, string>;
  colors?: Record<string, string>;
  config?: Record<string, any>;
  hoursConfig?: Record<string, number>;
  featureToggles?: FeatureToggles;
  team?: any[];
  requests?: any[];
  overrides?: Record<string, string>;
  publishedOverrides?: Record<string, string>;
  lastPublished?: number | null;
}

class SaveBatcher {
  private batch: SaveBatch = {};
  private changeCount = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private writeInProgress = false;
  private pendingRetries: SaveBatch[] = [];
  private maxBatchSize = 10;
  private maxWaitMs = 5000;
  private retryCount = 0;
  private maxRetries = 3;

  // Callback to execute the actual write
  private writeCallback: ((data: SaveBatch) => Promise<void>) | null = null;

  // Callback to notify about retry status
  private statusCallback:
    | ((status: "saving" | "retrying" | "success" | "failed") => void)
    | null = null;

  setWriteCallback(callback: (data: SaveBatch) => Promise<void>) {
    this.writeCallback = callback;
  }

  setStatusCallback(
    callback: (status: "saving" | "retrying" | "success" | "failed") => void,
  ) {
    this.statusCallback = callback;
  }

  /**
   * Add changes to the batch queue
   * Automatically triggers write when batch is full or timeout reached
   */
  addChanges(changes: SaveBatch): void {
    // Filter out undefined values (editors don't save all fields)
    const filteredChanges: Partial<SaveBatch> = {};
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        filteredChanges[key as keyof SaveBatch] = value as any;
      }
    }

    Object.assign(this.batch, filteredChanges);
    this.changeCount++;

    if (import.meta.env.DEV) {
      console.log(
        `[Batcher] Queued ${
          Object.keys(filteredChanges).length
        } field(s), total in batch: ${this.changeCount}/${this.maxBatchSize}`,
      );
    }

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Trigger immediately if batch is full
    if (this.changeCount >= this.maxBatchSize) {
      if (import.meta.env.DEV) {
        console.log("[Batcher] Batch full, flushing immediately");
      }
      this.flush();
    } else {
      // Otherwise set debounce timer
      this.debounceTimer = setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log("[Batcher] Timeout reached, flushing batch");
        }
        this.flush();
      }, this.maxWaitMs);
    }
  }

  /**
   * Force immediate flush of pending changes
   */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (Object.keys(this.batch).length === 0) {
      return; // Nothing to save
    }

    if (this.writeInProgress) {
      return; // Already writing
    }

    this.writeInProgress = true;
    const dataToWrite = {
      ...this.batch,
      lastUpdated: Date.now(), // Add timestamp to satisfy Firestore validation rules
    };
    this.batch = {};
    this.changeCount = 0;

    if (import.meta.env.DEV) {
      console.log(
        `[Batcher] Flushing ${
          Object.keys(dataToWrite).length
        } field(s) to Firestore`,
      );
    }

    try {
      if (this.writeCallback) {
        await this.writeCallback(dataToWrite);
        if (import.meta.env.DEV) {
          console.log("[Batcher] Write succeeded");
        }
        this.retryCount = 0; // Reset retry count on success
        if (this.statusCallback) {
          this.statusCallback("success");
        }
      }
    } catch (error) {
      // Batch failed - add to retry queue for processing
      this.pendingRetries.push(dataToWrite);

      if (import.meta.env.DEV) {
        console.error("[SaveBatcher] Initial write failed, will retry:", error);
      }

      if (this.statusCallback) {
        this.statusCallback("retrying");
      }

      // Auto-retry after delay
      this.scheduleRetry();
    } finally {
      this.writeInProgress = false;
    }
  }

  /**
   * Retry failed batches
   * FUTURE: Could store in IndexedDB to survive page refresh
   */
  private async scheduleRetry(): Promise<void> {
    if (this.pendingRetries.length === 0) return;

    // Increment retry count for this attempt
    this.retryCount++;

    // Check if we've exceeded max retries
    if (this.retryCount > this.maxRetries) {
      console.error("[SaveBatcher] Max retries exceeded, clearing retry queue");
      this.pendingRetries = [];
      this.retryCount = 0;
      if (this.statusCallback) {
        this.statusCallback("failed");
      }
      return;
    }

    // Exponential backoff: 1s, 2s, 4s
    const delayMs = Math.min(1000 * Math.pow(2, this.retryCount - 1), 4000);

    if (import.meta.env.DEV) {
      console.log(
        `[Batcher] Scheduling retry #${this.retryCount}/${this.maxRetries} in ${delayMs}ms (${this.pendingRetries.length} batch(es) pending)`,
      );
    }

    // Use Promise-based delay to avoid blocking UI
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Process retries sequentially, non-blocking
    while (this.pendingRetries.length > 0) {
      const batch = this.pendingRetries[0];
      try {
        if (import.meta.env.DEV) {
          console.log(
            `[Batcher] Retrying batch (attempt ${this.retryCount}/${this.maxRetries})`,
          );
        }
        if (this.writeCallback) {
          await this.writeCallback(batch);
          this.pendingRetries.shift(); // Remove from queue on success
          this.retryCount = 0; // Reset on success
          if (import.meta.env.DEV) {
            console.log("[Batcher] Retry succeeded");
          }
          if (this.statusCallback) {
            this.statusCallback("success");
          }
        }
      } catch (error) {
        console.error("[SaveBatcher] Retry failed:", error);
        if (this.statusCallback) {
          this.statusCallback("retrying");
        }
        // Schedule another retry (will check max retries on next call)
        this.scheduleRetry();
        break; // Stop processing this batch, wait for next retry
      }
    }
  }

  /**
   * Get pending write count (for UI feedback)
   */
  getPendingCount(): number {
    return this.changeCount + this.pendingRetries.length;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Get max retries allowed
   */
  getMaxRetries(): number {
    return this.maxRetries;
  }

  /**
   * Clear all pending data (use with caution)
   */
  clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.batch = {};
    this.changeCount = 0;
    this.pendingRetries = [];
    this.retryCount = 0;
  }
}

export const saveBatcher = new SaveBatcher();
