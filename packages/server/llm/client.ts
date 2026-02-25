import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

const openAIClient = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
   timeout: 60_000,
   maxRetries: 2,
});

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

// ---- Nutrition Plan Schema (Plan A/B/C) ----
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

// helpers
function extractOutputText(resp: any): string {
   if (resp?.output_text) return resp.output_text;
   const out = resp?.output ?? [];
   const texts: string[] = [];
   for (const item of out) {
      if (item?.type === 'message') {
         for (const c of item.content ?? []) {
            if (c?.type === 'output_text' && typeof c.text === 'string') {
               texts.push(c.text);
            }
         }
      }
   }
   return texts.join('\n').trim();
}
function extractJsonFromText(text: string) {
   const start = text.indexOf('{');
   const end = text.lastIndexOf('}');
   if (start === -1 || end === -1 || end <= start)
      throw new Error('No JSON found in model output');
   return JSON.parse(text.slice(start, end + 1));
}
function prevNotFound(e: any) {
   const msg =
      e?.message ||
      e?.error?.message ||
      (typeof e?.toString === 'function' ? e.toString() : '');
   return (
      e?.status === 400 && /Previous response with id .* not found/i.test(msg)
   );
}

export const llmClient = {
   // ---- Normal chat/text with history ----
   async generateText({
      model = 'gpt-4o-mini',
      prompt,
      instructions,
      temperature = 0.2,
      maxTokens = 200,
      previousResponseId,
      messages,
   }: GenerateTextOptions): Promise<GenerateTextResult> {
      const inputMessages =
         messages && messages.length
            ? messages
            : [
                 ...(instructions
                    ? [{ role: 'system', content: instructions }]
                    : []),
                 { role: 'user', content: prompt },
              ];

      try {
         const resp = await openAIClient.responses.create({
            model,
            input: inputMessages,
            temperature,
            max_output_tokens: maxTokens,
            ...(previousResponseId
               ? { previous_response_id: previousResponseId }
               : {}),
            store: false,
         });

         return { id: resp.id, text: extractOutputText(resp) };
      } catch (e: any) {
         if (previousResponseId && prevNotFound(e)) {
            const resp = await openAIClient.responses.create({
               model,
               input: inputMessages,
               temperature,
               max_output_tokens: maxTokens,
               store: false,
            });
            return {
               id: resp.id,
               text: extractOutputText(resp),
               droppedThread: true,
            };
         }
         throw e;
      }
   },

   // ---- Structured nutrition plan ----
   async generateNutritionPlan(input: {
      model: string;
      prompt: string;
      instructions?: string;
      maxTokens?: number;
   }): Promise<{ id: string; json: NutritionPlanJson; rawText: string }> {
      const responsesAny = openAIClient.responses as unknown as {
         parse?: (args: any) => Promise<any>;
      };

      if (typeof responsesAny.parse === 'function') {
         const resp = await responsesAny.parse({
            model: input.model,
            input: [
               ...(input.instructions
                  ? [{ role: 'system', content: input.instructions }]
                  : []),
               { role: 'user', content: input.prompt },
            ],
            text: {
               format: zodTextFormat(NutritionPlanSchema, 'nutrition_plan'),
            },
            max_output_tokens: input.maxTokens ?? 900,
            store: false,
         });
         return {
            id: (resp as any).id,
            json: (resp as any).output_parsed as NutritionPlanJson,
            rawText: extractOutputText(resp),
         };
      }

      // Fallback
      const resp = await openAIClient.responses.create({
         model: input.model,
         input: input.prompt,
         instructions: input.instructions,
         max_output_tokens: input.maxTokens ?? 900,
         store: false,
      });
      const rawText = extractOutputText(resp);
      const maybeJson = extractJsonFromText(rawText);
      const json = NutritionPlanSchema.parse(maybeJson);
      return { id: resp.id, json, rawText };
   },
};
