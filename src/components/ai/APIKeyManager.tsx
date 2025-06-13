import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { Eye, EyeOff, Key, Lock, Save, TestTube } from 'lucide-react';

interface APIKeyConfig {
  openai: string;
  gemini: string;
  openrouter: string;
  deepseek: string;
  [key: string]: string; // Add index signature
}

export function APIKeyManager() {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const { preferences, savePreferences, loading } = useAIPreferences();
  const [apiKeys, setApiKeys] = useState<APIKeyConfig>({
    openai: '',
    gemini: '',
    openrouter: '',
    deepseek: ''
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openai: false,
    gemini: false,
    openrouter: false,
    deepseek: false
  });
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences.api_keys) {
      setApiKeys({
        openai: preferences.api_keys.openai || '',
        gemini: preferences.api_keys.gemini || '',
        openrouter: preferences.api_keys.openrouter || '',
        deepseek: preferences.api_keys.deepseek || ''
      });
    }
  }, [preferences]);

  if (!hasRole('admin')) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Hanya Admin yang dapat mengelola API Keys.
        </AlertDescription>
      </Alert>
    );
  }

  const handleKeyChange = (provider: keyof APIKeyConfig, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const testAPIKey = async (provider: keyof APIKeyConfig) => {
    const key = apiKeys[provider];
    if (!key.trim()) {
      toast({
        title: "Error",
        description: "API Key tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }

    setTesting(prev => ({ ...prev, [provider]: true }));

    try {
      // Simple test for different providers
      let testUrl = '';
      let testHeaders: Record<string, string> = {};
      let testBody: any = {};

      switch (provider) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/models';
          testHeaders = {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          };
          break;
        case 'gemini':
          testUrl = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
          break;
        case 'openrouter':
          testUrl = 'https://openrouter.ai/api/v1/models';
          testHeaders = {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          };
          break;
        case 'deepseek':
          testUrl = 'https://api.deepseek.com/v1/models';
          testHeaders = {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          };
          break;
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: testHeaders
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: `API Key ${provider.toUpperCase()} berhasil diverifikasi`
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Error testing ${provider} API key:`, error);
      toast({
        title: "Error",
        description: `API Key ${provider.toUpperCase()} tidak valid`,
        variant: "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const saveAPIKeys = async () => {
    setSaving(true);
    try {
      await savePreferences({
        api_keys: apiKeys
      });

      toast({
        title: "Berhasil",
        description: "API Keys berhasil disimpan"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan API Keys",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const providers = [
    {
      key: 'openai' as keyof APIKeyConfig,
      name: 'OpenAI',
      description: 'API key untuk GPT models',
      placeholder: 'sk-...',
      helpUrl: 'https://platform.openai.com/api-keys'
    },
    {
      key: 'gemini' as keyof APIKeyConfig,
      name: 'Google Gemini',
      description: 'API key untuk Gemini models (Gratis)',
      placeholder: 'AI...',
      helpUrl: 'https://makersuite.google.com/app/apikey'
    },
    {
      key: 'openrouter' as keyof APIKeyConfig,
      name: 'OpenRouter',
      description: 'API key untuk multi-model access',
      placeholder: 'sk-or-...',
      helpUrl: 'https://openrouter.ai/keys'
    },
    {
      key: 'deepseek' as keyof APIKeyConfig,
      name: 'DeepSeek',
      description: 'API key untuk DeepSeek models',
      placeholder: 'sk-...',
      helpUrl: 'https://platform.deepseek.com/api_keys'
    }
  ];

  if (loading) {
    return <div>Memuat konfigurasi API...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Manajemen API Keys
          </CardTitle>
          <CardDescription>
            Kelola API keys untuk berbagai provider AI. Keys disimpan secara terenkripsi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {providers.map((provider) => (
            <div key={provider.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor={provider.key} className="font-medium">
                    {provider.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {provider.description}
                  </p>
                </div>
                <a
                  href={provider.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Dapatkan API Key
                </a>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={provider.key}
                    type={showKeys[provider.key] ? 'text' : 'password'}
                    value={apiKeys[provider.key]}
                    onChange={(e) => handleKeyChange(provider.key, e.target.value)}
                    placeholder={provider.placeholder}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => toggleShowKey(provider.key)}
                  >
                    {showKeys[provider.key] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testAPIKey(provider.key)}
                  disabled={!apiKeys[provider.key].trim() || testing[provider.key]}
                  className="flex items-center gap-1"
                >
                  <TestTube className="h-4 w-4" />
                  {testing[provider.key] ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>
          ))}

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Keamanan:</strong> API keys disimpan terenkripsi dan hanya dapat diakses oleh admin. 
              Jangan bagikan API keys kepada pihak yang tidak berwenang.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button 
              onClick={saveAPIKeys} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan API Keys'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Provider</CardTitle>
          <CardDescription>
            Status ketersediaan berbagai AI provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div key={provider.key} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    apiKeys[provider.key] ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {apiKeys[provider.key] ? 'Terkonfigurasi' : 'Belum dikonfigurasi'}
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  {provider.key === 'gemini' && (
                    <span className="text-green-600 font-medium">Gratis</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
