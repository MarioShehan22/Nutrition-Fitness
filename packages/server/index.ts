import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes';
import { connectMongo } from './db/mongo';
import { llmClient } from './llm/client.ts';

await connectMongo();

const app = express();

// ✅ simplest CORS (allow Vite frontend)
app.use(
   cors({
      origin: 'http://localhost:5173',
      credentials: true,
   })
);
router.get('/api/health/openai', async (_req, res) => {
   try {
      const r = await llmClient.generateText({
         prompt: 'Say OK',
         maxTokens: 16, // ✅ must be >= 16
      });
      res.json({ ok: true, text: r.text });
   } catch (e: any) {
      const status = e?.status ?? e?.response?.status ?? 500;
      return res.status(status).json({
         ok: false,
         detail: e?.error?.message ?? e?.message ?? String(e),
         status,
      });
   }
});

app.use(express.json());
app.use(router);

app.listen(process.env.PORT || 3000, () => {
   console.log(
      `Server running on http://localhost:${process.env.PORT || 3000}`
   );
});
