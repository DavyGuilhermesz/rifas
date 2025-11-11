import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await checkUserProfile(session.user.id);
    }
    setLoading(false);
  };

  const checkUserProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setUser({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        is_admin: profile.is_admin,
      });
      setIsAdmin(profile.is_admin === true);
    }
  };

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success('Código enviado para seu email!');
    return true;
  };

  const verifyOtpAndSetPassword = async (email: string, token: string, password?: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      toast.error(error.message);
      return false;
    }

    if (password && data.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        toast.error(updateError.message);
        return false;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          username: data.user.email!.split('@')[0],
          is_admin: data.user.email === 'davyvlog9@gmail.com',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    toast.success('Login realizado com sucesso!');
    return true;
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success('Login realizado com sucesso!');
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    toast.success('Logout realizado com sucesso!');
  };

  return {
    user,
    loading,
    isAdmin,
    sendOtp,
    verifyOtpAndSetPassword,
    signInWithPassword,
    signOut,
  };
}
