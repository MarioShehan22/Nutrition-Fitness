import { useEffect, useMemo, useState } from 'react';
import { getTimeseries } from '../api/progress';
import { apiErrorMessage } from '../api/http';

function isoDate(d = new Date()) {
   return d.toISOString().slice(0, 10);
}
function daysAgoISO(days: number) {
   const d = new Date();
   d.setDate(d.getDate() - days);
   return d.toISOString().slice(0, 10);
}

export default function ProgressPage() {
   const userId = localStorage.getItem('userId') || 'demo-user';

   const [from, setFrom] = useState(daysAgoISO(14));
   const [to, setTo] = useState(isoDate());
   const [loading, setLoading] = useState(false);
   const [rows, setRows] = useState<any[]>([]);
   const [error, setError] = useState('');

   const maxCalories = useMemo(() => {
      if (rows.length === 0) return 1;
      return Math.max(
         1,
         ...rows.map((r) => Number(r.totalCalories ?? r.calories ?? 0))
      );
   }, [rows]);

   async function load() {
      setError('');
      setLoading(true);
      try {
         const data = await getTimeseries(userId, from, to);
         // Your backend may return { points: [...] } or directly [...]
         const pts = Array.isArray(data)
            ? data
            : data.points || data.data || [];
         setRows(Array.isArray(pts) ? pts : []);
      } catch (e) {
         setError(apiErrorMessage(e));
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   return (
      <div style={{ padding: 16, maxWidth: 980, margin: '0 auto' }}>
         <h2>Progress</h2>

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
               <label>From</label>
               <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
               />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
               <label>To</label>
               <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
               />
            </div>

            <button onClick={load} disabled={loading}>
               {loading ? 'Loading...' : 'Load'}
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
            <h3 style={{ marginTop: 0 }}>Calories trend</h3>

            {rows.length === 0 ? (
               <div style={{ opacity: 0.8 }}>
                  No data for selected date range.
               </div>
            ) : (
               <div style={{ display: 'grid', gap: 6 }}>
                  {rows.map((r, idx) => {
                     const cal = Number(r.totalCalories ?? r.calories ?? 0);
                     const pct = Math.round((cal / maxCalories) * 100);
                     return (
                        <div
                           key={idx}
                           style={{
                              display: 'grid',
                              gridTemplateColumns: '90px 1fr 60px',
                              gap: 10,
                              alignItems: 'center',
                           }}
                        >
                           <div style={{ fontFamily: 'monospace' }}>
                              {(r.date || r.day || '').slice(0, 10)}
                           </div>
                           <div
                              style={{
                                 height: 10,
                                 border: '1px solid #ddd',
                                 borderRadius: 6,
                                 overflow: 'hidden',
                              }}
                           >
                              <div
                                 style={{ width: `${pct}%`, height: '100%' }}
                              />
                           </div>
                           <div style={{ textAlign: 'right' }}>{cal} kcal</div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>

         <div
            style={{
               marginTop: 16,
               padding: 12,
               border: '1px solid #ddd',
               borderRadius: 10,
            }}
         >
            <h3 style={{ marginTop: 0 }}>Daily breakdown</h3>

            {rows.length === 0 ? (
               <div style={{ opacity: 0.8 }}>No rows.</div>
            ) : (
               <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr>
                           <th
                              style={{
                                 textAlign: 'left',
                                 borderBottom: '1px solid #eee',
                                 padding: 8,
                              }}
                           >
                              Date
                           </th>
                           <th
                              style={{
                                 textAlign: 'right',
                                 borderBottom: '1px solid #eee',
                                 padding: 8,
                              }}
                           >
                              Calories
                           </th>
                           <th
                              style={{
                                 textAlign: 'right',
                                 borderBottom: '1px solid #eee',
                                 padding: 8,
                              }}
                           >
                              Protein (g)
                           </th>
                           <th
                              style={{
                                 textAlign: 'right',
                                 borderBottom: '1px solid #eee',
                                 padding: 8,
                              }}
                           >
                              Carbs (g)
                           </th>
                           <th
                              style={{
                                 textAlign: 'right',
                                 borderBottom: '1px solid #eee',
                                 padding: 8,
                              }}
                           >
                              Fat (g)
                           </th>
                        </tr>
                     </thead>
                     <tbody>
                        {rows.map((r, idx) => (
                           <tr key={idx}>
                              <td
                                 style={{
                                    padding: 8,
                                    borderBottom: '1px solid #f5f5f5',
                                 }}
                              >
                                 {(r.date || r.day || '').slice(0, 10)}
                              </td>
                              <td
                                 style={{
                                    padding: 8,
                                    textAlign: 'right',
                                    borderBottom: '1px solid #f5f5f5',
                                 }}
                              >
                                 {Number(r.totalCalories ?? r.calories ?? 0)}
                              </td>
                              <td
                                 style={{
                                    padding: 8,
                                    textAlign: 'right',
                                    borderBottom: '1px solid #f5f5f5',
                                 }}
                              >
                                 {Number(
                                    r.totals?.protein_g ?? r.protein_g ?? 0
                                 )}
                              </td>
                              <td
                                 style={{
                                    padding: 8,
                                    textAlign: 'right',
                                    borderBottom: '1px solid #f5f5f5',
                                 }}
                              >
                                 {Number(r.totals?.carbs_g ?? r.carbs_g ?? 0)}
                              </td>
                              <td
                                 style={{
                                    padding: 8,
                                    textAlign: 'right',
                                    borderBottom: '1px solid #f5f5f5',
                                 }}
                              >
                                 {Number(r.totals?.fat_g ?? r.fat_g ?? 0)}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      </div>
   );
}
