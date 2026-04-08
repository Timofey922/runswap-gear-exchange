import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STRAVA_CLIENT_ID = '222256';
const STRAVA_REDIRECT_URI = `${window.location.origin}/strava/callback`;

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: any;
}

const STORAGE_KEY = 'pacemarket_strava_tokens';

export const useStrava = () => {
  const [tokens, setTokens] = useState<StravaTokens | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at * 1000 > Date.now()) return parsed;
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false);

  const isConnected = !!tokens && tokens.expires_at * 1000 > Date.now();

  const connect = useCallback((returnPath?: string) => {
    if (returnPath) localStorage.setItem('strava_return_path', returnPath);
    const scope = 'read,activity:read_all,profile:read_all';
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=code&scope=${scope}`;
    window.location.href = url;
  }, []);

  const exchangeCode = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('strava-auth', {
        body: { code, redirect_uri: STRAVA_REDIRECT_URI, client_id: STRAVA_CLIENT_ID },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setTokens(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStravaData = useCallback(async (endpoint: string, params?: Record<string, string>) => {
    if (!tokens) throw new Error('Not connected to Strava');
    const { data, error } = await supabase.functions.invoke('strava-proxy', {
      body: { access_token: tokens.access_token, endpoint, params },
    });
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data;
  }, [tokens]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTokens(null);
  }, []);

  return { isConnected, tokens, connect, exchangeCode, fetchStravaData, disconnect, loading };
};
