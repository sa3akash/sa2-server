import { IMessageData } from '@chat/interfaces/chat-interface';
import { markChatSchema } from '@chat/schemas/chat-schema';
import { joiValidation } from '@global/decorators/joi-validation-decorator';
import { chatQueue } from '@service/queues/chat-queue';
import { MessageCache } from '@service/redis/chat-cache';
import { socketIOChatObject } from '@socket/chat-socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';

const messageCache: MessageCache = new MessageCache();

export class UpdateMessages {
  @joiValidation(markChatSchema)
  public async message(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId } = req.body;
    const updatedMessage: IMessageData = await messageCache.updateChatMessages(`${senderId}`, `${receiverId}`);

    socketIOChatObject.emit('message-read', updatedMessage);
    socketIOChatObject.emit('chat-list', updatedMessage);

    chatQueue.addChatJob('markMessagesAsReadInDB', {
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId)
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as read' });
  }
}
