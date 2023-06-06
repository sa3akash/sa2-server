import { AddUser } from '@follower/controllers/block-user';
import { FollowerAdd } from '@follower/controllers/follower-user';
import { GetFollowers } from '@follower/controllers/get-followers';
import { RemoveFollower } from '@follower/controllers/unfollow-user';
import { authMiddleware } from '@global/helpers/auth-middleware';
import express, { Router } from 'express';

class FollowerRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }

  public followersRoutes(): Router {
    this.router.put('/user/follow/:followerId', authMiddleware.checkAuthentication, FollowerAdd.prototype.follower);
    this.router.put('/user/unfollow/:followerId', authMiddleware.checkAuthentication, RemoveFollower.prototype.unFollower);
    this.router.get('/user/following', authMiddleware.checkAuthentication, GetFollowers.prototype.userFollowing);
    this.router.get('/user/followers/:userId', authMiddleware.checkAuthentication, GetFollowers.prototype.userFollowers);
    this.router.put('/user/block/:followerId', authMiddleware.checkAuthentication, AddUser.prototype.block);
    this.router.put('/user/unblock/:followerId', authMiddleware.checkAuthentication, AddUser.prototype.unblock);

    return this.router;
  }
}

export const followerRoutes: FollowerRoutes = new FollowerRoutes();
