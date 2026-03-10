import axios from 'axios';
import { z } from 'zod';

const NutritionPlanSchema = z.object({
   dailyCalories: z.number().int().min(1200).max(3500),
   mealTargets: z.object({
      breakfast: z.number().int(),
      snack1: z.number().int(),
      lunch: z.number().int(),
      snack2: z.number().int(),
      dinner: z.number().int(),
   }),
   plans: z
      .array(
         z.object({
            key: z.enum(['A', 'B', 'C']),
            meals: z.object({
               breakfast: z.array(z.string().min(1)),
               snack1: z.array(z.string().min(1)),
               lunch: z.array(z.string().min(1)),
               snack2: z.array(z.string().min(1)),
               dinner: z.array(z.string().min(1)),
               substitutions: z.array(z.string().min(1)).default([]),
               conditionNotes: z.string().default(''),
            }),
         })
      )
      .length(3),
});

export type NutritionPlanJson = z.infer<typeof NutritionPlanSchema>;

export type GenerateTextOptions = {
   model?: string;
   prompt: string;
   instructions?: string;
   temperature?: number;
   maxTokens?: number;
   previousResponseId?: string;
   messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
};

export type GenerateTextResult = {
   id: string;
   text: string;
   droppedThread?: boolean;
};

function extractJsonFromText(text: string) {
   const start = text.indexOf('{');
   const end = text.lastIndexOf('}');
   if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON found in model output');
   }
   return JSON.parse(text.slice(start, end + 1));
}

function openRouterHeaders() {
   const h: Record<string, string> = {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
      'Content-Type': 'application/json',
   };

   if (process.env.OPENROUTER_SITE_URL)
      h['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
   if (process.env.OPENROUTER_APP_NAME)
      h['X-Title'] = process.env.OPENROUTER_APP_NAME;

   return h;
}

async function chatCompletions(args: {
   model: string;
   messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
   temperature: number;
   maxTokens: number;
}) {
   if (!process.env.OPENROUTER_API_KEY) {
      const err: any = new Error('Missing OPENROUTER_API_KEY in environment');
      err.status = 500;
      throw err;
   }

   const { data } = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
         model: args.model,
         messages: args.messages,
         temperature: args.temperature,
         max_tokens: Math.max(16, Math.floor(args.maxTokens ?? 200)),
      },
      { headers: openRouterHeaders(), timeout: 60_000 }
   );

   const text: string = data?.choices?.[0]?.message?.content ?? '';
   const id: string = data?.id ?? `or_${Date.now()}`;

   return { id, text, raw: data };
}

export const llmClient = {
   async generateText({
      model = process.env.OPENROUTER_MODEL ||
         'meta-llama/llama-3.1-8b-instruct:free',
      prompt,
      instructions,
      temperature = 0.2,
      maxTokens = 200,
      messages,
   }: GenerateTextOptions): Promise<GenerateTextResult> {
      const inputMessages =
         messages && messages.length
            ? messages
            : [
                 ...(instructions
                    ? [{ role: 'system' as const, content: instructions }]
                    : []),
                 { role: 'user' as const, content: prompt },
              ];

      const resp = await chatCompletions({
         model,
         messages: inputMessages,
         temperature,
         maxTokens,
      });

      return { id: resp.id, text: resp.text };
   },

   async generateNutritionPlan(input: {
      model: string;
      prompt: string;
      instructions?: string;
      maxTokens?: number;
   }): Promise<{ id: string; json: NutritionPlanJson; rawText: string }> {
      const model =
         input.model ||
         process.env.OPENROUTER_MODEL ||
         'meta-llama/llama-3.1-8b-instruct:free';

      const strictPrompt = `
         Return ONLY valid JSON (no markdown, no commentary).
         The JSON must match this shape:
         {
           "dailyCalories": number (1200-3500),
           "mealTargets": { "breakfast": number, "snack1": number, "lunch": number, "snack2": number, "dinner": number },
           "plans": [
             { "key": "A", "meals": { "breakfast": string[], "snack1": string[], "lunch": string[], "snack2": string[], "dinner": string[], "substitutions": string[], "conditionNotes": string } },
             { "key": "B", "meals": { ... } },
             { "key": "C", "meals": { ... } }
           ]
         }
         USER REQUEST:
         ${input.prompt}
         `.trim();

      const messages = [
         ...(input.instructions
            ? [{ role: 'system' as const, content: input.instructions }]
            : []),
         { role: 'user' as const, content: strictPrompt },
      ];

      const resp = await chatCompletions({
         model,
         messages,
         temperature: 0.2,
         maxTokens: input.maxTokens ?? 900,
      });

      const rawText = (resp.text || '').trim();

      let parsed: any;
      try {
         parsed = JSON.parse(rawText);
      } catch {
         parsed = extractJsonFromText(rawText);
      }

      const json = NutritionPlanSchema.parse(parsed);
      return { id: resp.id, json, rawText };
   },
};
