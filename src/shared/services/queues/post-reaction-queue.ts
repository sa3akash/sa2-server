import { IReactionJob } from '@reaction/interfaces/reactions-interfaces';
import { BaseQueue } from '@service/queues/base-queue';
import { reactionWorker } from '@worker/post-reaction-worker';

class ReactionQueue extends BaseQueue {
  constructor() {
    super('post-reaction-queue');
    this.processJob('addReactionToDB', 5, reactionWorker.addReactionToDB);
    this.processJob('removeReactionToDB', 5, reactionWorker.removeReactionToDB);
  }

  public addReactionJob(name: string, data: IReactionJob): void {
    this.addJob(name, data);
  }
  public removeReactionJob(name: string, data: IReactionJob): void {
    this.addJob(name, data);
  }
}

export const reactionQueue: ReactionQueue = new ReactionQueue();
