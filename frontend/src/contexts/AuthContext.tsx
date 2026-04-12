import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../services/api';
import { USE_MOCK_DATA } from '../lib/runtime';

export interface AgentInfo {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  organizationName?: string;
}

interface AuthContextValue {
  agent: AgentInfo | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAgent: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('comfa_token');
    const storedAgent = localStorage.getItem('comfa_agent');
    if (!storedToken || !storedAgent) {
      setInitialized(true);
      return;
    }
    try {
      const parsed = JSON.parse(storedAgent) as AgentInfo;
      setToken(storedToken);
      setAgent(parsed);
      // If organizationName is missing (old session), fetch it from the API
      if (!parsed.organizationName) {
        api.getMyAgentProfile().then((profile) => {
          if (profile.organization_name) {
            const updated = { ...parsed, organizationName: profile.organization_name };
            localStorage.setItem('comfa_agent', JSON.stringify(updated));
            setAgent(updated);
          }
        }).catch(() => undefined);
      }
    } catch {
      // ignore parse errors
    } finally {
      setInitialized(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let apiSuccess = false;

    try {
      const data = await api.login(email, password);
      if (data.access && data.user) {
        const agentInfo: AgentInfo = {
          id: data.user.id,
          nombre: [data.user.nombre, data.user.apellido].filter(Boolean).join(' ').trim() || data.user.nombre,
          email: data.user.email,
          rol: data.user.rol ?? 'asesor',
          organizationName: data.user.organization_name,
        };
        localStorage.setItem('comfa_token', data.access);
        localStorage.setItem('comfa_refresh', data.refresh);
        localStorage.setItem('comfa_agent', JSON.stringify(agentInfo));
        setToken(data.access);
        setAgent(agentInfo);
        apiSuccess = true;
      }
    } catch (err) {
      // 403 with email_not_verified → redirect to verification pending page
      if (err instanceof ApiError && err.status === 403 && err.message === 'email_not_verified') {
        sessionStorage.setItem('pending_verification_email', email);
        window.location.href = '/email-verification-pending';
        return;
      }
      // network error — fall through to demo check
    }

    if (apiSuccess) return;

    if (USE_MOCK_DATA) {
      throw new Error('El modo mock no esta habilitado en este entorno');
    }

    throw new Error('Credenciales inválidas');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('comfa_token');
    localStorage.removeItem('comfa_refresh');
    localStorage.removeItem('comfa_agent');
    setToken(null);
    setAgent(null);
    window.location.href = '/login';
  }, []);

  const refreshAgent = useCallback(async () => {
    if (!localStorage.getItem('comfa_token')) return;
    const profile = await api.getMyAgentProfile();
    const agentInfo: AgentInfo = {
      id: profile.id,
      nombre: profile.full_name?.trim() || [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim() || profile.nombre,
      email: profile.email,
      rol: profile.rol ?? 'asesor',
      organizationName: profile.organization_name ?? undefined,
    };
    localStorage.setItem('comfa_agent', JSON.stringify(agentInfo));
    setAgent(agentInfo);
  }, []);

  const isAuthenticated = !!token && !!agent;
  const isAdmin = agent?.rol === 'admin';

  // Don't render children until hydration is complete
  if (!initialized) return null;

  return (
    <AuthContext.Provider value={{ agent, token, login, logout, refreshAgent, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
