import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AgentInfo {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthContextValue {
  agent: AgentInfo | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const DEMO_AGENTS: Record<string, AgentInfo & { password: string }> = {
  'carlos.perez@comfaguajira.com': {
    id: 'demo-1',
    nombre: 'Carlos Pérez',
    email: 'carlos.perez@comfaguajira.com',
    rol: 'admin',
    password: 'demo1234',
  },
  'laura.gutierrez@comfaguajira.com': {
    id: 'demo-2',
    nombre: 'Laura Gutiérrez',
    email: 'laura.gutierrez@comfaguajira.com',
    rol: 'asesor',
    password: 'demo1234',
  },
  'andres.morales@comfaguajira.com': {
    id: 'demo-3',
    nombre: 'Andrés Morales',
    email: 'andres.morales@comfaguajira.com',
    rol: 'asesor',
    password: 'demo1234',
  },
  'diana.suarez@comfaguajira.com': {
    id: 'demo-4',
    nombre: 'Diana Suárez',
    email: 'diana.suarez@comfaguajira.com',
    rol: 'asesor',
    password: 'demo1234',
  },
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('comfa_token');
      const storedAgent = localStorage.getItem('comfa_agent');
      if (storedToken && storedAgent) {
        setToken(storedToken);
        setAgent(JSON.parse(storedAgent) as AgentInfo);
      }
    } catch {
      // ignore parse errors
    } finally {
      setInitialized(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let apiSuccess = false;

    // 1. Try real API first
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          access_token: string;
          agent_id: string;
          agent_nombre: string;
          token_type: string;
          rol?: string;
        };
        const agentInfo: AgentInfo = {
          id: data.agent_id,
          nombre: data.agent_nombre,
          email,
          rol: data.rol ?? 'asesor',
        };
        localStorage.setItem('comfa_token', data.access_token);
        localStorage.setItem('comfa_agent', JSON.stringify(agentInfo));
        setToken(data.access_token);
        setAgent(agentInfo);
        apiSuccess = true;
      }
    } catch {
      // network error — fall through to demo check
    }

    if (apiSuccess) return;

    // 2. Check demo credentials
    const demo = DEMO_AGENTS[email.toLowerCase()];
    if (demo && demo.password === password) {
      const { password: _pw, ...agentInfo } = demo;
      void _pw;
      const mockToken = `demo-token-${demo.id}`;
      localStorage.setItem('comfa_token', mockToken);
      localStorage.setItem('comfa_agent', JSON.stringify(agentInfo));
      setToken(mockToken);
      setAgent(agentInfo);
      return;
    }

    // 3. Nothing matched
    throw new Error('Credenciales inválidas');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('comfa_token');
    localStorage.removeItem('comfa_agent');
    setToken(null);
    setAgent(null);
    window.location.href = '/login';
  }, []);

  const isAuthenticated = !!token && !!agent;
  const isAdmin = agent?.rol === 'admin';

  // Don't render children until hydration is complete
  if (!initialized) return null;

  return (
    <AuthContext.Provider value={{ agent, token, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
