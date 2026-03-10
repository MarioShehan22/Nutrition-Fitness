type MealItem = {
   name: string;
   kcal: number;
   tags?: string[];
   portionScale?: number;
   swap?: string;
};

type Meal = { items: MealItem[]; kcal: number };

type DayPlan = {
   breakfast: Meal | undefined;
   snack1: Meal | undefined;
   lunch: Meal | undefined;
   snack2: Meal | undefined;
   dinner: Meal | undefined;
};

type AdjustRule = {
   maxScaleUpPct: number;
   maxScaleDownPct: number;
   snackAddKcal: number;
   snackDropKcal: number;
};

type Adjustment =
   | {
        type: 'scale';
        where: string;
        pct: number;
        deltaKcal: number;
     }
   | {
        type: 'add_snack' | 'drop_snack';
        where: keyof DayPlan;
        deltaKcal: number;
     };

const DEFAULT_RULES: AdjustRule = {
   maxScaleUpPct: 0.15,
   maxScaleDownPct: 0.15,
   snackAddKcal: 180,
   snackDropKcal: 150,
};

const sumKcal = (meal: Meal) =>
   meal.items.reduce(
      (s, i) => s + Math.round(i.kcal * (i.portionScale ?? 1)),
      0
   );

const hasTag = (it: MealItem, tag: string) => (it.tags ?? []).includes(tag);

export function adjustPlanForDay(
   basePlan: DayPlan,
   baseTarget: number,
   target: number,
   rules: AdjustRule = DEFAULT_RULES
) {
   const scale = target / baseTarget;

   const order: (keyof DayPlan)[] = [
      'breakfast',
      'lunch',
      'dinner',
      'snack1',
      'snack2',
   ];

   const scaled: DayPlan = {
      breakfast: undefined,
      snack1: undefined,
      lunch: undefined,
      snack2: undefined,
      dinner: undefined,
   };

   let total = 0;

   // initial scale
   for (const m of order) {
      const orig = basePlan[m];
      if (!orig) {
         scaled[m] = undefined;
         continue;
      }

      const items = orig.items.map((i) => ({
         ...i,
         kcal: Math.round(i.kcal * scale),
      }));

      const meal: Meal = { items, kcal: 0 };
      meal.kcal = sumKcal(meal);
      scaled[m] = meal;
      total += meal.kcal;
   }

   let gap = Math.round(target - total);
   const adjustments: Adjustment[] = [];

   const scaleMealItems = (
      m: keyof DayPlan,
      pct: number,
      selector: (i: MealItem) => boolean
   ) => {
      const meal = scaled[m];
      if (!meal) return;

      for (const it of meal.items) {
         if (!selector(it)) continue;

         const before = Math.round(it.kcal * (it.portionScale ?? 1));
         const nextScale = (it.portionScale ?? 1) * (1 + pct);
         const bounded = Math.max(
            1 - rules.maxScaleDownPct,
            Math.min(1 + rules.maxScaleUpPct, nextScale)
         );

         it.portionScale = Number(bounded.toFixed(3));

         const after = Math.round(it.kcal * it.portionScale);
         const delta = after - before;

         gap -= delta;
         adjustments.push({
            type: 'scale',
            where: `${m}.${it.name}`,
            pct: Math.round((it.portionScale - 1) * 100),
            deltaKcal: delta,
         });

         meal.kcal = sumKcal(meal);

         if (Math.abs(gap) < 20) break;
      }
   };

   if (gap > 0) {
      // increase kcal
      for (const m of ['lunch', 'dinner', 'breakfast'] as (keyof DayPlan)[]) {
         scaleMealItems(
            m,
            0.1,
            (i) => hasTag(i, 'protein_dense') || hasTag(i, 'carb_dense')
         );
         if (gap <= 0) break;

         scaleMealItems(m, 0.05, () => true);
         if (gap <= 0) break;
      }

      if (gap > 50) {
         if (!scaled.snack2) {
            scaled.snack2 = { items: [], kcal: 0 };
         }

         scaled.snack2.items.push({
            name: 'Protein-rich snack (roasted chickpeas/curd)',
            kcal: rules.snackAddKcal,
            tags: ['protein_dense', 'diabetic_safe'],
         });

         scaled.snack2.kcal = sumKcal(scaled.snack2);
         gap -= rules.snackAddKcal;

         adjustments.push({
            type: 'add_snack',
            where: 'snack2',
            deltaKcal: rules.snackAddKcal,
         });
      }
   } else if (gap < 0) {
      // reduce kcal
      for (const m of ['lunch', 'dinner', 'breakfast'] as (keyof DayPlan)[]) {
         scaleMealItems(
            m,
            -0.1,
            (i) => hasTag(i, 'carb_dense') || hasTag(i, 'deep_fried')
         );
         if (gap >= 0) break;

         scaleMealItems(m, -0.05, () => true);
         if (gap >= 0) break;
      }

      if (gap < -50 && scaled.snack2 && scaled.snack2.items.length > 0) {
         const before = scaled.snack2.kcal;
         scaled.snack2.items = [];
         scaled.snack2.kcal = 0;
         gap += before;

         adjustments.push({
            type: 'drop_snack',
            where: 'snack2',
            deltaKcal: -before,
         });
      }
   }

   // recompute final total
   let finalTotal = 0;
   for (const m of order) {
      finalTotal += scaled[m]?.kcal ?? 0;
   }

   return {
      target,
      scale: Number(scale.toFixed(2)),
      meals: scaled,
      totalKcal: finalTotal,
      adjustments,
   };
}
