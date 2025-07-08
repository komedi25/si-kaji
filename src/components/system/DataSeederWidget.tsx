import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, CheckCircle, AlertCircle, 
  RefreshCw, Loader2, Download 
} from 'lucide-react';
import { seedDemoData, checkDemoDataExists } from '@/utils/dataSeeder';

export const DataSeederWidget = () => {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    checkExistingData();
  }, []);

  const checkExistingData = async () => {
    try {
      const exists = await checkDemoDataExists();
      setHasData(exists);
    } catch (error) {
      console.error('Error checking data:', error);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const success = await seedDemoData();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (success) {
        toast({
          title: "✅ Data Berhasil Disemai!",
          description: "Data demo realistis berhasil ditambahkan ke sistem"
        });
        setHasData(true);
      } else {
        throw new Error('Seeding failed');
      }
    } catch (error) {
      console.error('Seeding error:', error);
      toast({
        title: "❌ Gagal Menyemai Data",
        description: "Terjadi kesalahan saat menambahkan data demo",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const getDataStatus = () => {
    if (hasData === null) return { status: 'checking', label: 'Memeriksa...', color: 'bg-yellow-100 text-yellow-700' };
    if (hasData) return { status: 'exists', label: 'Data Tersedia', color: 'bg-green-100 text-green-700' };
    return { status: 'empty', label: 'Data Kosong', color: 'bg-red-100 text-red-700' };
  };

  const dataStatus = getDataStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Seeder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status Data:</span>
            <Badge className={dataStatus.color}>
              {dataStatus.status === 'checking' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {dataStatus.status === 'exists' && <CheckCircle className="h-3 w-3 mr-1" />}
              {dataStatus.status === 'empty' && <AlertCircle className="h-3 w-3 mr-1" />}
              {dataStatus.label}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={checkExistingData}
            disabled={isSeeding}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isSeeding && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Menyemai data demo...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleSeedData}
            disabled={isSeeding || hasData}
            className="w-full"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyemai Data...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {hasData ? 'Data Sudah Ada' : 'Semai Data Demo'}
              </>
            )}
          </Button>
          
          {hasData && (
            <Button
              variant="outline"
              onClick={() => {
                setHasData(false);
                handleSeedData();
              }}
              disabled={isSeeding}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Semai Ulang Data
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Termasuk 5 siswa dengan data lengkap</p>
          <p>• Master data: jurusan, kelas, jenis pelanggaran</p>
          <p>• Sample: pelanggaran, prestasi, kasus, izin</p>
          <p>• Data ekstrakurikuler dan kegiatan</p>
        </div>
      </CardContent>
    </Card>
  );
};