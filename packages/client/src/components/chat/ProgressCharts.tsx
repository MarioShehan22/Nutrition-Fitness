import axios from 'axios';
import { useEffect, useState } from 'react';
import CalorieTrackingCharts from './CalorieTrackingCharts';

type DayRow = {
   date: string;
   target: number;
   consumed: number;
   delta: number;
   status: 'under' | 'over' | 'ok';
   suggestedAdjustment?: string;
};

type Payload = {
   mode: 'static' | string;
   tolerance: number;
   baseTarget: number;
   startDate: string;
   endDate: string;
   series: DayRow[];
};

type Props = {
   baseUrl?: string; // optional, only if you want custom base url
   userId: string;
};

export default function ProgressCharts({ baseUrl = '', userId }: Props) {
   const [data, setData] = useState<Payload | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   useEffect(() => {
      let alive = true;

      const load = async () => {
         try {
            setLoading(true);
            setError('');

            // If baseUrl is "", it uses same origin (good with Vite proxy)
            const url = `${baseUrl}/api/progress/timeseries?userId=${encodeURIComponent(userId)}`;

            const resp = await axios.get<Payload>(url);

            if (!alive) return;
            setData(resp.data);
         } catch (e) {
            console.error(e);
            if (!alive) return;
            setError('Failed to load progress data.');
         } finally {
            if (!alive) return;
            setLoading(false);
         }
      };

      load();
      return () => {
         alive = false;
      };
   }, [baseUrl, userId]);

   if (loading) return <p>Loading progress…</p>;
   if (error) return <p style={{ color: 'red' }}>{error}</p>;
   if (!data) return null;

   return (
      <div style={{ padding: 16 }}>
         <h2
            style={{
               marginBottom: 6,
               textAlign: 'center',
               fontWeight: 700,
               fontSize: '1.3rem',
               textTransform: 'uppercase',
               letterSpacing: '1px',
               color: '#666',
            }}
         >
            Calorie Consumption Overview
         </h2>
         <CalorieTrackingCharts data={data} />
      </div>
   );
}
