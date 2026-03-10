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

type ManualEntry = {
   foodName: string;
   calories: number;
   macros?: {
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
   };
   portion?: string;
   time?: string;
};

type ManualLogPayload = {
   userId: string;
   date: string;
   entries: ManualEntry[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
   return typeof v === 'object' && v !== null;
}

function clampNumber(n: number) {
   return Number.isFinite(n) ? n : 0;
}

export default function LogFoodPage() {
   const userId = localStorage.getItem('userId') || 'demo-user';
   const [date, setDate] = useState<string>(isoDate());

   const [manualItems, setManualItems] = useState<ManualItem[]>([
      { name: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
   ]);

   const [visionFile, setVisionFile] = useState<File | null>(null);

   const [loadingManual, setLoadingManual] = useState(false);
   const [loadingVision, setLoadingVision] = useState(false);

   const [result, setResult] = useState<unknown>(null);
   const [error, setError] = useState('');

   const manualTotal = useMemo(() => {
      return manualItems.reduce(
         (acc, it) => {
            acc.cal += clampNumber(Number(it.calories || 0));
            acc.p += clampNumber(Number(it.protein_g || 0));
            acc.c += clampNumber(Number(it.carbs_g || 0));
            acc.f += clampNumber(Number(it.fat_g || 0));
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

      const entries: ManualEntry[] = manualItems
         .map((x) => ({
            foodName: (x.name || '').trim(),
            calories: Number(x.calories || 0),
            macros: {
               protein_g: Number(x.protein_g || 0),
               carbs_g: Number(x.carbs_g || 0),
               fat_g: Number(x.fat_g || 0),
            },
         }))
         .filter((x) => x.foodName.length > 0);

      if (entries.length === 0) {
         setError('Add at least 1 food item.');
         return;
      }

      const payload: ManualLogPayload = { userId, date, entries };

      try {
         setLoadingManual(true);
         const res = await logManual(payload);
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
      fd.append('image', visionFile);
      fd.append('userId', userId);
      fd.append('date', date);

      try {
         setLoadingVision(true);

         // TODO: replace with real API call later
         setResult({
            message: 'Vision logging not implemented yet.',
            fileName: visionFile.name,
            date,
         });

         // const res = await logVision(fd);
         // setResult(res);
      } catch (e) {
         setError(apiErrorMessage(e));
      } finally {
         setLoadingVision(false);
      }
   }

   return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
         {/* Header */}
         <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Log Food
               </h1>
               <p className="mt-1 text-sm text-slate-600">
                  Add foods manually or upload a meal photo.
               </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
               <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">
                     User
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                     {userId}
                  </div>
               </div>

               <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">
                     Date
                  </span>
                  <input
                     type="date"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="bg-transparent text-sm text-slate-900 outline-none"
                  />
               </div>
            </div>
         </div>

         {/* Error */}
         {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
               <span className="font-semibold">Error:</span> {error}
            </div>
         )}

         {/* Manual entry */}
         <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                     Manual entry
                  </h2>
                  <p className="text-sm text-slate-600">
                     Add one or more food items and save the log.
                  </p>
               </div>

               <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                     {manualTotal.cal} kcal
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                     P {manualTotal.p}g • C {manualTotal.c}g • F {manualTotal.f}
                     g
                  </div>
               </div>
            </div>

            <div className="mt-4 overflow-x-auto">
               <div className="min-w-[780px]">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-semibold text-slate-500">
                     <div>Food</div>
                     <div>kcal</div>
                     <div>P (g)</div>
                     <div>C (g)</div>
                     <div>F (g)</div>
                     <div className="text-right"> </div>
                  </div>

                  <div className="mt-2 grid gap-2">
                     {manualItems.map((it, i) => (
                        <div
                           key={i}
                           className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-2"
                        >
                           <input
                              placeholder="Food name"
                              value={it.name}
                              onChange={(e) =>
                                 updateItem(i, { name: e.target.value })
                              }
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                           />

                           <input
                              type="number"
                              placeholder="kcal"
                              value={it.calories}
                              onChange={(e) =>
                                 updateItem(i, {
                                    calories: Number(e.target.value),
                                 })
                              }
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                           />

                           <input
                              type="number"
                              placeholder="P"
                              value={it.protein_g ?? 0}
                              onChange={(e) =>
                                 updateItem(i, {
                                    protein_g: Number(e.target.value),
                                 })
                              }
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                           />

                           <input
                              type="number"
                              placeholder="C"
                              value={it.carbs_g ?? 0}
                              onChange={(e) =>
                                 updateItem(i, {
                                    carbs_g: Number(e.target.value),
                                 })
                              }
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                           />

                           <input
                              type="number"
                              placeholder="F"
                              value={it.fat_g ?? 0}
                              onChange={(e) =>
                                 updateItem(i, {
                                    fat_g: Number(e.target.value),
                                 })
                              }
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                           />

                           <button
                              onClick={() => removeRow(i)}
                              disabled={manualItems.length === 1}
                              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Remove"
                           >
                              ✕
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
               <button
                  onClick={addRow}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
               >
                  + Add item
               </button>

               <button
                  onClick={submitManual}
                  disabled={loadingManual}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
               >
                  {loadingManual ? 'Saving...' : 'Save manual log'}
               </button>
            </div>
         </div>

         {/* Vision */}
         <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                     Vision (photo)
                  </h2>
                  <p className="text-sm text-slate-600">
                     Upload a meal photo to analyze and log automatically.
                  </p>
               </div>

               {visionFile ? (
                  <div className="text-sm text-slate-700">
                     Selected:{' '}
                     <span className="font-semibold text-slate-900">
                        {visionFile.name}
                     </span>
                  </div>
               ) : (
                  <div className="text-sm text-slate-500">No file selected</div>
               )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
               <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto">
                  <span>Choose image</span>
                  <input
                     type="file"
                     accept="image/*"
                     className="hidden"
                     onChange={(e) =>
                        setVisionFile(e.target.files?.[0] ?? null)
                     }
                  />
               </label>

               <button
                  onClick={submitVision}
                  disabled={loadingVision}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
               >
                  {loadingVision ? 'Uploading...' : 'Analyze & log'}
               </button>
            </div>
         </div>

         {/* Result */}
         {result !== null && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
               <div className="text-sm font-semibold text-slate-900">
                  Result
               </div>
               <pre className="mt-3 max-h-[420px] overflow-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-800">
                  {JSON.stringify(
                     isRecord(result) ? result : { result },
                     null,
                     2
                  )}
               </pre>
            </div>
         )}
      </div>
   );
}
