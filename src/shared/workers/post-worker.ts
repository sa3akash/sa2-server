import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { postServices } from '@service/db/post-services';

const log: Logger = config.createLogger('post-worker');

class PostWorker {
  async addPostToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      // key = userId, value = postObject
      const { key, value } = job.data;
      // add to db
      await postServices.addPostToDB(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      log.error(err);
      throw new ServerError('Post not saved in database, Try again later.');
    }
  }

  async deletePostToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      // key = userId, value = postObject
      const { postId, userId } = job.data;
      // add to db
      await postServices.deletePostById(postId, userId);
      job.progress(100);

      done(null, job.data);
    } catch (err) {
      log.error(err);
      throw new ServerError('Post not saved in database, Try again later.');
    }
  }

  async updatePostInDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { key, value } = job.data;
      await postServices.editPost(key, value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const postWorker: PostWorker = new PostWorker();
