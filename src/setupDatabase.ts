import mongoose from 'mongoose';
import { config } from '@root/config';
import Logger from 'bunyan';
import { redisConnection } from '@service/redis/redis-connection';

const log: Logger = config.createLogger('setupDatabase');

export default () => {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL!)
      .then(() => {
        log.info('DB connection successfull.');
        redisConnection.connection();
      })
      .catch((err) => {
        log.error(err);
        return process.exit(1);
      });
  };
  connect();
  mongoose.connection.on('disconnect', connect);
};
