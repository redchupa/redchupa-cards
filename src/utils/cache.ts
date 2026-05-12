/**
 * Tiny TTL cache for WebSocket query results.
 *
 * Per-card singletons hold one of these so multiple instances of the same
 * card on a dashboard share cached history responses instead of re-firing
 * identical WS calls for each. Old entries are evicted on access (lazy) and
 * on insert when the cache is full (FIFO — first-key drop).
 */
export class TTLCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number = 50,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
