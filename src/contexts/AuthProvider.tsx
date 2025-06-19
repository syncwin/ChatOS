import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { secureGuestStorage } from '@/lib/secureStorage';

interface GuestApiKey {
  provider: string;
  api_key: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  guestAccess: boolean;
  setGuestAccess: (enabled: boolean) => void;
  guestApiKeys: GuestApiKey[];
  addGuestApiKey: (key: GuestApiKey) => void;
  deleteGuestApiKey: (provider: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestAccess, setGuestAccess] = useState(() => sessionStorage.getItem('guestAccess') === 'true');
  const [guestApiKeys, setGuestApiKeys] = useState<GuestApiKey[]>([]);

  // Load guest API keys from secure storage
  useEffect(() => {
    if (guestAccess) {
      const loadGuestKeys = async () => {
        const providers = secureGuestStorage.getStoredProviders();
        const keys: GuestApiKey[] = [];
        
        for (const provider of providers) {
          const apiKey = await secureGuestStorage.getApiKey(provider);
          if (apiKey) {
            keys.push({ provider, api_key: apiKey });
          }
        }
        
        setGuestApiKeys(keys);
      };
      
      loadGuestKeys();
    }
  }, [guestAccess]);

  useEffect(() => {
    sessionStorage.setItem('guestAccess', String(guestAccess));
    if (!guestAccess) {
      // Clear secure storage when disabling guest access
      secureGuestStorage.clearAllApiKeys();
      setGuestApiKeys([]);
    }
  }, [guestAccess]);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setGuestAccess(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setGuestAccess(false);
        }
        setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const addGuestApiKey = async (key: GuestApiKey) => {
    // Store in secure storage
    await secureGuestStorage.storeApiKey(key.provider, key.api_key);
    
    // Update local state
    setGuestApiKeys(prev => {
      const existing = prev.find(k => k.provider === key.provider);
      if (existing) {
        return prev.map(k => k.provider === key.provider ? key : k);
      }
      return [...prev, key];
    });
  };

  const deleteGuestApiKey = (provider: string) => {
    // Remove from secure storage
    secureGuestStorage.removeApiKey(provider);
    
    // Update local state
    setGuestApiKeys(prev => prev.filter(k => k.provider !== provider));
  };

  const value = {
    session,
    user,
    loading,
    isGuest: guestAccess && !user,
    guestAccess,
    setGuestAccess,
    guestApiKeys,
    addGuestApiKey,
    deleteGuestApiKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
