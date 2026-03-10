import { http } from './http';

export async function getDailyLog(userId: string, date: string) {
   const { data } = await http.get('/api/logs/daily', {
      params: { userId, date },
   });
   return data;
}

export async function updateMealStatus(payload: {
   userId: string;
   date: string; // YYYY-MM-DD
   slot: 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';
   status?: 'planned' | 'done' | 'skipped';
   notes?: string;
   consumed?: string[];
}) {
   const { data } = await http.patch('/api/logs/daily/meal', payload);
   return data;
}

export async function addWater(payload: {
   userId: string;
   date: string;
   ml: number;
}) {
   const { data } = await http.post('/api/logs/daily/water/add', payload);
   return data;
}

export async function setWaterTarget(payload: {
   userId: string;
   date: string;
   targetMl: number;
}) {
   const { data } = await http.patch('/api/logs/daily/water/target', payload);
   return data;
}

export async function logManual(payload: {
   userId: string;
   date: string;
   entries: Array<{
      foodName: string;
      calories: number;
      portion?: string;
      time?: string;
      macros?: { protein_g?: number; carbs_g?: number; fat_g?: number };
   }>;
}) {
   const { data } = await http.post('/api/logs/manual', payload);
   return data;
}
