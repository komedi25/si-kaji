
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Brain, Clock, Target, Zap } from 'lucide-react';

interface AIPreferences {
  preferred_provider: string;
  preferred_model: string;
  auto_analysis_enabled: boolean;
  auto_analysis_schedule: string;
  notification_enabled: boolean;
}

export function AIConfiguration() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [preferences, setPreferences] = useState<AIPreferences>({
    preferred_provider: 'gemini',
    preferred_model: 'gemini-pro',
    auto_analysis_enabled: false,
    auto_analysis_schedule: 'weekly',
    notification_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!hasRole('admin')) {
    return (
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Hanya Admin yang dapat mengakses konfigurasi AI.
        </AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading AI preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          preferred_provider: data.preferred_provider || 'gemini',
          preferred_model: data.preferred_model || 'gemini-pro',
          auto_analysis_enabled: data.auto_analysis_enabled || false,
          auto_analysis_schedule: data.auto_analysis_schedule || 'weekly',
          notification_enabled: data.notification_enabled || true
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Konfigurasi AI telah disimpan"
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan konfigurasi",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setPreferences(prev => ({
      ...prev,
      preferred_provider: provider,
      preferred_model: getDefaultModel(provider)
    }));
  };

  const getDefaultModel = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'gpt-4o-mini';
      case 'gemini':
        return 'gemini-pro';
      case 'openrouter':
        return 'meta-llama/llama-3.1-8b-instruct:free';
      case 'deepseek':
        return 'deepseek-chat';
      default:
        return 'gemini-pro';
    }
  };

  const getModelOptions = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4o', label: 'GPT-4O' },
          { value: 'gpt-4o-mini', label: 'GPT-4O Mini' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
        ];
      case 'gemini':
        return [
          { value: 'gemini-pro', label: 'Gemini Pro' },
          { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' }
        ];
      case 'openrouter':
        return [
          { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
          { value: 'microsoft/phi-3-medium-128k-instruct:free', label: 'Phi-3 Medium (Free)' },
          { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (Free)' }
        ];
      case 'deepseek':
        return [
          { value: 'deepseek-chat', label: 'DeepSeek Chat' },
          { value: 'deepseek-coder', label: 'DeepSeek Coder' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return <div>Memuat konfigurasi AI...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="automation">Otomasi</TabsTrigger>
          <TabsTrigger value="performance">Performa</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Pengaturan AI Provider
              </CardTitle>
              <CardDescription>
                Pilih provider AI dan model yang akan digunakan untuk analisis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider AI</Label>
                <Select value={preferences.preferred_provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih provider AI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini (Gratis)</SelectItem>
                    <SelectItem value="openai">OpenAI GPT</SelectItem>
                    <SelectItem value="openrouter">OpenRouter (Multi-model)</SelectItem>
                    <SelectItem value="deepseek">DeepSeek (Cost-effective)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model AI</Label>
                <Select 
                  value={preferences.preferred_model} 
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, preferred_model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih model AI" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelOptions(preferences.preferred_provider).map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Rekomendasi:</strong> Gunakan Gemini untuk analisis gratis atau OpenAI GPT-4O Mini untuk performa terbaik.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Analisis Otomatis
              </CardTitle>
              <CardDescription>
                Atur kapan AI akan melakukan analisis otomatis terhadap data siswa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aktifkan Analisis Otomatis</Label>
                  <p className="text-sm text-muted-foreground">
                    AI akan menganalisis data siswa secara berkala
                  </p>
                </div>
                <Switch
                  checked={preferences.auto_analysis_enabled}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, auto_analysis_enabled: checked }))
                  }
                />
              </div>

              {preferences.auto_analysis_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="schedule">Jadwal Analisis</Label>
                  <Select 
                    value={preferences.auto_analysis_schedule} 
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, auto_analysis_schedule: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jadwal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi AI</Label>
                  <p className="text-sm text-muted-foreground">
                    Terima notifikasi ketika AI menghasilkan rekomendasi baru
                  </p>
                </div>
                <Switch
                  checked={preferences.notification_enabled}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, notification_enabled: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Optimasi Performa
              </CardTitle>
              <CardDescription>
                Pengaturan untuk mengoptimalkan performa AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Tips Performa:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Gunakan Gemini untuk analisis rutin (gratis)</li>
                    <li>• Gunakan GPT-4O untuk analisis kompleks</li>
                    <li>• OpenRouter memberikan akses ke berbagai model</li>
                    <li>• DeepSeek cost-effective untuk volume tinggi</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Status Provider</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Google Gemini</span>
                    <span className="text-green-600">Tersedia (Gratis)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OpenAI GPT</span>
                    <span className="text-yellow-600">Perlu API Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OpenRouter</span>
                    <span className="text-yellow-600">Perlu API Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DeepSeek</span>
                    <span className="text-yellow-600">Perlu API Key</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </Button>
      </div>
    </div>
  );
}
