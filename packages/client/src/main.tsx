import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-loading-skeleton/dist/skeleton.css';
import App from './App.tsx';
import ChatBot from '@/components/chat/ChatBot.tsx';
import './index.css';
import './App.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <QueryClientProvider client={queryClient}>
         <ChatBot />
      </QueryClientProvider>
   </StrictMode>
);
