import fs from 'fs';
import path from 'path';
import { conversationRepository } from '../repositories/conversation.repository';
import { llmClient } from '../llm/client';

// --- Load NutriFit instructions once (module load) ---
const promptsDir = path.resolve(process.cwd(), 'llm', 'prompts');
const appInfoPath = path.join(promptsDir, 'NutriFit.md');
const systemTemplatePath = path.join(promptsDir, 'nutrifit_chatbot.txt');

const appInfo = fs.readFileSync(appInfoPath, 'utf-8');
const systemTemplate = fs.readFileSync(systemTemplatePath, 'utf-8');
const instructions = systemTemplate.replaceAll('{{appInfo}}', appInfo);

type ChatResponse = {
   id: string;
   message: string;
};

// Public interface
export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<ChatResponse> {
      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions,
         prompt,
         temperature: 0.2,
         maxTokens: 1500,
         previousResponseId:
            conversationRepository.getLastResponseId(conversationId),
      });

      conversationRepository.setLastResponseId(conversationId, response.id);

      return {
         id: response.id,
         message: response.text,
      };
   },
};
