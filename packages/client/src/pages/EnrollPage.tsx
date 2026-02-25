import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollPlan } from '../api/enrollment';
import { apiErrorMessage } from '../api/http';
import { getPlan } from '@/api/plans.ts';

function todayISO() {
   return new Date().toISOString().slice(0, 10);
}
function plusDaysISO(days: number) {
   const d = new Date();
   d.setDate(d.getDate() + days);
   return d.toISOString().slice(0, 10);
}

const styles = {
   page: { minHeight: '100vh', background: '#f6f7fb', padding: 24 },
   container: { maxWidth: 760, margin: '0 auto', display: 'grid', gap: 14 },
   title: { margin: 0, fontSize: 28, letterSpacing: -0.3 },
   card: {
      background: 'white',
      border: '1px solid #e7e9f1',
      borderRadius: 14,
      boxShadow: '0 10px 30px rgba(16,24,40,0.06)',
      padding: 18,
   },
   row: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap' as const,
      alignItems: 'center',
   },
   chip: {
      display: 'inline-flex',
      padding: '6px 10px',
      borderRadius: 999,
      border: '1px solid #e7e9f1',
      background: '#fafbff',
      fontSize: 12,
   },
   label: { fontSize: 12, opacity: 0.75, fontWeight: 700, marginBottom: 6 },
   select: {
      height: 42,
      width: '100%',
      borderRadius: 12,
      border: '1px solid #d8dbe7',
      padding: '0 12px',
      background: 'white',
      outline: 'none',
      fontSize: 14,
   },
   primaryBtn: (disabled: boolean) => ({
      height: 46,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid #111827',
      background: disabled ? '#11182780' : '#111827',
      color: 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 900,
      width: '100%',
   }),
   ghostBtn: {
      height: 46,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid #d8dbe7',
      background: 'white',
      cursor: 'pointer',
      fontWeight: 800,
      width: '100%',
   },
};

export default function EnrollPage() {
   const nav = useNavigate();
   const [loading, setLoading] = useState(false);

   const userId = localStorage.getItem('userId') || '';
   const chosenKey = (localStorage.getItem('chosenKey') || 'A') as
      | 'A'
      | 'B'
      | 'C';
   const planId = localStorage.getItem('planId') || '';

   const [rotation, setRotation] = useState<'fixed' | 'rotate-daily'>('fixed');

   async function submit() {
      try {
         setLoading(true);

         const plan = await getPlan(planId); // ✅ gets plan.requirementId
         const requirementId = String(plan.requirementId);

         await enrollPlan({
            userId,
            planId,
            requirementId, // ✅ always matches
            chosenKey,
            rotation,
            startDate: todayISO(),
            endDate: plusDaysISO(29),
            rotationStartKey: chosenKey,
         });

         nav('/today');
      } catch (e) {
         alert(apiErrorMessage(e));
      } finally {
         setLoading(false);
      }
   }

   const disabled = loading || !userId || !planId;

   return (
      <div style={styles.page}>
         <div style={styles.container}>
            <h2 style={styles.title}>Enroll</h2>

            <div style={styles.card}>
               <div style={styles.row}>
                  <span style={styles.chip}>
                     User: <b style={{ marginLeft: 6 }}>{userId || '—'}</b>
                  </span>
                  <span style={styles.chip}>
                     Plan: <b style={{ marginLeft: 6 }}>{planId || '—'}</b>
                  </span>
                  <span style={styles.chip}>
                     Chosen: <b style={{ marginLeft: 6 }}>{chosenKey}</b>
                  </span>
               </div>

               <div style={{ marginTop: 14 }}>
                  <div style={styles.label}>Rotation mode</div>
                  <select
                     value={rotation}
                     onChange={(e) => setRotation(e.target.value as any)}
                     style={styles.select}
                  >
                     <option value="fixed">
                        Fixed — always use chosen plan
                     </option>
                     <option value="rotate-daily">
                        Rotate daily — switch A/B/C each day
                     </option>
                  </select>

                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                     Enrollment period: <b>30 days</b> from today.
                  </div>
               </div>

               <div
                  style={{
                     display: 'grid',
                     gridTemplateColumns: '1fr 1fr',
                     gap: 10,
                     marginTop: 16,
                  }}
               >
                  <button
                     type="button"
                     style={styles.ghostBtn}
                     onClick={() => nav('/generate')}
                     disabled={loading}
                  >
                     Back
                  </button>

                  <button
                     type="button"
                     style={styles.primaryBtn(disabled)}
                     disabled={disabled}
                     onClick={submit}
                  >
                     {loading ? 'Enrolling...' : 'Enroll & Go to Today'}
                  </button>
               </div>

               {(!userId || !planId) && (
                  <div style={{ marginTop: 10, color: '#a00', fontSize: 13 }}>
                     Missing userId/planId. Please generate a plan first.
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
