import { http } from './http';

export type DayRow = {
   date: string;
   target: number;
   consumed: number;
   delta: number;
   status: 'under' | 'over' | 'ok';
   suggestedAdjustment?: string;
   totals?: { protein_g?: number; carbs_g?: number; fat_g?: number };
};

export type ProgressPayload = {
   mode: string;
   tolerance: number;
   baseTarget: number;
   startDate: string;
   endDate: string;
   series: DayRow[];
};

export async function getTimeseries(
   userId: string,
   from: string,
   to: string,
   mode: 'static' | 'weekly' | 'carry' = 'static'
): Promise<ProgressPayload> {
   const { data } = await http.get('/api/progress/timeseries', {
      params: { userId, from, to, mode },
   });
   return data as ProgressPayload;
}
