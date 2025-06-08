
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIPreferences {
  id?: string;
  preferred_provider: string;
  preferred_model?: string;
  auto_analysis_enabled: boolean;
  auto_analysis_schedule: string;
  notification_enabled: boolean;
}

export function useAIPreferences() {
  const [preferences, setPreferences] = useState<AIPreferences>({
    preferred_provider: 'gemini',
    preferred_model: '',
    auto_analysis_enabled: false,
    auto_analysis_schedule: 'weekly',
    notification_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading AI preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: Partial<AIPreferences>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updatedPreferences = { ...preferences, ...newPreferences };

      const { error } = await supabase
        .from('ai_preferences')
        .upsert({
          user_id: user.id,
          ...updatedPreferences
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "Berhasil",
        description: "Preferensi AI telah disimpan"
      });
    } catch (error) {
      console.error('Error saving AI preferences:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan preferensi AI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  return {
    preferences,
    loading,
    savePreferences,
    loadPreferences
  };
}
