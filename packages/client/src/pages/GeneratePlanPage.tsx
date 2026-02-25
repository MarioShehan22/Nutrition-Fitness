import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePlan, getPlan } from '../api/plans';
import { apiErrorMessage } from '../api/http';

export default function GeneratePlanPage() {
   const nav = useNavigate();
   const [plan, setPlan] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [selectedKey, setSelectedKey] = useState<'A' | 'B' | 'C' | null>(null);

   useEffect(() => {
      (async () => {
         try {
            setLoading(true);

            // ✅ reuse existing plan if already generated
            const existingPlanId = localStorage.getItem('planId');
            if (existingPlanId) {
               const existing = await getPlan(existingPlanId);
               setPlan(existing);
               setLoading(false);
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

            setPlan(res.plan);
            localStorage.setItem('requirementId', res.requirementId);
            localStorage.setItem('planId', res.planId);
         } catch (e) {
            alert(apiErrorMessage(e));
         } finally {
            setLoading(false);
         }
      })();
   }, [nav]);

   if (loading) return <div style={{ padding: 24 }}>Generating plan...</div>;
   if (!plan) return <div style={{ padding: 24 }}>No plan yet.</div>;

   const plans = plan.plans || [];

   return (
      <div style={{ padding: 24 }}>
         <div
            style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'flex-end',
               gap: 10,
               flexWrap: 'wrap',
            }}
         >
            <div>
               <h2 style={{ margin: 0 }}>Choose a plan</h2>
               <div style={{ opacity: 0.75, marginTop: 6 }}>
                  We generated 3 options (A/B/C). Pick one.
               </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
               Daily calories: <b>{plan.dailyCalories}</b>
            </div>
         </div>

         <div
            style={{
               marginTop: 14,
               display: 'grid',
               gridTemplateColumns: 'repeat(12,1fr)',
               gap: 12,
            }}
         >
            {plans.map((p: any) => {
               const active = selectedKey === p.key;
               const mealCount = p.meals?.length ?? 0;

               return (
                  <div
                     key={p.key}
                     style={{
                        gridColumn: 'span 4',
                        border: '1px solid ' + (active ? '#111827' : '#e7e9f1'),
                        borderRadius: 14,
                        padding: 14,
                        background: active ? '#111827' : 'white',
                        color: active ? 'white' : '#111827',
                        cursor: 'pointer',
                     }}
                     onClick={() => setSelectedKey(p.key)}
                  >
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
                        <div style={{ fontSize: 12, opacity: 0.85 }}>
                           {mealCount} meals
                        </div>
                     </div>

                     <div
                        style={{
                           marginTop: 10,
                           opacity: active ? 0.9 : 0.75,
                           fontSize: 13,
                        }}
                     >
                        Preview:{' '}
                        {p.meals?.[0]?.name || p.meals?.[0]?.title || 'Meal 1'}{' '}
                        •{' '}
                        {p.meals?.[1]?.name || p.meals?.[1]?.title || 'Meal 2'}
                     </div>

                     <button
                        type="button"
                        style={{
                           height: 42,
                           width: '100%',
                           borderRadius: 12,
                           border:
                              '1px solid ' +
                              (active ? 'rgba(255,255,255,0.30)' : '#111827'),
                           background: active
                              ? 'rgba(255,255,255,0.14)'
                              : '#111827',
                           color: 'white',
                           cursor: 'pointer',
                           fontWeight: 800,
                           marginTop: 12,
                        }}
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
