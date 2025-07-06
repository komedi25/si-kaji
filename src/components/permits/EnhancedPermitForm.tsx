
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudentData } from '@/hooks/useStudentData';
import { FileText, Send, Clock, Calendar, AlertTriangle, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PermitFormData {
  permit_type: string;
  permit_category: string;
  urgency_level: string;
  reason: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  supporting_document_url: string;
  parent_contact: string;
  parent_approval: boolean;
  activity_location: string;
  emergency_contact: string;
}

export const EnhancedPermitForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { studentData } = useStudentData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PermitFormData>({
    permit_type: '',
    permit_category: 'regular',
    urgency_level: 'normal',
    reason: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    supporting_document_url: '',
    parent_contact: '',
    parent_approval: false,
    activity_location: '',
    emergency_contact: ''
  });

  const permitTypes = [
    { value: 'sakit', label: 'Sakit', category: 'medical' },
    { value: 'izin_keluarga', label: 'Izin Keluarga', category: 'family' },
    { value: 'dispensasi_akademik', label: 'Dispensasi Akademik', category: 'academic' },
    { value: 'kegiatan_eksternal', label: 'Kegiatan di Luar Sekolah', category: 'external' },
    { value: 'izin_pulang_awal', label: 'Izin Pulang Awal', category: 'early_leave' },
    { value: 'kegiatan_setelah_jam_sekolah', label: 'Kegiatan Setelah Jam Sekolah', category: 'after_hours' },
    { value: 'keperluan_administrasi', label: 'Keperluan Administrasi', category: 'administrative' },
    { value: 'lainnya', label: 'Lainnya', category: 'others' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Rendah', color: 'bg-green-100 text-green-800' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Tinggi', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'urgent', label: 'Mendesak', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentData?.id) {
      toast({
        title: "Error",
        description: "Data siswa tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    // Validasi form
    if (!formData.permit_type || !formData.reason || !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    // Validasi untuk kegiatan setelah jam sekolah
    if (formData.permit_type === 'kegiatan_setelah_jam_sekolah') {
      if (!formData.activity_location || !formData.emergency_contact || !formData.parent_approval) {
        toast({
          title: "Error",
          description: "Untuk kegiatan setelah jam sekolah, mohon lengkapi lokasi, kontak darurat, dan persetujuan orang tua",
          variant: "destructive"
        });
        return;
      }
    }

    // Validasi untuk izin mendesak
    if (formData.urgency_level === 'urgent' && !formData.parent_contact) {
      toast({
        title: "Error",
        description: "Izin mendesak memerlukan kontak orang tua yang dapat dihubungi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const permitData = {
        student_id: studentData.id,
        permit_type: formData.permit_type,
        permit_category: formData.permit_category,
        urgency_level: formData.urgency_level,
        reason: formData.reason,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        supporting_document_url: formData.supporting_document_url || null,
        parent_contact: formData.parent_contact || null,
        parent_approval: formData.parent_approval,
        activity_location: formData.activity_location || null,
        emergency_contact: formData.emergency_contact || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('student_permits')
        .insert(permitData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan izin berhasil diajukan dan akan diproses sesuai workflow persetujuan"
      });

      // Reset form
      setFormData({
        permit_type: '',
        permit_category: 'regular',
        urgency_level: 'normal',
        reason: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        supporting_document_url: '',
        parent_contact: '',
        parent_approval: false,
        activity_location: '',
        emergency_contact: ''
      });

    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan permohonan izin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPermitType = permitTypes.find(type => type.value === formData.permit_type);
  const isAfterHours = formData.permit_type === 'kegiatan_setelah_jam_sekolah';
  const isUrgent = formData.urgency_level === 'urgent';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Form Permohonan Izin Enhanced
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="permit_type">Jenis Izin *</Label>
              <Select value={formData.permit_type} onValueChange={(value) => setFormData({...formData, permit_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis izin" />
                </SelectTrigger>
                <SelectContent>
                  {permitTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency_level">Tingkat Kepentingan</Label>
              <Select value={formData.urgency_level} onValueChange={(value) => setFormData({...formData, urgency_level: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat kepentingan" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={level.color}>{level.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Tanggal Mulai *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">Tanggal Selesai *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Time for specific activities */}
          {(isAfterHours || selectedPermitType?.category === 'early_leave') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Jam Mulai
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="end_time">Jam Selesai</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Activity Location for external activities */}
          {(isAfterHours || selectedPermitType?.category === 'external') && (
            <div>
              <Label htmlFor="activity_location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasi Kegiatan *
              </Label>
              <Input
                id="activity_location"
                placeholder="Masukkan lokasi lengkap kegiatan..."
                value={formData.activity_location}
                onChange={(e) => setFormData({...formData, activity_location: e.target.value})}
                required={isAfterHours}
              />
            </div>
          )}

          {/* Parent Contact and Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isUrgent || isAfterHours) && (
              <div>
                <Label htmlFor="parent_contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Kontak Orang Tua {(isUrgent || isAfterHours) && '*'}
                </Label>
                <Input
                  id="parent_contact"
                  type="tel"
                  placeholder="Nomor HP orang tua/wali..."
                  value={formData.parent_contact}
                  onChange={(e) => setFormData({...formData, parent_contact: e.target.value})}
                  required={isUrgent || isAfterHours}
                />
              </div>
            )}

            {isAfterHours && (
              <div>
                <Label htmlFor="emergency_contact">Kontak Darurat *</Label>
                <Input
                  id="emergency_contact"
                  type="tel"
                  placeholder="Nomor HP yang bisa dihubungi saat kegiatan..."
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  required={isAfterHours}
                />
              </div>
            )}
          </div>

          {/* Parent Approval for after-hours activities */}
          {isAfterHours && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parent_approval"
                checked={formData.parent_approval}
                onCheckedChange={(checked) => setFormData({...formData, parent_approval: checked as boolean})}
              />
              <Label htmlFor="parent_approval" className="text-sm">
                Saya telah mendapat persetujuan dari orang tua/wali untuk mengikuti kegiatan ini *
              </Label>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Alasan / Deskripsi *</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan permohonan izin atau deskripsi kegiatan secara detail..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
              rows={4}
            />
          </div>

          {/* Supporting Document */}
          <div>
            <Label htmlFor="supporting_document_url">Dokumen Pendukung (URL - Opsional)</Label>
            <Input
              id="supporting_document_url"
              type="url"
              placeholder="https://... (surat dokter, undangan, surat keterangan, dll)"
              value={formData.supporting_document_url}
              onChange={(e) => setFormData({...formData, supporting_document_url: e.target.value})}
            />
          </div>

          {/* Info boxes for special cases */}
          {isAfterHours && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Kegiatan Setelah Jam Sekolah</span>
              </div>
              <div className="text-sm text-orange-600">
                • Kegiatan ini berlangsung setelah pukul 17:15 WIB<br />
                • Diperlukan persetujuan bertingkat (Wali Kelas → Guru BK → Waka Kesiswaan)<br />
                • Wajib menyertakan kontak darurat dan persetujuan orang tua<br />
                • Proses persetujuan memerlukan waktu 2-3 hari kerja
              </div>
            </div>
          )}

          {isUrgent && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Izin Mendesak</span>
              </div>
              <div className="text-sm text-red-600">
                • Permohonan akan diprioritaskan untuk review<br />
                • Wajib menyertakan kontak orang tua yang dapat dihubungi<br />
                • Proses persetujuan dipercepat menjadi maksimal 24 jam
              </div>
            </div>
          )}

          {/* Workflow Preview */}
          {selectedPermitType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800 mb-2">Alur Persetujuan:</div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span className="bg-blue-100 px-2 py-1 rounded">1. Wali Kelas</span>
                <span>→</span>
                {formData.permit_type === 'kegiatan_setelah_jam_sekolah' ? (
                  <>
                    <span className="bg-blue-100 px-2 py-1 rounded">2. Guru BK</span>
                    <span>→</span>
                    <span className="bg-blue-100 px-2 py-1 rounded">3. Waka Kesiswaan</span>
                  </>
                ) : formData.permit_type === 'dispensasi_akademik' ? (
                  <span className="bg-blue-100 px-2 py-1 rounded">2. Waka Kesiswaan</span>
                ) : (
                  <span className="bg-green-100 px-2 py-1 rounded text-green-700">Selesai</span>
                )}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Mengirim...' : 'Ajukan Permohonan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
