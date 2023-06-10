import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { UploadApiResponse } from 'cloudinary';
import { UserCache } from '@service/redis/user-cache';
import { IMessageData, IMessageNotification } from '@chat/interfaces/chat-interface';
import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { addChatSchema } from '@chat/schemas/chat-schema';
import { IUserDocument } from '@user/interfaces/user-interface';
import { uploads } from '@global/helpers/cloudinary-upload';
import { BadRequestError } from '@global/helpers/error-handler';
import { INotificationTemplate } from '@notification/interfaces/notifications-interfaces';
import { notificationTemplate } from '@service/emails/templates/notification/notification-template';
import { emailQueue } from '@service/queues/email-queue';
import { config } from '@root/config';
import { socketIOChatObject } from '@socket/chat-socket';
import { MessageCache } from '@service/redis/chat-cache';
import { chatQueue } from '@service/queues/chat-queue';

const userCache: UserCache = new UserCache();
const messageCache: MessageCache = new MessageCache();

export class AddMessage {
  @joiValidation(addChatSchema)

  /**
   *
   * add message controller
   *
   */
  public async message(req: Request, res: Response): Promise<void> {
    const {
      conversationId,
      receiverId,
      receiverUsername,
      receiverAvatarColor,
      receiverProfilePicture,
      body,
      gifUrl,
      isRead,
      selectedImage
    } = req.body;

    let fileUrl = '';
    const messageObjectId: ObjectId = new ObjectId();

    const conversationObjectId: ObjectId = !conversationId ? new ObjectId() : new mongoose.Types.ObjectId(conversationId);

    const sender: IUserDocument = (await userCache.getUserFromCache(`${req.currentUser!.userId}`)) as IUserDocument;

    if (selectedImage.length) {
      const path = `${config.FOLDFR}/${req.currentUser!.userId}/chat`;
      const result: UploadApiResponse = (await uploads(
        selectedImage,
        `${req.currentUser!.userId}-chat`,
        true,
        true,
        path
      )) as UploadApiResponse;
      if (!result?.public_id) {
        throw new BadRequestError(result.message);
      }
      fileUrl = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;
    }

    const messageData: IMessageData = {
      _id: `${messageObjectId}`,
      conversationId: new mongoose.Types.ObjectId(conversationObjectId),
      receiverId,
      receiverAvatarColor,
      receiverProfilePicture,
      receiverUsername,
      senderUsername: `${req.currentUser!.username}`,
      senderId: `${req.currentUser!.userId}`,
      senderAvatarColor: `${req.currentUser!.avatarColor}`,
      senderProfilePicture: `${sender.profilePicture}`,
      body,
      isRead,
      gifUrl,
      selectedImage: fileUrl,
      reaction: [],
      createdAt: new Date(),
      deleteForEveryone: false,
      deleteForMe: false
    };

    AddMessage.prototype.emitSocketIOEvent(messageData);

    if (!isRead) {
      AddMessage.prototype.messageNotification({
        currentUser: req.currentUser!,
        message: body,
        receiverName: receiverUsername,
        receiverId,
        messageData
      });
    }

    // add chat list to me
    await messageCache.addChatListToCache(`${req.currentUser!.userId}`, `${receiverId}`, `${conversationObjectId}`);
    // add chat list to other user
    await messageCache.addChatListToCache(`${receiverId}`, `${req.currentUser!.userId}`, `${conversationObjectId}`);
    // add message
    await messageCache.addChatMessageToCache(`${conversationObjectId}`, messageData);

    chatQueue.addChatJob('addChatMessageToDB', messageData);

    res.status(HTTP_STATUS.OK).json({ message: 'Message added', conversationId: conversationObjectId });
  }

  /**
   *
   * add chat user controller
   *
   */
  public async addChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers = await messageCache.addChatUsersToCache(req.body);
    socketIOChatObject.emit('add-chat-users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users added' });
  }

  /**
   *
   * remove chat user controller
   *
   */
  public async removeChatUsers(req: Request, res: Response): Promise<void> {
    const chatUsers = await messageCache.removeChatUsersFromCache(req.body);
    socketIOChatObject.emit('add-chat-users', chatUsers);
    res.status(HTTP_STATUS.OK).json({ message: 'Users removed' });
  }

  private emitSocketIOEvent(data: IMessageData): void {
    socketIOChatObject.emit('message-received', data);
    socketIOChatObject.emit('chat-list', data);
  }

  private async messageNotification({ currentUser, message, receiverName, receiverId }: IMessageNotification): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(`${receiverId}`)) as IUserDocument;
    if (cachedUser.notifications.messages) {
      const templateParams: INotificationTemplate = {
        username: receiverName,
        message,
        header: `Message notification from ${currentUser.username}`
      };
      const template: string = notificationTemplate.notificationMessageTemplate(templateParams);
      emailQueue.addEmailJob('directMessageEmail', {
        receiverEmail: cachedUser.email!,
        template,
        subject: `You've received messages from ${currentUser.username}`
      });
    }
  }
}
