import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePlan, getPlan } from '../api/plans';
import { apiErrorMessage } from '../api/http';

type PlanKey = 'A' | 'B' | 'C';

type MealsByType = {
   breakfast: string[];
   snack1: string[];
   lunch: string[];
   snack2: string[];
   dinner: string[];
   substitutions?: string[];
   conditionNotes?: string;
};

type PlanOption = {
   key: PlanKey;
   meals: MealsByType;
};

type PlanDoc = {
   dailyCalories: number;
   mealTargets?: Record<string, number>;
   plans: PlanOption[];
};

export default function GeneratePlanPage() {
   const nav = useNavigate();

   const [plan, setPlan] = useState<PlanDoc | null>(null);
   const [loading, setLoading] = useState(false);
   const [selectedKey, setSelectedKey] = useState<PlanKey | null>(null);

   useEffect(() => {
      (async () => {
         try {
            setLoading(true);

            const existingPlanId = localStorage.getItem('planId');
            if (existingPlanId) {
               const existing = await getPlan(existingPlanId);
               setPlan(existing as PlanDoc);
               return;
            }

            const raw = localStorage.getItem('requirementsForm');
            if (!raw) {
               alert('Missing requirements. Please fill the form first.');
               nav('/requirements');
               return;
            }

            const requirements = JSON.parse(raw);
            const res = await generatePlan(requirements);

            setPlan(res.plan as PlanDoc);
            localStorage.setItem('requirementId', String(res.requirementId));
            localStorage.setItem('planId', String(res.planId));
         } catch (e) {
            alert(apiErrorMessage(e));
         } finally {
            setLoading(false);
         }
      })();
   }, [nav]);

   const plans = useMemo(() => plan?.plans ?? [], [plan]);

   if (loading) return <div style={{ padding: 24 }}>Generating plan...</div>;
   if (!plan) return <div style={{ padding: 24 }}>No plan yet.</div>;

   const pageWrap: React.CSSProperties = {
      padding: 24,
      maxWidth: 1100,
      margin: '0 auto',
   };

   const headerRow: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
      flexWrap: 'wrap',
   };

   // responsive grid without CSS files
   const grid: React.CSSProperties = {
      marginTop: 16,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 14,
   };

   const cardBase: React.CSSProperties = {
      border: '1px solid #e7e9f1',
      borderRadius: 14,
      padding: 14,
      background: '#fff',
      color: '#111827',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 420, // ✅ keeps cards aligned
   };

   const cardActive: React.CSSProperties = {
      border: '1px solid #111827',
      boxShadow: '0 8px 22px rgba(17,24,39,0.10)',
   };

   const pillsRow: React.CSSProperties = {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 10,
   };

   const pill = (bg: string): React.CSSProperties => ({
      fontSize: 12,
      padding: '4px 8px',
      borderRadius: 999,
      background: bg,
   });

   const mealsBox: React.CSSProperties = {
      marginTop: 12,
      border: '1px solid #f0f1f5',
      borderRadius: 12,
      padding: 10,
      background: '#fafafa',
      flex: 1, // ✅ fill space so button stays at bottom
      overflow: 'auto', // ✅ scroll inside card
   };

   const mealRow: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: '92px 1fr',
      gap: 8,
      padding: '6px 0',
      borderBottom: '1px dashed #e9eaf0',
      fontSize: 13,
   };

   const chooseBtn = (active: boolean): React.CSSProperties => ({
      height: 44,
      width: '100%',
      borderRadius: 12,
      border: '1px solid #111827',
      background: active ? '#111827' : '#fff',
      color: active ? '#fff' : '#111827',
      cursor: 'pointer',
      fontWeight: 800,
      marginTop: 12,
   });

   return (
      <div style={pageWrap}>
         <div style={headerRow}>
            <div>
               <h2 style={{ margin: 0 }}>Choose a plan</h2>
               <div style={{ opacity: 0.75, marginTop: 6 }}>
                  We generated 3 options (A/B/C). Pick one.
               </div>
            </div>

            <div style={{ fontSize: 13, opacity: 0.85 }}>
               Daily calories: <b>{plan.dailyCalories}</b>
            </div>
         </div>

         <div style={grid}>
            {plans.map((p) => {
               const active = selectedKey === p.key;
               const meals = p.meals;

               return (
                  <div
                     key={p.key}
                     style={{ ...cardBase, ...(active ? cardActive : {}) }}
                     onClick={() => setSelectedKey(p.key)}
                     role="button"
                     tabIndex={0}
                  >
                     {/* top row */}
                     <div
                        style={{
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center',
                        }}
                     >
                        <div style={{ fontSize: 18, fontWeight: 900 }}>
                           Plan {p.key}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                           Option
                        </div>
                     </div>

                     {/* tags */}
                     <div style={pillsRow}>
                        <span style={pill('#eef2ff')}>Breakfast</span>
                        <span style={pill('#ecfeff')}>Lunch</span>
                        <span style={pill('#fef3c7')}>Dinner</span>
                     </div>

                     {/* meals list */}
                     <div style={mealsBox}>
                        <div style={mealRow}>
                           <b>Breakfast</b>
                           <span>{meals.breakfast?.join(', ') || '-'}</span>
                        </div>
                        <div style={mealRow}>
                           <b>Snack 1</b>
                           <span>{meals.snack1?.join(', ') || '-'}</span>
                        </div>
                        <div style={mealRow}>
                           <b>Lunch</b>
                           <span>{meals.lunch?.join(', ') || '-'}</span>
                        </div>
                        <div style={mealRow}>
                           <b>Snack 2</b>
                           <span>{meals.snack2?.join(', ') || '-'}</span>
                        </div>
                        <div style={{ ...mealRow, borderBottom: 'none' }}>
                           <b>Dinner</b>
                           <span>{meals.dinner?.join(', ') || '-'}</span>
                        </div>

                        {!!meals.substitutions?.length && (
                           <div
                              style={{
                                 marginTop: 10,
                                 fontSize: 12,
                                 opacity: 0.85,
                              }}
                           >
                              <b>Substitutions:</b>
                              <ul style={{ margin: '6px 0 0 18px' }}>
                                 {meals.substitutions.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                 ))}
                              </ul>
                           </div>
                        )}

                        {meals.conditionNotes && (
                           <div
                              style={{
                                 marginTop: 10,
                                 fontSize: 12,
                                 opacity: 0.85,
                              }}
                           >
                              <b>Notes:</b> {meals.conditionNotes}
                           </div>
                        )}
                     </div>

                     {/* button pinned bottom */}
                     <button
                        type="button"
                        style={chooseBtn(active)}
                        onClick={(e) => {
                           e.stopPropagation();
                           localStorage.setItem('chosenKey', p.key);
                           nav('/enroll');
                        }}
                     >
                        Choose Plan {p.key}
                     </button>
                  </div>
               );
            })}
         </div>
      </div>
   );
}
