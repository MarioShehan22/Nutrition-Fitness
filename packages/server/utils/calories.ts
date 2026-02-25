export type ActivityLevel = 'low' | 'medium' | 'high';
export type Goal = 'loss' | 'maintenance' | 'gain';
export type Gender = 'male' | 'female';

export function calcDailyCalories(input: {
   age: number;
   gender: Gender;
   heightCm: number;
   weightKg: number;
   activityLevel: ActivityLevel;
   goal: Goal;
}) {
   const { age, gender, heightCm, weightKg, activityLevel, goal } = input;

   const bmr =
      gender === 'male'
         ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
         : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

   const factor =
      activityLevel === 'low' ? 1.2 : activityLevel === 'medium' ? 1.375 : 1.55;
   let calories = bmr * factor;

   if (goal === 'loss') calories -= 500;
   if (goal === 'gain') calories += 300;

   calories = Math.max(1200, Math.min(3500, calories));

   const mealTargets = {
      breakfast: Math.round(calories * 0.25),
      lunch: Math.round(calories * 0.3),
      dinner: Math.round(calories * 0.25),
      snack1: Math.round(calories * 0.1),
      snack2: Math.round(calories * 0.1),
   };

   return { calories: Math.round(calories), mealTargets };
}
