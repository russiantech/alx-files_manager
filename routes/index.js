
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

/**
 * GET Routes
 */

// Returns the status of Redis and DB
router.get('/status', AppController.getStatus);

// Returns statistics about the number of users and files
router.get('/stats', AppController.getStats);

// Handles user authentication (login)
router.get('/connect', AuthController.getConnect);

// Handles user logout
router.get('/disconnect', AuthController.getDisconnect);

// Returns the authenticated user's details
router.get('/users/me', UsersController.getMe);

// Returns details of a specific file by ID
router.get('/files/:id', FilesController.getShow);

// Returns a list of files
router.get('/files', FilesController.getIndex);

/**
 * POST Routes
 */

// Creates a new user
router.post('/users', UsersController.postNew);

// Uploads a new file
router.post('/files', FilesController.postUpload);

export default router;

