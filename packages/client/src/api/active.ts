import { http } from './http';

function todayISO() {
   return new Date().toISOString().slice(0, 10);
}

export async function getToday(userId: string, date: string = todayISO()) {
   const { data } = await http.get('/api/plan-active/today', {
      params: { userId, date },
   });
   return data;
}
