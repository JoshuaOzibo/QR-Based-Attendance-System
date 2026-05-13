import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['MONGO_URI'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`${envVar} environment variable is required`);
    process.exit(1);
  }
});

export const env = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  QR_SECRET_KEY: process.env.QR_SECRET_KEY || 'default-secret-key',
  QR_CODE_DIR: process.env.QR_CODE_DIR,
  CLASS_LAT: parseFloat(process.env.CLASS_LAT || 30.2679634),
  CLASS_LNG: parseFloat(process.env.CLASS_LNG || 77.991887),
  MAX_DISTANCE_METERS: parseFloat(process.env.MAX_DISTANCE_METERS || 10000000000000)
};
