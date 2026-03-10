import type { KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { FaArrowUp } from 'react-icons/fa';
import { Button } from '../ui/button';

export type ChatFormData = {
   prompt: string;
};

type Props = {
   onSubmit: (data: ChatFormData) => void;
};

export default function ChatInput({ onSubmit }: Props) {
   const { register, handleSubmit, reset, formState } = useForm<ChatFormData>({
      mode: 'onChange',
      defaultValues: { prompt: '' },
   });

   const submit = handleSubmit((data) => {
      onSubmit({ prompt: data.prompt });
      reset({ prompt: '' });
   });

   const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         submit();
      }
   };

   return (
      <form
         onSubmit={submit}
         onKeyDown={handleKeyDown}
         className="flex items-end gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
      >
         <textarea
            {...register('prompt', {
               required: true,
               validate: (v) => v.trim().length > 0,
            })}
            rows={1}
            className="min-h-[44px] w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Ask anything…"
            maxLength={1000}
         />

         <Button
            type="submit"
            disabled={!formState.isValid || formState.isSubmitting}
            className="h-10 w-10 rounded-full p-0"
         >
            <FaArrowUp />
         </Button>
      </form>
   );
}
