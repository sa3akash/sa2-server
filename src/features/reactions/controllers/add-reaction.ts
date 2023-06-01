import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reactions-interfaces';
import { addReactionSchema } from '@reaction/schemas/reaction-schema';
import { reactionQueue } from '@service/queues/post-reaction-queue';
import { ReactionCache } from '@service/redis/reaction-cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

const reactionCache: ReactionCache = new ReactionCache();

export class AddReaction {
  @joiValidation(addReactionSchema)
  public async addReaction(req: Request, res: Response): Promise<void> {
    const { userTo, postId, type, profilePicture, previousReaction, postReactions } = req.body;

    const reactionObject: IReactionDocument = {
      _id: new ObjectId(),
      userTo,
      postId,
      profilePicture,
      type,
      avataColor: req.currentUser?.avatarColor,
      username: req.currentUser?.username
    } as IReactionDocument;
    // save reaction data in redis cache
    await reactionCache.addReactionSaveToCache(postId, reactionObject, postReactions, type, previousReaction);

    // mongodb database reaction
    const databaseReaction: IReactionJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      type,
      previousReaction,
      reactionObject
    } as IReactionJob;

    // add queue
    reactionQueue.addReactionJob('addReactionToDB', databaseReaction);

    // send response back in user
    res.status(HTTP_STATUS.OK).json({ message: 'Reaction added successfully.' });
  }
}
