import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { conversationRepository } from '../repositories/conversation.repository';
import { llmClient } from '../llm/client';

// --- Resolve prompt files relative to THIS file (robust) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// adjust to your layout: this assumes prompts live at: src/llm/prompts/
const promptsDir = path.resolve(__dirname, '..', 'llm', 'prompts');
const appInfoPath = path.join(promptsDir, 'NutriFit.md');
const systemTemplatePath = path.join(promptsDir, 'nutrifit_chatbot.txt');

if (!fs.existsSync(appInfoPath)) {
   throw new Error(`NutriFit.md not found at ${appInfoPath}`);
}
if (!fs.existsSync(systemTemplatePath)) {
   throw new Error(`nutrifit_chatbot.txt not found at ${systemTemplatePath}`);
}

const appInfo = fs.readFileSync(appInfoPath, 'utf-8');
const systemTemplate = fs.readFileSync(systemTemplatePath, 'utf-8');
const systemPrompt = systemTemplate.replaceAll('{{appInfo}}', appInfo);

type ChatResponse = { id: string; message: string };

export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      // 1) Build message history
      const history = conversationRepository.getHistory(conversationId);
      const trimmed = history.slice(-12); // keep last 12 messages only

      const messages = [
         { role: 'system' as const, content: systemPrompt },
         ...trimmed.map((m) => ({ role: m.role as any, content: m.content })),
         { role: 'user' as const, content: prompt },
      ];

      // 2) Call LLM (try with previous_response_id, gracefully drop if invalid)
      const prev = conversationRepository.getLastResponseId(conversationId);
      const resp = await llmClient.generateText({
         model: 'gpt-4o-mini',
         messages,
         temperature: 0.2,
         maxTokens: 600,
         previousResponseId: prev,
      });

      // 3) Update state
      if (resp.droppedThread && prev) {
         conversationRepository.clear(conversationId); // avoid future 400s
      }
      conversationRepository.appendMessage(conversationId, 'user', prompt);
      conversationRepository.appendMessage(
         conversationId,
         'assistant',
         resp.text
      );
      conversationRepository.setLastResponseId(conversationId, resp.id);

      return { id: resp.id, message: resp.text };
   },
};
