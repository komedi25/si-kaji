import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, QrCode, Search, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PermitData {
  id: string;
  permit_type: string;
  student_name: string;
  student_nis: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  approved_at: string;
  urgency_level: string;
}

export const PermitVerification = () => {
  const { toast } = useToast();
  const [permitId, setPermitId] = useState('');
  const [permitData, setPermitData] = useState<PermitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const verifyPermit = async (id?: string) => {
    const searchId = id || permitId;
    if (!searchId.trim()) {
      toast({
        title: "Error",
        description: "Masukkan ID permit untuk verifikasi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setNotFound(false);
    
    try {
      const { data, error } = await supabase
        .from('student_permits')
        .select(`
          id,
          permit_type,
          start_date,
          end_date,
          reason,
          status,
          submitted_at,
          urgency_level,
          students (
            full_name,
            nis
          )
        `)
        .eq('id', searchId)
        .eq('status', 'approved')
        .single();

      if (error || !data) {
        setNotFound(true);
        setPermitData(null);
        return;
      }

      setPermitData({
        id: data.id,
        permit_type: data.permit_type,
        student_name: data.students.full_name,
        student_nis: data.students.nis,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
        status: data.status,
        approved_at: data.submitted_at, // Using submitted_at as approved_at equivalent
        urgency_level: data.urgency_level
      });
      setNotFound(false);

    } catch (error) {
      console.error('Error verifying permit:', error);
      toast({
        title: "Error",
        description: "Gagal memverifikasi izin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if permit ID is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPermitId = urlParams.get('permit_id');
    if (urlPermitId) {
      setPermitId(urlPermitId);
      verifyPermit(urlPermitId);
    }
  }, []);

  const isPermitValid = () => {
    if (!permitData) return false;
    const today = new Date();
    const startDate = new Date(permitData.start_date);
    const endDate = new Date(permitData.end_date);
    return today >= startDate && today <= endDate;
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
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Verifikasi Izin Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Masukkan ID Permit atau scan QR Code..."
              value={permitId}
              onChange={(e) => setPermitId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && verifyPermit()}
            />
            <Button onClick={() => verifyPermit()} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memverifikasi izin...</p>
          </CardContent>
        </Card>
      )}

      {notFound && (
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Izin Tidak Valid</h3>
            <p className="text-red-600">
              Izin dengan ID "{permitId}" tidak ditemukan, belum disetujui, atau sudah kedaluwarsa.
            </p>
          </CardContent>
        </Card>
      )}

      {permitData && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-700">Izin Valid</h3>
                  <p className="text-sm text-green-600">Izin telah diverifikasi dan sah</p>
                </div>
              </div>
              <Badge 
                className={`${isPermitValid() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
                }`}
              >
                {isPermitValid() ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Nama Siswa</p>
                    <p className="font-medium">{permitData.student_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">NIS</p>
                    <p className="font-medium">{permitData.student_nis}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Jenis Izin</p>
                    <p className="font-medium">{getPermitTypeLabel(permitData.permit_type)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Periode Izin</p>
                    <p className="font-medium">
                      {format(new Date(permitData.start_date), 'dd MMM yyyy', { locale: id })} - 
                      {format(new Date(permitData.end_date), 'dd MMM yyyy', { locale: id })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Disetujui</p>
                    <p className="font-medium">
                      {format(new Date(permitData.approved_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">ID Permit</p>
                    <p className="font-mono text-sm">{permitData.id}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Alasan:</p>
              <p className="text-sm">{permitData.reason}</p>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Verifikasi dilakukan pada {format(new Date(), 'dd MMM yyyy, HH:mm', { locale: id })} WIB
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};