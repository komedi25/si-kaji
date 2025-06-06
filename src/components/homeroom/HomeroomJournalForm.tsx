
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Save, Upload } from 'lucide-react';

export const HomeroomJournalForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    journal_date: new Date().toISOString().split('T')[0],
    class_id: '',
    activity_description: '',
    attendance_summary: '',
    learning_progress: '',
    behavioral_notes: '',
    student_notes: '',
    follow_up_actions: '',
    attachments: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('homeroom_journals')
        .insert({
          ...formData,
          homeroom_teacher_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jurnal perwalian berhasil disimpan"
      });

      // Reset form
      setFormData({
        journal_date: new Date().toISOString().split('T')[0],
        class_id: '',
        activity_description: '',
        attendance_summary: '',
        learning_progress: '',
        behavioral_notes: '',
        student_notes: '',
        follow_up_actions: '',
        attachments: []
      });
    } catch (error) {
      console.error('Error saving journal:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jurnal perwalian",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Formulir Jurnal Perwalian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journal_date">Tanggal Jurnal</Label>
              <Input
                id="journal_date"
                type="date"
                value={formData.journal_date}
                onChange={(e) => setFormData(prev => ({ ...prev, journal_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class_id">Kelas</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class1">X RPL 1</SelectItem>
                  <SelectItem value="class2">X RPL 2</SelectItem>
                  <SelectItem value="class3">XI RPL 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_description">Deskripsi Kegiatan Pembelajaran</Label>
            <Textarea
              id="activity_description"
              placeholder="Jelaskan kegiatan pembelajaran hari ini..."
              value={formData.activity_description}
              onChange={(e) => setFormData(prev => ({ ...prev, activity_description: e.target.value }))}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendance_summary">Ringkasan Kehadiran</Label>
              <Input
                id="attendance_summary"
                placeholder="Contoh: H: 32, I: 2, S: 1, A: 0"
                value={formData.attendance_summary}
                onChange={(e) => setFormData(prev => ({ ...prev, attendance_summary: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learning_progress">Progres Pembelajaran</Label>
              <Textarea
                id="learning_progress"
                placeholder="Catat progres pembelajaran siswa..."
                value={formData.learning_progress}
                onChange={(e) => setFormData(prev => ({ ...prev, learning_progress: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="behavioral_notes">Catatan Perilaku Siswa</Label>
            <Textarea
              id="behavioral_notes"
              placeholder="Catatan mengenai perilaku siswa yang perlu diperhatikan..."
              value={formData.behavioral_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, behavioral_notes: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student_notes">Catatan Khusus Siswa</Label>
            <Textarea
              id="student_notes"
              placeholder="Catatan individual untuk siswa tertentu..."
              value={formData.student_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, student_notes: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="follow_up_actions">Rencana Tindak Lanjut</Label>
            <Textarea
              id="follow_up_actions"
              placeholder="Rencana tindak lanjut untuk pertemuan berikutnya..."
              value={formData.follow_up_actions}
              onChange={(e) => setFormData(prev => ({ ...prev, follow_up_actions: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Lampirkan File
            </Button>
            
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
