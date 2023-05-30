import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { IPostDocument } from '@post/interfaces/post-interface';
import { postSchema, postWithImageSchema } from '@post/schemas/post-schemas';
import { config } from '@root/config';
import { postQueue } from '@service/queues/post-queue';
import { PostCache } from '@service/redis/post-cache';
import { socketIOPostObject } from '@socket/post-socket';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

const postCache: PostCache = new PostCache();

export class CreatePost {
  @joiValidation(postSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;

    const postObjectId: ObjectId = new ObjectId();

    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as IPostDocument;

    // emit post data to socket
    socketIOPostObject.emit('add-post', createdPost);

    // save post to redis database
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost: createdPost
    });

    // add queue for save data to mongodb database
    postQueue.addPostJob('addPostToDB', {
      key: req.currentUser!.userId,
      value: createdPost
    });
    // send response
    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created successfully.' });
  }

  // post with image

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body;

    const path = `${config.FOLDFR}/${req.currentUser?.userId}/post`;

    const result: UploadApiResponse = (await uploads(image, '', false, false, path)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as IPostDocument;
    // post send real time using socket.io
    socketIOPostObject.emit('add post', createdPost);
    // save post to redis cache
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    });
    // save post to mongodb database using queue and bull
    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });

    // call image queue to mongodb database

    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created with image successfully.' });
  }
}
