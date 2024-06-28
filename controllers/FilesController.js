import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Queue from 'bull';
import { findUserIdByToken } from '../utils/helpers';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  /**
   * Should create a new file in DB and on disk
   */
  static async postUpload(request, response) {
    const fileQueue = new Queue('fileQueue');
    const userId = await findUserIdByToken(request);

    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { name, type, data } = request.body;
    const isPublic = request.body.isPublic || false;
    const parentId = request.body.parentId || 0;

    if (!name) return response.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return response.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') return response.status(400).json({ error: 'Missing data' });

    if (parentId !== 0) {
      const parentFile = await dbClient.files.findOne({ _id: ObjectID(parentId) });
      if (!parentFile) return response.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return response.status(400).json({ error: 'Parent is not a folder' });
    }

    let fileInserted;
    if (type === 'folder') {
      fileInserted = await dbClient.files.insertOne({
        userId: ObjectID(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? parentId : ObjectID(parentId),
      });
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      const filenameUUID = uuidv4();
      const localPath = `${folderPath}/${filenameUUID}`;
      const clearData = Buffer.from(data, 'base64');
      await fs.promises.writeFile(localPath, clearData);

      fileInserted = await dbClient.files.insertOne({
        userId: ObjectID(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? parentId : ObjectID(parentId),
        localPath,
      });

      if (type === 'image') {
        await fileQueue.add({ userId, fileId: fileInserted.insertedId, localPath });
      }
    }

    return response.status(201).json({
      id: fileInserted.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  /**
   * Retrieve a file by fileId
   */
  static async getShow(request, response) {
    const userId = await findUserIdByToken(request);
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const fileId = request.params.id;
    const file = await dbClient.files.findOne({ _id: ObjectID(fileId), userId: ObjectID(userId) });

    if (!file) return response.status(404).json({ error: 'Not found' });

    return response.json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * List all files associated with a user
   */
  static async getIndex(request, response) {
    const userId = await findUserIdByToken(request);
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const parentId = request.query.parentId || '0';
    const page = parseInt(request.query.page, 10) || 0;
    const pageSize = 20;

    const query = parentId === '0'
      ? { userId: ObjectID(userId) }
      : { userId: ObjectID(userId), parentId: ObjectID(parentId) };

    const files = await dbClient.files
      .find(query)
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray();

    const filesArray = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));

    return response.json(filesArray);
  }
}

export default FilesController;


