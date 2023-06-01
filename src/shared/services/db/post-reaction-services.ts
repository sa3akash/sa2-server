import { Helpers } from '@global/helpers/helpers';
import { IPostDocument } from '@post/interfaces/post-interface';
import { PostModel } from '@post/models/post-schema';
import { IQueryReaction, IReactionDocument, IReactionJob } from '@reaction/interfaces/reactions-interfaces';
import { ReactionModel } from '@reaction/models/Reaction-model';
import { UserCache } from '@service/redis/user-cache';
import { IUserDocument } from '@user/interfaces/user-interface';
import { omit } from 'lodash';
import mongoose from 'mongoose';

const userCache: UserCache = new UserCache();

class ReactionServices {
  public async addReactonToDB(reactionData: IReactionJob): Promise<void> {
    const { userTo, userFrom, username, postId, previousReaction, reactionObject, type } = reactionData;

    let updatedReactionObject: IReactionDocument = reactionObject as IReactionDocument;

    if (previousReaction) {
      updatedReactionObject = omit(reactionObject, ['_id']);
    }

    const updateReaction: [IUserDocument, IReactionDocument, IPostDocument] = (await Promise.all([
      userCache.getUserFromCache(`${userTo}`),
      ReactionModel.replaceOne({ postId, username, type: previousReaction }, updatedReactionObject, { upsert: true }),
      PostModel.findByIdAndUpdate(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1,
            [`reactions.${type}`]: 1
          }
        },
        { new: true }
      )
    ])) as unknown as [IUserDocument, IReactionDocument, IPostDocument];

    // send reactions notifications
  }

  public async removeReactonToDB(reactionData: IReactionJob): Promise<void> {
    const { username, postId, previousReaction } = reactionData;

    await Promise.all([
      ReactionModel.deleteOne({ postId, username, type: previousReaction }),
      PostModel.updateOne(
        { _id: postId },
        {
          $inc: {
            [`reactions.${previousReaction}`]: -1
          }
        }
      )
    ]);
  }

  public async getPostReactions(query: IQueryReaction, sort: Record<string, 1 | -1>): Promise<[IReactionDocument[], number]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([{ $match: query }, { $sort: sort }]);

    return [reactions, reactions.length];
  }

  public async getSingleReactionByUsername(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), username: Helpers.firstLetterUpperCase(username) } }
    ]);

    return reactions.length ? [reactions[0], 1] : [];
  }

  public async getReactionsByUsername(username: string): Promise<IReactionDocument[]> {
    const reactions: IReactionDocument[] = await ReactionModel.aggregate([
      { $match: { username: Helpers.firstLetterUpperCase(username) } }
    ]);
    return reactions;
  }
}

export const reactionServices: ReactionServices = new ReactionServices();
