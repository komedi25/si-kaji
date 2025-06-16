
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceSchedule } from '@/types/selfAttendance';
import { Clock, Plus, Edit, Trash2 } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 7, label: 'Minggu' }
];

export const AttendanceScheduleManager = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AttendanceSchedule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    day_of_week: '',
    check_in_start: '06:30',
    check_in_end: '07:00',
    check_out_start: '15:00',
    check_out_end: '16:00',
    late_threshold_minutes: '15'
  });

  useEffect(() => {
    fetchSchedules();
    fetchClasses();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_schedules')
        .select(`
          *,
          classes(name, grade)
        `)
        .order('day_of_week');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('is_active', true)
        .order('grade, name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const scheduleData = {
        name: formData.name,
        class_id: formData.class_id || null,
        day_of_week: parseInt(formData.day_of_week),
        check_in_start: formData.check_in_start + ':00',
        check_in_end: formData.check_in_end + ':00',
        check_out_start: formData.check_out_start + ':00',
        check_out_end: formData.check_out_end + ':00',
        late_threshold_minutes: parseInt(formData.late_threshold_minutes)
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('attendance_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Jadwal berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('attendance_schedules')
          .insert(scheduleData);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Jadwal berhasil ditambahkan"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jadwal",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (schedule: AttendanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      class_id: schedule.class_id || '',
      day_of_week: schedule.day_of_week.toString(),
      check_in_start: schedule.check_in_start.slice(0, 5),
      check_in_end: schedule.check_in_end.slice(0, 5),
      check_out_start: schedule.check_out_start.slice(0, 5),
      check_out_end: schedule.check_out_end.slice(0, 5),
      late_threshold_minutes: schedule.late_threshold_minutes.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    try {
      const { error } = await supabase
        .from('attendance_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Jadwal berhasil dihapus"
      });
      
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus jadwal",
        variant: "destructive"
      });
    }
  };

  const toggleStatus = async (schedule: AttendanceSchedule) => {
    try {
      const { error } = await supabase
        .from('attendance_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: `Jadwal ${schedule.is_active ? 'dinonaktifkan' : 'diaktifkan'}`
      });
      
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status jadwal",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      class_id: '',
      day_of_week: '',
      check_in_start: '06:30',
      check_in_end: '07:00',
      check_out_start: '15:00',
      check_out_end: '16:00',
      late_threshold_minutes: '15'
    });
    setEditingSchedule(null);
  };

  const getDayName = (dayNumber: number) => {
    return DAYS.find(day => day.value === dayNumber)?.label || '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Manajemen Jadwal Presensi
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Jadwal</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contoh: Jadwal Senin-Kamis"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="day_of_week">Hari</Label>
                    <Select value={formData.day_of_week} onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="class_id">Kelas (Opsional)</Label>
                  <Select value={formData.class_id} onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas (kosongkan untuk semua kelas)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Kelas</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.grade} {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="check_in_start">Mulai Masuk</Label>
                    <Input
                      id="check_in_start"
                      type="time"
                      value={formData.check_in_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_start: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="check_in_end">Batas Masuk</Label>
                    <Input
                      id="check_in_end"
                      type="time"
                      value={formData.check_in_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_end: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="check_out_start">Mulai Pulang</Label>
                    <Input
                      id="check_out_start"
                      type="time"
                      value={formData.check_out_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_start: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="check_out_end">Batas Pulang</Label>
                    <Input
                      id="check_out_end"
                      type="time"
                      value={formData.check_out_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_end: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="late_threshold">Batas Toleransi Terlambat (menit)</Label>
                  <Input
                    id="late_threshold"
                    type="number"
                    value={formData.late_threshold_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, late_threshold_minutes: e.target.value }))}
                    placeholder="15"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingSchedule ? 'Perbarui' : 'Tambah'} Jadwal
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Hari</TableHead>
              <TableHead>Jam Masuk</TableHead>
              <TableHead>Jam Pulang</TableHead>
              <TableHead>Toleransi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium">{schedule.name}</TableCell>
                <TableCell>{getDayName(schedule.day_of_week)}</TableCell>
                <TableCell>
                  {schedule.check_in_start.slice(0, 5)} - {schedule.check_in_end.slice(0, 5)}
                </TableCell>
                <TableCell>
                  {schedule.check_out_start.slice(0, 5)} - {schedule.check_out_end.slice(0, 5)}
                </TableCell>
                <TableCell>{schedule.late_threshold_minutes} menit</TableCell>
                <TableCell>
                  <Badge 
                    variant={schedule.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleStatus(schedule)}
                  >
                    {schedule.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
