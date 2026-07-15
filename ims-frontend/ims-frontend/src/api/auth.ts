import { api, unwrap } from '@/lib/api';
import type { User } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    unwrap<{ accessToken: string; user: User }>(api.post('/auth/login', { email, password })),

  logout: () => api.post('/auth/logout'),

  me: () => unwrap<User>(api.get('/auth/me')),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};
