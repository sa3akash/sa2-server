import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { ICommentDocument, ICommentJob } from '@comment/interfaces/comment-interface';
import { commentQueue } from '@service/queues/comment-queue';
import { CommentCache } from '@service/redis/comment-cache';
import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { addCommentSchema } from '@comment/schemas/comment-schema';

const commentCache: CommentCache = new CommentCache();

export class AddComment {
  @joiValidation(addCommentSchema)
  public async comment(req: Request, res: Response): Promise<void> {
    const { userTo, postId, profilePicture, comment } = req.body;

    const commentObjectId: ObjectId = new ObjectId();

    const commentData: ICommentDocument = {
      _id: commentObjectId,
      postId,
      username: `${req.currentUser?.username}`,
      avatarColor: `${req.currentUser?.avatarColor}`,
      profilePicture,
      comment,
      createdAt: new Date()
    } as ICommentDocument;
    // save to cache
    await commentCache.addPostCommentToCache(postId, commentData);
    // create job object
    const databaseCommentData: ICommentJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      comment: commentData
    };
    // add to queue
    commentQueue.addCommentJob('addCommentToDB', databaseCommentData);
    // send response to user
    res.status(HTTP_STATUS.OK).json({ message: 'Comment created successfully' });
  }
}
