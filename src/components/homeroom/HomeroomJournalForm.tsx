
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClassSelector } from '@/components/common/ClassSelector';

export const HomeroomJournalForm = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    class_id: '',
    journal_date: '',
    activity_description: '',
    student_notes: '',
    attendance_summary: '',
    learning_progress: '',
    behavioral_notes: '',
    follow_up_actions: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('admin') && !hasRole('wali_kelas')) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk membuat jurnal perwalian",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('homeroom_journals')
        .insert({
          homeroom_teacher_id: user?.id,
          class_id: formData.class_id,
          journal_date: formData.journal_date,
          activity_description: formData.activity_description,
          student_notes: formData.student_notes,
          attendance_summary: formData.attendance_summary,
          learning_progress: formData.learning_progress,
          behavioral_notes: formData.behavioral_notes,
          follow_up_actions: formData.follow_up_actions
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jurnal perwalian berhasil disimpan"
      });

      // Reset form
      setFormData({
        class_id: '',
        journal_date: '',
        activity_description: '',
        student_notes: '',
        attendance_summary: '',
        learning_progress: '',
        behavioral_notes: '',
        follow_up_actions: ''
      });
    } catch (error) {
      console.error('Error creating journal:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jurnal perwalian",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin') && !hasRole('wali_kelas')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Anda tidak memiliki akses untuk membuat jurnal perwalian
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Jurnal Perwalian</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class_id">Kelas *</Label>
              <ClassSelector
                value={formData.class_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}
                placeholder="Pilih kelas"
              />
            </div>

            <div>
              <Label htmlFor="journal_date">Tanggal Jurnal *</Label>
              <Input
                id="journal_date"
                type="date"
                value={formData.journal_date}
                onChange={(e) => setFormData(prev => ({ ...prev, journal_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="activity_description">Deskripsi Kegiatan *</Label>
            <Textarea
              id="activity_description"
              value={formData.activity_description}
              onChange={(e) => setFormData(prev => ({ ...prev, activity_description: e.target.value }))}
              placeholder="Jelaskan kegiatan pembelajaran dan aktivitas kelas hari ini"
              required
            />
          </div>

          <div>
            <Label htmlFor="attendance_summary">Ringkasan Kehadiran</Label>
            <Textarea
              id="attendance_summary"
              value={formData.attendance_summary}
              onChange={(e) => setFormData(prev => ({ ...prev, attendance_summary: e.target.value }))}
              placeholder="Catatan tentang kehadiran siswa (berapa hadir, sakit, izin, alfa)"
            />
          </div>

          <div>
            <Label htmlFor="learning_progress">Kemajuan Pembelajaran</Label>
            <Textarea
              id="learning_progress"
              value={formData.learning_progress}
              onChange={(e) => setFormData(prev => ({ ...prev, learning_progress: e.target.value }))}
              placeholder="Catatan tentang kemajuan atau pencapaian pembelajaran siswa"
            />
          </div>

          <div>
            <Label htmlFor="behavioral_notes">Catatan Perilaku</Label>
            <Textarea
              id="behavioral_notes"
              value={formData.behavioral_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, behavioral_notes: e.target.value }))}
              placeholder="Catatan tentang perilaku siswa, kedisiplinan, atau hal-hal khusus"
            />
          </div>

          <div>
            <Label htmlFor="student_notes">Catatan Individual Siswa</Label>
            <Textarea
              id="student_notes"
              value={formData.student_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, student_notes: e.target.value }))}
              placeholder="Catatan khusus untuk siswa tertentu yang memerlukan perhatian"
            />
          </div>

          <div>
            <Label htmlFor="follow_up_actions">Tindak Lanjut</Label>
            <Textarea
              id="follow_up_actions"
              value={formData.follow_up_actions}
              onChange={(e) => setFormData(prev => ({ ...prev, follow_up_actions: e.target.value }))}
              placeholder="Rencana tindak lanjut atau hal-hal yang perlu dilakukan esok hari"
            />
          </div>

          <Button type="submit" disabled={loading || !formData.class_id || !formData.activity_description} className="w-full">
            {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
