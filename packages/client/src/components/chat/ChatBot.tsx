import axios from 'axios';
import { useMemo, useRef, useState } from 'react';
import ChatInput, { type ChatFormData } from './ChatInput';
import type { Message } from './ChatMessages';
import ChatMessages from './ChatMessages';
import TypingIndicator from './TypingIndicator';

import popSound from '@/assets/sounds/pop.mp3';
import notificationSound from '@/assets/sounds/notification.mp3';

type ChatResponse = { message: string };

export default function ChatBot() {
   const [messages, setMessages] = useState<Message[]>([]);
   const [isBotTyping, setIsBotTyping] = useState(false);
   const [error, setError] = useState('');

   const conversationId = useRef(crypto.randomUUID());

   // Create audio once (avoid re-creating on every render)
   const popAudio = useMemo(() => {
      const a = new Audio(popSound);
      a.volume = 0.2;
      return a;
   }, []);

   const notificationAudio = useMemo(() => {
      const a = new Audio(notificationSound);
      a.volume = 0.2;
      return a;
   }, []);

   const onSubmit = async ({ prompt }: ChatFormData) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      try {
         setError('');
         setMessages((prev) => [...prev, { content: trimmed, role: 'user' }]);
         setIsBotTyping(true);

         popAudio.play().catch(() => {});

         const { data } = await axios.post<ChatResponse>(
            'http://localhost:3000/api/chat',
            {
               prompt: trimmed,
               conversationId: conversationId.current,
            }
         );

         setMessages((prev) => [
            ...prev,
            { content: data.message, role: 'bot' },
         ]);
         notificationAudio.play().catch(() => {});
      } catch (err) {
         console.error(err);
         setError('Something went wrong, try again!');
      } finally {
         setIsBotTyping(false);
      }
   };

   return (
      <div className="flex h-full flex-col">
         <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
            <ChatMessages messages={messages} />
            {isBotTyping && <TypingIndicator />}
            {error && <p className="text-sm text-red-600">{error}</p>}
         </div>

         <div className="pt-2">
            <ChatInput onSubmit={onSubmit} />
         </div>
      </div>
   );
}
