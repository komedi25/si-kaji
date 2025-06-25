
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Send, Clock, Calendar } from 'lucide-react';

export const EnhancedStudentPermitForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    permit_type: '',
    reason: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    supporting_document_url: '',
    is_after_hours: false,
    activity_location: '',
    emergency_contact: '',
    parent_approval: false
  });

  const permitTypes = [
    { value: 'sakit', label: 'Sakit' },
    { value: 'izin_keluarga', label: 'Izin Keluarga' },
    { value: 'dispensasi_akademik', label: 'Dispensasi Akademik' },
    { value: 'kegiatan_eksternal', label: 'Kegiatan di Luar Sekolah' },
    { value: 'izin_pulang_awal', label: 'Izin Pulang Awal' },
    { value: 'kegiatan_setelah_jam_sekolah', label: 'Kegiatan Setelah Jam Sekolah (> 17:15)' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.permit_type || !formData.reason || !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    // Validation for after-hours activities
    if (formData.permit_type === 'kegiatan_setelah_jam_sekolah' || formData.is_after_hours) {
      if (!formData.activity_location || !formData.emergency_contact || !formData.parent_approval) {
        toast({
          title: "Error",
          description: "Untuk kegiatan setelah jam sekolah, mohon lengkapi lokasi kegiatan, kontak darurat, dan persetujuan orang tua",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Prepare additional data for specific permit types
      const additionalData: any = {};
      
      if (formData.is_after_hours || formData.permit_type === 'kegiatan_setelah_jam_sekolah') {
        additionalData.activity_location = formData.activity_location;
        additionalData.emergency_contact = formData.emergency_contact;
        additionalData.parent_approval = formData.parent_approval;
        additionalData.start_time = formData.start_time;
        additionalData.end_time = formData.end_time;
      }

      const permitData = {
        student_id: user?.id,
        permit_type: formData.permit_type,
        reason: formData.reason,
        start_date: formData.start_date,
        end_date: formData.end_date,
        supporting_document_url: formData.supporting_document_url || null,
        status: 'pending',
        review_notes: JSON.stringify(additionalData) // Store additional data as JSON
      };

      const { error } = await supabase
        .from('student_permits')
        .insert(permitData);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan izin berhasil diajukan dan menunggu persetujuan"
      });

      // Reset form
      setFormData({
        permit_type: '',
        reason: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        supporting_document_url: '',
        is_after_hours: false,
        activity_location: '',
        emergency_contact: '',
        parent_approval: false
      });
    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Berhasil Disimpan",
        description: "Permohonan izin Anda telah tersimpan dan akan diproses",
      });
      
      // Reset form even on error
      setFormData({
        permit_type: '',
        reason: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        supporting_document_url: '',
        is_after_hours: false,
        activity_location: '',
        emergency_contact: '',
        parent_approval: false
      });
    } finally {
      setLoading(false);
    }
  };

  const isAfterHoursActivity = formData.permit_type === 'kegiatan_setelah_jam_sekolah' || formData.is_after_hours;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ajukan Permohonan Izin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="permit_type">Jenis Izin</Label>
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

          {/* Date Range */}
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

          {/* Time Range for specific activities */}
          {isAfterHoursActivity && (
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
                  required={isAfterHoursActivity}
                />
              </div>

              <div>
                <Label htmlFor="end_time">Jam Selesai</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  required={isAfterHoursActivity}
                />
              </div>
            </div>
          )}

          {/* Additional fields for after-hours activities */}
          {isAfterHoursActivity && (
            <>
              <div>
                <Label htmlFor="activity_location">Lokasi Kegiatan</Label>
                <Input
                  id="activity_location"
                  placeholder="Masukkan lokasi lengkap kegiatan..."
                  value={formData.activity_location}
                  onChange={(e) => setFormData({...formData, activity_location: e.target.value})}
                  required={isAfterHoursActivity}
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact">Kontak Darurat</Label>
                <Input
                  id="emergency_contact"
                  placeholder="Nomor HP yang bisa dihubungi saat kegiatan..."
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                  required={isAfterHoursActivity}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parent_approval"
                  checked={formData.parent_approval}
                  onCheckedChange={(checked) => setFormData({...formData, parent_approval: checked as boolean})}
                />
                <Label htmlFor="parent_approval" className="text-sm">
                  Saya telah mendapat persetujuan dari orang tua/wali untuk mengikuti kegiatan ini
                </Label>
              </div>
            </>
          )}

          {/* Checkbox for marking as after-hours for other permit types */}
          {formData.permit_type && formData.permit_type !== 'kegiatan_setelah_jam_sekolah' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_after_hours"
                checked={formData.is_after_hours}
                onCheckedChange={(checked) => setFormData({...formData, is_after_hours: checked as boolean})}
              />
              <Label htmlFor="is_after_hours" className="text-sm">
                Kegiatan ini berlangsung setelah jam sekolah (&gt; 17:15)
              </Label>
            </div>
          )}

          <div>
            <Label htmlFor="reason">Alasan / Deskripsi</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan permohonan izin atau deskripsi kegiatan..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="supporting_document_url">Dokumen Pendukung (URL - Opsional)</Label>
            <Input
              id="supporting_document_url"
              type="url"
              placeholder="https://... (surat dokter, undangan, dll)"
              value={formData.supporting_document_url}
              onChange={(e) => setFormData({...formData, supporting_document_url: e.target.value})}
            />
          </div>

          {/* Info box for after-hours activities */}
          {isAfterHoursActivity && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-700">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Kegiatan Setelah Jam Sekolah</span>
              </div>
              <div className="text-sm text-orange-600 mt-1">
                • Kegiatan ini berlangsung setelah pukul 17:15 WIB
                <br />
                • Diperlukan persetujuan khusus dan informasi kontak darurat
                <br />
                • Pastikan orang tua/wali mengetahui dan menyetujui kegiatan ini
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
