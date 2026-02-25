import type { RequestHandler } from 'express';
import { chatService } from '../services/chat.service';
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

      const response = await chatService.sendMessage(prompt, convId);

      res.status(200).json({
         id: response.id,
         message: response.message,
         conversationId: convId,
      });
      return;
   } catch {
      res.status(500).json({ error: 'Failed to generate a response.' });
      return;
   }
};
