import { Outlet } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '@/components/Footer.tsx';

export default function AppLayout() {
   return (
      <div style={{ minHeight: '100vh', background: '#f6f7fb' }}>
         <Nav />
         <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
            <Outlet />
         </div>
         <Footer />
      </div>
   );
}
