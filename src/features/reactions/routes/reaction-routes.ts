import { authMiddleware } from '@global/helpers/auth-middleware';
import { AddReaction } from '@reaction/controllers/add-reaction';
import { GetReactions } from '@reaction/controllers/get-reaction';
import { RemoveReaction } from '@reaction/controllers/remove-reaction';
import express, { Router } from 'express';

class ReactionRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public reactionRoutes(): Router {
    this.router.post('/reaction/add', authMiddleware.checkAuthentication, AddReaction.prototype.addReaction);
    this.router.delete('/reaction/remove', authMiddleware.checkAuthentication, RemoveReaction.prototype.removeReaction);

    this.router.get('/reaction/:postId', authMiddleware.checkAuthentication, GetReactions.prototype.getReactionByPostId);
    this.router.get('/reaction/:postId/:username', authMiddleware.checkAuthentication, GetReactions.prototype.getSingleReactionByUsername);
    this.router.get('/reactions/:username', authMiddleware.checkAuthentication, GetReactions.prototype.getAllReactionByUsername);

    return this.router;
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
