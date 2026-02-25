export type ConversationMessage = {
   role: 'user' | 'assistant' | 'system';
   content: string;
   ts: number;
};

const histories = new Map<string, ConversationMessage[]>();
const lastResponseIds = new Map<string, string>();

const maxMessages = Number(process.env.CONVERSATION_MAX_MESSAGES ?? 24);

function trimHistory(messages: ConversationMessage[]) {
   if (messages.length <= maxMessages) return messages;
   return messages.slice(-maxMessages);
}

export const conversationRepository = {
   getHistory(conversationId: string): ConversationMessage[] {
      return histories.get(conversationId) ?? [];
   },

   appendMessage(
      conversationId: string,
      role: ConversationMessage['role'],
      content: string
   ) {
      const existing = histories.get(conversationId) ?? [];
      histories.set(
         conversationId,
         trimHistory([...existing, { role, content, ts: Date.now() }])
      );
   },

   clear(conversationId: string) {
      histories.delete(conversationId);
      lastResponseIds.delete(conversationId);
   },

   // OpenAI Responses threading (optional)
   getLastResponseId(conversationId: string) {
      return lastResponseIds.get(conversationId);
   },
   setLastResponseId(conversationId: string, responseId: string) {
      lastResponseIds.set(conversationId, responseId);
   },
};
