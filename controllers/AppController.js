import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Returns the status of Redis and DB
   * @param {Object} request - The HTTP request object
   * @param {Object} response - The HTTP response object
   * @returns {void}
   */
  static getStatus(request, response) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    response.status(200).send(status);
  }

  /**
   * Returns statistics about the number of users and files in the database
   * @param {Object} request - The HTTP request object
   * @param {Object} response - The HTTP response object
   * @returns {Promise<void>}
   */
  static async getStats(request, response) {
    try {
      const stats = {
        users: await dbClient.nbUsers(),
        files: await dbClient.nbFiles(),
      };
      response.status(200).send(stats);
    } catch (error) {
      response.status(500).send({ error: 'An error occurred while fetching statistics' });
    }
  }
}

export default AppController;

