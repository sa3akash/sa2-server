import { IReactionJob } from '@reaction/interfaces/reactions-interfaces';
import { reactionQueue } from '@service/queues/post-reaction-queue';
import { ReactionCache } from '@service/redis/reaction-cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const reactionCache: ReactionCache = new ReactionCache();

export class RemoveReaction {
  public async removeReaction(req: Request, res: Response): Promise<void> {
    const { postId, previousReaction, postReactions } = req.body;

    // save reaction data in redis cache
    await reactionCache.removeReactionFromCache(postId, req.currentUser!.username, postReactions);

    // mongodb database reaction
    const databaseReaction: IReactionJob = {
      postId,
      username: req.currentUser!.username,
      previousReaction
    } as IReactionJob;

    // add queue
    reactionQueue.removeReactionJob('removeReactionToDB', databaseReaction);

    // send response back in user
    res.status(HTTP_STATUS.OK).json({ message: 'Reaction remove successfully.' });
  }
}
