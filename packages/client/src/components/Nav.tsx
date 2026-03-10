import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Nav() {
   const location = useLocation();

   const linkStyle = (path: string) => ({
      padding: '8px 12px',
      borderRadius: 6,
      textDecoration: 'none',
      fontWeight: 500,
      background: location.pathname === path ? '#007bff' : 'transparent',
      color: location.pathname === path ? '#fff' : '#333',
   });

   return (
      <div
         style={{
            display: 'flex',
            gap: 12,
            padding: 12,
            borderBottom: '1px solid #eee',
            background: '#fafafa',
            alignItems: 'center',
            justifyContent: 'space-between',
         }}
      >
         <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
               <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
               <div className="text-sm font-semibold tracking-tight">
                  NutriFit
               </div>
               <div className="text-xs text-slate-500">
                  Smart healthy living • Sri Lanka
               </div>
            </div>
         </div>

         <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/home" style={linkStyle('/home')}>
               Home
            </Link>
            <Link to="/requirements" style={linkStyle('/requirements')}>
               Requirements
            </Link>
            <Link to="/generate-plan" style={linkStyle('/generate-plan')}>
               Generate Plan
            </Link>
            <Link to="/enroll" style={linkStyle('/enroll')}>
               Enroll
            </Link>
            <Link to="/today" style={linkStyle('/today')}>
               Today
            </Link>
            <Link to="/log" style={linkStyle('/log')}>
               Log Food
            </Link>
            <Link to="/progress" style={linkStyle('/progress')}>
               Progress
            </Link>
         </div>
      </div>
   );
}
