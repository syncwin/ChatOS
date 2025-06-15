
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import type { AuthFormValues, ForgotPasswordFormValues } from '@/lib/schemas/auth';

const Auth = () => {
  const navigate = useNavigate();
  const { user, setGuestAccess } = useAuth();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'tabs' | 'forgot_password'>('tabs');

  // Redirect to main app if already authenticated
  useEffect(() => {
    if (user && view === 'tabs') {
      navigate('/');
    }
  }, [user, navigate, view]);

  const handleSignIn = async (values: AuthFormValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully!');
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (values: AuthFormValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.info('Check your email for the confirmation link.');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.info('Check your email for the password reset link.');
      setView('tabs');
    }
    setLoading(false);
  };

  const handleGuest = () => {
    setGuestAccess(true);
    navigate('/');
  };

  if (view === 'forgot_password') {
    return (
      <ForgotPasswordForm
        onSubmit={handlePasswordReset}
        onBack={() => setView('tabs')}
        loading={loading}
      />
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-background">
      <Tabs defaultValue="signin" className="w-[400px]">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold">InsightSeeker</h1>
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <Button variant="ghost" onClick={handleGuest} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Continue as Guest
          </Button>
        </div>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm
            onSubmit={handleSignIn}
            onForgotPassword={() => setView('forgot_password')}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="signup">
          <SignUpForm onSubmit={handleSignUp} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Auth;
