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
   // fallback: try exact match
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
      // if today.meals is already an array, keep it
      if (Array.isArray(today?.meals)) return today.meals;

      // if today.meals is an object like { breakfast: [...], snack1: [...] }
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

   async function setMeal(slot: MealSlot, status: MealStatus, notes?: string) {
      setError('');
      try {
         await updateMealStatus({ userId, date, slot, status, notes });
         const d = await getDailyLog(userId, date);
         setDaily(d);
      } catch (e) {
         setError(apiErrorMessage(e));
      }
   }

   async function addWaterQuick(amountMl: number) {
      setError('');
      try {
         await addWater({ userId, date, ml: amountMl }); // ✅ only this
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
      <div style={{ padding: 16, maxWidth: 980, margin: '0 auto' }}>
         <div
            style={{
               display: 'flex',
               gap: 12,
               alignItems: 'center',
               flexWrap: 'wrap',
            }}
         >
            <h2 style={{ margin: 0 }}>Today</h2>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
               <label>Date</label>
               <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
               />
            </div>

            <button onClick={refresh} disabled={loading}>
               {loading ? 'Refreshing...' : 'Refresh'}
            </button>
         </div>

         {error && (
            <div
               style={{
                  marginTop: 12,
                  padding: 12,
                  border: '1px solid #f3b',
                  borderRadius: 8,
               }}
            >
               <b>Error:</b> {error}
            </div>
         )}

         <div
            style={{
               marginTop: 16,
               padding: 12,
               border: '1px solid #ddd',
               borderRadius: 10,
            }}
         >
            <div>
               <b>User:</b> {userId}
            </div>
            <div>
               <b>Plan key:</b> {today?.key ?? '—'}
            </div>
            <div>
               <b>Plan id:</b> {today?.planId ?? '—'}
            </div>
            <div>
               <b>Daily calories:</b> {today?.dailyCalories ?? '—'}
            </div>
         </div>

         <div
            style={{
               marginTop: 16,
               padding: 12,
               border: '1px solid #ddd',
               borderRadius: 10,
            }}
         >
            <h3 style={{ marginTop: 0 }}>Water</h3>
            <div
               style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  flexWrap: 'wrap',
               }}
            >
               <div>
                  <b>{waterTotal}</b> ml / <b>{waterTarget}</b> ml
               </div>
               <button onClick={() => addWaterQuick(250)}>+250 ml</button>
               <button onClick={() => addWaterQuick(500)}>+500 ml</button>
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
               >
                  Set target
               </button>
            </div>
         </div>

         <div style={{ marginTop: 16 }}>
            <h3>Meals</h3>

            {meals.length === 0 ? (
               <div
                  style={{
                     padding: 12,
                     border: '1px solid #ddd',
                     borderRadius: 10,
                  }}
               >
                  No meals returned from <code>/today</code>. Check the
                  enrollment window / userId.
               </div>
            ) : (
               <div style={{ display: 'grid', gap: 12 }}>
                  {meals.map((m: any, idx: number) => {
                     const slot: MealSlot = normalizeSlot(
                        m.slot || m.mealType || m.type || ''
                     );
                     const state = daily?.meals?.[slot];
                     const title = m.name || m.title || m.mealName || slot;

                     return (
                        <div
                           key={`${slot}-${idx}`}
                           style={{
                              border: '1px solid #ddd',
                              borderRadius: 10,
                              padding: 12,
                           }}
                        >
                           <div
                              style={{
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 gap: 10,
                                 flexWrap: 'wrap',
                              }}
                           >
                              <div>
                                 <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    {slot.toUpperCase()}
                                 </div>
                                 <div style={{ fontSize: 18, fontWeight: 600 }}>
                                    {title}
                                 </div>
                              </div>
                              <div>
                                 <select
                                    value={state?.status ?? 'planned'}
                                    onChange={(e) =>
                                       setMeal(
                                          slot,
                                          e.target.value as MealStatus,
                                          state?.notes
                                       )
                                    }
                                 >
                                    <option value="planned">Planned</option>
                                    <option value="done">Consumed</option>
                                    <option value="skipped">Skipped</option>
                                 </select>
                              </div>
                           </div>

                           {!!m.items?.length && (
                              <ul style={{ marginTop: 8 }}>
                                 {m.items.map((it: any, i: number) => (
                                    <li key={i}>
                                       {it.name ?? it}{' '}
                                       {it.amount ? `- ${it.amount}` : ''}
                                    </li>
                                 ))}
                              </ul>
                           )}

                           <div style={{ marginTop: 10 }}>
                              <textarea
                                 placeholder="Notes..."
                                 value={state?.notes ?? ''}
                                 onChange={(e) => {
                                    const notes = e.target.value;
                                    // local UI only; we save on button click to avoid spamming PATCH
                                    setDaily((prev: any) => ({
                                       ...(prev || {}),
                                       meals: {
                                          ...(prev?.meals || {}),
                                          [slot]: {
                                             ...(prev?.meals?.[slot] || {}),
                                             notes,
                                          },
                                       },
                                    }));
                                 }}
                                 rows={2}
                                 style={{ width: '100%' }}
                              />
                              <div
                                 style={{
                                    display: 'flex',
                                    gap: 8,
                                    marginTop: 6,
                                 }}
                              >
                                 <button
                                    onClick={() =>
                                       setMeal(
                                          slot,
                                          (state?.status ??
                                             'planned') as MealStatus,
                                          daily?.meals?.[slot]?.notes
                                       )
                                    }
                                 >
                                    Save notes
                                 </button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      </div>
   );
}
