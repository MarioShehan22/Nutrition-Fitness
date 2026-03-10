import { useEffect, useMemo, useState } from 'react';
import { getToday } from '../api/active';
import {
   addWater,
   getDailyLog,
   setWaterTarget,
   updateMealStatus,
} from '../api/logs';
import { apiErrorMessage } from '../api/http';

type MealSlot = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';
type MealStatus = 'planned' | 'done' | 'skipped';

function isoDate(d = new Date()) {
   return d.toISOString().slice(0, 10);
}

function normalizeSlot(slot: string): MealSlot {
   const s = slot?.toLowerCase?.() ?? '';
   if (s.includes('break')) return 'breakfast';
   if (s.includes('snack') && (s.includes('1') || s.includes('one')))
      return 'snack1';
   if (s.includes('snack') && (s.includes('2') || s.includes('two')))
      return 'snack2';
   if (s.includes('lunch')) return 'lunch';
   if (s.includes('dinner')) return 'dinner';
   if (['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'].includes(s))
      return s as MealSlot;
   return 'lunch';
}

export default function TodayPage() {
   const userId = localStorage.getItem('userId') || 'demo-user';

   const [date, setDate] = useState<string>(isoDate());
   const [loading, setLoading] = useState(false);
   const [today, setToday] = useState<any>(null);
   const [daily, setDaily] = useState<any>(null);
   const [error, setError] = useState<string>('');

   const waterTotal = daily?.water?.totalMl ?? 0;
   const waterTarget = daily?.water?.targetMl ?? 2000;

   const meals = useMemo(() => {
      if (Array.isArray(today?.meals)) return today.meals;

      const obj = today?.meals;
      if (obj && typeof obj === 'object') {
         const slots: MealSlot[] = [
            'breakfast',
            'snack1',
            'lunch',
            'snack2',
            'dinner',
         ];
         return slots.map((slot) => ({
            slot,
            items: Array.isArray(obj[slot]) ? obj[slot] : [],
            title: slot,
         }));
      }
      return [];
   }, [today]);

   async function refresh() {
      setError('');
      setLoading(true);
      try {
         const t = await getToday(userId);
         setToday(t);

         const d = await getDailyLog(userId, date);
         setDaily(d);
      } catch (e) {
         setError(apiErrorMessage(e));
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [date]);

   async function setMeal(slot: MealSlot, status: MealStatus) {
      setError('');
      try {
         await updateMealStatus({ userId, date, slot, status });
         const d = await getDailyLog(userId, date);
         setDaily(d);
      } catch (e) {
         setError(apiErrorMessage(e));
      }
   }

   async function addWaterQuick(amountMl: number) {
      setError('');
      try {
         await addWater({ userId, date, ml: amountMl });
         const d = await getDailyLog(userId, date);
         setDaily(d);
      } catch (e) {
         setError(apiErrorMessage(e));
      }
   }

   async function changeWaterTarget(newTarget: number) {
      setError('');
      try {
         await setWaterTarget({ userId, date, targetMl: newTarget });
         const d = await getDailyLog(userId, date);
         setDaily(d);
      } catch (e) {
         setError(apiErrorMessage(e));
      }
   }

   return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
         {/* Header */}
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
               <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Today
               </h1>
               <p className="text-sm text-slate-600">
                  Track meals & water for the selected date.
               </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
               <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-xs font-semibold text-slate-600">
                     Date
                  </span>
                  <input
                     type="date"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="bg-transparent text-sm text-slate-900 outline-none"
                  />
               </div>

               <button
                  onClick={refresh}
                  disabled={loading}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
               >
                  {loading ? 'Refreshing...' : 'Refresh'}
               </button>
            </div>
         </div>

         {/* Error */}
         {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
               <span className="font-semibold">Error:</span> {error}
            </div>
         )}

         {/* Summary cards */}
         <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
               <div className="text-sm font-semibold text-slate-900">
                  Plan summary
               </div>
               <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <Row label="User" value={userId} />
                  <Row label="Plan key" value={today?.key ?? '—'} />
                  <Row label="Plan id" value={today?.planId ?? '—'} />
                  <Row
                     label="Daily calories"
                     value={today?.dailyCalories ?? '—'}
                  />
               </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
               <div className="flex items-start justify-between gap-3">
                  <div>
                     <div className="text-sm font-semibold text-slate-900">
                        Water
                     </div>
                     <div className="mt-1 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">
                           {waterTotal}
                        </span>{' '}
                        ml <span className="text-slate-400">/</span>{' '}
                        <span className="font-semibold text-slate-900">
                           {waterTarget}
                        </span>{' '}
                        ml
                     </div>
                  </div>

                  <div className="text-xs text-slate-500">
                     {Math.min(
                        100,
                        Math.round(
                           (waterTotal / Math.max(1, waterTarget)) * 100
                        )
                     )}
                     % complete
                  </div>
               </div>

               <div className="mt-4 flex flex-wrap gap-2">
                  <button
                     onClick={() => addWaterQuick(250)}
                     className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                     +250 ml
                  </button>
                  <button
                     onClick={() => addWaterQuick(500)}
                     className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                     +500 ml
                  </button>
                  <button
                     onClick={() => {
                        const v = prompt(
                           'Set water target (ml)',
                           String(waterTarget)
                        );
                        if (!v) return;
                        const n = Number(v);
                        if (Number.isFinite(n) && n > 0) changeWaterTarget(n);
                     }}
                     className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                     Set target
                  </button>
               </div>

               {/* Progress bar */}
               <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                     className="h-full rounded-full bg-emerald-500"
                     style={{
                        width: `${Math.min(100, (waterTotal / Math.max(1, waterTarget)) * 100)}%`,
                     }}
                  />
               </div>
            </div>
         </div>

         {/* Meals */}
         <div className="mt-8">
            <div className="flex items-end justify-between">
               <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  Meals
               </h2>
               <span className="text-sm text-slate-500">{date}</span>
            </div>

            {meals.length === 0 ? (
               <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
                  No meals returned from{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5">
                     /today
                  </code>
                  . Check enrollment window / userId.
               </div>
            ) : (
               <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {meals.map((m: any, idx: number) => {
                     const slot: MealSlot = normalizeSlot(
                        m.slot || m.mealType || m.type || ''
                     );
                     const state = daily?.meals?.[slot];
                     const title = m.name || m.title || m.mealName || slot;

                     return (
                        <div
                           key={`${slot}-${idx}`}
                           className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                           <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                 <div className="text-xs font-semibold text-slate-500">
                                    {slot.toUpperCase()}
                                 </div>
                                 <div className="mt-1 text-lg font-semibold text-slate-900">
                                    {title}
                                 </div>
                              </div>

                              <select
                                 value={state?.status ?? 'planned'}
                                 onChange={(e) =>
                                    setMeal(slot, e.target.value as MealStatus)
                                 }
                                 className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none hover:bg-slate-50"
                              >
                                 <option value="planned">Planned</option>
                                 <option value="done">Consumed</option>
                                 <option value="skipped">Skipped</option>
                              </select>
                           </div>

                           {!!m.items?.length ? (
                              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                                 {m.items.map((it: any, i: number) => (
                                    <li
                                       key={i}
                                       className="flex items-start justify-between gap-3"
                                    >
                                       <span className="leading-relaxed">
                                          {it.name ?? it}
                                       </span>
                                       {it.amount ? (
                                          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                             {it.amount}
                                          </span>
                                       ) : null}
                                    </li>
                                 ))}
                              </ul>
                           ) : (
                              <div className="mt-4 text-sm text-slate-500">
                                 No items listed for this meal.
                              </div>
                           )}
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      </div>
   );
}

function Row({ label, value }: { label: string; value: any }) {
   return (
      <div className="flex items-center justify-between gap-4">
         <span className="text-slate-500">{label}</span>
         <span className="font-semibold text-slate-900">{String(value)}</span>
      </div>
   );
}
