import type { Request, Response } from 'express';
import z from 'zod';
import { planService } from '../services/plan.service';
import { planRepository } from '../repositories/plan.repository';
import mongoose from 'mongoose';

const MacroRatiosSchema = z
   .object({
      carb: z.number().min(0).max(1),
      protein: z.number().min(0).max(1),
      fat: z.number().min(0).max(1),
   })
   .refine(
      (v) =>
         Math.abs((v.carb ?? 0) + (v.protein ?? 0) + (v.fat ?? 0) - 1) < 0.05,
      {
         message: 'macroRatios must sum to ~1.0',
      }
   );

const PreferredMealsSchema = z
   .object({
      breakfast: z.string().optional(),
      snack1: z.string().optional(),
      lunch: z.string().optional(),
      snack2: z.string().optional(),
      dinner: z.string().optional(),
   })
   .partial();

const GoalSchema = z.object({
   type: z.enum(['loss', 'maintenance', 'gain']),
   calorieTargetPerDay: z.number().min(800).max(5000).optional(),
   macroRatios: MacroRatiosSchema.optional(),
   preferredMeals: PreferredMealsSchema.optional(),
});

export const requirementSchema = z.preprocess(
   (input: any) => {
      if (!input || typeof input !== 'object') return input;

      // string -> object
      if (typeof input.goal === 'string') {
         input.goal = { type: input.goal };
      }

      if (input.preferredMeals && !input.goal?.preferredMeals) {
         input.goal = {
            ...(input.goal || {}),
            preferredMeals: input.preferredMeals,
         };
      }

      if (input.goal?.calorieTargetPerDay != null) {
         const v = Math.round(Number(input.goal.calorieTargetPerDay));
         input.goal.calorieTargetPerDay = Math.max(1200, Math.min(3500, v));
      }

      return input;
   },
   z.object({
      userId: z.string().optional(),
      age: z.number().int().min(5).max(90),
      gender: z.enum(['male', 'female']),
      heightCm: z.number().min(80).max(250),
      weightKg: z.number().min(20).max(400),
      activityLevel: z.enum(['low', 'medium', 'high']),
      goal: GoalSchema,
      dietaryPreference: z.enum(['veg', 'non_veg', 'vegan']),
      allergies: z.array(z.string()).optional().default([]),
      conditions: z.array(z.string()).optional().default([]),
      notes: z.string().optional(),
   })
);

function normalizeRequirement<T extends z.infer<typeof requirementSchema>>(
   data: T
) {
   const out = { ...data } as any;
   if (out.preferredMeals) {
      out.goal = { ...(out.goal || {}), preferredMeals: out.preferredMeals };
      delete out.preferredMeals;
   }
   return out as T;
}

export const planController = {
   async createRequirements(req: Request, res: Response) {
      const parsed = requirementSchema.safeParse(req.body);
      if (!parsed.success)
         return res.status(400).json({ errors: parsed.error.flatten() });

      const body = normalizeRequirement(parsed.data);
      const doc = await planService.saveRequirements(body);
      return res.json({ requirementId: String(doc._id), requirement: doc });
   },

   async generatePlan(req: Request, res: Response) {
      const parsed = requirementSchema.safeParse(req.body);
      if (!parsed.success)
         return res.status(400).json({ errors: parsed.error.flatten() });

      try {
         const requirement = await planService.saveRequirements(
            normalizeRequirement(parsed.data)
         );
         const plan = await planService.generateAndSavePlan(requirement);
         return res
            .status(201)
            .json({
               requirementId: String(requirement._id),
               planId: String(plan._id),
               plan,
            });
      } catch (e: any) {
         const status = e?.status ?? e?.response?.status;
         const code = e?.code ?? e?.error?.code;
         const msg = e?.error?.message ?? e?.message ?? String(e);

         // Insufficient quota / rate limit
         if (status === 429) {
            return res.status(429).json({
               error: 'OpenAI request blocked (quota/rate limit)',
               code: code ?? 'rate_limit_or_quota',
               detail: msg,
            });
         }

         return res
            .status(502)
            .json({ error: 'Failed to generate nutrition plan', detail: msg });
      }
   },

   async getPlan(req: Request, res: Response) {
      const id = req.params?.id;
      if (!id) return res.status(400).json({ error: 'Missing plan id' });
      if (!mongoose.Types.ObjectId.isValid(id))
         return res.status(400).json({ error: 'Invalid plan id format' });

      const plan = await planRepository.getPlan(id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      return res.json(plan);
   },

   async listPlans(req: Request, res: Response) {
      const userId = req.query.userId;
      if (typeof userId !== 'string' || !userId.trim()) {
         return res.status(400).json({ error: 'userId query param required' });
      }
      const plans = await planRepository.listPlansByUser(userId);
      return res.json(plans);
   },
};
