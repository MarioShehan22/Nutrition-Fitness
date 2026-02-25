import { http } from './http';

export async function sendChat(payload: { userId: string; message: string }) {
   const { data } = await http.post('/api/chat', payload);
   return data;
}
