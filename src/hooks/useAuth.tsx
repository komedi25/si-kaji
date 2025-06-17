
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, AuthUser, UserProfile } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasPermission: (permission: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      console.log('Profile fetched:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const fetchUserRoles = async (userId: string): Promise<AppRole[]> => {
    try {
      console.log('Fetching roles for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }
      
      console.log('Raw roles data from database:', data);
      const roles = data.map(item => item.role as AppRole);
      console.log('Mapped roles:', roles);
      
      // Auto-assign admin role if user email is admin@smkn1kendal.sch.id and no roles exist
      if (roles.length === 0) {
        const { data: userData } = await supabase.auth.getUser();
        console.log('No roles found, checking if admin email:', userData.user?.email);
        
        if (userData.user?.email === 'admin@smkn1kendal.sch.id') {
          console.log('Admin email detected, attempting to assign admin role');
          
          // First check if user_roles table exists and is accessible
          const { data: testData, error: testError } = await supabase
            .from('user_roles')
            .select('id')
            .limit(1);
          
          console.log('User roles table test:', { testData, testError });
          
          const { data: insertData, error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'admin',
              assigned_by: userId,
              is_active: true
            })
            .select();
          
          console.log('Role insertion result:', { insertData, roleError });
          
          if (!roleError && insertData && insertData.length > 0) {
            console.log('Admin role assigned successfully:', insertData);
            return ['admin'];
          } else {
            console.error('Error assigning admin role:', roleError);
            
            // Try to check if role was actually inserted despite error
            const { data: checkData, error: checkError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .eq('is_active', true);
            
            console.log('Role check after insertion:', { checkData, checkError });
            
            if (checkData && checkData.length > 0) {
              return checkData.map(item => item.role as AppRole);
            }
          }
        }
      }
      
      return roles;
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
      return [];
    }
  };

  const updateAuthUser = async (authUser: User | null) => {
    if (!authUser) {
      console.log('No auth user, clearing user state');
      setUser(null);
      return;
    }

    console.log('Updating auth user:', authUser.email, 'ID:', authUser.id);
    const profile = await fetchUserProfile(authUser.id);
    const roles = await fetchUserRoles(authUser.id);
    
    console.log('Final user data:', {
      id: authUser.id,
      email: authUser.email,
      profile: profile,
      roles: roles
    });

    setUser({
      id: authUser.id,
      email: authUser.email || '',
      profile: profile || undefined,
      roles
    });
  };

  const refreshUserData = async () => {
    console.log('Refreshing user data...');
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await updateAuthUser(currentUser);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'User email:', session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls to prevent deadlock
          setTimeout(() => {
            updateAuthUser(session.user);
          }, 200); // Increased timeout slightly more
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          updateAuthUser(session.user);
        }, 200);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // If sign in successful, wait a bit then refresh user data
    if (!error) {
      setTimeout(async () => {
        console.log('Sign in successful, refreshing user data...');
        await refreshUserData();
      }, 1000); // Increased timeout for better reliability
    } else {
      console.error('Sign in error:', error);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: AppRole): boolean => {
    const result = user?.roles.includes(role) || false;
    console.log(`Checking role ${role}:`, result, 'User roles:', user?.roles);
    return result;
  };

  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('has_permission', {
        _user_id: user.id,
        _permission_name: permission
      });
      
      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error in hasPermission:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasPermission,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
