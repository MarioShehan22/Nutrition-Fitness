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

type DayRow = {
   date: string;
   target: number;
   consumed: number;
   delta: number; // consumed - target (negative = under)
   status: 'under' | 'over' | 'ok';
   suggestedAdjustment?: string;
};

type Payload = {
   mode: string;
   tolerance: number;
   baseTarget: number;
   startDate: string;
   endDate: string;
   series: DayRow[];
};

type Props = {
   data: Payload;
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
      <div style={{ width: '100%', display: 'grid', gap: 24 }}>
         {/* ✅ Comparison chart */}
         <div>
            <h3 style={{ margin: '0 0 10px' }}>Target vs Consumed</h3>
            <div style={{ width: '100%', height: 360 }}>
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

                     {/* ✅ TWO COLORS */}
                     <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#1f77b4" // blue
                        strokeWidth={2}
                        dot={false}
                        name="Target"
                     />
                     <Line
                        type="monotone"
                        dataKey="consumed"
                        stroke="#ff7f0e" // orange
                        strokeWidth={2}
                        dot={false}
                        name="Consumed"
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* ✅ Delta chart */}
         <div>
            <h3 style={{ margin: '0 0 10px' }}>
               Daily Delta (Consumed − Target)
            </h3>
            <p style={{ marginTop: 0, opacity: 0.75 }}>
               Negative bars mean you were under target; positive means over
               target.
            </p>

            <div style={{ width: '100%', height: 320 }}>
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
                        {/* ✅ Color bar based on sign */}
                        {chartData.map((row, idx) => (
                           <Cell
                              key={`cell-${idx}`}
                              fill={row.delta >= 0 ? '#2ca02c' : '#d62728'} // green if over, red if under
                           />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
   );
}
