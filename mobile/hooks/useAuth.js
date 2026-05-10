// mobile/hooks/useAuth.js
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveToken, clearToken, getToken } from '../services/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) { const me = await authAPI.me(); setUser(me); }
      } catch { await clearToken(); }
      finally { setLoading(false); }
    })();
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    await saveToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    await clearToken();
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
