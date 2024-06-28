import redisClient from './redis';
import dbClient from './db';

/**
 * Retrieves the authentication token from the request headers
 * @param {Object} request - The HTTP request object
 * @return {string} The authentication token prefixed with 'auth_'
 */
async function getAuthToken(request) {
  const token = request.headers['x-token'];
  return `auth_${token}`;
}

/**
 * Finds the user ID associated with the authentication token
 * @param {Object} request - The HTTP request object
 * @return {string|null} The user ID or null if not found
 */
async function findUserIdByToken(request) {
  const key = await getAuthToken(request);
  const userId = await redisClient.get(key);
  return userId || null;
}

/**
 * Retrieves a user document by user ID
 * @param {string} userId - The ID of the user to find
 * @return {Object|null} The user document or null if not found
 */
async function findUserById(userId) {
  const userExistsArray = await dbClient.users.find({ _id: new ObjectId(userId) }).toArray();
  return userExistsArray[0] || null;
}

export {
  findUserIdByToken,
  findUserById,
};

