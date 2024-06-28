import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  /**
   * Signs in the user by generating a new authentication token
   * @param {Object} request - The HTTP request object
   * @param {Object} response - The HTTP response object
   * @returns {Promise<void>}
   */
  static async getConnect(request, response) {
    try {
      const Authorization = request.header('Authorization') || '';
      const credentials = Authorization.split(' ')[1];
      if (!credentials) {
        return response.status(401).send({ error: 'Unauthorized' });
      }

      const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
      const [email, password] = decodedCredentials.split(':');
      if (!email || !password) {
        return response.status(401).send({ error: 'Unauthorized' });
      }

      const sha1Password = sha1(password);
      const user = await dbClient.users.findOne({ email, password: sha1Password });

      if (!user) {
        return response.status(401).send({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      const hoursForExpiration = 24;

      await redisClient.set(key, user._id.toString(), hoursForExpiration * 3600);

      return response.status(200).send({ token });
    } catch (error) {
      return response.status(500).send({ error: 'Internal Server Error' });
    }
  }

  /**
   * Signs out the user based on the token
   * @param {Object} request - The HTTP request object
   * @param {Object} response - The HTTP response object
   * @returns {Promise<void>}
   */
  static async getDisconnect(request, response) {
    try {
      const token = request.headers['x-token'];
      const user = await redisClient.get(`auth_${token}`);

      if (!user) {
        return response.status(401).send({ error: 'Unauthorized' });
      }

      await redisClient.del(`auth_${token}`);
      return response.status(204).end();
    } catch (error) {
      return response.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;

