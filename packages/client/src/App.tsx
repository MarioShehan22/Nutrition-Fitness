import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RequirementsPage from './pages/RequirementsPage';
import GeneratePlanPage from './pages/GeneratePlanPage';
import EnrollPage from './pages/EnrollPage';
import TodayPage from './pages/TodayPage';
import LogFoodPage from './pages/LogFoodPage';
import ProgressPage from './pages/ProgressPage';
import ChatBot from '@/components/chat/ChatBot.tsx';

export default function App() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Navigate to="/requirements" />} />
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/generate" element={<GeneratePlanPage />} />
            <Route path="/enroll" element={<EnrollPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/log" element={<LogFoodPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            {/*<ChatBot/>*/}
         </Routes>
      </BrowserRouter>
   );
}
