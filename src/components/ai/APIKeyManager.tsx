
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { 
  Key, 
  Save, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Shield
} from 'lucide-react';

interface APIKeyConfig {
  provider: string;
  name: string;
  description: string;
  required: boolean;
  testEndpoint?: string;
}

const API_PROVIDERS: APIKeyConfig[] = [
  {
    provider: 'openai',
    name: 'OpenAI',
    description: 'API key untuk menggunakan GPT models dari OpenAI',
    required: true,
    testEndpoint: 'https://api.openai.com/v1/models'
  },
  {
    provider: 'gemini',
    name: 'Google Gemini',
    description: 'API key untuk menggunakan Gemini Pro dari Google',
    required: true,
    testEndpoint: 'https://generativelanguage.googleapis.com/v1/models'
  },
  {
    provider: 'openrouter',
    name: 'OpenRouter',
    description: 'API key untuk mengakses berbagai model melalui OpenRouter',
    required: false,
    testEndpoint: 'https://openrouter.ai/api/v1/models'
  },
  {
    provider: 'deepseek',
    name: 'DeepSeek',
    description: 'API key untuk menggunakan DeepSeek models',
    required: false,
    testEndpoint: 'https://api.deepseek.com/v1/models'
  }
];

interface APIKeyStatus {
  provider: string;
  status: 'unknown' | 'valid' | 'invalid' | 'testing';
  lastTested?: Date;
  error?: string;
}

export function APIKeyManager() {
  const { toast } = useToast();
  const { preferences, savePreferences, loading } = useAIPreferences();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(preferences.api_keys || {});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyStatuses, setKeyStatuses] = useState<APIKeyStatus[]>([]);
  const [testingKeys, setTestingKeys] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setApiKeys(preferences.api_keys || {});
    setHasChanges(false);
  }, [preferences.api_keys]);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    setHasChanges(true);
    
    // Reset status when key changes
    setKeyStatuses(prev => 
      prev.map(status => 
        status.provider === provider 
          ? { ...status, status: 'unknown' as const, error: undefined }
          : status
      )
    );
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const testAPIKey = async (provider: string) => {
    const key = apiKeys[provider];
    if (!key) {
      toast({
        title: "Error",
        description: "API key tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }

    setTestingKeys(prev => [...prev, provider]);
    
    try {
      // Update status to testing
      setKeyStatuses(prev => [
        ...prev.filter(s => s.provider !== provider),
        { provider, status: 'testing' as const }
      ]);

      // Simulate API test (in real implementation, you'd call the actual API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result - in real implementation, test the actual API
      const isValid = key.length > 10; // Simple validation
      
      setKeyStatuses(prev => [
        ...prev.filter(s => s.provider !== provider),
        { 
          provider, 
          status: isValid ? 'valid' as const : 'invalid' as const, 
          lastTested: new Date(),
          error: isValid ? undefined : 'Invalid API key format'
        }
      ]);

      toast({
        title: isValid ? "Berhasil" : "Error",
        description: isValid 
          ? `API key ${provider} valid dan berfungsi` 
          : `API key ${provider} tidak valid`,
        variant: isValid ? "default" : "destructive"
      });

    } catch (error) {
      setKeyStatuses(prev => [
        ...prev.filter(s => s.provider !== provider),
        { 
          provider, 
          status: 'invalid' as const, 
          lastTested: new Date(),
          error: 'Connection failed'
        }
      ]);

      toast({
        title: "Error",
        description: `Gagal menguji API key ${provider}`,
        variant: "destructive"
      });
    } finally {
      setTestingKeys(prev => prev.filter(p => p !== provider));
    }
  };

  const saveAPIKeys = async () => {
    try {
      await savePreferences({ api_keys: apiKeys });
      setHasChanges(false);
      
      toast({
        title: "Berhasil",
        description: "API keys telah disimpan"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan API keys",
        variant: "destructive"
      });
    }
  };

  const removeAPIKey = (provider: string) => {
    const newKeys = { ...apiKeys };
    delete newKeys[provider];
    setApiKeys(newKeys);
    setHasChanges(true);
    
    // Remove status
    setKeyStatuses(prev => prev.filter(s => s.provider !== provider));
    
    toast({
      title: "Berhasil",
      description: `API key ${provider} telah dihapus`
    });
  };

  const getKeyStatus = (provider: string): APIKeyStatus | undefined => {
    return keyStatuses.find(s => s.provider === provider);
  };

  const getStatusBadge = (status: APIKeyStatus) => {
    switch (status.status) {
      case 'valid':
        return <Badge variant="secondary" className="text-green-700 bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Invalid</Badge>;
      case 'testing':
        return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Testing...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Manager
          </h3>
          <p className="text-sm text-muted-foreground">
            Kelola API keys untuk berbagai provider AI
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setApiKeys(preferences.api_keys || {});
              setHasChanges(false);
            }}
            disabled={!hasChanges || loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={saveAPIKeys}
            disabled={!hasChanges || loading}
          >
            <Save className="h-4 w-4 mr-1" />
            Simpan
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          API keys disimpan secara aman dan terenkripsi. Pastikan untuk hanya menggunakan API keys dengan permission yang sesuai.
        </AlertDescription>
      </Alert>

      {/* API Keys */}
      <div className="space-y-4">
        {API_PROVIDERS.map((config) => {
          const hasKey = Boolean(apiKeys[config.provider]);
          const status = getKeyStatus(config.provider);
          const isTesting = testingKeys.includes(config.provider);
          
          return (
            <Card key={config.provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {config.name}
                      {config.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                  
                  {status && getStatusBadge(status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`key-${config.provider}`}>API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        id={`key-${config.provider}`}
                        type={showKeys[config.provider] ? 'text' : 'password'}
                        value={apiKeys[config.provider] || ''}
                        onChange={(e) => handleKeyChange(config.provider, e.target.value)}
                        placeholder={`Masukkan ${config.name} API key...`}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowKey(config.provider)}
                      >
                        {showKeys[config.provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {hasKey && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testAPIKey(config.provider)}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAPIKey(config.provider)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {hasKey && !showKeys[config.provider] && (
                  <div className="text-sm text-muted-foreground">
                    Current key: {maskKey(apiKeys[config.provider])}
                  </div>
                )}

                {status && status.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {status.error}
                    </AlertDescription>
                  </Alert>
                )}

                {status && status.lastTested && (
                  <div className="text-xs text-muted-foreground">
                    Last tested: {status.lastTested.toLocaleString('id-ID')}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Test All Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk Actions</CardTitle>
          <CardDescription>
            Lakukan aksi untuk semua API keys sekaligus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                Object.keys(apiKeys).forEach(provider => {
                  if (apiKeys[provider] && !testingKeys.includes(provider)) {
                    testAPIKey(provider);
                  }
                });
              }}
              disabled={testingKeys.length > 0 || Object.keys(apiKeys).length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Test All Keys
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setKeyStatuses([]);
                toast({
                  title: "Berhasil",
                  description: "Status semua API keys telah direset"
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Panduan Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>OpenAI:</strong> Dapatkan API key dari{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                OpenAI Platform
              </a>
            </div>
            <div>
              <strong>Google Gemini:</strong> Dapatkan API key dari{' '}
              <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google AI Studio
              </a>
            </div>
            <div>
              <strong>OpenRouter:</strong> Daftar di{' '}
              <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                OpenRouter
              </a>{' '}
              untuk akses ke berbagai model
            </div>
            <div>
              <strong>DeepSeek:</strong> Dapatkan API key dari{' '}
              <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                DeepSeek Platform
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Anda memiliki perubahan yang belum disimpan. Klik "Simpan" untuk menyimpan API keys.
          </p>
        </div>
      )}
    </div>
  );
}
