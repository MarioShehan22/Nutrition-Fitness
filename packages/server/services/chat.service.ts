import OpenAI from 'openai';

const openrouter = new OpenAI({
   apiKey: process.env.OPENROUTER_API_KEY!,
   baseURL: 'https://openrouter.ai/api/v1',
   timeout: 60_000,
   maxRetries: 2,
   defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'NutriFit',
   },
});

export async function generateTextOpenRouter(opts: {
   model?: string;
   messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
   temperature?: number;
   maxTokens?: number;
}) {
   const resp = await openrouter.chat.completions.create({
      model:
         opts.model ??
         process.env.OPENROUTER_MODEL ??
         'meta-llama/llama-3.1-8b-instruct:free',
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: Math.max(16, opts.maxTokens ?? 200),
   });

   const text = resp.choices?.[0]?.message?.content ?? '';
   return { id: resp.id ?? 'openrouter', text };
}
