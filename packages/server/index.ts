import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes';
import { connectMongo } from './db/mongo';
import { llmClient } from './llm/client.ts';

await connectMongo();

const app = express();

app.use(
   cors({
      origin: 'http://localhost:5173',
      credentials: true,
   })
);

app.use(express.json());

app.use('/api', router);

app.listen(process.env.PORT || 3000, () => {
   console.log(
      `Server running on http://localhost:${process.env.PORT || 3000}`
   );
});
