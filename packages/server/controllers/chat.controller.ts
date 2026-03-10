import type { RequestHandler } from 'express';
import { generateTextOpenRouter } from '../services/chat.service';
import z from 'zod';

const chatSchema = z.object({
   prompt: z
      .string()
      .trim()
      .min(1, 'Prompt is required.')
      .max(1000, 'Prompt is too long (max 1000 characters)'),
   conversationId: z.string().uuid().optional(),
});

const newId = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now());

export const sendMessage: RequestHandler = async (req, res) => {
   const parsed = chatSchema.safeParse(req.body);

   if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
   }

   try {
      const { prompt, conversationId } = parsed.data;
      const convId = conversationId ?? newId();

      const response = await generateTextOpenRouter({
         messages: [
            {
               role: 'system',
               content: 'You are a helpful nutrition assistant for NutriFit.',
            },
            {
               role: 'user',
               content: prompt,
            },
         ],
         temperature: 0.2,
         maxTokens: 200,
      });

      res.status(200).json({
         id: response.id,
         message: response.text,
         conversationId: convId,
      });
   } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate a response.' });
   }
};
