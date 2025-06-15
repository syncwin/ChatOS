
import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  guestAccess: boolean;
  setGuestAccess: (enabled: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestAccess, setGuestAccess] = useState(() => sessionStorage.getItem('guestAccess') === 'true');

  useEffect(() => {
    sessionStorage.setItem('guestAccess', String(guestAccess));
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

  const value = {
    session,
    user,
    loading,
    isGuest: !user,
    guestAccess,
    setGuestAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
