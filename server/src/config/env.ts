import dotenv from 'dotenv';
dotenv.config();

const rawPort = process.env.PORT || '5000';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a whole number between 1 and 65535.');
}

const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
let clientOrigin: string;
try {
  clientOrigin = new URL(rawClientUrl).origin;
} catch {
  throw new Error('CLIENT_URL must be a valid absolute URL, such as http://localhost:5173.');
}

export const ENV = {
  PORT: port,
  // The demo has no authentication, so keep it on this computer by default.
  // Set HOST=0.0.0.0 only when network access is intentional and protected.
  HOST: process.env.HOST || '127.0.0.1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fastfood_db',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: clientOrigin,
};
