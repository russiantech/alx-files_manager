import redis from 'redis';
import { promisify } from 'util';

/**
 * Class for performing operations with Redis service
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    // Handle connection errors
    this.client.on('error', (error) => {
      console.error(`Redis client not connected to the server: ${error.message}`);
    });

    // Handle successful connection
    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
    });
  }

  /**
   * Checks if connection to Redis is alive
   * @return {boolean} True if connection is alive, otherwise false
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Gets the value corresponding to a key in Redis
   * @param {string} key - The key to search for in Redis
   * @return {Promise<string>} The value associated with the key
   */
  async get(key) {
    return await this.getAsync(key);
  }

  /**
   * Creates a new key in Redis with a specific TTL
   * @param {string} key - The key to be saved in Redis
   * @param {string} value - The value to be assigned to the key
   * @param {number} duration - The TTL (Time To Live) of the key in seconds
   * @return {void}
   */
  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  /**
   * Deletes a key in Redis
   * @param {string} key - The key to be deleted
   * @return {void}
   */
  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;

