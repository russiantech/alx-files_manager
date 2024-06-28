import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

/**
 * Class for managing MongoDB client connections and operations
 */
class DBClient {
  constructor() {
    MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
      if (!err) {
        this.db = client.db(DB_DATABASE);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
        console.log('MongoDB client connected to the server');
      } else {
        console.error(`MongoDB client not connected to the server: ${err.message}`);
        this.db = false;
      }
    });
  }

  /**
   * Checks if connection to MongoDB is alive
   * @return {boolean} True if connection is alive, otherwise false
   */
  isAlive() {
    return !!this.db;
  }

  /**
   * Returns the number of users in the users collection
   * @return {Promise<number>} Number of users
   */
  async nbUsers() {
    if (this.isAlive()) {
      return await this.users.countDocuments();
    }
    return 0;
  }

  /**
   * Returns the number of files in the files collection
   * @return {Promise<number>} Number of files
   */
  async nbFiles() {
    if (this.isAlive()) {
      return await this.files.countDocuments();
    }
    return 0;
  }

  /**
   * Retrieves a user document from the users collection
   * @param {Object} query - The query object to search for the user
   * @return {Promise<Object|null>} The user document or null if not found
   */
  async getUser(query) {
    if (this.isAlive()) {
      return await this.users.findOne(query);
    }
    return null;
  }
}

const dbClient = new DBClient();
export default dbClient;

