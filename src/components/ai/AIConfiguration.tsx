
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { Bot, Key, Settings, Zap } from 'lucide-react';

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { value: 'gemini', label: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'] },
  { value: 'openrouter', label: 'OpenRouter', models: ['custom'] },
  { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] }
];

const ANALYSIS_SCHEDULES = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' }
];

export function AIConfiguration() {
  const { preferences, loading, savePreferences } = useAIPreferences();
  const [customModel, setCustomModel] = useState('');

  const selectedProvider = AI_PROVIDERS.find(p => p.value === preferences.preferred_provider);
  const availableModels = selectedProvider?.models || [];

  const handleProviderChange = (provider: string) => {
    savePreferences({ 
      preferred_provider: provider,
      preferred_model: '' // Reset model when provider changes
    });
  };

  const handleModelChange = (model: string) => {
    if (model === 'custom') {
      savePreferences({ preferred_model: customModel });
    } else {
      savePreferences({ preferred_model: model });
    }
  };

  const handleCustomModelSubmit = () => {
    if (customModel.trim()) {
      savePreferences({ preferred_model: customModel.trim() });
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Konfigurasi Provider AI
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
                <SelectValue placeholder="Pilih Provider AI" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map(provider => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model AI</Label>
            <Select 
              value={preferences.preferred_model || ''} 
              onValueChange={handleModelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Model AI" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Model</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(preferences.preferred_model === 'custom' || selectedProvider?.value === 'openrouter') && (
            <div className="space-y-2">
              <Label htmlFor="custom-model">Custom Model Name</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-model"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Masukkan nama model custom"
                />
                <Button onClick={handleCustomModelSubmit} size="sm">
                  Set
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Konfigurasi API Keys
          </CardTitle>
          <CardDescription>
            API keys disimpan dengan aman di Supabase Secrets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> API keys dikonfigurasi di tingkat sistem oleh administrator. 
              Hubungi admin sistem untuk mengatur atau memperbarui API keys.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Status API Keys</Label>
            <div className="space-y-2">
              {AI_PROVIDERS.map(provider => (
                <div key={provider.value} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{provider.label}</span>
                  <span className="text-xs px-2 py-1 bg-gray-200 rounded">Dikonfigurasi Sistem</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Analisis Otomatis
          </CardTitle>
          <CardDescription>
            Konfigurasi analisis otomatis untuk siswa bermasalah
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aktifkan Analisis Otomatis</Label>
              <p className="text-sm text-muted-foreground">
                AI akan menganalisis siswa dengan poin disiplin rendah secara otomatis
              </p>
            </div>
            <Switch
              checked={preferences.auto_analysis_enabled}
              onCheckedChange={(checked) => savePreferences({ auto_analysis_enabled: checked })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="schedule">Jadwal Analisis</Label>
            <Select 
              value={preferences.auto_analysis_schedule} 
              onValueChange={(schedule) => savePreferences({ auto_analysis_schedule: schedule })}
              disabled={!preferences.auto_analysis_enabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jadwal analisis" />
              </SelectTrigger>
              <SelectContent>
                {ANALYSIS_SCHEDULES.map(schedule => (
                  <SelectItem key={schedule.value} value={schedule.value}>
                    {schedule.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifikasi Rekomendasi</Label>
              <p className="text-sm text-muted-foreground">
                Terima notifikasi saat AI menghasilkan rekomendasi baru
              </p>
            </div>
            <Switch
              checked={preferences.notification_enabled}
              onCheckedChange={(checked) => savePreferences({ notification_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* General Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferensi Umum
          </CardTitle>
          <CardDescription>
            Pengaturan umum untuk fitur AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Kriteria Analisis Otomatis</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Siswa dengan skor disiplin di bawah 60 poin</li>
              <li>• Siswa dengan 3+ pelanggaran dalam sebulan terakhir</li>
              <li>• Siswa dengan tingkat kehadiran di bawah 80%</li>
              <li>• Siswa yang dilaporkan dalam kasus disiplin aktif</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Stakeholder Rekomendasi</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Wali Kelas:</strong> Rekomendasi pembinaan harian</li>
              <li>• <strong>Guru BK:</strong> Rekomendasi konseling dan intervensi</li>
              <li>• <strong>TPPK:</strong> Rekomendasi tindakan disiplin</li>
              <li>• <strong>ARPS:</strong> Rekomendasi pencegahan narkoba</li>
              <li>• <strong>P4GN:</strong> Rekomendasi anti-radikalisme</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
