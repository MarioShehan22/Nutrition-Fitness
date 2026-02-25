import { http } from './http';

export async function enrollPlan(payload: {
   userId: string;
   planId: string;
   requirementId: string;
   chosenKey: 'A' | 'B' | 'C';
   rotation?: 'fixed' | 'rotate-daily';
   startDate: string;
   endDate: string;
   rotationStartKey?: 'A' | 'B' | 'C';
}) {
   const { data } = await http.post('/api/plan/enroll', payload);
   return data;
}
