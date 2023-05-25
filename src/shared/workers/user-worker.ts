import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { userService } from '@service/db/user-services';

const log: Logger = config.createLogger('user-worker');

class UserWorker {
  async addUserDataToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { value } = job.data;
      // add method to send data to database
      userService.addUserData(value);
      job.progress(100);
      done(null, job.data);
    } catch (err) {
      log.error(err);
      done(err as Error);
    }
  }
}

export const userWorker: UserWorker = new UserWorker();
