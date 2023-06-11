import { Helpers } from '@global/helpers/helpers';
import { INotificationDocument, INotificationTemplate } from '@notification/interfaces/notifications-interfaces';
import { NotificationModel } from '@notification/models/notification-model';
import { IPostDocument } from '@post/interfaces/post-interface';
import { PostModel } from '@post/models/post-schema';
import { IQueryReaction, IReactionDocument, IReactionJob } from '@reaction/interfaces/reactions-interfaces';
import { ReactionModel } from '@reaction/models/Reaction-model';
import { notificationTemplate } from '@service/emails/templates/notification/notification-template';
import { emailQueue } from '@service/queues/email-queue';
import { UserCache } from '@service/redis/user-cache';
import { socketIONotificationObject } from '@socket/notification-socket';
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

    if (updateReaction[0].notifications.reactions && userTo !== userFrom) {
      const notificationModel: INotificationDocument = new NotificationModel();
      const notifications = await notificationModel.insertNotification({
        userFrom: userFrom as string,
        userTo: userTo as string,
        message: `${username} reacted to your post.`,
        notificationType: 'reactions',
        entityId: new mongoose.Types.ObjectId(postId),
        createdItemId: new mongoose.Types.ObjectId(updateReaction[1]._id!),
        createdAt: new Date(),
        comment: '',
        post: updateReaction[2].post,
        imgId: updateReaction[2].imgId!,
        imgVersion: updateReaction[2].imgVersion!,
        gifUrl: updateReaction[2].gifUrl!,
        reaction: type!
      });
      // send notification real time using socket.io
      socketIONotificationObject.emit('insert-notification', notifications, { userTo });
      const templateParams: INotificationTemplate = {
        username: updateReaction[0].username!,
        message: `${username} reacted to your post.`,
        header: 'Post Reaction Notification'
      };
      // email template
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      // send email notification
      emailQueue.addEmailJob('reactionsEmail', {
        receiverEmail: updateReaction[0].email!,
        template,
        subject: 'Post reaction notification'
      });
    }
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
