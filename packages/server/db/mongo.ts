import mongoose from 'mongoose';

export async function connectMongo() {
   const uri = process.env.MONGO_URI;
   if (!uri) throw new Error('Missing MONGO_URI in .env');

   mongoose.connection.on('connected', () => console.log('✅ Mongo connected'));
   mongoose.connection.on('error', (e) => console.error('❌ Mongo error:', e));

   await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30_000, // wait longer than 10s
   });
}
