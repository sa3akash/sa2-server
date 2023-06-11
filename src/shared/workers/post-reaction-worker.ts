import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error-handler';
import { reactionServices } from '@service/db/post-reaction-services';

const log: Logger = config.createLogger('post-reaction-worker');

class ReactionWorker {
  async addReactionToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      // key = userId, value = postObject
      const reactionObject = job.data;
      // add to db
      await reactionServices.addReactonToDB(reactionObject);

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      log.error(err);
      throw new ServerError('Post not saved in database, Try again later.');
    }
  }
  async removeReactionToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      // key = userId, value = postObject
      const reactionObject = job.data;
      // add to db
      await reactionServices.removeReactonToDB(reactionObject);

      job.progress(100);
      done(null, job.data);
    } catch (err) {
      log.error(err);
      throw new ServerError('Post not saved in database, Try again later.');
    }
  }
}

export const reactionWorker: ReactionWorker = new ReactionWorker();
