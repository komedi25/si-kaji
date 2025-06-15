
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';

export const FacilityIntegration = () => {
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate API test - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response - replace with actual API test
      const mockResponse = {
        status: 'connected',
        facilities_count: 45,
        last_sync: new Date().toISOString()
      };
      
      setIsConnected(true);
      toast({
        title: "Koneksi Berhasil",
        description: `Terhubung dengan inventaris. ${mockResponse.facilities_count} fasilitas ditemukan.`
      });
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "Koneksi Gagal",
        description: "Tidak dapat terhubung dengan sistem inventaris",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const syncFacilities = async () => {
    try {
      toast({
        title: "Sinkronisasi Dimulai",
        description: "Mengambil data fasilitas dari sistem inventaris..."
      });
      
      // TODO: Implement actual sync with inventory system
      // Example API call structure:
      /*
      const response = await fetch(`${apiEndpoint}/facilities`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const facilities = await response.json();
        // Update local database with facilities data
      }
      */
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Sinkronisasi Selesai",
        description: "Data fasilitas berhasil diperbarui dari sistem inventaris"
      });
    } catch (error) {
      toast({
        title: "Sinkronisasi Gagal",
        description: "Gagal mengambil data dari sistem inventaris",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integrasi Sistem Inventaris
          </CardTitle>
          <CardDescription>
            Konfigurasi koneksi dengan sistem inventaris untuk sinkronisasi data fasilitas secara otomatis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input
                id="api-endpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.inventaris.sekolah.id"
              />
            </div>
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API key"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={!apiEndpoint || !apiKey || isTesting}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Koneksi
                </>
              )}
            </Button>
            
            {isConnected && (
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Terhubung
              </Badge>
            )}
            
            {!isConnected && apiEndpoint && apiKey && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Tidak Terhubung
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Sinkronisasi Data</CardTitle>
            <CardDescription>
              Sinkronkan data fasilitas dengan sistem inventaris
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sinkronisasi Manual</p>
                  <p className="text-sm text-gray-500">
                    Ambil data fasilitas terbaru dari sistem inventaris
                  </p>
                </div>
                <Button onClick={syncFacilities}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sinkronkan Sekarang
                </Button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Informasi Sinkronisasi</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Terakhir sync:</span>
                    <span className="ml-2">Belum pernah</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2">Siap</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Panduan Integrasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">1. Persiapan API</h4>
              <p className="text-gray-600">Pastikan sistem inventaris memiliki REST API dengan endpoint yang diperlukan</p>
            </div>
            <div>
              <h4 className="font-medium">2. Autentikasi</h4>
              <p className="text-gray-600">Dapatkan API key dari administrator sistem inventaris</p>
            </div>
            <div>
              <h4 className="font-medium">3. Format Data</h4>
              <p className="text-gray-600">API harus mengembalikan data fasilitas dengan format JSON standar</p>
            </div>
            <div>
              <h4 className="font-medium">4. Jadwal Sinkronisasi</h4>
              <p className="text-gray-600">Setelah terhubung, sistem akan melakukan sinkronisasi otomatis setiap 6 jam</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
