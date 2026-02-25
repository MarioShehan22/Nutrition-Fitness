import mongoose from 'mongoose';
export function parseObjectId(id: string) {
   if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Invalid plan id format');
      err.status = 400;
      throw err;
   }
   return new mongoose.Types.ObjectId(id);
}
