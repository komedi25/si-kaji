
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StudentSearchWithQR } from '@/components/common/StudentSearchWithQR';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';

interface CounselingFormProps {
  onSuccess?: () => void;
}

export const CounselingForm = ({ onSuccess }: CounselingFormProps) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    session_date: '',
    session_time: '',
    session_type: '',
    topic: '',
    duration_minutes: '60'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('admin') && !hasRole('guru_bk')) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk membuat jadwal konseling",
        variant: "destructive"
      });
      return;
    }

    if (!formData.student_id || !formData.session_date || !formData.session_time || !formData.session_type) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap lengkapi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    // Validasi tanggal tidak boleh di masa lalu
    const selectedDate = new Date(formData.session_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Tanggal Tidak Valid",
        description: "Tidak dapat membuat jadwal konseling di masa lalu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('counseling_sessions')
        .insert({
          student_id: formData.student_id,
          counselor_id: user?.id,
          session_date: formData.session_date,
          session_time: formData.session_time,
          session_type: formData.session_type,
          topic: formData.topic || null,
          duration_minutes: parseInt(formData.duration_minutes) || 60,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jadwal konseling berhasil dibuat"
      });

      // Reset form
      setFormData({
        student_id: '',
        session_date: '',
        session_time: '',
        session_type: '',
        topic: '',
        duration_minutes: '60'
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating counseling session:', error);
      toast({
        title: "Error",
        description: "Gagal membuat jadwal konseling",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin') && !hasRole('guru_bk')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Akses Terbatas</h3>
              <p className="text-gray-500 mt-2">
                Anda tidak memiliki akses untuk membuat jadwal konseling. 
                Fitur ini hanya tersedia untuk guru BK dan administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Buat Jadwal Konseling Baru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="student">Siswa *</Label>
            <StudentSearchWithQR
              value={formData.student_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
              placeholder="Cari siswa berdasarkan nama atau NIS"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Sesi *
              </Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <Label htmlFor="session_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Waktu Sesi *
              </Label>
              <Input
                id="session_time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData(prev => ({ ...prev, session_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_type">Jenis Sesi *</Label>
              <Select value={formData.session_type} onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis sesi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Kelompok</SelectItem>
                  <SelectItem value="crisis">Krisis</SelectItem>
                  <SelectItem value="follow_up">Tindak Lanjut</SelectItem>
                  <SelectItem value="family">Keluarga</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Durasi (menit) *</Label>
              <Select value={formData.duration_minutes} onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 menit</SelectItem>
                  <SelectItem value="45">45 menit</SelectItem>
                  <SelectItem value="60">60 menit</SelectItem>
                  <SelectItem value="90">90 menit</SelectItem>
                  <SelectItem value="120">120 menit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="topic">Topik/Tema Konseling</Label>
            <Textarea
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Masukkan topik atau tema yang akan dibahas dalam sesi konseling (opsional)"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Topik ini akan membantu persiapan sesi konseling
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Catatan Penting:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Pastikan waktu yang dipilih tidak bertabrakan dengan jadwal lain</li>
                  <li>• Siswa akan mendapat notifikasi setelah jadwal dibuat</li>
                  <li>• Jadwal dapat diubah atau dibatalkan sebelum pelaksanaan</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={loading || !formData.student_id || !formData.session_date || !formData.session_time || !formData.session_type}
              className="flex-1"
            >
              {loading ? 'Menyimpan...' : 'Buat Jadwal Konseling'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
