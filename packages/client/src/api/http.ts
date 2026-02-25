import axios from 'axios';

export const http = axios.create({
   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
   headers: { 'Content-Type': 'application/json' },
});

export function apiErrorMessage(e: any) {
   const data = e?.response?.data;
   if (data?.detail) return `${data.error ?? 'Error'}: ${data.detail}`;
   if (data?.error) return data.error;
   if (data?.errors) return JSON.stringify(data.errors, null, 2);
   return e?.message ?? String(e);
}
