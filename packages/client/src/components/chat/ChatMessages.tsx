import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export type Message = {
   content: string;
   role: 'user' | 'bot';
};

type Props = {
   messages: Message[];
};

export default function ChatMessages({ messages }: Props) {
   const lastMessageRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   const onCopyMessage = (e: React.ClipboardEvent) => {
      const selection = window.getSelection()?.toString().trim();
      if (selection) {
         e.preventDefault();
         e.clipboardData.setData('text/plain', selection);
      }
   };

   return (
      <div className="flex flex-col gap-3">
         {messages.map((message, index) => {
            const isUser = message.role === 'user';

            return (
               <div
                  key={`${message.role}-${index}`}
                  onCopy={onCopyMessage}
                  ref={index === messages.length - 1 ? lastMessageRef : null}
                  className={[
                     'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                     'prose prose-sm prose-p:my-0 prose-ul:my-2 prose-ol:my-2',
                     isUser
                        ? 'self-end bg-slate-900 text-white prose-invert'
                        : 'self-start bg-white text-slate-900 border border-slate-200',
                  ].join(' ')}
               >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
               </div>
            );
         })}
      </div>
   );
}
