import { BaseCache } from '@service/redis/base-cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { find } from 'lodash';
import { ICommentDocument, ICommentNameList } from '@comment/interfaces/comment-interface';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('comment-cache');

export class CommentCache extends BaseCache {
  constructor() {
    super('comment-redis');
  }
  //*******
  //** add comment
  //*******

  public async addPostCommentToCache(key: string, value: ICommentDocument): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      await this.client.LPUSH(`comments:${key}`, JSON.stringify(value));
      // update postCount
      const commentsCount: string[] = await this.client.HMGET(`posts:${key}`, 'commentsCount');

      let count: number = Helpers.parseJson(commentsCount[0]) as number;
      count += 1;

      await this.client.HSET(`posts:${key}`, 'commentsCount', `${count}`);
    } catch (err) {
      log.error(err);
      throw new ServerError('Server Error, Try again later.');
    }
  }

  public async getCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reply: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);

      const list: ICommentDocument[] = [];
      for (const item of reply) {
        list.push(Helpers.parseJson(item));
      }
      return list;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getCommentsNamesFromCache(postId: string): Promise<ICommentNameList[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const commentsCount: number = await this.client.LLEN(`comments:${postId}`);
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);

      const list: string[] = [];
      for (const item of comments) {
        const comment: ICommentDocument = Helpers.parseJson(item) as ICommentDocument;
        list.push(comment.username);
      }

      const response: ICommentNameList = {
        count: commentsCount,
        names: list
      };
      return [response];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getSingleCommentFromCache(postId: string, commentId: string): Promise<ICommentDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);
      const list: ICommentDocument[] = [];

      for (const item of comments) {
        list.push(Helpers.parseJson(item));
      }

      const result: ICommentDocument = find(list, (listItem: ICommentDocument) => listItem._id === commentId) as ICommentDocument;

      return [result];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
