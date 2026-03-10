import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequirements } from '../api/plans';
import { apiErrorMessage } from '../api/http';

type GoalType = 'loss' | 'maintenance' | 'gain';
type Gender = 'male' | 'female';
type ActivityLevel = 'low' | 'medium' | 'high';
type DietaryPreference = 'veg' | 'non_veg' | 'vegan';

type MacroRatios = { carb: number; protein: number; fat: number };
type PreferredMeals = {
   breakfast?: string;
   snack1?: string;
   lunch?: string;
   snack2?: string;
   dinner?: string;
};

type RequirementForm = {
   userId: string;
   age: number | '';
   gender: Gender;
   heightCm: number | '';
   weightKg: number | '';
   activityLevel: ActivityLevel;
   dietaryPreference: DietaryPreference | '';
   allergiesText: string; // comma separated
   conditionsText: string; // comma separated
   notes: string;

   // goal fields
   goalType: GoalType;
   calorieTargetPerDay: number | ''; // optional
   macroRatiosEnabled: boolean;
   macroRatios: MacroRatios;

   preferredMealsEnabled: boolean;
   preferredMeals: PreferredMeals;
};

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
   textarea: {
      minHeight: 90,
      borderRadius: 10,
      border: '1px solid #d8dbe7',
      padding: '10px 12px',
      outline: 'none',
      fontSize: 14,
      resize: 'vertical' as const,
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
   row: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap' as const,
   },
   toggle: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      borderRadius: 12,
      border: '1px solid #e7e9f1',
      background: '#fafbff',
      cursor: 'pointer',
      userSelect: 'none' as const,
      fontSize: 13,
      fontWeight: 700,
   },
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
   divider: { height: 1, background: '#eef0f6', margin: '10px 0' },
};

function parseCSV(text: string): string[] {
   return text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
}

function clamp01(n: number) {
   if (!Number.isFinite(n)) return 0;
   return Math.max(0, Math.min(1, n));
}

export default function RequirementsPage() {
   const nav = useNavigate();
   const [loading, setLoading] = useState(false);

   const [form, setForm] = useState<RequirementForm>({
      userId: String(localStorage.getItem('userId') || '').trim(),
      age: '',
      gender: 'male',
      heightCm: '',
      weightKg: '',
      activityLevel: 'medium',
      dietaryPreference: '',

      allergiesText: '',
      conditionsText: '',
      notes: '',

      goalType: 'loss',
      calorieTargetPerDay: '',
      macroRatiosEnabled: false,
      macroRatios: { carb: 0.5, protein: 0.25, fat: 0.25 },

      preferredMealsEnabled: false,
      preferredMeals: {},
   });

   const macroSum = useMemo(() => {
      const m = form.macroRatios;
      return (
         (Number(m.carb) || 0) + (Number(m.protein) || 0) + (Number(m.fat) || 0)
      );
   }, [form.macroRatios]);

   const macroOk = useMemo(() => {
      if (!form.macroRatiosEnabled) return true;
      return Math.abs(macroSum - 1) <= 0.05;
   }, [form.macroRatiosEnabled, macroSum]);

   async function submit() {
      try {
         setLoading(true);

         // required basic fields
         const userId = String(form.userId || '').trim();
         if (!userId) throw new Error('User ID is required.');
         if (!form.dietaryPreference)
            throw new Error('Dietary preference is required.');
         if (form.age === '' || form.heightCm === '' || form.weightKg === '') {
            throw new Error('Age, height and weight are required.');
         }

         if (!macroOk) {
            throw new Error('Macro ratios must sum to ~1.0 (±0.05).');
         }

         const goal: any = {
            type: form.goalType,
         };

         // optional calorie override
         if (form.calorieTargetPerDay !== '') {
            goal.calorieTargetPerDay = Number(form.calorieTargetPerDay);
         }

         // optional macro ratios
         if (form.macroRatiosEnabled) {
            goal.macroRatios = {
               carb: clamp01(Number(form.macroRatios.carb)),
               protein: clamp01(Number(form.macroRatios.protein)),
               fat: clamp01(Number(form.macroRatios.fat)),
            };
         }

         // optional preferred meals
         if (form.preferredMealsEnabled) {
            const pm = form.preferredMeals;
            const cleaned: PreferredMeals = {};
            (
               ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'] as const
            ).forEach((k) => {
               const v = String(pm[k] || '').trim();
               if (v) cleaned[k] = v;
            });
            if (Object.keys(cleaned).length > 0) goal.preferredMeals = cleaned;
         }

         const payload = {
            userId,
            age: Number(form.age),
            gender: form.gender,
            heightCm: Number(form.heightCm),
            weightKg: Number(form.weightKg),
            activityLevel: form.activityLevel,
            goal,
            dietaryPreference: form.dietaryPreference,
            allergies: parseCSV(form.allergiesText),
            conditions: parseCSV(form.conditionsText),
            notes: String(form.notes || '').trim() || undefined,
         };

         // store for generate-plan page
         localStorage.setItem('requirementsForm', JSON.stringify(payload));
         localStorage.setItem('userId', payload.userId);

         const res = await createRequirements(payload);
         localStorage.setItem('requirementId', res.requirementId);

         nav('/generate-plan');
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
                     Fill your details. We’ll generate plan A/B/C.
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
                     User: <b>{form.userId || '—'}</b>
                  </span>
               </div>
            </div>

            <div style={styles.card}>
               <div style={styles.grid}>
                  {/* UserId */}
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
                        Required (used to save data in DB)
                     </div>
                  </div>

                  {/* Age */}
                  <div style={{ ...styles.field, gridColumn: 'span 3' }}>
                     <div style={styles.label}>Age</div>
                     <input
                        style={styles.input}
                        type="number"
                        value={form.age}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              age:
                                 e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
                           })
                        }
                     />
                  </div>

                  {/* Gender */}
                  <div style={{ ...styles.field, gridColumn: 'span 3' }}>
                     <div style={styles.label}>Gender</div>
                     <select
                        style={styles.select}
                        value={form.gender}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              gender: e.target.value as Gender,
                           })
                        }
                     >
                        <option value="male">male</option>
                        <option value="female">female</option>
                     </select>
                  </div>

                  {/* Height */}
                  <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                     <div style={styles.label}>Height (cm)</div>
                     <input
                        style={styles.input}
                        type="number"
                        value={form.heightCm}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              heightCm:
                                 e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
                           })
                        }
                     />
                  </div>

                  {/* Weight */}
                  <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                     <div style={styles.label}>Weight (kg)</div>
                     <input
                        style={styles.input}
                        type="number"
                        value={form.weightKg}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              weightKg:
                                 e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
                           })
                        }
                     />
                  </div>

                  {/* Activity */}
                  <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                     <div style={styles.label}>Activity level</div>
                     <select
                        style={styles.select}
                        value={form.activityLevel}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              activityLevel: e.target.value as ActivityLevel,
                           })
                        }
                     >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                     </select>
                  </div>

                  {/* Dietary */}
                  <div style={{ ...styles.field, gridColumn: 'span 6' }}>
                     <div style={styles.label}>Dietary preference</div>
                     <select
                        style={styles.select}
                        value={form.dietaryPreference}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              dietaryPreference: e.target
                                 .value as DietaryPreference,
                           })
                        }
                     >
                        <option value="">Select…</option>
                        <option value="non_veg">Non-veg</option>
                        <option value="veg">Veg</option>
                        <option value="vegan">Vegan</option>
                     </select>
                     <div style={styles.hint}>Required</div>
                  </div>

                  {/* Allergies */}
                  <div style={{ ...styles.field, gridColumn: 'span 6' }}>
                     <div style={styles.label}>Allergies (comma separated)</div>
                     <input
                        style={styles.input}
                        placeholder="eg: peanuts, milk"
                        value={form.allergiesText}
                        onChange={(e) =>
                           setForm({ ...form, allergiesText: e.target.value })
                        }
                     />
                  </div>

                  {/* Conditions */}
                  <div style={{ ...styles.field, gridColumn: 'span 6' }}>
                     <div style={styles.label}>
                        Conditions (comma separated)
                     </div>
                     <input
                        style={styles.input}
                        placeholder="eg: diabetes, high_bp"
                        value={form.conditionsText}
                        onChange={(e) =>
                           setForm({ ...form, conditionsText: e.target.value })
                        }
                     />
                  </div>

                  {/* Notes */}
                  <div style={{ ...styles.field, gridColumn: 'span 12' }}>
                     <div style={styles.label}>Notes</div>
                     <textarea
                        style={styles.textarea}
                        placeholder="Any preferences, dislikes, meal timing, etc."
                        value={form.notes}
                        onChange={(e) =>
                           setForm({ ...form, notes: e.target.value })
                        }
                     />
                  </div>

                  <div style={{ gridColumn: 'span 12' }}>
                     <div style={styles.divider} />
                  </div>

                  {/* Goal type */}
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
                           const active = form.goalType === g.key;
                           return (
                              <button
                                 key={g.key}
                                 type="button"
                                 onClick={() =>
                                    setForm({
                                       ...form,
                                       goalType: g.key as GoalType,
                                    })
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
                     <div style={styles.hint}>Sends: goal.type</div>
                  </div>

                  {/* Calorie Target override */}
                  <div style={{ ...styles.field, gridColumn: 'span 6' }}>
                     <div style={styles.label}>
                        Calorie target per day (optional)
                     </div>
                     <input
                        style={styles.input}
                        type="number"
                        placeholder="eg: 1800"
                        value={form.calorieTargetPerDay}
                        onChange={(e) =>
                           setForm({
                              ...form,
                              calorieTargetPerDay:
                                 e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
                           })
                        }
                     />
                     <div style={styles.hint}>
                        If empty, backend calculates automatically.
                     </div>
                  </div>

                  {/* Macro ratios toggle */}
                  <div style={{ ...styles.field, gridColumn: 'span 6' }}>
                     <div style={styles.label}>Macro ratios (optional)</div>
                     <div style={styles.row}>
                        <div
                           style={styles.toggle}
                           onClick={() =>
                              setForm({
                                 ...form,
                                 macroRatiosEnabled: !form.macroRatiosEnabled,
                              })
                           }
                        >
                           <input
                              type="checkbox"
                              checked={form.macroRatiosEnabled}
                              readOnly
                           />
                           Enable macro ratios
                        </div>

                        {form.macroRatiosEnabled && (
                           <div
                              style={{
                                 fontSize: 12,
                                 opacity: macroOk ? 0.75 : 1,
                                 color: macroOk ? '#111827' : '#dc2626',
                              }}
                           >
                              Sum: {macroSum.toFixed(2)} (must be ~1.00)
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Macro fields */}
                  {form.macroRatiosEnabled && (
                     <>
                        <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                           <div style={styles.label}>Carb (0–1)</div>
                           <input
                              style={styles.input}
                              type="number"
                              step="0.01"
                              value={form.macroRatios.carb}
                              onChange={(e) =>
                                 setForm({
                                    ...form,
                                    macroRatios: {
                                       ...form.macroRatios,
                                       carb: Number(e.target.value),
                                    },
                                 })
                              }
                           />
                        </div>
                        <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                           <div style={styles.label}>Protein (0–1)</div>
                           <input
                              style={styles.input}
                              type="number"
                              step="0.01"
                              value={form.macroRatios.protein}
                              onChange={(e) =>
                                 setForm({
                                    ...form,
                                    macroRatios: {
                                       ...form.macroRatios,
                                       protein: Number(e.target.value),
                                    },
                                 })
                              }
                           />
                        </div>
                        <div style={{ ...styles.field, gridColumn: 'span 4' }}>
                           <div style={styles.label}>Fat (0–1)</div>
                           <input
                              style={styles.input}
                              type="number"
                              step="0.01"
                              value={form.macroRatios.fat}
                              onChange={(e) =>
                                 setForm({
                                    ...form,
                                    macroRatios: {
                                       ...form.macroRatios,
                                       fat: Number(e.target.value),
                                    },
                                 })
                              }
                           />
                        </div>
                     </>
                  )}

                  {/* Preferred meals toggle */}
                  <div style={{ ...styles.field, gridColumn: 'span 12' }}>
                     <div style={styles.label}>Preferred meals (optional)</div>
                     <div style={styles.row}>
                        <div
                           style={styles.toggle}
                           onClick={() =>
                              setForm({
                                 ...form,
                                 preferredMealsEnabled:
                                    !form.preferredMealsEnabled,
                              })
                           }
                        >
                           <input
                              type="checkbox"
                              checked={form.preferredMealsEnabled}
                              readOnly
                           />
                           Enable preferred meals
                        </div>
                        <div style={styles.hint}>
                           Example: “String hoppers”, “Rice & curry”, “Kola
                           kanda”
                        </div>
                     </div>
                  </div>

                  {form.preferredMealsEnabled && (
                     <>
                        {(
                           [
                              'breakfast',
                              'snack1',
                              'lunch',
                              'snack2',
                              'dinner',
                           ] as const
                        ).map((k) => (
                           <div
                              key={k}
                              style={{ ...styles.field, gridColumn: 'span 6' }}
                           >
                              <div style={styles.label}>{k}</div>
                              <input
                                 style={styles.input}
                                 value={form.preferredMeals[k] ?? ''}
                                 onChange={(e) =>
                                    setForm({
                                       ...form,
                                       preferredMeals: {
                                          ...form.preferredMeals,
                                          [k]: e.target.value,
                                       },
                                    })
                                 }
                              />
                           </div>
                        ))}
                     </>
                  )}
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
