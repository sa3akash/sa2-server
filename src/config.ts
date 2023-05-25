import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

dotenv.config();

class Config {
  public DATABASE_URL: string | undefined;
  public JWT_SEC: string | undefined;
  public S_KEY_ONE: string | undefined;
  public S_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public NODE_ENV: string | undefined;
  public SERVER_PORT: number | undefined;
  public REDIS_URL: string | undefined;
  public CLOUD_NAME: string | undefined;
  public CLOUD_API_KEY: string | undefined;
  public CLOUD_SEC: string | undefined;
  public FOLDFR: string | undefined;

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL;
    this.JWT_SEC = process.env.JWT_SEC;
    this.S_KEY_ONE = process.env.S_KEY_ONE;
    this.S_KEY_TWO = process.env.S_KEY_TWO;
    this.CLIENT_URL = process.env.CLIENT_URL;
    this.NODE_ENV = process.env.NODE_ENV;
    this.SERVER_PORT = +process.env.SERVER_PORT!;
    this.REDIS_URL = process.env.REDIS_URL;
    this.CLOUD_NAME = process.env.CLOUD_NAME;
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY;
    this.CLOUD_SEC = process.env.CLOUD_SEC;
    this.FOLDFR = process.env.FOLDFR;
  }

  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined || value === null) {
        throw new Error(`${key} env is not defined`);
      }
    }
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public cloudinaryconfig(): void {
    cloudinary.v2.config({
      cloud_name: this.CLOUD_NAME,
      api_key: this.CLOUD_API_KEY,
      api_secret: this.CLOUD_SEC
    });
  }
}

export const config: Config = new Config();
