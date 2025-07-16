import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, X, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      
      if (!hasCamera) {
        toast({
          title: "Kamera Tidak Tersedia",
          description: "Tidak ada kamera yang terdeteksi pada perangkat ini",
          variant: "destructive"
        });
        onClose();
        return;
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          onScan(result.data);
          stopScanning();
          onClose();
          toast({
            title: "QR Code Terdeteksi",
            description: "Data berhasil dipindai",
            variant: "default"
          });
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      setQrScanner(scanner);
      await scanner.start();
      setIsScanning(true);
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      toast({
        title: "Error Kamera",
        description: "Gagal mengakses kamera. Pastikan izin kamera telah diberikan.",
        variant: "destructive"
      });
      onClose();
    }
  };

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
    }
    setIsScanning(false);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scan QR Code Kartu Siswa
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 border-2 border-white border-dashed animate-pulse">
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-blue-500"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-blue-500"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-blue-500"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-blue-500"></div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white text-center py-2 rounded">
              <p className="text-xs">Arahkan kamera ke QR code pada kartu siswa</p>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Camera className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Sedang memindai...</span>
            </div>
            <p className="text-xs text-gray-500">
              QR code akan terdeteksi secara otomatis
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onClose}
          >
            Batal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};