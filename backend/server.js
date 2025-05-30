import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import mongoose from 'mongoose';
import { initDerivedKeys } from './utils/jwtKeyManager.js';

async function startServer() {
  try {
    await initDerivedKeys();

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
}

startServer();
