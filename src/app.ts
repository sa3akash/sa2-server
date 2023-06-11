import express, { Express } from 'express';
import { SA2Server } from '@root/setupServer';
import databaseConnection from '@root/setupDatabase';
import { config } from '@root/config';

class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: SA2Server = new SA2Server(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryconfig();
  }
}

const application: Application = new Application();
application.initialize();
