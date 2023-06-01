/* eslint-disable @typescript-eslint/no-empty-function */
import { authRoutes } from '@auth/routes/auth-routes';
import { currentRoutes } from '@auth/routes/current-routes';
import { authMiddleware } from '@global/helpers/auth-middleware';
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
  };
  routes();
};
