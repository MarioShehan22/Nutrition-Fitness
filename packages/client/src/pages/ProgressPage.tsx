import { useEffect, useMemo, useState } from 'react';
import { getTimeseries } from '../api/progress';
import { apiErrorMessage } from '../api/http';
import CalorieTrackingCharts from '../components/CalorieTrackingCharts';

function isoDate(d = new Date()) {
   return d.toISOString().slice(0, 10);
}
function daysAgoISO(days: number) {
   const d = new Date();
   d.setDate(d.getDate() - days);
   return d.toISOString().slice(0, 10);
}

export type DayRow = {
   date: string;
   target: number;
   consumed: number;
   delta: number;
   status: 'under' | 'over' | 'ok';
   suggestedAdjustment?: string;
   totals?: { protein_g?: number; carbs_g?: number; fat_g?: number };
};

export type ProgressPayload = {
   mode: string;
   tolerance: number;
   baseTarget: number;
   startDate: string;
   endDate: string;
   series: DayRow[];
};

export default function ProgressPage() {
   const userId = localStorage.getItem('userId') || 'demo-user';

   const [from, setFrom] = useState(daysAgoISO(14));
   const [to, setTo] = useState(isoDate());
   const [mode, setMode] = useState<'static' | 'weekly' | 'carry'>('static');

   const [loading, setLoading] = useState(false);
   const [data, setData] = useState<ProgressPayload | null>(null);
   const [error, setError] = useState('');

   const rows = data?.series ?? [];

   const maxCalories = useMemo(() => {
      if (rows.length === 0) return 1;
      return Math.max(1, ...rows.map((r) => Number(r.consumed ?? 0)));
   }, [rows]);

   async function load() {
      setError('');
      setLoading(true);
      try {
         const res = await getTimeseries(userId, from, to, mode);

         const payload: ProgressPayload = {
            mode: String(res.mode ?? mode),
            tolerance: Number(res.tolerance ?? 0.1),
            baseTarget: Number(res.baseTarget ?? 0),
            startDate: String(res.startDate ?? from),
            endDate: String(res.endDate ?? to),
            series: Array.isArray(res.series) ? res.series : [],
         };

         setData(payload);
      } catch (e) {
         setError(apiErrorMessage(e));
         setData(null);
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
         {/* Header */}
         <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Progress
               </h1>
               <p className="mt-1 text-sm text-slate-600">
                  Calories target vs consumed, plus macro breakdown.
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
                     From
                  </span>
                  <input
                     type="date"
                     value={from}
                     onChange={(e) => setFrom(e.target.value)}
                     className="bg-transparent text-sm text-slate-900 outline-none"
                  />
               </div>

               <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">
                     To
                  </span>
                  <input
                     type="date"
                     value={to}
                     onChange={(e) => setTo(e.target.value)}
                     className="bg-transparent text-sm text-slate-900 outline-none"
                  />
               </div>

               <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">
                     Mode
                  </span>
                  <select
                     value={mode}
                     onChange={(e) =>
                        setMode(e.target.value as 'static' | 'weekly' | 'carry')
                     }
                     className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  >
                     <option value="static">Static</option>
                     <option value="weekly">Weekly</option>
                     <option value="carry">Carry</option>
                  </select>
               </div>

               <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
               >
                  {loading ? 'Loading...' : 'Load'}
               </button>
            </div>
         </div>

         {/* Error */}
         {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
               <span className="font-semibold">Error:</span> {error}
            </div>
         )}

         {/* Empty */}
         {!data || rows.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
               No data for selected date range.
            </div>
         ) : (
            <>
               {/* Charts */}
               <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <CalorieTrackingCharts data={data} />
               </div>

               {/* Mini trend list */}
               <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                     Calories trend
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                     A quick scan of consumption per day.
                  </p>

                  <div className="mt-4 grid gap-2">
                     {rows.map((r, idx) => {
                        const cal = Number(r.consumed ?? 0);
                        const pct = Math.round((cal / maxCalories) * 100);

                        return (
                           <div
                              key={idx}
                              className="grid grid-cols-[92px_1fr_84px] items-center gap-3 text-sm"
                           >
                              <div className="font-mono text-xs text-slate-600">
                                 {r.date.slice(0, 10)}
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                 <div
                                    className="h-full bg-slate-900"
                                    style={{ width: `${pct}%` }}
                                 />
                              </div>

                              <div className="text-right font-semibold text-slate-900">
                                 {cal} kcal
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Table */}
               <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                     Daily breakdown
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                     Target vs consumed + macros.
                  </p>

                  <div className="mt-4 overflow-auto">
                     <table className="min-w-[860px] w-full border-collapse text-sm">
                        <thead>
                           <tr className="text-left text-xs font-semibold text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                 Date
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2 text-right">
                                 Target
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2 text-right">
                                 Consumed
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2 text-right">
                                 Delta
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2 text-right">
                                 Protein
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2 text-right">
                                 Carbs
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2 text-right">
                                 Fat
                              </th>
                           </tr>
                        </thead>

                        <tbody>
                           {rows.map((r, idx) => {
                              const delta = Number(r.delta ?? 0);
                              const deltaClass =
                                 delta > 0
                                    ? 'text-rose-600'
                                    : delta < 0
                                      ? 'text-emerald-700'
                                      : 'text-slate-700';

                              return (
                                 <tr key={idx} className="hover:bg-slate-50">
                                    <td className="border-b border-slate-100 px-3 py-2 font-mono text-xs text-slate-600">
                                       {r.date.slice(0, 10)}
                                    </td>
                                    <td className="border-b border-slate-100 px-3 py-2 text-right">
                                       {Number(r.target ?? 0)}
                                    </td>
                                    <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold text-slate-900">
                                       {Number(r.consumed ?? 0)}
                                    </td>
                                    <td
                                       className={`border-b border-slate-100 px-3 py-2 text-right font-semibold ${deltaClass}`}
                                    >
                                       {delta}
                                    </td>
                                    <td className="border-b border-slate-100 px-3 py-2 text-right">
                                       {Number(r.totals?.protein_g ?? 0)}
                                    </td>
                                    <td className="border-b border-slate-100 px-3 py-2 text-right">
                                       {Number(r.totals?.carbs_g ?? 0)}
                                    </td>
                                    <td className="border-b border-slate-100 px-3 py-2 text-right">
                                       {Number(r.totals?.fat_g ?? 0)}
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            </>
         )}
      </div>
   );
}
