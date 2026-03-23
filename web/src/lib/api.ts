const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...rest } = init ?? {};
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Resources ───────────────────────────────────────────────────────────────
export const api = {
  contact: {
    send: (data: { name: string; email: string; subject?: string; message: string }) =>
      request<void>('/contact', { method: 'POST', body: JSON.stringify(data) }),
  },
  topics: {
    list: (type?: 'topic' | 'theme') =>
      request<Topic[]>(`/topics${type ? `?type=${type}` : ''}`),
  },
  resources: {
    list: (params?: Record<string, string | number>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<PaginatedResponse<Resource>>(`/resources${q ? `?${q}` : ''}`);
    },
    featured: (limit = 6) => request<Resource[]>(`/resources/featured?limit=${limit}`),
    get: (slug: string) => request<Resource>(`/resources/${slug}`),
  },
  questions: {
    list: (params?: Record<string, string | number>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<PaginatedResponse<Question>>(`/questions${q ? `?${q}` : ''}`);
    },
    get: (slug: string) => request<Question>(`/questions/${slug}`),
    submit: (data: SubmitQuestionPayload) =>
      request<Question>('/questions', { method: 'POST', body: JSON.stringify(data) }),
    mine: (token: string, params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<PaginatedResponse<Question>>(`/questions/mine${q ? `?${q}` : ''}`, { token });
    },
    getComments: (id: string) =>
      request<QuestionComment[]>(`/questions/${id}/comments`),
    addComment: (id: string, body: string, token: string) =>
      request<QuestionComment>(`/questions/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
        token,
      }),
    deleteComment: (questionId: string, commentId: string, token: string) =>
      request<void>(`/questions/${questionId}/comments/${commentId}`, { method: 'DELETE', token }),
    toggleReaction: (questionId: string, commentId: string, emoji: string, token: string) =>
      request<{ added: boolean }>(`/questions/${questionId}/comments/${commentId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
        token,
      }),
    answer: (id: string, data: { answer: string; tags?: string[]; featured?: boolean; category?: QuestionCategory; topicId?: string }, token: string) =>
      request<Question>(`/questions/${id}/answer`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    lock: (id: string, locked: boolean, token: string) =>
      request<Question>(`/questions/${id}/lock`, {
        method: 'PATCH',
        body: JSON.stringify({ locked }),
        token,
      }),
    toggleContributions: (id: string, allow: boolean, token: string) =>
      request<Question>(`/questions/${id}/contributions`, {
        method: 'PATCH',
        body: JSON.stringify({ allow }),
        token,
      }),
    remove: (id: string, token: string) =>
      request<void>(`/questions/${id}`, { method: 'DELETE', token }),
    reject: (id: string, token: string) =>
      request<Question>(`/questions/${id}/reject`, { method: 'PATCH', token }),
    hide: (id: string, hidden: boolean, token: string) =>
      request<Question>(`/questions/${id}/hide`, { method: 'PATCH', body: JSON.stringify({ hidden }), token }),
    hideComment: (questionId: string, commentId: string, hidden: boolean, token: string) =>
      request<QuestionComment>(`/questions/${questionId}/comments/${commentId}/hide`, {
        method: 'PATCH', body: JSON.stringify({ hidden }), token,
      }),
    getCommentsAdmin: (id: string, token: string) =>
      request<QuestionComment[]>(`/questions/${id}/comments/admin`, { token }),
  },
  blog: {
    list: (params?: Record<string, string | number>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<PaginatedResponse<BlogPost>>(`/blog${q ? `?${q}` : ''}`);
    },
    recent: (limit = 3) => request<BlogPost[]>(`/blog/recent?limit=${limit}`),
    get: (slug: string) => request<BlogPost>(`/blog/${slug}`),
    tags: () => request<string[]>('/blog/tags'),
  },
  sessions: {
    list: (status?: string) => {
      const q = status ? `?status=${status}` : '';
      return request<LiveSession[]>(`/sessions${q}`);
    },
    getLive: () => request<LiveSession | null>('/sessions/live'),
    getNext: () => request<LiveSession | null>('/sessions/next'),
    get: (id: string) => request<LiveSession>(`/sessions/${id}`),
    getMessages: (id: string, token: string) =>
      request<ChatMessageData[]>(`/sessions/${id}/messages`, { token }),
    create: (data: { title: string; description?: string; scheduledAt?: string; posterUrl?: string; link?: string }, token: string) =>
      request<LiveSession>('/sessions', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: { title?: string; description?: string; scheduledAt?: string; posterUrl?: string; link?: string }, token: string) =>
      request<LiveSession>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
    start: (id: string, token: string) =>
      request<LiveSession>(`/sessions/${id}/start`, { method: 'PATCH', token }),
    end: (id: string, token: string) =>
      request<LiveSession>(`/sessions/${id}/end`, { method: 'PATCH', token }),
    remove: (id: string, token: string) =>
      request<void>(`/sessions/${id}`, { method: 'DELETE', token }),
    cancel: (id: string, token: string) =>
      request<LiveSession>(`/sessions/${id}/cancel`, { method: 'PATCH', token }),
    generate: (token: string) =>
      request<{ created: number }>('/sessions/generate', { method: 'POST', token }),
    listAll: (token: string, status?: string) => {
      const q = status ? `?status=${status}` : '';
      return request<LiveSession[]>(`/sessions/admin/all${q}`, { token });
    },
  },
  admin: {
    stats: (token: string) =>
      Promise.all([
        request<{ total: number; pending: number; answered: number }>('/questions/admin/stats', { token }),
        request<{ total: number; published: number; featured: number }>('/resources/admin/stats', { token }),
        request<{ total: number; admins: number; editors: number }>('/users/stats', { token }),
      ]).then(([questions, resources, users]) => ({ questions, resources, users })),

    questions: {
      list: (params: Record<string, string | number>, token: string) => {
        const q = new URLSearchParams(params as any).toString();
        return request<PaginatedResponse<Question>>(`/questions/admin/all${q ? `?${q}` : ''}`, { token });
      },
      getById: (id: string, token: string) =>
        request<Question>(`/questions/admin/${id}`, { token }),
    },

    resources: {
      list: (params: Record<string, string | number>, token: string) => {
        const q = new URLSearchParams(params as any).toString();
        return request<PaginatedResponse<Resource>>(`/resources/admin/all${q ? `?${q}` : ''}`, { token });
      },
      create: (data: Partial<Resource> & { title: string; description: string }, token: string) =>
        request<Resource>('/resources', { method: 'POST', body: JSON.stringify(data), token }),
      update: (id: string, data: Partial<Resource>, token: string) =>
        request<Resource>(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
      remove: (id: string, token: string) =>
        request<void>(`/resources/${id}`, { method: 'DELETE', token }),
    },

    blog: {
      list: (params: Record<string, string | number>, token: string) => {
        const q = new URLSearchParams(params as any).toString();
        return request<PaginatedResponse<BlogPost>>(`/blog/admin/all${q ? `?${q}` : ''}`, { token });
      },
      getById: (id: string, token: string) =>
        request<BlogPost>(`/blog/admin/${id}`, { token }),
      create: (data: Partial<BlogPost> & { title: string; excerpt: string; content: string }, token: string) =>
        request<BlogPost>('/blog', { method: 'POST', body: JSON.stringify(data), token }),
      update: (id: string, data: Partial<BlogPost>, token: string) =>
        request<BlogPost>(`/blog/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
      remove: (id: string, token: string) =>
        request<void>(`/blog/${id}`, { method: 'DELETE', token }),
    },

    settings: {
      get: () => request<Record<string, string>>('/settings'),
      update: (data: Record<string, string>, token: string) =>
        request<Record<string, string>>('/settings', { method: 'PATCH', body: JSON.stringify(data), token }),
    },

    social: {
      logs: (token: string, params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams(params as any).toString();
        return request<PaginatedResponse<SocialPost>>(`/social/logs${q ? `?${q}` : ''}`, { token });
      },
      test: (platform: string, token: string) =>
        request<{ ok: boolean; error?: string }>(`/social/test/${platform}`, { method: 'POST', token }),
    },

    users: {
      list: (params: Record<string, string | number>, token: string) => {
        const q = new URLSearchParams(params as any).toString();
        return request<PaginatedResponse<AdminUser>>(`/users${q ? `?${q}` : ''}`, { token });
      },
      update: (id: string, data: { role?: string }, token: string) =>
        request<AdminUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
      remove: (id: string, token: string) =>
        request<void>(`/users/${id}`, { method: 'DELETE', token }),
    },
    topics: {
      list: (token: string) => request<Topic[]>('/topics/admin/all', { token }),
      create: (data: Partial<Topic> & { name: string }, token: string) =>
        request<Topic>('/topics', { method: 'POST', body: JSON.stringify(data), token }),
      update: (id: string, data: Partial<Topic>, token: string) =>
        request<Topic>(`/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
      remove: (id: string, token: string) =>
        request<void>(`/topics/${id}`, { method: 'DELETE', token }),
    },
  },
  bookmarks: {
    toggle: (type: BookmarkType, targetId: string, token: string) =>
      request<{ bookmarked: boolean }>('/bookmarks/toggle', {
        method: 'POST',
        body: JSON.stringify({ type, targetId }),
        token,
      }),
    check: (type: BookmarkType, targetId: string, token: string) =>
      request<{ bookmarked: boolean }>(`/bookmarks/check?type=${type}&targetId=${targetId}`, { token }),
    list: (token: string, type?: BookmarkType) => {
      const q = type ? `?type=${type}` : '';
      return request<Bookmark[]>(`/bookmarks${q}`, { token });
    },
  },
  profile: {
    update: (data: { firstName?: string; middleName?: string; lastName?: string; username?: string }, token: string) =>
      request<any>('/users/me/profile', { method: 'PATCH', body: JSON.stringify(data), token }),
    changePassword: (data: { currentPassword: string; newPassword: string }, token: string) =>
      request<void>('/users/me/password', { method: 'PATCH', body: JSON.stringify(data), token }),
    deactivate: (token: string) =>
      request<void>('/users/me/deactivate', { method: 'POST', token }),
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  type: string;
  category: string;
  tags?: string[];
  featured: boolean;
  published: boolean;
  viewCount: number;
  author?: { id: string; name: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  type: 'topic' | 'theme';
  description?: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export type QuestionCategory = 'session' | 'topic' | 'theme' | 'general';

export interface Question {
  id: string;
  title: string;
  slug?: string;
  body: string;
  askerName: string;
  status: string;
  answer?: string;
  answeredAt?: string;
  tags?: string[];
  category: QuestionCategory;
  topicId?: string;
  topic?: Topic;
  sessionDate?: string;
  featured: boolean;
  anonymous: boolean;
  viewCount: number;
  locked: boolean;
  hidden: boolean;
  allowContributions: boolean;
  answeredBy?: { id: string; name: string; avatar?: string };
  createdAt: string;
}

export interface CommentReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface QuestionComment {
  id: string;
  body: string;
  questionId: string;
  authorId?: string;
  author?: { id: string; name: string; username?: string | null; avatar?: string };
  reactions: CommentReaction[];
  hidden: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  tags?: string[];
  featured: boolean;
  published: boolean;
  publishedAt?: string;
  viewCount: number;
  readingTimeMinutes: number;
  author?: { id: string; name: string; avatar?: string };
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  username?: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  platform: string;
  contentType: string;
  contentId: string;
  contentTitle: string;
  message: string;
  status: 'success' | 'failed';
  error?: string;
  postedAt: string;
}

export interface LiveSession {
  id: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  posterUrl?: string | null;
  link?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageData {
  id: string;
  sessionId: string;
  authorName: string;
  userId: string;
  body: string;
  pinned: boolean;
  replyToId?: string;
  replyTo?: { id: string; authorName: string; body: string } | null;
  reactions: Record<string, { count: number; userIds: string[] }>;
  createdAt: string;
}

export type BookmarkType = 'blog' | 'resource' | 'question';

export interface Bookmark {
  id: string;
  type: BookmarkType;
  createdAt: string;
  content: BlogPost | Resource | Question;
}

export interface SubmitQuestionPayload {
  title: string;
  body: string;
  askerName: string;
  askerEmail: string;
  tags?: string[];
  anonymous?: boolean;
  category?: QuestionCategory;
  topicId?: string;
  sessionDate?: string;
}
