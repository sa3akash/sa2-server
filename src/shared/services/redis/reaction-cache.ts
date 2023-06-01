import { BaseCache } from '@service/redis/base-cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IReactionDocument, IReactions } from '@reaction/interfaces/reactions-interfaces';
import { Helpers } from '@global/helpers/helpers';
import { find } from 'lodash';

const log: Logger = config.createLogger('reaction-cache');

export class ReactionCache extends BaseCache {
  constructor() {
    super('reaction-redis');
  }
  //*******
  //** add reactions
  //*******

  public async addReactionSaveToCache(
    key: string,
    reaction: IReactionDocument,
    postReactions: IReactions,
    type: string,
    previousReaction: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      if (previousReaction) {
        // remove reaction
        this.removeReactionFromCache(key, reaction.username, postReactions);
      }

      // if not react then add new reaction
      if (type) {
        await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));
        // update post
        await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
      }
    } catch (err) {
      log.error(err);
      throw new ServerError('Server Error, Try again later.');
    }
  }

  public async removeReactionFromCache(key: string, username: string, postReactions: IReactions): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();

      const userPreviousReaction: IReactionDocument = this.getPreviousReactions(response, username) as IReactionDocument;

      multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));
      await multi.exec();

      // update post
      await this.client.HSET(`posts:${key}`, 'reactions', JSON.stringify(postReactions));
    } catch (err) {
      log.error(err);
      throw new ServerError('Server Error, Try again later.');
    }
  }

  private getPreviousReactions(response: string[], username: string): IReactionDocument | undefined {
    const list: IReactionDocument[] = [];

    for (const item of response) {
      list.push(Helpers.parseJson(item) as IReactionDocument);
    }

    return find(list, (listItem: IReactionDocument) => listItem.username === username);
  }

  public async getReactionFromCache(postId: string): Promise<[IReactionDocument[], number]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const reactionsCount: number = await this.client.LLEN(`reactions:${postId}`);
      const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const list: IReactionDocument[] = [];
      for (const item of response) {
        list.push(Helpers.parseJson(item));
      }
      return response.length ? [list, reactionsCount] : [[], 0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getSingleReactionByUsernameFromCache(postId: string, username: string): Promise<[IReactionDocument, number] | []> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.LRANGE(`reactions:${postId}`, 0, -1);
      const list: IReactionDocument[] = [];
      for (const item of response) {
        list.push(Helpers.parseJson(item));
      }
      const result: IReactionDocument = find(list, (listItem: IReactionDocument) => {
        return listItem?.postId === postId && listItem?.username === username;
      }) as IReactionDocument;

      return result ? [result, 1] : [];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
