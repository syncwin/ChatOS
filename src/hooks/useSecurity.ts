
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface SecurityEvent {
  type: 'failed_login' | 'rate_limit_exceeded' | 'invalid_input' | 'guest_key_warning';
  timestamp: number;
  details?: string;
}

export const useSecurity = () => {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  const logSecurityEvent = (type: SecurityEvent['type'], details?: string) => {
    const event: SecurityEvent = {
      type,
      timestamp: Date.now(),
      details
    };

    setSecurityEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
    
    // Log to console for monitoring (in production, this would go to a security service)
    console.warn(`Security Event: ${type}`, event);
  };

  // Monitor for suspicious activity patterns
  useEffect(() => {
    const recentFailures = securityEvents.filter(
      event => event.type === 'failed_login' && 
      Date.now() - event.timestamp < 300000 // 5 minutes
    );

    if (recentFailures.length >= 3) {
      logSecurityEvent('rate_limit_exceeded', 'Multiple failed login attempts detected');
    }
  }, [securityEvents]);

  // Session timeout warning for authenticated users
  useEffect(() => {
    if (!user) return;

    const warningTimeout = setTimeout(() => {
      console.warn('Session will expire soon. Please save your work.');
    }, 50 * 60 * 1000); // 50 minutes (assuming 60-minute session)

    return () => clearTimeout(warningTimeout);
  }, [user]);

  return {
    logSecurityEvent,
    securityEvents,
    hasRecentSecurityEvents: securityEvents.length > 0
  };
};
