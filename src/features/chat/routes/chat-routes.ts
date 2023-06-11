import { AddMessage } from '@chat/controllers/add-chat-controller';
import { MessageReaction } from '@chat/controllers/add-message-reaction';
import { DeleteMessage } from '@chat/controllers/delete-chat-message';
import { GetChatMessage } from '@chat/controllers/get-chat-message';
import { UpdateMessages } from '@chat/controllers/update-chat-message';
import { authMiddleware } from '@global/helpers/auth-middleware';
import express, { Router } from 'express';

class ChatRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/chat/message/conversation-list', authMiddleware.checkAuthentication, GetChatMessage.prototype.conversationList);
    this.router.get('/chat/message/user/:receiverId', authMiddleware.checkAuthentication, GetChatMessage.prototype.messages);
    this.router.post('/chat/message', authMiddleware.checkAuthentication, AddMessage.prototype.message);
    this.router.post('/chat/message/add-chat-users', authMiddleware.checkAuthentication, AddMessage.prototype.addChatUsers);
    this.router.post('/chat/message/remove-chat-users', authMiddleware.checkAuthentication, AddMessage.prototype.removeChatUsers);
    this.router.put('/chat/message/mark-as-read', authMiddleware.checkAuthentication, UpdateMessages.prototype.message);
    this.router.put('/chat/message/reaction', authMiddleware.checkAuthentication, MessageReaction.prototype.reaction);
    this.router.delete(
      '/chat/message/mark-as-deleted/:messageId/:senderId/:receiverId/:type',
      authMiddleware.checkAuthentication,
      DeleteMessage.prototype.markMessageAsDeleted
    );

    return this.router;
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
