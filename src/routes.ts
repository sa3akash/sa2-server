import { authRoutes } from '@auth/routes/auth-routes';
import { currentRoutes } from '@auth/routes/current-routes';
import { chatRoutes } from '@chat/routes/chat-routes';
import { commentRoutes } from '@comment/routes/comment-route';
import { followerRoutes } from '@follower/routes/follower-routes';
import { authMiddleware } from '@global/helpers/auth-middleware';
import { imageRoutes } from '@image/routes/image-routes';
import { notificationRoutes } from '@notification/routes/notification-routes';
import { postRoutes } from '@post/routes/post-route';
import { reactionRoutes } from '@reaction/routes/reaction-routes';
import { serverAdapter } from '@service/queues/base-queue';
import { Application } from 'express';

const basePath = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(basePath, authRoutes.routes());
    app.use(basePath, authRoutes.signOutRoute());
    app.use(basePath, authMiddleware.verifyUser, currentRoutes.getCurrentUser());
    app.use(basePath, authMiddleware.verifyUser, postRoutes.getPostRoutes());
    app.use(basePath, authMiddleware.verifyUser, reactionRoutes.reactionRoutes());
    app.use(basePath, authMiddleware.verifyUser, commentRoutes.getCommentRoutes());
    app.use(basePath, authMiddleware.verifyUser, followerRoutes.followersRoutes());
    app.use(basePath, authMiddleware.verifyUser, notificationRoutes.routes());
    app.use(basePath, authMiddleware.verifyUser, imageRoutes.routes());
    app.use(basePath, authMiddleware.verifyUser, chatRoutes.routes());
  };
  routes();
};
