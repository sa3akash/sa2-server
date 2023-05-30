import { BaseCache } from '@service/redis/base-cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { IPostDocument, IReactions, ISavePostToCache } from '@post/interfaces/post-interface';
import { Helpers } from '@global/helpers/helpers';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';

const log: Logger = config.createLogger('post-cache');
export type PostCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IPostDocument | IPostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super('post-redis');
  }

  public async savePostToCache(data: ISavePostToCache): Promise<void> {
    const { key, currentUserId, uId, createdPost } = data;
    // ready for save to cache
    const dataToSave = {
      _id: `${createdPost._id}`,
      userId: `${createdPost.userId}`,
      username: `${createdPost.username}`,
      email: `${createdPost.email}`,
      avatarColor: `${createdPost.avatarColor}`,
      profilePicture: `${createdPost.profilePicture}`,
      post: `${createdPost.post}`,
      bgColor: `${createdPost.bgColor}`,
      feelings: `${createdPost.feelings}`,
      privacy: `${createdPost.privacy}`,
      gifUrl: `${createdPost.gifUrl}`,
      commentsCount: `${createdPost.commentsCount}`,
      reactions: JSON.stringify(createdPost.reactions),
      imgVersion: `${createdPost.imgVersion}`,
      imgId: `${createdPost.imgId}`,
      videoId: `${createdPost.videoId}`,
      videoVersion: `${createdPost.videoVersion}`,
      createdAt: `${createdPost.createdAt}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // save logic here
      const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      // use multi for execute all commands in one time
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      // create a set name post
      await this.client.ZADD('post', { score: parseInt(uId, 10), value: `${key}` });
      // loop all entries and save redis db
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        multi.HSET(`posts:${key}`, `${itemKey}`, `${itemValue}`);
      }
      // increment post count
      const count: number = parseInt(postCount[0], 10) + 1;
      multi.HSET(`users:${currentUserId}`, 'postsCount', count);
      multi.exec(); //exec multi command
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostFromCache(key: string, start: string, end: string): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // ZRANGE is return all post and ZRANGEBYSCORE return new post first

      const reply: string[] = await this.client.sendCommand(['ZREVRANGE', key, start, end]);

      // ERROR:  ERR syntax error
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      // loop all reply variables
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType; //type any if error
      const postReplies: IPostDocument[] = [];

      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
        postReplies.push(post);
      }

      return postReplies;
    } catch (err) {
      log.error(err);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getNumberOfPostFromCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const countPost: number = await this.client.ZCARD('post');
      return countPost;
    } catch (err) {
      log.error(err);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getPostsWithImagesFromCache(key: string, start: number, end: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, start, end);
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postWithImages: IPostDocument[] = [];

      for (const post of replies as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
          post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
          post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
          postWithImages.push(post);
        }
      }
      return postWithImages;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUserPostsFromCache(key: string, uId: number): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const reply: string[] = await this.client.ZRANGE(key, uId, uId, { REV: true, BY: 'SCORE' });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const value of reply) {
        multi.HGETALL(`posts:${value}`);
      }

      const replies: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReplies: IPostDocument[] = [];

      for (const post of replies as IPostDocument[]) {
        post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
        post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
        post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;
        postReplies.push(post);
      }
      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalUserPostsInCache(uId: number): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const count: number = await this.client.ZCOUNT('post', uId, uId);
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async deletePostFromCache(key: string, currentUserId: string): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      // save logic here
      const postCount: string[] = await this.client.HMGET(`users:${currentUserId}`, 'postsCount');
      // use multi for execute all commands in one time
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      // remove set
      multi.ZREM('post', key);
      multi.DEL(`posts:${key}`);
      multi.DEL(`comments:${key}`);
      multi.DEL(`reactions:${key}`);

      const count: number = parseInt(postCount[0], 10) - 1;
      multi.HSET(`users:${currentUserId}`, ['postsCount', count]);

      await multi.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updatePostInCache(key: string, updatedPost: IPostDocument): Promise<IPostDocument> {
    // key === postId
    const dataToSave = {
      post: `${updatedPost.post}`,
      bgColor: `${updatedPost.bgColor}`,
      feelings: `${updatedPost.feelings}`,
      privacy: `${updatedPost.privacy}`,
      gifUrl: `${updatedPost.gifUrl}`,
      videoId: `${updatedPost.videoId}`,
      videoVersion: `${updatedPost.videoVersion}`,
      profilePicture: `${updatedPost.profilePicture}`,
      imgVersion: `${updatedPost.imgVersion}`,
      imgId: `${updatedPost.imgId}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`posts:${key}`, `${itemKey}`, `${itemValue}`);
      }

      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      multi.HGETALL(`posts:${key}`);

      const reply: PostCacheMultiType = (await multi.exec()) as PostCacheMultiType;
      const postReply = reply as IPostDocument[];
      postReply[0].commentsCount = Helpers.parseJson(`${postReply[0].commentsCount}`) as number;
      postReply[0].reactions = Helpers.parseJson(`${postReply[0].reactions}`) as IReactions;
      postReply[0].createdAt = new Date(Helpers.parseJson(`${postReply[0].createdAt}`)) as Date;

      return postReply[0];
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
