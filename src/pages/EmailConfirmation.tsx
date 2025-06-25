import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type ConfirmationState = 'loading' | 'success' | 'error' | 'expired';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmationState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmailChange = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || type !== 'email_change') {
        setState('error');
        setMessage('Invalid confirmation link. Please request a new email change.');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email_change'
        });

        if (error) {
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setState('expired');
            setMessage('This confirmation link has expired. Please request a new email change.');
          } else {
            setState('error');
            setMessage(`Failed to confirm email change: ${error.message}`);
          }
          return;
        }

        if (data.user) {
          setState('success');
          setMessage('Your email address has been successfully updated!');
          toast.success('Email address updated successfully!');
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setState('error');
          setMessage('Failed to confirm email change. Please try again.');
        }
      } catch (error) {
        setState('error');
        setMessage('An unexpected error occurred. Please try again.');
        console.error('Email confirmation error:', error);
      }
    };

    confirmEmailChange();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (state) {
      case 'loading':
        return 'Confirming Email Change...';
      case 'success':
        return 'Email Confirmed!';
      case 'expired':
        return 'Link Expired';
      case 'error':
        return 'Confirmation Failed';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {state === 'success' && (
            <p className="text-sm text-gray-600 mb-4">
              You will be redirected to the home page in a few seconds.
            </p>
          )}
          {(state === 'error' || state === 'expired') && (
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/auth')} 
                variant="outline" 
                className="w-full"
              >
                Go to Sign In
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          )}
          {state === 'loading' && (
            <p className="text-sm text-gray-600">
              Please wait while we confirm your email change...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;