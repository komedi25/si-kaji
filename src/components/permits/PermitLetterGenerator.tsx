import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, QrCode } from 'lucide-react';

interface PermitLetterGeneratorProps {
  permitId: string;
  permitData: {
    permit_type: string;
    student_name: string;
    student_nis: string;
    start_date: string;
    end_date: string;
    reason: string;
    approved_at: string;
  };
}

export const PermitLetterGenerator: React.FC<PermitLetterGeneratorProps> = ({
  permitId,
  permitData
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      // Generate QR code data with permit verification info
      const qrData = {
        permit_id: permitId,
        student_nis: permitData.student_nis,
        valid_from: permitData.start_date,
        valid_until: permitData.end_date,
        verification_url: `${window.location.origin}/verify-permit/${permitId}`
      };

      // Call edge function to generate QR code
      const { data, error } = await supabase.functions.invoke('generate-permit-qr', {
        body: { qrData, permitId }
      });

      if (error) throw error;

      // Update permit with QR code URL
      const { error: updateError } = await supabase
        .from('student_permits')
        .update({ qr_code_url: data.qr_url })
        .eq('id', permitId);

      if (updateError) throw updateError;

      toast({
        title: "Berhasil",
        description: "QR Code berhasil dibuat"
      });

      return data.qr_url;
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Gagal membuat QR Code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDispensationLetter = async () => {
    try {
      setLoading(true);

      // Generate letter PDF
      const { data, error } = await supabase.functions.invoke('generate-letter-pdf', {
        body: {
          type: 'dispensation',
          permitData,
          template: 'dispensation_letter'
        }
      });

      if (error) throw error;

      // Update permit with letter URL
      const { error: updateError } = await supabase
        .from('student_permits')
        .update({ 
          dispensation_letter_url: data.letter_url,
          approval_letter_url: data.letter_url
        })
        .eq('id', permitId);

      if (updateError) throw updateError;

      toast({
        title: "Berhasil", 
        description: "Surat dispensasi berhasil dibuat"
      });

      // Auto-download the letter
      if (data.letter_url) {
        window.open(data.letter_url, '_blank');
      }

      return data.letter_url;
    } catch (error) {
      console.error('Error generating letter:', error);
      toast({
        title: "Error",
        description: "Gagal membuat surat dispensasi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermitTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'sakit': 'Sakit',
      'izin_keluarga': 'Izin Keluarga',
      'dispensasi_akademik': 'Dispensasi Akademik',
      'kegiatan_eksternal': 'Kegiatan Eksternal',
      'izin_pulang_awal': 'Izin Pulang Awal',
      'kegiatan_setelah_jam_sekolah': 'Kegiatan Setelah Jam Sekolah',
      'keperluan_administrasi': 'Keperluan Administrasi',
      'lainnya': 'Lainnya'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-green-700 font-medium">
        <FileText className="h-4 w-4" />
        Dokumen Izin Resmi
      </div>
      
      <div className="text-sm text-green-600 mb-3">
        Izin {getPermitTypeLabel(permitData.permit_type)} untuk {permitData.student_name} telah disetujui.
        Silakan generate dokumen resmi untuk digunakan.
      </div>

      <div className="flex gap-3">
        <Button
          onClick={generateDispensationLetter}
          disabled={loading}
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Generate Surat Izin
        </Button>
        
        <Button
          onClick={generateQRCode}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <QrCode className="h-4 w-4" />
          Generate QR Code
        </Button>
      </div>

      <div className="text-xs text-green-600">
        💡 QR Code dapat digunakan untuk verifikasi digital izin oleh petugas sekolah
      </div>
    </div>
  );
};