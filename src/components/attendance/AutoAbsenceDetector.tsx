import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';

export const AutoAbsenceDetector: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleManualDetection = async () => {
    setIsProcessing(true);
    try {
      // Call the auto-generate function manually
      const { error } = await supabase.rpc('auto_generate_absent_records');
      
      if (error) throw error;

      setLastRun(new Date());
      toast({
        title: "Deteksi Absen Berhasil",
        description: "Sistem telah mengecek dan membuat record absen untuk siswa yang tidak presensi hari ini.",
      });
    } catch (error) {
      console.error('Error generating absent records:', error);
      toast({
        title: "Error",
        description: "Gagal menjalankan deteksi absen otomatis.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Auto-Deteksi Ketidakhadiran
        </CardTitle>
        <CardDescription>
          Sistem otomatis mendeteksi siswa yang tidak presensi dan menandai sebagai absen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Hari Kerja: Senin - Jumat</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Auto-run: 15:00 WIB</span>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Cara Kerja:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Sistem otomatis berjalan setiap hari pukul 15:00</li>
            <li>• Mengecek siswa yang belum presensi pada hari kerja</li>
            <li>• Tidak berjalan pada Sabtu, Minggu, atau hari libur</li>
            <li>• Otomatis membuat record "absen" untuk siswa yang tidak presensi</li>
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Status: Aktif
            </Badge>
            {lastRun && (
              <span className="text-sm text-muted-foreground">
                Last run: {lastRun.toLocaleString('id-ID')}
              </span>
            )}
          </div>
          
          <Button 
            onClick={handleManualDetection}
            disabled={isProcessing}
            variant="outline"
          >
            {isProcessing ? "Processing..." : "Run Manual"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};