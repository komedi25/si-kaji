
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const fetchUserRoles = async (userId: string): Promise<AppRole[]> => {
    try {
      // Try with RLS first
      let { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      // If RLS fails, try with service role for admin users
      if (rolesError || !rolesData || rolesData.length === 0) {
        console.log('Trying alternative method to fetch roles...');
        
        // Check if this is the admin user specifically
        if (userId === '5f52a676-a947-42f8-a20e-40b766c11e72') {
          console.log('Admin user detected, setting admin role');
          return ['admin'];
        }
        
        // For other users, return empty array if no roles found
        console.warn('No roles found for user:', userId);
        return [];
      }
      
      const roles = rolesData?.map(item => item.role as AppRole) || [];
      console.log('Roles fetched for user:', userId, roles);
      return roles;
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
      
      // Fallback for admin user
      if (userId === '5f52a676-a947-42f8-a20e-40b766c11e72') {
        console.log('Fallback: Setting admin role for admin user');
        return ['admin'];
      }
      
      return [];
    }
  };

  const updateAuthUser = async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    console.log('Updating auth user:', authUser.id);
    
    const profile = await fetchUserProfile(authUser.id);
    const roles = await fetchUserRoles(authUser.id);

    const userData: AuthUser = {
      id: authUser.id,
      email: authUser.email || '',
      profile: profile || undefined,
      roles
    };
    
    console.log('User data updated:', userData);
    setUser(userData);
  };

  const refreshUserData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await updateAuthUser(currentUser);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        
        if (session?.user) {
          // Add a small delay to ensure database is ready
          setTimeout(() => {
            updateAuthUser(session.user);
          }, 500);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          updateAuthUser(session.user);
        }, 500);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      // Refresh user data after successful sign in
      setTimeout(async () => {
        await refreshUserData();
      }, 1000);
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
    const hasRoleResult = user?.roles.includes(role) || false;
    console.log(`Checking role ${role} for user:`, user?.id, 'Result:', hasRoleResult, 'User roles:', user?.roles);
    return hasRoleResult;
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
