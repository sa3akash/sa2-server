import { IReactionDocument } from '@reaction/interfaces/reactions-interfaces';
import { reactionServices } from '@service/db/post-reaction-services';
import { ReactionCache } from '@service/redis/reaction-cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';

const reactionCache: ReactionCache = new ReactionCache();

export class GetReactions {
  public async getReactionByPostId(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;

    const cacheReaction: [IReactionDocument[], number] = await reactionCache.getReactionFromCache(postId);

    const results: [IReactionDocument[], number] = cacheReaction[0].length
      ? cacheReaction
      : await reactionServices.getPostReactions({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });

    // send response back in user
    res.status(HTTP_STATUS.OK).json({ message: 'Post Reactions.', reactions: results[0], reactionCount: results[1] });
  }

  public async getSingleReactionByUsername(req: Request, res: Response): Promise<void> {
    const { postId, username } = req.params;

    const cacheReaction: [IReactionDocument, number] | Array<string> = await reactionCache.getSingleReactionByUsernameFromCache(
      postId,
      username
    );

    const results: [IReactionDocument, number] | Array<string> = cacheReaction.length
      ? cacheReaction
      : await reactionServices.getSingleReactionByUsername(postId, username);

    // send response back in user
    res.status(HTTP_STATUS.OK).json({
      message: 'Single post reaction by username.',
      reactions: results.length ? results[0] : {},
      reactionCount: results.length ? results[1] : 0
    });
  }

  public async getAllReactionByUsername(req: Request, res: Response): Promise<void> {
    const { username } = req.params;

    const results: IReactionDocument[] = await reactionServices.getReactionsByUsername(username);

    // send response back in user
    res.status(HTTP_STATUS.OK).json({
      message: 'All reaction by username.',
      reactions: results
    });
  }
}
