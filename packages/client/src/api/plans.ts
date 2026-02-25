import { http } from './http';

export type RequirementsInput = {
   userId?: string;
   age: number;
   gender: 'male' | 'female';
   heightCm: number;
   weightKg: number;
   activityLevel: 'low' | 'medium' | 'high';
   goal: 'loss' | 'maintenance' | 'gain';
   dietaryPreference: 'veg' | 'non_veg' | 'vegan';
   allergies?: string[];
   conditions?: string[];
   notes?: string;
};

export async function createRequirements(payload: RequirementsInput) {
   const { data } = await http.post('/api/plan/requirements', payload);
   return data;
}

export async function generatePlan(payload: RequirementsInput) {
   const { data } = await http.post('/api/plan/generate', payload);
   return data; // { requirementId, planId, plan }
}

export async function getPlan(planId: string) {
   const { data } = await http.get(`/api/plan/${planId}`);
   return data;
}
