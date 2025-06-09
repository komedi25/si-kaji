
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { Bot, Settings, Zap, AlertTriangle, Users, FileText, Brain } from 'lucide-react';

const AI_PROVIDERS = [
  { 
    value: 'openai', 
    label: 'OpenAI', 
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    supportCustom: true
  },
  { 
    value: 'gemini', 
    label: 'Google Gemini', 
    models: ['gemini-pro', 'gemini-pro-vision'],
    supportCustom: false
  },
  { 
    value: 'openrouter', 
    label: 'OpenRouter', 
    models: [
      'meta-llama/llama-3.2-3b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'huggingfaceh4/zephyr-7b-beta:free',
      'google/gemma-7b-it:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'gryphe/mythomist-7b:free'
    ],
    supportCustom: true
  },
  { 
    value: 'deepseek', 
    label: 'DeepSeek', 
    models: ['deepseek-chat', 'deepseek-coder'],
    supportCustom: true
  }
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
      // Don't save yet, wait for custom model input
      return;
    } else {
      savePreferences({ preferred_model: model });
    }
  };

  const handleCustomModelSubmit = () => {
    if (customModel.trim()) {
      savePreferences({ preferred_model: customModel.trim() });
      setCustomModel('');
    }
  };

  const isCustomModelSelected = preferences.preferred_model && 
    !availableModels.includes(preferences.preferred_model);

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
              value={isCustomModelSelected ? 'custom' : (preferences.preferred_model || '')} 
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
                {selectedProvider?.supportCustom && (
                  <SelectItem value="custom">Custom Model</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {(isCustomModelSelected || selectedProvider?.supportCustom) && (
            <div className="space-y-2">
              <Label htmlFor="custom-model">
                {isCustomModelSelected ? 'Model Saat Ini' : 'Custom Model Name'}
              </Label>
              {isCustomModelSelected ? (
                <div className="flex gap-2">
                  <Input
                    value={preferences.preferred_model}
                    disabled
                    className="bg-gray-50"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => savePreferences({ preferred_model: '' })}
                  >
                    Reset
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="custom-model"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="Masukkan nama model custom"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomModelSubmit()}
                  />
                  <Button onClick={handleCustomModelSubmit} size="sm" disabled={!customModel.trim()}>
                    Set
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedProvider && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedProvider.label}:</strong> {
                  selectedProvider.value === 'openai' ? 'Memerlukan API key berbayar, namun memberikan hasil terbaik' :
                  selectedProvider.value === 'gemini' ? 'Tersedia gratis dengan batas penggunaan yang cukup besar' :
                  selectedProvider.value === 'openrouter' ? 'Akses ke berbagai model, beberapa gratis' :
                  selectedProvider.value === 'deepseek' ? 'Model yang sangat cost-effective dengan performa tinggi' :
                  'Provider AI terpilih'
                }
              </p>
            </div>
          )}
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
            Pengaturan umum untuk fitur AI dan stakeholder rekomendasi
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Wali Kelas</span>
                </div>
                <p className="text-xs text-green-700 ml-6">Rekomendasi pembinaan harian dan monitoring siswa</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Guru BK</span>
                </div>
                <p className="text-xs text-green-700 ml-6">Rekomendasi konseling dan intervensi psikologis</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">TPPK</span>
                </div>
                <p className="text-xs text-green-700 ml-6">Pencegahan kekerasan & penanganan kedisiplinan</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">ARPS</span>
                </div>
                <p className="text-xs text-green-700 ml-6">Pencegahan anak rentan putus sekolah</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">P4GN</span>
                </div>
                <p className="text-xs text-green-700 ml-6">Satgas anti narkotika dan pencegahan penyalahgunaan</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Fitur AI Tersedia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Analisis pola perilaku siswa</li>
                <li>• Prediksi risiko putus sekolah</li>
                <li>• Deteksi indikasi kekerasan</li>
                <li>• Monitoring kedisiplinan</li>
              </ul>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Generator surat otomatis</li>
                <li>• Ringkasan kasus siswa</li>
                <li>• Rekomendasi tindakan intervensi</li>
                <li>• Laporan analisis komprehensif</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
