type MealItem = {
   name: string;
   kcal: number;
   tags?: string[];
   portionScale?: number;
   swap?: string;
};
type Meal = { items: MealItem[]; kcal: number };
type DayPlan = {
   breakfast: Meal;
   snack1: Meal;
   lunch: Meal;
   snack2: Meal;
   dinner: Meal;
};

type AdjustRule = {
   maxScaleUpPct: number; // 0.15
   maxScaleDownPct: number; // 0.15
   snackAddKcal: number; // ~180
   snackDropKcal: number; // ~150
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
   basePlan: DayPlan, // from enrolled key
   baseTarget: number, // plan.dailyCalories
   target: number, // effective target for THIS date
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
   const scaled: Record<string, Meal> = {};
   let total = 0;

   // initial scale
   for (const m of order) {
      const orig = basePlan[m];
      const items = orig.items.map((i) => ({
         ...i,
         kcal: Math.round(i.kcal * scale),
      }));
      const meal: Meal = { items, kcal: 0 };
      meal.kcal = sumKcal(meal);
      scaled[m] = meal;
      total += meal.kcal;
   }

   let gap = Math.round(target - total); // + need to add; - need to reduce
   const adjustments: any[] = [];

   const scaleMealItems = (
      m: keyof DayPlan,
      pct: number,
      selector: (i: MealItem) => boolean
   ) => {
      const meal = scaled[m];
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
            +0.1,
            (i) => hasTag(i, 'protein_dense') || hasTag(i, 'carb_dense')
         );
         if (gap <= 0) break;
         scaleMealItems(m, +0.05, (_) => true);
         if (gap <= 0) break;
      }
      if (gap > 50) {
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
         scaleMealItems(m, -0.05, (_) => true);
         if (gap >= 0) break;
      }
      if (gap < -50 && scaled.snack2.items.length) {
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
   for (const m of order) finalTotal += scaled[m].kcal;

   return {
      target,
      scale: Number(scale.toFixed(2)),
      meals: scaled as DayPlan,
      totalKcal: finalTotal,
      adjustments,
   };
}
