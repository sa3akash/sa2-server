import { IMessageData } from '@chat/interfaces/chat-interface';
import { chatService } from '@service/db/chat-services';
import { MessageCache } from '@service/redis/chat-cache';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const messageCache: MessageCache = new MessageCache();

export class GetChatMessage {
  /**
   *
   * get conversation list controllers
   *
   */
  public async conversationList(req: Request, res: Response): Promise<void> {
    let list: IMessageData[] = [];

    const cachedList: IMessageData[] = await messageCache.getUserConversationList(`${req.currentUser!.userId}`);
    if (cachedList.length) {
      list = cachedList;
    } else {
      list = await chatService.getUserConversationList(req.currentUser!.userId);
    }

    res.status(HTTP_STATUS.OK).json({ message: 'User conversation list', list });
  }

  /**
   *
   * get messages controllers
   *
   */
  public async messages(req: Request, res: Response): Promise<void> {
    const { receiverId } = req.params;

    let messages: IMessageData[] = [];
    const cachedMessages: IMessageData[] = await messageCache.getChatMessagesFromCache(`${req.currentUser!.userId}`, `${receiverId}`);
    if (cachedMessages.length) {
      messages = cachedMessages;
    } else {
      messages = await chatService.getMessages(req.currentUser!.userId, receiverId, { createdAt: 1 });
    }

    res.status(HTTP_STATUS.OK).json({ message: 'User chat messages', messages });
  }
}
