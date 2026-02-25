import { planRepository } from '../repositories/plan.repository';
import { calcDailyCalories } from '../utils/calories';
import { llmClient } from '../llm/client';
import { suggestDurationDays, startEndDates, bmi } from '../utils/planDuration';

export const planService = {
   async saveRequirements(reqBody: any) {
      const goalType = reqBody.goal?.type ?? 'maintenance';
      const bmiValue = bmi(reqBody.weightKg, reqBody.heightCm);
      const durationDays = suggestDurationDays(goalType, bmiValue);
      const { start, end } = startEndDates(durationDays, 'Asia/Colombo');

      reqBody.goal = {
         ...(reqBody.goal || {}),
         durationDays,
         startDate: start,
         endDate: end,
      };

      return planRepository.createRequirement(reqBody);
   },

   async generateAndSavePlan(requirement: any) {
      const goalType = requirement.goal?.type ?? 'maintenance';

      const { calories: computedCalories, mealTargets } = calcDailyCalories({
         age: requirement.age,
         gender: requirement.gender,
         heightCm: requirement.heightCm,
         weightKg: requirement.weightKg,
         activityLevel: requirement.activityLevel,
         goal: goalType,
      });

      const overrideCals = requirement.goal?.calorieTargetPerDay;
      const finalCalories = overrideCals
         ? Math.max(1200, Math.min(3500, Math.round(overrideCals)))
         : computedCalories;

      const preferredMeals = requirement.goal?.preferredMeals || {};
      const macroRatios = requirement.goal?.macroRatios || null;

      const startDate = requirement.goal?.startDate
         ? new Date(requirement.goal.startDate)
         : new Date();
      const durationDays = requirement.goal?.durationDays ?? 30;
      const endDate = requirement.goal?.endDate
         ? new Date(requirement.goal.endDate)
         : new Date(startDate.getTime() + durationDays * 86400000);

      const prompt = `
         Generate 3 Sri Lankan full-day meal plans (Plan A/B/C) for NutriFit.
         
         User:
         - Goal: ${goalType}
         - Dietary preference: ${requirement.dietaryPreference}
         - Allergies: ${(requirement.allergies || []).join(', ') || 'none'}
         - Conditions: ${(requirement.conditions || []).join(', ') || 'none'}
         
         Daily calories target: ${finalCalories}
         Meal targets (calories): ${JSON.stringify(mealTargets, null, 2)}
         
         User preferred meals (use as hints, not strict rules):
         ${JSON.stringify(preferredMeals, null, 2)}
         
         ${macroRatios ? `Preferred macro ratios (optional): ${JSON.stringify(macroRatios)}` : ''}
         
         Rules:
         - Return exactly 3 plans: A, B, C
         - Each plan includes: breakfast, snack1, lunch, snack2, dinner
         - Use Sri Lankan foods; avoid allergens; reflect conditions with safe choices
         - Include "substitutions" and "conditionNotes"
         - Output MUST validate against the nutrition_plan schema
         `.trim();

      const model = process.env.LLM_MODEL || 'gpt-4o-mini';

      let provider: 'openai' | 'fallback' = 'openai';
      let llm: any;

      try {
         llm = await llmClient.generateNutritionPlan({
            model,
            instructions: process.env.NUTRIFIT_INSTRUCTIONS || '',
            prompt,
            maxTokens: 700, // lower cost
         });
      } catch (e: any) {
         const status = e?.status ?? e?.response?.status;
         const code = e?.code ?? e?.error?.code;

         if (status === 429 || code === 'insufficient_quota') {
            provider = 'fallback';
            llm = {
               json: buildFallbackNutritionPlan({
                  dailyCalories: finalCalories,
                  mealTargets,
                  dietaryPreference: requirement.dietaryPreference,
                  allergies: requirement.allergies || [],
                  conditions: requirement.conditions || [],
               }),
               rawText: `FALLBACK_PLAN_USED: ${e?.message ?? String(e)}`,
            };
         } else {
            throw e;
         }
      }

      const planDoc = await planRepository.createPlan({
         userId: requirement.userId,
         requirementId: String(requirement._id),
         provider,
         model,
         dailyCalories: llm.json.dailyCalories,
         mealTargets: llm.json.mealTargets,
         plans: llm.json.plans,
         rawText: llm.rawText,
         parseOk: true,
         durationDays,
         startDate,
         endDate,
      });

      return planDoc;
   },
};

function buildFallbackNutritionPlan(input: {
   dailyCalories: number;
   mealTargets: any;
   dietaryPreference: 'veg' | 'non_veg' | 'vegan';
   allergies: string[];
   conditions: string[];
}) {
   const cond = input.conditions?.length
      ? `Conditions: ${input.conditions.join(', ')}`
      : '';
   const allg = input.allergies?.length
      ? `Allergies: ${input.allergies.join(', ')}`
      : '';

   const nonVeg = input.dietaryPreference === 'non_veg';

   const mk = (
      b: string[],
      s1: string[],
      l: string[],
      s2: string[],
      d: string[]
   ) => ({
      breakfast: b,
      snack1: s1,
      lunch: l,
      snack2: s2,
      dinner: d,
      substitutions: [
         'Swap white rice → red rice',
         'If vegan: replace curd/egg with coconut yogurt/tofu',
         'If weight loss: reduce coconut milk portions',
      ],
      conditionNotes: [cond, allg].filter(Boolean).join(' | '),
   });

   return {
      dailyCalories: input.dailyCalories,
      mealTargets: input.mealTargets,
      plans: [
         {
            key: 'A',
            meals: mk(
               [
                  'String hoppers + dhal curry' +
                     (nonVeg ? ' + boiled egg' : ''),
               ],
               ['Banana'],
               [
                  'Red rice + dhal + gotukola sambol' +
                     (nonVeg ? ' + grilled chicken' : ''),
               ],
               ['Roasted gram (kadala)'],
               [
                  'Vegetable soup + roti' +
                     (nonVeg ? ' + fish curry (small)' : ''),
               ]
            ),
         },
         {
            key: 'B',
            meals: mk(
               ['Hoppers (2–3) + lunu miris' + (nonVeg ? ' + egg hopper' : '')],
               ['Papaya'],
               [
                  'Rice + beetroot curry + dhal' +
                     (nonVeg ? ' + tuna curry' : ''),
               ],
               ['Boiled peanuts'],
               ['Kola kanda + boiled sweet potato']
            ),
         },
         {
            key: 'C',
            meals: mk(
               ['Kiribath (light) + pol sambol' + (nonVeg ? ' + egg' : '')],
               ['Orange'],
               [
                  'Rice + okra curry + leafy mallung + dhal' +
                     (nonVeg ? ' + chicken' : ''),
               ],
               ['Fruit bowl'],
               ['Stir-fry vegetables + roti']
            ),
         },
      ],
   };
}
