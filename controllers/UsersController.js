import sha1 from 'sha1';
import Queue from 'bull';
import { findUserById, findUserIdByToken } from '../utils/helpers';
import dbClient from '../utils/db';

const userQueue = new Queue('userQueue');

class UsersController {
  /**
   * Creates a new user using the provided email and password
   * @param {Object} request - The HTTP request object
   * @param {Object} response - The HTTP response object
   * @returns {Promise<void>}
   */
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });

    try {
      // Check if the email already exists in the database
      const emailExists = await dbClient.users.findOne({ email });
      if (emailExists) return response.status(400).send({ error: 'Already exist' });

      // Insert new user
      const sha1Password = sha1(password);
      const result = await dbClient.users.insertOne({ email, password: sha1Password });

      const user = { id: result.insertedId, email };

      // Add user to the queue
      await userQueue.add({ userId: result.insertedId.toString() });

      return response.status(201).send(user);
    } catch (err) {
      await userQueue.add({});
      return response.status(500).send({ error: 'Error creating user' });
    }
  }

  /**
   * Retrieves the user based on the token provided in the headers
   * @param {Object} request - The HTTP request object
   * @param {Object} response - The HTTP response object
   * @returns {Promise<void>}
   */
  static async getMe(request, response) {
    const token = request.headers['x-token'];
    if (!token) return response.status(401).json({ error: 'Unauthorized' });

    try {
      const userId = await findUserIdByToken(request);
      if (!userId) return response.status(401).send({ error: 'Unauthorized' });

      const user = await findUserById(userId);
      if (!user) return response.status(401).send({ error: 'Unauthorized' });

      const processedUser = { id: user._id, email: user.email };

      return response.status(200).send(processedUser);
    } catch (error) {
      return response.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;

