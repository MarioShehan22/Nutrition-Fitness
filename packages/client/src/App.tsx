import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import RequirementsPage from './pages/RequirementsPage';
import GeneratePlanPage from './pages/GeneratePlanPage';
import EnrollPage from './pages/EnrollPage';
import TodayPage from './pages/TodayPage';
import LogFoodPage from './pages/LogFoodPage';
import ProgressPage from './pages/ProgressPage';
import HomePage from '@/pages/HomePage.tsx';
import './index.css';
import ChatBot from '@/components/chat/ChatBot.tsx';

export default function App() {
   return (
      <BrowserRouter>
         <Routes>
            {/* Layout route = Navbar shared */}
            <Route element={<AppLayout />}>
               <Route
                  path="/"
                  element={<Navigate to="/requirements" replace />}
               />

               <Route path="/requirements" element={<RequirementsPage />} />
               <Route path="/home" element={<HomePage />} />

               {/* keep your existing route name */}
               <Route path="/generate-plan" element={<GeneratePlanPage />} />

               <Route path="/enroll" element={<EnrollPage />} />
               <Route path="/today" element={<TodayPage />} />
               <Route path="/log" element={<LogFoodPage />} />
               <Route path="/progress" element={<ProgressPage />} />
               <Route path="/chat" element={<ChatBot />} />

               <Route
                  path="*"
                  element={<div style={{ padding: 16 }}>404</div>}
               />
            </Route>
         </Routes>
      </BrowserRouter>
   );
}
