import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentPermit {
  id: string;
  permit_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: string;
  review_notes?: string;
  submitted_at: string;
}

export const StudentPermitManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permits, setPermits] = useState<StudentPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    permit_type: '',
    reason: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchStudentId();
    }
  }, [user]);

  useEffect(() => {
    if (studentId) {
      fetchPermits();
    }
  }, [studentId]);

  const fetchStudentId = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching student data for user ID:', user.id);
      
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching student ID:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data siswa: " + error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (data) {
        console.log('Student data found:', data);
        setStudentId(data.id);
      } else {
        console.log('No student data found for user:', user.id);
        toast({
          title: "Info",
          description: "Data siswa tidak ditemukan. Silakan hubungi administrator untuk menghubungkan akun Anda dengan data siswa.",
          variant: "destructive"
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchStudentId:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data siswa",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const fetchPermits = async () => {
    if (!studentId) return;

    try {
      console.log('Fetching permits for student ID:', studentId);
      
      const { data, error } = await supabase
        .from('student_permits')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching permits:', error);
        throw error;
      }
      
      console.log('Permits fetched:', data);
      setPermits(data || []);
    } catch (error) {
      console.error('Error fetching permits:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data perizinan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast({
        title: "Error",
        description: "Data siswa tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    // Validasi khusus untuk kegiatan di luar jam pembelajaran
    if (formData.permit_type === 'kegiatan_luar') {
      if (!formData.start_time || !formData.end_time) {
        toast({
          title: "Error",
          description: "Waktu mulai dan selesai wajib diisi untuk kegiatan di luar jam pembelajaran",
          variant: "destructive"
        });
        return;
      }

      // Validasi jam berakhir maksimal 17:15
      const endTime = formData.end_time;
      if (endTime > '17:15') {
        toast({
          title: "Error",
          description: "Kegiatan siswa harus berakhir maksimal pukul 17:15 di hari kerja",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const permitData: {
        student_id: string;
        permit_type: string;
        reason: string;
        start_date: string;
        end_date: string;
        status: string;
        start_time?: string;
        end_time?: string;
      } = {
        student_id: studentId,
        permit_type: formData.permit_type,
        reason: formData.reason,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'pending'
      };

      // Tambahkan waktu jika ada
      if (formData.start_time) {
        permitData.start_time = formData.start_time;
      }
      if (formData.end_time) {
        permitData.end_time = formData.end_time;
      }

      const { error } = await supabase
        .from('student_permits')
        .insert(permitData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengajuan izin berhasil disubmit"
      });

      setFormData({
        permit_type: '',
        reason: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: ''
      });
      setShowForm(false);
      fetchPermits();
    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan izin",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      cancelled: 'outline'
    } as const;

    const labels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      cancelled: 'Dibatalkan'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPermitTypeLabel = (type: string) => {
    const labels = {
      sakit: 'Izin Sakit',
      keluarga: 'Urusan Keluarga',
      keperluan_penting: 'Keperluan Penting',
      kegiatan_luar: 'Kegiatan di Luar Jam Pembelajaran',
      lainnya: 'Lainnya'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Tampilkan pesan jika data siswa tidak ditemukan
  if (!studentId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Data Siswa Belum Tersedia</h3>
              <p className="text-gray-500 mt-2">
                Data siswa Anda belum terhubung dengan akun ini. Silakan hubungi administrator sekolah untuk menghubungkan data siswa dengan akun Anda.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Langkah Selanjutnya:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Hubungi bagian tata usaha sekolah</li>
                <li>• Berikan informasi akun Anda: {user?.email}</li>
                <li>• Administrator akan menghubungkan data siswa dengan akun Anda</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Perizinan & Kegiatan</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajukan Izin/Kegiatan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Form Pengajuan Izin/Kegiatan</span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="permit_type">Jenis Permohonan</Label>
                <select
                  id="permit_type"
                  className="w-full p-2 border rounded-md"
                  value={formData.permit_type}
                  onChange={(e) => setFormData({...formData, permit_type: e.target.value})}
                  required
                >
                  <option value="">Pilih jenis permohonan</option>
                  <option value="sakit">Izin Sakit</option>
                  <option value="keluarga">Urusan Keluarga</option>
                  <option value="keperluan_penting">Keperluan Penting</option>
                  <option value="kegiatan_luar">Kegiatan di Luar Jam Pembelajaran</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Tanggal Mulai</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">Tanggal Selesai</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Tampilkan input waktu hanya untuk kegiatan di luar jam pembelajaran */}
              {formData.permit_type === 'kegiatan_luar' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Waktu Mulai <span className="text-red-500">*</span></Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">Waktu Selesai <span className="text-red-500">*</span></Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      max="17:15"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maksimal pukul 17:15 di hari kerja
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="reason">Alasan/Tujuan</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Jelaskan alasan atau tujuan permohonan izin/kegiatan"
                  required
                />
              </div>
              
              {formData.permit_type === 'kegiatan_luar' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Catatan:</strong> Permohonan kegiatan di luar jam pembelajaran akan direview oleh wali kelas dan dilanjutkan ke wakil kepala sekolah bidang kesiswaan untuk persetujuan. Kegiatan harus berakhir maksimal pukul 17:15 di hari kerja.
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="submit">Submit Permohonan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Riwayat Permohonan</h3>
        {permits.map((permit) => (
          <Card key={permit.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {getPermitTypeLabel(permit.permit_type)}
                </span>
                {getStatusBadge(permit.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Periode:</strong> {format(new Date(permit.start_date), 'dd/MM/yyyy')} - {format(new Date(permit.end_date), 'dd/MM/yyyy')}
                </div>
                <div>
                  <strong>Diajukan:</strong> {format(new Date(permit.submitted_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                </div>
              </div>

              {permit.start_time && permit.end_time && (
                <div className="text-sm">
                  <strong>Waktu:</strong> {permit.start_time} - {permit.end_time}
                </div>
              )}
              
              <div>
                <strong>Alasan/Tujuan:</strong>
                <div className="mt-1 text-sm text-gray-600">
                  {permit.reason}
                </div>
              </div>
              
              {permit.review_notes && (
                <div>
                  <strong>Catatan Review:</strong>
                  <div className="mt-1 text-sm text-gray-600">
                    {permit.review_notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {permits.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Belum ada permohonan izin/kegiatan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
