type GoalType = 'loss' | 'maintenance' | 'gain';

export function bmi(weightKg: number, heightCm: number) {
   const h = heightCm / 100;
   return +(weightKg / (h * h)).toFixed(1);
}

export function suggestDurationDays(goal: GoalType, bmiValue: number) {
   if (goal === 'maintenance') return 30; // 4 weeks review cycle
   if (goal === 'gain') return 56; // ~8 weeks lean-gain phase

   // weight loss → adjust by BMI category
   if (bmiValue >= 30) return 84; // ~12 weeks
   if (bmiValue >= 25) return 56; // ~8 weeks
   return 28; // ~4 weeks (overweight threshold not met)
}

export function startEndDates(
   durationDays: number,
   tz: string = 'Asia/Colombo'
) {
   const now = new Date();
   const start = now;
   const end = new Date(start.getTime() + durationDays * 86400000);
   return { start, end };
}
