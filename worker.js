import DBClient from './utils/db';
import Bull from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

/**
 * Creates an image thumbnail with the specified options
 * @param {string} path - The path to the original image
 * @param {Object} options - The options for the thumbnail
 */
const createImageThumbnail = async (path, options) => {
  try {
    const thumbnail = await imageThumbnail(path, options);
    const pathNail = `${path}_${options.width}`;
    await fs.writeFileSync(pathNail, thumbnail);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Process the fileQueue to create thumbnails for uploaded files
 */
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const fileDocument = await DBClient.db.collection('files').findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!fileDocument) throw new Error('File not found');

  await createImageThumbnail(fileDocument.localPath, { width: 500 });
  await createImageThumbnail(fileDocument.localPath, { width: 250 });
  await createImageThumbnail(fileDocument.localPath, { width: 100 });
});

/**
 * Process the userQueue to handle user-related tasks
 */
userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const userDocument = await DBClient.db.collection('users').findOne({
    _id: ObjectId(userId),
  });

  if (!userDocument) throw new Error('User not found');

  console.log(`Welcome ${userDocument.email}`);
});

