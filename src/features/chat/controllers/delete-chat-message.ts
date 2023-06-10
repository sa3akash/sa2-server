import { IMessageData } from '@chat/interfaces/chat-interface';
import { chatQueue } from '@service/queues/chat-queue';
import { MessageCache } from '@service/redis/chat-cache';
import { socketIOChatObject } from '@socket/chat-socket';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';

const messageCache: MessageCache = new MessageCache();

export class DeleteMessage {
  public async markMessageAsDeleted(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.params;

    const updatedMessage: IMessageData = await messageCache.markMessageAsDeleted(`${senderId}`, `${receiverId}`, `${messageId}`, type);

    socketIOChatObject.emit('message-read', updatedMessage);
    socketIOChatObject.emit('chat-list', updatedMessage);

    chatQueue.addChatJob('markMessageAsDeletedInDB', {
      messageId: new mongoose.Types.ObjectId(messageId),
      type
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as deleted' });
  }
}
