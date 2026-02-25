import { http } from './http';

export async function getTimeseries(userId: string, from: string, to: string) {
   const { data } = await http.get('/api/progress/timeseries', {
      params: { userId, from, to },
   });
   return data;
}
