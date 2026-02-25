import { useMemo, useState } from 'react';
import { apiErrorMessage } from '../api/http';
import { logManual } from '../api/logs';

function isoDate(d = new Date()) {
   return d.toISOString().slice(0, 10);
}

type ManualItem = {
   name: string;
   calories: number;
   protein_g?: number;
   carbs_g?: number;
   fat_g?: number;
};

export default function LogFoodPage() {
   const userId = localStorage.getItem('userId') || 'demo-user';
   const [date, setDate] = useState<string>(isoDate());

   const [manualItems, setManualItems] = useState<ManualItem[]>([
      { name: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
   ]);

   const [visionFile, setVisionFile] = useState<File | null>(null);

   const [loadingManual, setLoadingManual] = useState(false);
   const [loadingVision, setLoadingVision] = useState(false);
   const [result, setResult] = useState<any>(null);
   const [error, setError] = useState('');

   const manualTotal = useMemo(() => {
      return manualItems.reduce(
         (acc, it) => {
            acc.cal += Number(it.calories || 0);
            acc.p += Number(it.protein_g || 0);
            acc.c += Number(it.carbs_g || 0);
            acc.f += Number(it.fat_g || 0);
            return acc;
         },
         { cal: 0, p: 0, c: 0, f: 0 }
      );
   }, [manualItems]);

   function updateItem(i: number, patch: Partial<ManualItem>) {
      setManualItems((prev) =>
         prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x))
      );
   }

   function addRow() {
      setManualItems((prev) => [
         ...prev,
         { name: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      ]);
   }

   function removeRow(i: number) {
      setManualItems((prev) => prev.filter((_, idx) => idx !== i));
   }

   async function submitManual() {
      setError('');
      setResult(null);

      const cleaned = manualItems
         .map((x) => ({
            ...x,
            name: (x.name || '').trim(),
            calories: Number(x.calories || 0),
            protein_g: Number(x.protein_g || 0),
            carbs_g: Number(x.carbs_g || 0),
            fat_g: Number(x.fat_g || 0),
         }))
         .filter((x) => x.name && x.calories >= 0);

      if (cleaned.length === 0) {
         setError('Add at least 1 food item.');
         return;
      }

      try {
         setLoadingManual(true);
         const res = await logManual({ userId, date, items: cleaned });
         setResult(res);
      } catch (e) {
         setError(apiErrorMessage(e));
      } finally {
         setLoadingManual(false);
      }
   }

   async function submitVision() {
      setError('');
      setResult(null);

      if (!visionFile) {
         setError('Please choose an image.');
         return;
      }

      const fd = new FormData();
      // common patterns: backend may expect 'image' or 'file'
      fd.append('image', visionFile);
      fd.append('userId', userId);
      fd.append('date', date);

      try {
         setLoadingVision(true);
         // const res = await logVision(fd);
         setResult(res);
      } catch (e) {
         setError(apiErrorMessage(e));
      } finally {
         setLoadingVision(false);
      }
   }

   return (
      <div style={{ padding: 16, maxWidth: 980, margin: '0 auto' }}>
         <h2>Log Food</h2>

         <div
            style={{
               display: 'flex',
               gap: 12,
               alignItems: 'center',
               flexWrap: 'wrap',
            }}
         >
            <div>
               <b>User:</b> {userId}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
               <label>Date</label>
               <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
               />
            </div>
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
            <h3 style={{ marginTop: 0 }}>Manual entry</h3>

            <div style={{ opacity: 0.8, fontSize: 13 }}>
               Totals: {manualTotal.cal} kcal • P {manualTotal.p}g • C{' '}
               {manualTotal.c}g • F {manualTotal.f}g
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
               {manualItems.map((it, i) => (
                  <div
                     key={i}
                     style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                        gap: 8,
                        alignItems: 'center',
                     }}
                  >
                     <input
                        placeholder="Food name"
                        value={it.name}
                        onChange={(e) =>
                           updateItem(i, { name: e.target.value })
                        }
                     />
                     <input
                        type="number"
                        placeholder="kcal"
                        value={it.calories}
                        onChange={(e) =>
                           updateItem(i, { calories: Number(e.target.value) })
                        }
                     />
                     <input
                        type="number"
                        placeholder="P (g)"
                        value={it.protein_g ?? 0}
                        onChange={(e) =>
                           updateItem(i, { protein_g: Number(e.target.value) })
                        }
                     />
                     <input
                        type="number"
                        placeholder="C (g)"
                        value={it.carbs_g ?? 0}
                        onChange={(e) =>
                           updateItem(i, { carbs_g: Number(e.target.value) })
                        }
                     />
                     <input
                        type="number"
                        placeholder="F (g)"
                        value={it.fat_g ?? 0}
                        onChange={(e) =>
                           updateItem(i, { fat_g: Number(e.target.value) })
                        }
                     />

                     <button
                        onClick={() => removeRow(i)}
                        disabled={manualItems.length === 1}
                     >
                        ✕
                     </button>
                  </div>
               ))}
            </div>

            <div
               style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 12,
                  flexWrap: 'wrap',
               }}
            >
               <button onClick={addRow}>+ Add item</button>
               <button onClick={submitManual} disabled={loadingManual}>
                  {loadingManual ? 'Saving...' : 'Save manual log'}
               </button>
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
            <h3 style={{ marginTop: 0 }}>Vision (photo)</h3>

            <input
               type="file"
               accept="image/*"
               onChange={(e) => setVisionFile(e.target.files?.[0] ?? null)}
            />

            <div
               style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 12,
                  flexWrap: 'wrap',
               }}
            >
               <button onClick={submitVision} disabled={loadingVision}>
                  {loadingVision ? 'Uploading...' : 'Analyze & log'}
               </button>
               {visionFile && (
                  <span style={{ opacity: 0.8 }}>{visionFile.name}</span>
               )}
            </div>
         </div>

         {result && (
            <pre
               style={{
                  marginTop: 16,
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  background: '#fafafa',
                  overflow: 'auto',
               }}
            >
               {JSON.stringify(result, null, 2)}
            </pre>
         )}
      </div>
   );
}
