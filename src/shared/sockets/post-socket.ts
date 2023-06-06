import { ICommentDocument } from '@comment/interfaces/comment-interface';
import { IReactionDocument } from '@reaction/interfaces/reactions-interfaces';
import { Server, Socket } from 'socket.io';

export let socketIOPostObject: Server;

export class SocketIOPostHandler {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
    socketIOPostObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('reaction', (reaction: IReactionDocument) => {
        this.io.emit('update-reaction', reaction);
      });

      socket.on('comment', (comment: ICommentDocument) => {
        this.io.emit('update-comment', comment);
      });
    });
  }
}
