import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequirements } from '../api/plans';
import { apiErrorMessage } from '../api/http';

const styles = {
   page: { minHeight: '100vh', background: '#f6f7fb', padding: 24 },
   container: { maxWidth: 920, margin: '0 auto', display: 'grid', gap: 16 },
   header: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap' as const,
   },
   title: { margin: 0, fontSize: 28, letterSpacing: -0.3 },
   subtitle: { margin: '6px 0 0', opacity: 0.75 },
   card: {
      background: 'white',
      border: '1px solid #e7e9f1',
      borderRadius: 14,
      boxShadow: '0 10px 30px rgba(16,24,40,0.06)',
      padding: 18,
   },
   grid: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12 },
   field: { display: 'grid', gap: 6 },
   label: { fontSize: 12, opacity: 0.75, fontWeight: 600 },
   input: {
      height: 40,
      borderRadius: 10,
      border: '1px solid #d8dbe7',
      padding: '0 12px',
      outline: 'none',
      fontSize: 14,
   },
   select: {
      height: 40,
      borderRadius: 10,
      border: '1px solid #d8dbe7',
      padding: '0 12px',
      outline: 'none',
      fontSize: 14,
      background: 'white',
   },
   hint: { fontSize: 12, opacity: 0.7, marginTop: 2 },
   buttonRow: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      marginTop: 6,
   },
   primaryBtn: (disabled: boolean) => ({
      height: 44,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid #111827',
      background: disabled ? '#11182780' : '#111827',
      color: 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 700,
   }),
   ghostBtn: {
      height: 44,
      padding: '0 14px',
      borderRadius: 12,
      border: '1px solid #d8dbe7',
      background: 'white',
      cursor: 'pointer',
      fontWeight: 600,
   },
   badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      borderRadius: 999,
      border: '1px solid #e7e9f1',
      background: '#fafbff',
      fontSize: 12,
      opacity: 0.9,
   },
};

export default function RequirementsPage() {
   const nav = useNavigate();
   const [loading, setLoading] = useState(false);

   const [form, setForm] = useState<any>({
      userId: localStorage.getItem('userId') || 'demo-user',
      age: 28,
      gender: 'male',
      heightCm: 175,
      weightKg: 78,
      activityLevel: 'medium',
      goal: 'loss',
      dietaryPreference: 'non_veg',
      allergies: [],
      conditions: [],
   });

   async function submit() {
      try {
         setLoading(true);

         const payload = {
            userId: String(form.userId || '').trim(),
            age: Number(form.age),
            gender: form.gender,
            heightCm: Number(form.heightCm),
            weightKg: Number(form.weightKg),
            activityLevel: form.activityLevel,
            goal: form.goal,
            dietaryPreference: form.dietaryPreference,
            allergies: form.allergies ?? [],
            conditions: form.conditions ?? [],
         };

         // ✅ store full requirement for /generate
         localStorage.setItem('requirementsForm', JSON.stringify(payload));
         localStorage.setItem('userId', payload.userId);

         // ✅ optional: save requirements
         const res = await createRequirements(payload);
         localStorage.setItem('requirementId', res.requirementId);

         nav('/generate');
      } catch (e) {
         alert(apiErrorMessage(e));
      } finally {
         setLoading(false);
      }
   }

   return (
      <div style={styles.page}>
         <div style={styles.container}>
            <div style={styles.header}>
               <div>
                  <h2 style={styles.title}>Your nutrition setup</h2>
                  <div style={styles.subtitle}>
                     Tell us the basics. We’ll generate plan A/B/C for you.
                  </div>
               </div>

               <div style={styles.badge}>
                  <span
                     style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        background: '#22c55e',
                     }}
                  />
                  <span>
                     User: <b>{form.userId}</b>
                  </span>
               </div>
            </div>

            <div style={styles.card}>
               <div style={styles.grid}>
                  <div style={{ ...styles.field, gridColumn: 'span 6' }}>
                     <div style={styles.label}>User ID</div>
                     <input
                        style={styles.input}
                        value={form.userId}
                        onChange={(e) =>
                           setForm({ ...form, userId: e.target.value })
                        }
                     />
                     <div style={styles.hint}>
                        Use any string for now (until auth is added).
                     </div>
                  </div>

                  <div style={{ ...styles.field, gridColumn: 'span 3' }}>
                     <div style={styles.label}>Age</div>
                     <input
                        style={styles.input}
                        type="number"
                        value={form.age}
                        onChange={(e) =>
                           setForm({ ...form, age: Number(e.target.value) })
                        }
                     />
                  </div>

                  <div style={{ ...styles.field, gridColumn: 'span 3' }}>
                     <div style={styles.label}>Gender</div>
                     <select
                        style={styles.select}
                        value={form.gender}
                        onChange={(e) =>
                           setForm({ ...form, gender: e.target.value })
                        }
                     >
                        <option value="male">male</option>
                        <option value="female">female</option>
                     </select>
                  </div>

                  <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                     <div style={styles.label}>Height (cm)</div>
                     <input
                        style={styles.input}
                        type="number"
                        value={form.heightCm}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              heightCm: Number(e.target.value),
                           })
                        }
                     />
                  </div>

                  <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                     <div style={styles.label}>Weight (kg)</div>
                     <input
                        style={styles.input}
                        type="number"
                        value={form.weightKg}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              weightKg: Number(e.target.value),
                           })
                        }
                     />
                  </div>

                  <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                     <div style={styles.label}>Activity level</div>
                     <select
                        style={styles.select}
                        value={form.activityLevel}
                        onChange={(e) =>
                           setForm({ ...form, activityLevel: e.target.value })
                        }
                     >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                     </select>
                  </div>

                  <div style={{ ...styles.field, gridColumn: 'span 6' }}>
                     <div style={styles.label}>Dietary preference</div>
                     <select
                        style={styles.select}
                        value={form.dietaryPreference}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              dietaryPreference: e.target.value,
                           })
                        }
                     >
                        <option value="">Select…</option>
                        <option value="non_veg">Non-veg</option>
                        <option value="veg">Veg</option>
                        <option value="vegan">Vegan</option>
                     </select>
                     <div style={styles.hint}>
                        Allowed: veg / non_veg / vegan
                     </div>
                  </div>

                  <div style={{ ...styles.field, gridColumn: 'span 12' }}>
                     <div style={styles.label}>Goal</div>
                     <div
                        style={{
                           display: 'flex',
                           gap: 10,
                           flexWrap: 'wrap' as const,
                        }}
                     >
                        {[
                           { key: 'loss', label: 'Loss' },
                           { key: 'maintenance', label: 'Maintenance' },
                           { key: 'gain', label: 'Gain' },
                        ].map((g) => {
                           const active = form.goal === g.key;
                           return (
                              <button
                                 key={g.key}
                                 type="button"
                                 onClick={() =>
                                    setForm({ ...form, goal: g.key })
                                 }
                                 style={{
                                    height: 40,
                                    padding: '0 14px',
                                    borderRadius: 999,
                                    border:
                                       '1px solid ' +
                                       (active ? '#111827' : '#d8dbe7'),
                                    background: active ? '#111827' : 'white',
                                    color: active ? 'white' : '#111827',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                 }}
                              >
                                 {g.label}
                              </button>
                           );
                        })}
                     </div>
                     <div style={styles.hint}>
                        Backend accepts only: <b>loss</b>, <b>maintenance</b>,{' '}
                        <b>gain</b>
                     </div>
                  </div>
               </div>

               <div style={styles.buttonRow}>
                  <button
                     type="button"
                     style={styles.ghostBtn}
                     onClick={() => {
                        localStorage.removeItem('requirementId');
                        localStorage.removeItem('planId');
                        localStorage.removeItem('chosenKey');
                        localStorage.removeItem('requirementsForm');
                        alert('Local plan data cleared.');
                     }}
                  >
                     Reset local data
                  </button>

                  <button
                     type="button"
                     disabled={loading || !form.dietaryPreference}
                     onClick={submit}
                     style={styles.primaryBtn(
                        loading || !form.dietaryPreference
                     )}
                  >
                     {loading ? 'Saving...' : 'Save & Continue'}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
