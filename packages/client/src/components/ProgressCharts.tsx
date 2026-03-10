import axios from 'axios';
import { useEffect, useState } from 'react';
import CalorieTrackingCharts from './CalorieTrackingCharts';
import type { ProgressPayload } from '../pages/ProgressPage';

type Props = {
   baseUrl?: string;
   userId: string;
};

export default function ProgressCharts({ baseUrl = '', userId }: Props) {
   const [data, setData] = useState<ProgressPayload | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   useEffect(() => {
      let alive = true;

      const load = async () => {
         try {
            setLoading(true);
            setError('');

            const url = `${baseUrl}/api/progress/timeseries?userId=${encodeURIComponent(userId)}`;
            const resp = await axios.get<ProgressPayload>(url);

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

   if (loading) {
      return <p className="text-sm text-slate-600">Loading progress…</p>;
   }

   if (error) {
      return <p className="text-sm text-red-600">{error}</p>;
   }

   if (!data) return null;

   return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
         <div className="text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
               Calorie Consumption Overview
            </h2>
         </div>
         <div className="mt-4">
            <CalorieTrackingCharts data={data} />
         </div>
      </div>
   );
}
