
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Bot, 
  Clock, 
  Bell,
  Shield,
  Database,
  Zap
} from 'lucide-react';

interface ModelOption {
  provider: string;
  model: string;
  description: string;
  maxTokens: number;
  costPer1k: number;
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    provider: 'gemini',
    model: 'gemini-pro',
    description: 'Google Gemini Pro - Cepat dan efisien',
    maxTokens: 8192,
    costPer1k: 0.0005
  },
  {
    provider: 'gemini',
    model: 'gemini-pro-vision',
    description: 'Google Gemini Pro Vision - Dengan kemampuan visual',
    maxTokens: 8192,
    costPer1k: 0.0025
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    description: 'OpenAI GPT-4 Turbo - Paling canggih',
    maxTokens: 128000,
    costPer1k: 0.01
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    description: 'OpenAI GPT-3.5 Turbo - Hemat biaya',
    maxTokens: 16384,
    costPer1k: 0.0015
  },
  {
    provider: 'openrouter',
    model: 'auto',
    description: 'OpenRouter Auto - Pilihan otomatis terbaik',
    maxTokens: 32768,
    costPer1k: 0.002
  },
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    description: 'DeepSeek Chat - Model ekonomis',
    maxTokens: 16384,
    costPer1k: 0.0003
  }
];

const SCHEDULE_OPTIONS = [
  { value: 'disabled', label: 'Tidak Aktif' },
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' }
];

export function AIConfiguration() {
  const { toast } = useToast();
  const { preferences, loading, savePreferences } = useAIPreferences();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  }, [preferences]);

  const handlePreferenceChange = (key: string, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await savePreferences(localPreferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const getModelsByProvider = (provider: string) => {
    return AVAILABLE_MODELS.filter(model => model.provider === provider);
  };

  const getCurrentModel = () => {
    return AVAILABLE_MODELS.find(
      model => model.provider === localPreferences.preferred_provider && 
               model.model === localPreferences.preferred_model
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Konfigurasi AI
          </h3>
          <p className="text-sm text-muted-foreground">
            Atur preferensi dan pengaturan sistem AI
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={!hasChanges || loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!hasChanges || loading}
          >
            <Save className="h-4 w-4 mr-1" />
            Simpan
          </Button>
        </div>
      </div>

      {/* Provider & Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Provider & Model AI
          </CardTitle>
          <CardDescription>
            Pilih provider AI dan model yang akan digunakan secara default
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider AI</Label>
              <Select 
                value={localPreferences.preferred_provider} 
                onValueChange={(value) => handlePreferenceChange('preferred_provider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Select 
                value={localPreferences.preferred_model || ''} 
                onValueChange={(value) => handlePreferenceChange('preferred_model', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih model..." />
                </SelectTrigger>
                <SelectContent>
                  {getModelsByProvider(localPreferences.preferred_provider).map(model => (
                    <SelectItem key={model.model} value={model.model}>
                      <div>
                        <div className="font-medium">{model.model}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {getCurrentModel() && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Informasi Model</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Max Tokens:</span>
                  <div className="font-medium">{getCurrentModel()?.maxTokens.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Biaya per 1K:</span>
                  <div className="font-medium">${getCurrentModel()?.costPer1k}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>
                  <div className="font-medium capitalize">{getCurrentModel()?.provider}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary">Aktif</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analisis Otomatis
          </CardTitle>
          <CardDescription>
            Konfigurasi sistem analisis otomatis untuk siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-analysis">Aktifkan Analisis Otomatis</Label>
              <p className="text-sm text-muted-foreground">
                Sistem akan menganalisis data siswa secara berkala
              </p>
            </div>
            <Switch
              id="auto-analysis"
              checked={localPreferences.auto_analysis_enabled}
              onCheckedChange={(checked) => handlePreferenceChange('auto_analysis_enabled', checked)}
            />
          </div>

          {localPreferences.auto_analysis_enabled && (
            <div>
              <Label htmlFor="schedule">Jadwal Analisis</Label>
              <Select 
                value={localPreferences.auto_analysis_schedule} 
                onValueChange={(value) => handlePreferenceChange('auto_analysis_schedule', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi AI
          </CardTitle>
          <CardDescription>
            Atur preferensi notifikasi untuk aktivitas AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Aktifkan Notifikasi</Label>
              <p className="text-sm text-muted-foreground">
                Terima notifikasi tentang hasil analisis dan rekomendasi AI
              </p>
            </div>
            <Switch
              id="notifications"
              checked={localPreferences.notification_enabled}
              onCheckedChange={(checked) => handlePreferenceChange('notification_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status Sistem
          </CardTitle>
          <CardDescription>
            Informasi status dan kesehatan sistem AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="font-medium">Database</div>
              <Badge variant="secondary" className="mt-1">Terhubung</Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="font-medium">AI Service</div>
              <Badge variant="secondary" className="mt-1">Online</Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Bot className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="font-medium">API Keys</div>
              <Badge variant="secondary" className="mt-1">Terkonfigurasi</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Lanjutan</CardTitle>
          <CardDescription>
            Konfigurasi tambahan untuk penggunaan AI yang optimal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="max-tokens">Maksimal Token per Request</Label>
            <Input
              id="max-tokens"
              type="number"
              min="100"
              max="32000"
              defaultValue="2000"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Batasi jumlah token yang digunakan per permintaan AI (100-32000)
            </p>
          </div>

          <div>
            <Label htmlFor="temperature">Temperature (Kreativitas)</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="1"
              step="0.1"
              defaultValue="0.7"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kontrol kreativitas respons AI (0.0 = konsisten, 1.0 = kreatif)
            </p>
          </div>

          <div>
            <Label htmlFor="system-prompt">System Prompt Kustom</Label>
            <Textarea
              id="system-prompt"
              placeholder="Masukkan instruksi khusus untuk AI..."
              className="mt-1 min-h-20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Instruksi tambahan yang akan diberikan ke AI untuk semua percakapan
            </p>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Anda memiliki perubahan yang belum disimpan. Klik "Simpan" untuk menyimpan konfigurasi.
          </p>
        </div>
      )}
    </div>
  );
}
