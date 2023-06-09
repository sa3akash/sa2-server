import Logger from 'bunyan';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base-cache';

const log: Logger = config.createLogger('redis-connection');

class RedisConnection extends BaseCache {
  constructor() {
    super('redis-connection');
  }

  async connection(): Promise<void> {
    try {
      this.client.connect();
    } catch (err) {
      log.error(err);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
