export type TargetMode = 'static' | 'weekly' | 'carry';

export function effectiveTargetForDate(opts: {
   baseTarget: number;
   date: Date;
   windowStart: Date;
   windowEnd: Date;
   logsByDate: Map<string, { totalCalories: number }>;
   mode: TargetMode;
   tolerance?: number;
   capPct?: number;
}) {
   const { baseTarget, date, windowStart, windowEnd, logsByDate, mode } = opts;
   const capPct = opts.capPct ?? 0.2;
   const MS = 86400000;

   const toYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
   };

   if (mode === 'static') return { target: baseTarget, carryApplied: 0 };

   const ymd = toYMD(date);
   const yesterday = new Date(date.getTime() - MS);
   const ymdY = toYMD(yesterday);
   const consumedY = logsByDate.get(ymdY)?.totalCalories ?? 0;

   if (mode === 'carry') {
      const deltaY = consumedY - baseTarget;
      const carry = Math.max(
         -capPct * baseTarget,
         Math.min(capPct * baseTarget, deltaY)
      );
      const t = Math.max(800, Math.min(5000, Math.round(baseTarget + carry)));
      return { target: t, carryApplied: Math.round(carry) };
   }

   const weekStart = (d: Date) => {
      const tmp = new Date(d);
      const day = (tmp.getDay() + 6) % 7;
      tmp.setDate(tmp.getDate() - day);
      tmp.setHours(0, 0, 0, 0);
      return tmp;
   };
   const ws = weekStart(date);
   const we = new Date(ws.getTime() + 6 * MS);
   let weeklyConsumed = 0;
   for (let d = new Date(ws); d <= date; d = new Date(d.getTime() + MS)) {
      weeklyConsumed += logsByDate.get(toYMD(d))?.totalCalories ?? 0;
   }
   const weeklyBudget = 7 * baseTarget;
   const daysLeft = Math.floor((we.getTime() - date.getTime()) / MS) + 1;
   const remaining = weeklyBudget - weeklyConsumed;
   const t = Math.max(
      800,
      Math.min(5000, Math.round(remaining / Math.max(daysLeft, 1)))
   );
   return { target: t, carryApplied: t - baseTarget };
}
