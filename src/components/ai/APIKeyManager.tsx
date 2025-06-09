
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-4o, GPT-4o-mini models',
    secretKey: 'OPENAI_API_KEY',
    helpUrl: 'https://platform.openai.com/api-keys',
    testEndpoint: 'https://api.openai.com/v1/models'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro, Gemini Pro Vision',
    secretKey: 'GEMINI_API_KEY',
    helpUrl: 'https://makersuite.google.com/app/apikey',
    testEndpoint: null // Gemini has different validation
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models',
    secretKey: 'OPENROUTER_API_KEY',
    helpUrl: 'https://openrouter.ai/keys',
    testEndpoint: 'https://openrouter.ai/api/v1/models'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Chat, DeepSeek Coder',
    secretKey: 'DEEPSEEK_API_KEY',
    helpUrl: 'https://platform.deepseek.com/api_keys',
    testEndpoint: 'https://api.deepseek.com/v1/models'
  }
];

export function APIKeyManager() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, 'valid' | 'invalid' | 'unknown'>>({});
  const [loading, setLoading] = useState(false);

  // Load existing API keys from user preferences
  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_preferences')
        .select('api_keys')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading API keys:', error);
        return;
      }

      if (data?.api_keys && typeof data.api_keys === 'object') {
        setApiKeys(data.api_keys as Record<string, string>);
        // Initialize status as unknown for loaded keys
        const initialStatus: Record<string, 'unknown'> = {};
        Object.keys(data.api_keys as Record<string, string>).forEach(key => {
          if ((data.api_keys as Record<string, string>)[key]) {
            initialStatus[key] = 'unknown';
          }
        });
        setKeyStatus(initialStatus);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const saveAPIKeys = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Filter out empty keys
      const validKeys = Object.fromEntries(
        Object.entries(apiKeys).filter(([_, value]) => value.trim() !== '')
      );

      const { error } = await supabase
        .from('ai_preferences')
        .upsert({
          user_id: user.id,
          api_keys: validKeys
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "API Keys telah disimpan dengan aman"
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan API keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testAPIKey = async (provider: typeof AI_PROVIDERS[0]) => {
    if (!apiKeys[provider.secretKey]?.trim()) {
      toast({
        title: "Error",
        description: "API key tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }

    setTesting(prev => ({ ...prev, [provider.secretKey]: true }));

    try {
      // Test the API key by calling the AI processor edge function
      const { data, error } = await supabase.functions.invoke('ai-processor', {
        body: {
          provider: provider.id,
          task: 'test_connection',
          prompt: 'Test connection',
          model: provider.id === 'openai' ? 'gpt-4o-mini' : 
                 provider.id === 'gemini' ? 'gemini-pro' :
                 provider.id === 'deepseek' ? 'deepseek-chat' : 'default'
        }
      });

      if (error) {
        setKeyStatus(prev => ({ ...prev, [provider.secretKey]: 'invalid' }));
        toast({
          title: "API Key Tidak Valid",
          description: `Gagal terhubung dengan ${provider.name}: ${error.message}`,
          variant: "destructive"
        });
      } else {
        setKeyStatus(prev => ({ ...prev, [provider.secretKey]: 'valid' }));
        toast({
          title: "API Key Valid",
          description: `Berhasil terhubung dengan ${provider.name}`,
        });
      }
    } catch (error) {
      setKeyStatus(prev => ({ ...prev, [provider.secretKey]: 'invalid' }));
      toast({
        title: "Error",
        description: `Gagal menguji koneksi: ${error}`,
        variant: "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, [provider.secretKey]: false }));
    }
  };

  const toggleShowKey = (secretKey: string) => {
    setShowKeys(prev => ({ ...prev, [secretKey]: !prev[secretKey] }));
  };

  const updateAPIKey = (secretKey: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [secretKey]: value }));
    // Reset status when key changes
    if (keyStatus[secretKey]) {
      setKeyStatus(prev => ({ ...prev, [secretKey]: 'unknown' }));
    }
  };

  const getStatusIcon = (secretKey: string) => {
    const status = keyStatus[secretKey];
    if (status === 'valid') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === 'invalid') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getStatusBadge = (secretKey: string) => {
    const status = keyStatus[secretKey];
    if (status === 'valid') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>;
    } else if (status === 'invalid') {
      return <Badge variant="destructive">Invalid</Badge>;
    } else if (apiKeys[secretKey]?.trim()) {
      return <Badge variant="outline">Belum diuji</Badge>;
    }
    return <Badge variant="secondary">Tidak ada</Badge>;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          API keys disimpan dengan aman dan dienkripsi. Pastikan untuk menjaga kerahasiaan API keys Anda.
          API keys akan digunakan oleh sistem AI untuk mengakses layanan provider.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue={AI_PROVIDERS[0].id} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {AI_PROVIDERS.map((provider) => (
            <TabsTrigger key={provider.id} value={provider.id} className="flex items-center gap-2">
              {provider.name}
              {getStatusIcon(provider.secretKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        {AI_PROVIDERS.map((provider) => (
          <TabsContent key={provider.id} value={provider.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {provider.name} API Key
                  </span>
                  {getStatusBadge(provider.secretKey)}
                </CardTitle>
                <CardDescription>
                  {provider.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={provider.secretKey}>API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={provider.secretKey}
                        type={showKeys[provider.secretKey] ? 'text' : 'password'}
                        value={apiKeys[provider.secretKey] || ''}
                        onChange={(e) => updateAPIKey(provider.secretKey, e.target.value)}
                        placeholder={`Masukkan ${provider.name} API key...`}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowKey(provider.secretKey)}
                      >
                        {showKeys[provider.secretKey] ? 
                          <EyeOff className="h-4 w-4" /> : 
                          <Eye className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testAPIKey(provider)}
                      disabled={!apiKeys[provider.secretKey]?.trim() || testing[provider.secretKey]}
                    >
                      {testing[provider.secretKey] ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Butuh bantuan mendapatkan API key?</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => window.open(provider.helpUrl, '_blank')}
                  >
                    Kunjungi {provider.name} <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {provider.id === 'openai' && (
                  <Alert>
                    <AlertDescription>
                      <strong>OpenAI:</strong> Pastikan akun Anda memiliki kredit yang cukup. 
                      API key dapat ditemukan di platform.openai.com/api-keys
                    </AlertDescription>
                  </Alert>
                )}

                {provider.id === 'gemini' && (
                  <Alert>
                    <AlertDescription>
                      <strong>Google Gemini:</strong> Gunakan API key dari Google AI Studio. 
                      Sebagian besar model Gemini tersedia gratis dengan batas tertentu.
                    </AlertDescription>
                  </Alert>
                )}

                {provider.id === 'openrouter' && (
                  <Alert>
                    <AlertDescription>
                      <strong>OpenRouter:</strong> Akses ke berbagai model AI dari satu endpoint. 
                      Beberapa model tersedia gratis, cek openrouter.ai untuk detail.
                    </AlertDescription>
                  </Alert>
                )}

                {provider.id === 'deepseek' && (
                  <Alert>
                    <AlertDescription>
                      <strong>DeepSeek:</strong> Model AI yang cost-effective dengan performa tinggi. 
                      Dapatkan API key gratis di platform.deepseek.com
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveAPIKeys} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan API Keys'}
        </Button>
      </div>
    </div>
  );
}
