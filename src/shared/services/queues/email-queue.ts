import { BaseQueue } from '@service/queues/base-queue';
import { IEmailJob } from '@user/interfaces/user-interface';
import { emailWorker } from '@worker/email-worker';

class EmailQueue extends BaseQueue {
  constructor() {
    super('email-queue');
    this.processJob('forgotPassword', 5, emailWorker.addNotificationEmail);
  }
  public addEmailJob(name: string, data: IEmailJob): void {
    this.addJob(name, data);
  }
}

export const emailQueue: EmailQueue = new EmailQueue();
