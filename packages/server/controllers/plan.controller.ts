import type { RequestHandler } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';

import { planService } from '../services/plan.service';
import { planRepository } from '../repositories/plan.repository';

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
   (input: unknown) => {
      if (!input || typeof input !== 'object') return input;

      const obj = input as Record<string, any>;

      if (typeof obj.goal === 'string') {
         obj.goal = { type: obj.goal };
      }

      if (obj.preferredMeals && !obj.goal?.preferredMeals) {
         obj.goal = {
            ...(obj.goal || {}),
            preferredMeals: obj.preferredMeals,
         };
      }

      if (obj.goal?.calorieTargetPerDay != null) {
         const v = Math.round(Number(obj.goal.calorieTargetPerDay));
         obj.goal.calorieTargetPerDay = Math.max(1200, Math.min(3500, v));
      }

      return obj;
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

type RequirementInput = z.infer<typeof requirementSchema>;

function normalizeRequirement(data: RequirementInput): RequirementInput {
   const out = { ...data } as RequirementInput & {
      preferredMeals?: unknown;
      goal?: RequirementInput['goal'];
   };

   if ('preferredMeals' in out && out.preferredMeals) {
      out.goal = {
         ...(out.goal || { type: 'maintenance' }),
         preferredMeals:
            out.preferredMeals as RequirementInput['goal']['preferredMeals'],
      };
      delete (out as { preferredMeals?: unknown }).preferredMeals;
   }

   return out;
}

const createRequirements: RequestHandler = async (req, res) => {
   const parsed = requirementSchema.safeParse(req.body);

   if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
   }

   const body = normalizeRequirement(parsed.data);
   const doc = await planService.saveRequirements(body);

   res.json({ requirementId: String(doc._id), requirement: doc });
};

const generatePlan: RequestHandler = async (req, res) => {
   const parsed = requirementSchema.safeParse(req.body);

   if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
   }

   try {
      const requirement = await planService.saveRequirements(
         normalizeRequirement(parsed.data)
      );

      const plan = await planService.generateAndSavePlan(requirement);

      res.status(201).json({
         requirementId: String(requirement._id),
         planId: String(plan._id),
         plan,
      });
      return;
   } catch (e: unknown) {
      const err = e as {
         status?: number;
         response?: { status?: number };
         code?: string;
         error?: { code?: string; message?: string };
         message?: string;
      };

      const status = err?.status ?? err?.response?.status;
      const code = err?.code ?? err?.error?.code;
      const msg = err?.error?.message ?? err?.message ?? String(e);

      if (status === 429) {
         res.status(429).json({
            error: 'OpenAI request blocked (quota/rate limit)',
            code: code ?? 'rate_limit_or_quota',
            detail: msg,
         });
         return;
      }

      res.status(502).json({
         error: 'Failed to generate nutrition plan',
         detail: msg,
      });
   }
};

const getPlan: RequestHandler = async (req, res) => {
   const id = req.params.id;

   if (!id) {
      res.status(400).json({ error: 'Missing plan id' });
      return;
   }

   if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid plan id format' });
      return;
   }

   const plan = await planRepository.getPlan(id);

   if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
   }

   res.json(plan);
};

const listPlans: RequestHandler = async (req, res) => {
   const userId = req.query.userId;

   if (typeof userId !== 'string' || !userId.trim()) {
      res.status(400).json({ error: 'userId query param required' });
      return;
   }

   const plans = await planRepository.listPlansByUser(userId);
   res.json(plans);
};

const planController = {
   listPlans,
   getPlan,
   generatePlan,
   createRequirements,
};

export default planController;
