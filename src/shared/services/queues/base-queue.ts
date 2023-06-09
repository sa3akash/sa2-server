import Queue, { Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { IAuthDocument, IAuthJob } from '@auth/interfaces/auth-interface';
import { IEmailJob } from '@user/interfaces/user-interface';
import { IPostJobData } from '@post/interfaces/post-interface';
import { IReactionJob } from '@reaction/interfaces/reactions-interfaces';
import { ICommentJob } from '@comment/interfaces/comment-interface';
import { IBlockedUserJobData, IFollowerJobData } from '@follower/interfaces/follower-interface';
import { INotificationJobData } from '@notification/interfaces/notifications-interfaces';
import { IFileImageJobData } from '@image/interfaces/images-interface';

let bullAdapters: BullAdapter[] = [];
export let serverAdapter: ExpressAdapter;

type IBaseJobData =
  | IAuthDocument
  | IAuthJob
  | IEmailJob
  | IPostJobData
  | IReactionJob
  | ICommentJob
  | IFollowerJobData
  | IBlockedUserJobData
  | INotificationJobData
  | IFileImageJobData;

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;
  constructor(queueName: string) {
    this.queue = new Queue(queueName, config.REDIS_URL!);
    bullAdapters.push(new BullAdapter(this.queue));
    bullAdapters = [...new Set(bullAdapters)];
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: bullAdapters,
      serverAdapter: serverAdapter
    });

    this.log = config.createLogger(queueName);

    this.queue.on('completed', (job: Job) => {
      job.remove();
    });
    this.queue.on('global:completed', (jobId: string) => {
      this.log.info(`Job ${jobId} is completed.`);
    });

    this.queue.on('global:stalled', (jobId: string) => {
      this.log.info(`Job ${jobId} is stalled.`);
    });
  }

  protected addJob(jobName: string, data: IBaseJobData): void {
    this.queue.add(jobName, data, { attempts: 3, backoff: { type: 'fixed', delay: 5000 } });
  }

  protected processJob(name: string, concurrency: number, callback: Queue.ProcessCallbackFunction<void>): void {
    this.queue.process(name, concurrency, callback);
  }
}
