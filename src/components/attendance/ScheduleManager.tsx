
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Plus, Edit, Trash2 } from 'lucide-react';

interface AttendanceSchedule {
  id: string;
  name: string;
  day_of_week: number;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  late_threshold_minutes: number;
  class_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  classes?: {
    id: string;
    name: string;
  };
}

interface Class {
  id: string;
  name: string;
}

const dayNames = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export const ScheduleManager = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AttendanceSchedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    day_of_week: '',
    check_in_start: '',
    check_in_end: '',
    check_out_start: '',
    check_out_end: '',
    late_threshold_minutes: '15',
    class_id: ''
  });

  // Fetch schedules and classes
  const fetchData = async () => {
    // Fetch schedules
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('attendance_schedules')
      .select(`
        *,
        classes:class_id (
          id,
          name
        )
      `)
      .order('day_of_week', { ascending: true });

    if (schedulesError) {
      toast({
        title: "Error",
        description: "Gagal memuat data jadwal",
        variant: "destructive"
      });
      return;
    }

    setSchedules(schedulesData || []);

    // Fetch classes
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (classesError) {
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive"
      });
      return;
    }

    setClasses(classesData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      day_of_week: '',
      check_in_start: '',
      check_in_end: '',
      check_out_start: '',
      check_out_end: '',
      late_threshold_minutes: '15',
      class_id: ''
    });
    setEditingSchedule(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        day_of_week: parseInt(formData.day_of_week),
        check_in_start: formData.check_in_start,
        check_in_end: formData.check_in_end,
        check_out_start: formData.check_out_start,
        check_out_end: formData.check_out_end,
        late_threshold_minutes: parseInt(formData.late_threshold_minutes),
        class_id: formData.class_id || null
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('attendance_schedules')
          .update(data)
          .eq('id', editingSchedule.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Jadwal berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('attendance_schedules')
          .insert(data);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Jadwal berhasil ditambahkan"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (schedule: AttendanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      day_of_week: schedule.day_of_week.toString(),
      check_in_start: schedule.check_in_start,
      check_in_end: schedule.check_in_end,
      check_out_start: schedule.check_out_start,
      check_out_end: schedule.check_out_end,
      late_threshold_minutes: schedule.late_threshold_minutes.toString(),
      class_id: schedule.class_id || ''
    });
    setIsDialogOpen(true);
  };

  // Handle delete
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

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('attendance_schedules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Jadwal berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manajemen Jadwal Presensi
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Jadwal</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Senin - Kamis"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="day_of_week">Hari</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hari" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="check_in_start">Mulai Check In</Label>
                    <Input
                      id="check_in_start"
                      type="time"
                      value={formData.check_in_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_start: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="check_in_end">Batas Check In</Label>
                    <Input
                      id="check_in_end"
                      type="time"
                      value={formData.check_in_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_end: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="check_out_start">Mulai Check Out</Label>
                    <Input
                      id="check_out_start"
                      type="time"
                      value={formData.check_out_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_start: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="check_out_end">Batas Check Out</Label>
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

                <div>
                  <Label htmlFor="class_id">Kelas (Opsional)</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas (kosongkan untuk semua kelas)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Kelas</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Hari</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Toleransi</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium">{schedule.name}</TableCell>
                <TableCell>{dayNames[schedule.day_of_week]}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {schedule.check_in_start} - {schedule.check_in_end}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {schedule.check_out_start} - {schedule.check_out_end}
                  </div>
                </TableCell>
                <TableCell>{schedule.late_threshold_minutes} menit</TableCell>
                <TableCell>
                  {schedule.classes?.name || 'Semua Kelas'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(checked) => toggleActive(schedule.id, checked)}
                    />
                    <Badge variant={schedule.is_active ? "default" : "secondary"}>
                      {schedule.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
