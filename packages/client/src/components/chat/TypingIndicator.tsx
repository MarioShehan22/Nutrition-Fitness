export default function TypingIndicator() {
   return (
      <div className="flex w-fit items-center gap-1 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
         <Dot />
         <Dot className="[animation-delay:0.15s]" />
         <Dot className="[animation-delay:0.3s]" />
      </div>
   );
}

function Dot({ className }: { className?: string }) {
   return (
      <span
         className={[
            'h-2 w-2 animate-bounce rounded-full bg-slate-400',
            className ?? '',
         ].join(' ')}
      />
   );
}
