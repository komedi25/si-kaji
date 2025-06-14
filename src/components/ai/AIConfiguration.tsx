
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { Settings, Brain, Clock, Bell, Save, Info } from 'lucide-react';

export function AIConfiguration() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const { preferences, savePreferences, loading } = useAIPreferences();
  const [config, setConfig] = useState({
    preferred_provider: 'gemini',
    preferred_model: '',
    auto_analysis_enabled: false,
    auto_analysis_schedule: 'weekly',
    notification_enabled: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setConfig({
        preferred_provider: preferences.preferred_provider || 'gemini',
        preferred_model: preferences.preferred_model || '',
        auto_analysis_enabled: preferences.auto_analysis_enabled || false,
        auto_analysis_schedule: preferences.auto_analysis_schedule || 'weekly',
        notification_enabled: preferences.notification_enabled !== false
      });
    }
  }, [preferences]);

  if (!hasRole('admin')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Hanya Admin yang dapat mengubah konfigurasi AI.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      await savePreferences(config);
      toast({
        title: "Berhasil",
        description: "Konfigurasi AI berhasil disimpan"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan konfigurasi AI",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getModelOptions = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4o-mini', label: 'GPT-4O Mini (Recommended)' },
          { value: 'gpt-4o', label: 'GPT-4O' }
        ];
      case 'gemini':
        return [
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Gratis)' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
        ];
      case 'openrouter':
        return [
          { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
          { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
          { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' }
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
    return <div>Memuat konfigurasi...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Konfigurasi AI
          </CardTitle>
          <CardDescription>
            Atur preferensi dan pengaturan sistem AI untuk sekolah
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider AI</Label>
            <Select 
              value={config.preferred_provider} 
              onValueChange={(value) => handleConfigChange('preferred_provider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih provider AI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini (Gratis)</SelectItem>
                <SelectItem value="openai">OpenAI GPT</SelectItem>
                <SelectItem value="openrouter">OpenRouter (Multi-Model)</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Gemini adalah pilihan terbaik untuk penggunaan gratis dengan kuota yang besar
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model AI</Label>
            <Select 
              value={config.preferred_model} 
              onValueChange={(value) => handleConfigChange('preferred_model', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih model AI" />
              </SelectTrigger>
              <SelectContent>
                {getModelOptions(config.preferred_provider).map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Model yang dipilih akan digunakan untuk semua analisis AI
            </p>
          </div>

          {/* Auto Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-analysis">Analisis Otomatis</Label>
                <p className="text-xs text-muted-foreground">
                  Aktifkan analisis otomatis perilaku siswa secara berkala
                </p>
              </div>
              <Switch
                id="auto-analysis"
                checked={config.auto_analysis_enabled}
                onCheckedChange={(checked) => handleConfigChange('auto_analysis_enabled', checked)}
              />
            </div>

            {config.auto_analysis_enabled && (
              <div className="space-y-2">
                <Label htmlFor="schedule">Jadwal Analisis</Label>
                <Select 
                  value={config.auto_analysis_schedule} 
                  onValueChange={(value) => handleConfigChange('auto_analysis_schedule', value)}
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
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifikasi AI</Label>
              <p className="text-xs text-muted-foreground">
                Terima notifikasi ketika ada rekomendasi baru dari AI
              </p>
            </div>
            <Switch
              id="notifications"
              checked={config.notification_enabled}
              onCheckedChange={(checked) => handleConfigChange('notification_enabled', checked)}
            />
          </div>

          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips:</strong> Gunakan Google Gemini untuk penggunaan gratis dengan performa yang baik. 
              OpenAI memberikan hasil terbaik namun berbayar. OpenRouter memberikan akses ke berbagai model dengan harga kompetitif.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button 
              onClick={saveConfiguration} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Panduan Penggunaan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">Google Gemini (Gratis)</h4>
              <p className="text-xs text-muted-foreground">
                • Gratis dengan kuota besar (1500 request/hari)
                • Performa baik untuk analisis teks
                • Mendukung bahasa Indonesia dengan baik
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">OpenAI GPT</h4>
              <p className="text-xs text-muted-foreground">
                • Hasil analisis terbaik dan paling akurat
                • Berbayar per token (~$0.15-0.6 per 1000 token)
                • Mendukung reasoning yang kompleks
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">OpenRouter</h4>
              <p className="text-xs text-muted-foreground">
                • Akses ke berbagai model AI dalam satu platform
                • Harga kompetitif dan fleksibel
                • Pilihan model gratis tersedia
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">DeepSeek</h4>
              <p className="text-xs text-muted-foreground">
                • Model AI dari China dengan performa baik
                • Harga sangat terjangkau
                • Cocok untuk analisis data terstruktur
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
