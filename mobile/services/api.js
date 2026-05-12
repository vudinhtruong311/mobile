// mobile/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Đổi IP này thành IP máy tính khi test trên điện thoại thật ──
// Android emulator : http://10.0.2.2:8000
// iOS Simulator    : http://localhost:8000
// Điện thoại thật  : http://192.168.x.x:8000  (ipconfig để tìm IP)
export const API_BASE = 'http://172.20.10.4:8000';

const TOKEN_KEY = 'bibliosphere_token';

export const getToken    = ()      => AsyncStorage.getItem(TOKEN_KEY);
export const saveToken   = (token) => AsyncStorage.setItem(TOKEN_KEY, token);
export const clearToken  = ()      => AsyncStorage.removeItem(TOKEN_KEY);

// ── Core fetch ────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let msg = `Lỗi ${res.status}`;
    try { const e = await res.json(); msg = e.error || e.detail || e.message || msg; } catch {}
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:          (username, password) => apiFetch('/auth/login',    { method:'POST', body:{username,password} }),
  logout:         ()                   => apiFetch('/auth/logout',   { method:'POST' }),
  me:             ()                   => apiFetch('/auth/me'),
  updateProfile:  (data)               => apiFetch('/auth/profile',  { method:'PUT', body:data }),
  changePassword: (old_password, new_password) => apiFetch('/auth/password', { method:'PUT', body:{old_password,new_password} }),
};

// ── Books ─────────────────────────────────────────────────────
export const booksAPI = {
  getAll:   (params={}) => { const q=new URLSearchParams(params).toString(); return apiFetch(`/books${q?'?'+q:''}`); },
  getOne:   (id)        => apiFetch(`/books/${id}`),
  add:      (data)      => apiFetch('/books',     { method:'POST', body:data }),
  update:   (id, data)  => apiFetch(`/books/${id}`,{ method:'PUT',  body:data }),
  delete:   (id)        => apiFetch(`/books/${id}`,{ method:'DELETE' }),
  search:   (keyword)   => apiFetch(`/books?q=${encodeURIComponent(keyword)}`),
};

// ── Members ───────────────────────────────────────────────────
export const membersAPI = {
  getAll:   (params={}) => { const q=new URLSearchParams(params).toString(); return apiFetch(`/members${q?'?'+q:''}`); },
  getOne:   (id)        => apiFetch(`/members/${id}`),
  add:      (data)      => apiFetch('/members',      { method:'POST', body:data }),
  update:   (id, data)  => apiFetch(`/members/${id}`,{ method:'PUT',  body:data }),
  delete:   (id)        => apiFetch(`/members/${id}`,{ method:'DELETE' }),
  search:   (keyword)   => apiFetch(`/members?q=${encodeURIComponent(keyword)}`),
};

// ── Borrows ───────────────────────────────────────────────────
export const borrowsAPI = {
  getActive:  ()           => apiFetch('/borrows'),
  getOverdue: ()           => apiFetch('/borrows?overdue_only=true'),
  borrow:     (member_id, book_id, note) => apiFetch('/borrows', { method:'POST', body:{member_id,book_id,borrow_days:14,note} }),
  return:     (id)         => apiFetch(`/borrows/${id}/return`, { method:'PUT' }),
  extend:     (id)         => apiFetch(`/borrows/${id}/extend`, { method:'PUT' }),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsAPI = {
  dashboard: ()      => apiFetch('/reports/dashboard'),
  topBooks:  (n=10)  => apiFetch(`/reports/top-books?limit=${n}`),
  monthly:   (year)  => apiFetch(`/reports/monthly${year?'?year='+year:''}`),
  overdue:   ()      => apiFetch('/reports/overdue'),
};
