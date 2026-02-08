/** Queue-based content generation configuration */

/** Max items per batch — free models get fewer to maintain quality */
export const MAX_BATCH_FREE = 7;
export const MAX_BATCH_PAID = 30;

/** How many items the cron worker processes per cycle */
export const ITEMS_PER_CRON_CYCLE = 3;

/** Cron fires every 2 minutes */
export const CRON_INTERVAL_SEC = 120;

/** If an item is locked for longer than this, it's considered stale and unlocked */
export const LOCK_TIMEOUT_MIN = 5;

/** Max retries per queue item before marking as failed */
export const MAX_RETRIES = 3;

/** Max internal validation retries per AI call (before returning to queue) */
export const MAX_VALIDATION_RETRIES = 3;
