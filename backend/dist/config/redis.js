"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logger_1 = __importDefault(require("./logger"));
// In-Memory Fallback Implementation
class MemoryCacheClient {
    constructor() {
        this.store = new Map();
        this.emitter = new events_1.EventEmitter();
    }
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (entry.expiry && entry.expiry < Date.now()) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.store.set(key, { value, expiry });
    }
    async del(key) {
        this.store.delete(key);
    }
    async publish(channel, message) {
        this.emitter.emit(channel, message);
    }
    async subscribe(channel, callback) {
        this.emitter.on(channel, callback);
    }
}
// Global cached instance
let cache;
// Real Redis connection can be wired here if needed using 'ioredis' or 'redis' package.
// For robust zero-setup sandbox environment execution, we default to the in-memory fallback.
try {
    logger_1.default.info('Initializing cache client (Using In-Memory Database Fallback)...');
    cache = new MemoryCacheClient();
}
catch (err) {
    logger_1.default.error('Failed to initialize cache client. Using in-memory fallback.', err);
    cache = new MemoryCacheClient();
}
exports.default = cache;
