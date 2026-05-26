import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
    console.log(`\x1b[32m%s\x1b[0m`, `DATABASE CONNECTED SUCCESSFULLY!`);
    console.log(`\x1b[33m%s\x1b[0m`, `MongoDB Host: ${conn.connection.host}`);
    console.log(`\x1b[35m%s\x1b[0m`, `DB Name: ${conn.connection.name}`);
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
