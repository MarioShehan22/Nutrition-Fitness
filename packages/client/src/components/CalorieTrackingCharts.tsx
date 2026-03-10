import { useMemo } from 'react';
import {
   ResponsiveContainer,
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   Legend,
   BarChart,
   Bar,
   ReferenceLine,
   Cell,
} from 'recharts';
import type { ProgressPayload } from '../pages/ProgressPage';

type Props = {
   data: ProgressPayload;
};

const formatDate = (iso: string) => {
   const d = new Date(iso + 'T00:00:00');
   return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
};

const kcal = (n: number) => `${Math.round(n)} kcal`;

export default function CalorieTrackingCharts({ data }: Props) {
   const chartData = useMemo(() => {
      return data.series.map((r) => ({
         ...r,
         dateLabel: formatDate(r.date),
      }));
   }, [data.series]);

   return (
      <div className="grid gap-8">
         {/* Target vs Consumed */}
         <section>
            <div className="flex items-end justify-between gap-3">
               <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                     Target vs Consumed
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                     Compare your daily target with what you consumed.
                  </p>
               </div>
               <div className="text-xs text-slate-500">
                  Mode:{' '}
                  <span className="font-semibold text-slate-900">
                     {data.mode}
                  </span>
               </div>
            </div>

            <div className="mt-4 h-[360px] w-full">
               <ResponsiveContainer>
                  <LineChart
                     data={chartData}
                     margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="dateLabel" interval={6} />
                     <YAxis />
                     <Tooltip
                        formatter={(value: any) => kcal(Number(value))}
                        labelFormatter={(label) => `Date: ${label}`}
                     />
                     <Legend />

                     <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#1f77b4"
                        strokeWidth={2}
                        dot={false}
                        name="Target"
                     />
                     <Line
                        type="monotone"
                        dataKey="consumed"
                        stroke="#ff7f0e"
                        strokeWidth={2}
                        dot={false}
                        name="Consumed"
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </section>

         {/* Delta */}
         <section>
            <h3 className="text-lg font-semibold text-slate-900">
               Daily Delta (Consumed − Target)
            </h3>
            <p className="mt-1 text-sm text-slate-600">
               Negative bars mean under target; positive means over target.
            </p>

            <div className="mt-4 h-[320px] w-full">
               <ResponsiveContainer>
                  <BarChart
                     data={chartData}
                     margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="dateLabel" interval={6} />
                     <YAxis />
                     <Tooltip
                        formatter={(value: any) => kcal(Number(value))}
                        labelFormatter={(label) => `Date: ${label}`}
                     />
                     <Legend />
                     <ReferenceLine y={0} />

                     <Bar dataKey="delta" name="Delta">
                        {chartData.map((row, idx) => (
                           <Cell
                              key={`cell-${idx}`}
                              fill={row.delta >= 0 ? '#2ca02c' : '#d62728'}
                           />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </section>
      </div>
   );
}
