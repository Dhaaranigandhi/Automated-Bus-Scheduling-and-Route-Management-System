import { EventEmitter } from 'events';
import logger from './logger';

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  publish(channel: string, message: string): Promise<void>;
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
}

// In-Memory Fallback Implementation
class MemoryCacheClient implements CacheClient {
  private store = new Map<string, { value: string; expiry: number | null }>();
  private emitter = new EventEmitter();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async publish(channel: string, message: string): Promise<void> {
    this.emitter.emit(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    this.emitter.on(channel, callback);
  }
}

// Global cached instance
let cache: CacheClient;

// Real Redis connection can be wired here if needed using 'ioredis' or 'redis' package.
// For robust zero-setup sandbox environment execution, we default to the in-memory fallback.
try {
  logger.info('Initializing cache client (Using In-Memory Database Fallback)...');
  cache = new MemoryCacheClient();
} catch (err) {
  logger.error('Failed to initialize cache client. Using in-memory fallback.', err);
  cache = new MemoryCacheClient();
}

export default cache;
