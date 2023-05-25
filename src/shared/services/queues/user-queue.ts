import { BaseQueue } from '@service/queues/base-queue';
import { userWorker } from '@worker/user-worker';

class UserQueue extends BaseQueue {
  constructor() {
    super('user-queue');
    this.processJob('addUserUserToDB', 5, userWorker.addUserDataToDB);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addUserJob(name: string, data: any): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
