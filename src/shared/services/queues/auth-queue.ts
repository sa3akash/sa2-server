import { IAuthJob } from '@auth/interfaces/auth-interface';
import { BaseQueue } from '@service/queues/base-queue';
import { authWorker } from '@worker/auth-worker';

class AuthQueue extends BaseQueue {
  constructor() {
    super('auth-queue');
    this.processJob('addAuthUserToDB', 5, authWorker.addAuthDataToDB);
  }

  public addAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }
}

export const authQueue: AuthQueue = new AuthQueue();
