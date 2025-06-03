
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const HomeroomJournalForm = () => {
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    classId: '',
    activityDescription: '',
    studentNotes: '',
    attendanceSummary: '',
    learningProgress: '',
    behavioralNotes: '',
    followUpActions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Journal data:', { ...formData, journalDate: date });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Jurnal Perwalian Baru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journalDate">Tanggal Jurnal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classId">Kelas</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({...formData, classId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10-rpl-1">X RPL 1</SelectItem>
                  <SelectItem value="10-rpl-2">X RPL 2</SelectItem>
                  <SelectItem value="11-rpl-1">XI RPL 1</SelectItem>
                  <SelectItem value="11-rpl-2">XI RPL 2</SelectItem>
                  <SelectItem value="12-rpl-1">XII RPL 1</SelectItem>
                  <SelectItem value="12-rpl-2">XII RPL 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityDescription">Deskripsi Kegiatan</Label>
            <Textarea
              id="activityDescription"
              placeholder="Masukkan deskripsi kegiatan hari ini..."
              value={formData.activityDescription}
              onChange={(e) => setFormData({...formData, activityDescription: e.target.value})}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendanceSummary">Ringkasan Kehadiran</Label>
              <Textarea
                id="attendanceSummary"
                placeholder="Contoh: Hadir: 32, Izin: 2, Sakit: 1, Alpha: 0"
                value={formData.attendanceSummary}
                onChange={(e) => setFormData({...formData, attendanceSummary: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningProgress">Kemajuan Pembelajaran</Label>
              <Textarea
                id="learningProgress"
                placeholder="Catat kemajuan pembelajaran siswa..."
                value={formData.learningProgress}
                onChange={(e) => setFormData({...formData, learningProgress: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="behavioralNotes">Catatan Perilaku</Label>
              <Textarea
                id="behavioralNotes"
                placeholder="Catat perilaku siswa yang perlu diperhatikan..."
                value={formData.behavioralNotes}
                onChange={(e) => setFormData({...formData, behavioralNotes: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpActions">Tindak Lanjut</Label>
              <Textarea
                id="followUpActions"
                placeholder="Rencana tindak lanjut untuk pertemuan berikutnya..."
                value={formData.followUpActions}
                onChange={(e) => setFormData({...formData, followUpActions: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentNotes">Catatan Siswa</Label>
            <Textarea
              id="studentNotes"
              placeholder="Catatan khusus tentang siswa tertentu..."
              value={formData.studentNotes}
              onChange={(e) => setFormData({...formData, studentNotes: e.target.value})}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              Batal
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Simpan Jurnal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
