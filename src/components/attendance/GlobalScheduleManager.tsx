import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Plus, Edit, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AttendanceSchedule {
  id: string;
  name: string;
  day_of_week: number;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  late_threshold_minutes: number;
  applies_to_all_classes: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Holiday {
  id: string;
  holiday_name: string;
  holiday_date: string;
  holiday_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' }
];

export const GlobalScheduleManager = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AttendanceSchedule | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  
  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    day_of_week: 1,
    check_in_start: '06:30',
    check_in_end: '07:30',
    check_out_start: '14:00',
    check_out_end: '15:00',
    late_threshold_minutes: 15,
    applies_to_all_classes: true
  });

  const [holidayFormData, setHolidayFormData] = useState({
    holiday_name: '',
    holiday_date: '',
    holiday_type: 'national'
  });

  // Fetch schedules
  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('attendance_schedules')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data jadwal",
        variant: "destructive"
      });
      return;
    }

    setSchedules(data || []);
  };

  // Fetch holidays
  const fetchHolidays = async () => {
    const { data, error } = await supabase
      .from('attendance_holidays')
      .select('*')
      .order('holiday_date', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data libur",
        variant: "destructive"
      });
      return;
    }

    setHolidays(data || []);
  };

  useEffect(() => {
    fetchSchedules();
    fetchHolidays();
  }, []);

  // Reset schedule form
  const resetScheduleForm = () => {
    setScheduleFormData({
      name: '',
      day_of_week: 1,
      check_in_start: '06:30',
      check_in_end: '07:30',
      check_out_start: '14:00',
      check_out_end: '15:00',
      late_threshold_minutes: 15,
      applies_to_all_classes: true
    });
    setEditingSchedule(null);
  };

  // Reset holiday form
  const resetHolidayForm = () => {
    setHolidayFormData({
      holiday_name: '',
      holiday_date: '',
      holiday_type: 'national'
    });
    setEditingHoliday(null);
  };

  // Handle schedule submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...scheduleFormData,
        name: scheduleFormData.name || `${DAYS_OF_WEEK.find(d => d.value === scheduleFormData.day_of_week)?.label} Global`
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

      setIsScheduleDialogOpen(false);
      resetScheduleForm();
      fetchSchedules();
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

  // Handle holiday submit
  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingHoliday) {
        const { error } = await supabase
          .from('attendance_holidays')
          .update(holidayFormData)
          .eq('id', editingHoliday.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Hari libur berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('attendance_holidays')
          .insert(holidayFormData);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Hari libur berhasil ditambahkan"
        });
      }

      setIsHolidayDialogOpen(false);
      resetHolidayForm();
      fetchHolidays();
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

  // Handle schedule edit
  const handleScheduleEdit = (schedule: AttendanceSchedule) => {
    setEditingSchedule(schedule);
    setScheduleFormData({
      name: schedule.name,
      day_of_week: schedule.day_of_week,
      check_in_start: schedule.check_in_start,
      check_in_end: schedule.check_in_end,
      check_out_start: schedule.check_out_start,
      check_out_end: schedule.check_out_end,
      late_threshold_minutes: schedule.late_threshold_minutes,
      applies_to_all_classes: schedule.applies_to_all_classes
    });
    setIsScheduleDialogOpen(true);
  };

  // Handle holiday edit
  const handleHolidayEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayFormData({
      holiday_name: holiday.holiday_name,
      holiday_date: holiday.holiday_date,
      holiday_type: holiday.holiday_type
    });
    setIsHolidayDialogOpen(true);
  };

  // Delete schedule
  const deleteSchedule = async (id: string) => {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Delete holiday
  const deleteHoliday = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) return;

    try {
      const { error } = await supabase
        .from('attendance_holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Hari libur berhasil dihapus"
      });

      fetchHolidays();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Toggle schedule active status
  const toggleScheduleActive = async (id: string, isActive: boolean) => {
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

      fetchSchedules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Toggle holiday active status
  const toggleHolidayActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('attendance_holidays')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Hari libur berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`
      });

      fetchHolidays();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="schedules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedules">Jadwal Presensi</TabsTrigger>
          <TabsTrigger value="holidays">Hari Libur</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Jadwal Presensi Global
                </div>
                <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetScheduleForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Jadwal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleScheduleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="schedule_name">Nama Jadwal</Label>
                        <Input
                          id="schedule_name"
                          value={scheduleFormData.name}
                          onChange={(e) => setScheduleFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Contoh: Senin Reguler"
                        />
                      </div>

                      <div>
                        <Label htmlFor="day_of_week">Hari</Label>
                        <select
                          id="day_of_week"
                          value={scheduleFormData.day_of_week}
                          onChange={(e) => setScheduleFormData(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                          className="w-full p-2 border rounded-md"
                        >
                          {DAYS_OF_WEEK.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="check_in_start">Mulai Check-in</Label>
                          <Input
                            id="check_in_start"
                            type="time"
                            value={scheduleFormData.check_in_start}
                            onChange={(e) => setScheduleFormData(prev => ({ ...prev, check_in_start: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="check_in_end">Batas Check-in</Label>
                          <Input
                            id="check_in_end"
                            type="time"
                            value={scheduleFormData.check_in_end}
                            onChange={(e) => setScheduleFormData(prev => ({ ...prev, check_in_end: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="check_out_start">Mulai Check-out</Label>
                          <Input
                            id="check_out_start"
                            type="time"
                            value={scheduleFormData.check_out_start}
                            onChange={(e) => setScheduleFormData(prev => ({ ...prev, check_out_start: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="check_out_end">Batas Check-out</Label>
                          <Input
                            id="check_out_end"
                            type="time"
                            value={scheduleFormData.check_out_end}
                            onChange={(e) => setScheduleFormData(prev => ({ ...prev, check_out_end: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="late_threshold">Toleransi Keterlambatan (menit)</Label>
                        <Input
                          id="late_threshold"
                          type="number"
                          value={scheduleFormData.late_threshold_minutes}
                          onChange={(e) => setScheduleFormData(prev => ({ ...prev, late_threshold_minutes: parseInt(e.target.value) }))}
                          min="0"
                          max="60"
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="applies_to_all"
                          checked={scheduleFormData.applies_to_all_classes}
                          onCheckedChange={(checked) => setScheduleFormData(prev => ({ ...prev, applies_to_all_classes: checked }))}
                        />
                        <Label htmlFor="applies_to_all">Berlaku untuk semua kelas</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          {loading ? "Menyimpan..." : "Simpan"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsScheduleDialogOpen(false)}
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
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Pengaturan Jadwal Global</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Jadwal global akan berlaku untuk semua siswa. Sabtu dan Minggu otomatis dianggap libur kecuali ada jadwal khusus.
                      Hari libur nasional/agama yang terdaftar akan otomatis dideteksi sistem.
                    </p>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hari</TableHead>
                    <TableHead>Nama Jadwal</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Toleransi</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}
                      </TableCell>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>
                        {schedule.check_in_start} - {schedule.check_in_end}
                      </TableCell>
                      <TableCell>
                        {schedule.check_out_start} - {schedule.check_out_end}
                      </TableCell>
                      <TableCell>{schedule.late_threshold_minutes} menit</TableCell>
                      <TableCell>
                        <Badge variant={schedule.applies_to_all_classes ? "default" : "secondary"}>
                          {schedule.applies_to_all_classes ? "Global" : "Khusus"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={schedule.is_active}
                            onCheckedChange={(checked) => toggleScheduleActive(schedule.id, checked)}
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
                            onClick={() => handleScheduleEdit(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {schedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Belum ada jadwal presensi. Tambahkan jadwal pertama Anda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Manajemen Hari Libur
                </div>
                <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetHolidayForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Hari Libur
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingHoliday ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleHolidaySubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="holiday_name">Nama Hari Libur</Label>
                        <Input
                          id="holiday_name"
                          value={holidayFormData.holiday_name}
                          onChange={(e) => setHolidayFormData(prev => ({ ...prev, holiday_name: e.target.value }))}
                          placeholder="Contoh: Hari Kemerdekaan RI"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="holiday_date">Tanggal</Label>
                        <Input
                          id="holiday_date"
                          type="date"
                          value={holidayFormData.holiday_date}
                          onChange={(e) => setHolidayFormData(prev => ({ ...prev, holiday_date: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="holiday_type">Jenis Libur</Label>
                        <select
                          id="holiday_type"
                          value={holidayFormData.holiday_type}
                          onChange={(e) => setHolidayFormData(prev => ({ ...prev, holiday_type: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="national">Nasional</option>
                          <option value="religious">Keagamaan</option>
                          <option value="school">Sekolah</option>
                          <option value="regional">Regional</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          {loading ? "Menyimpan..." : "Simpan"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsHolidayDialogOpen(false)}
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
                    <TableHead>Nama Hari Libur</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.holiday_name}</TableCell>
                      <TableCell>
                        {new Date(holiday.holiday_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {holiday.holiday_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={holiday.is_active}
                            onCheckedChange={(checked) => toggleHolidayActive(holiday.id, checked)}
                          />
                          <Badge variant={holiday.is_active ? "default" : "secondary"}>
                            {holiday.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHolidayEdit(holiday)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteHoliday(holiday.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {holidays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Belum ada hari libur terdaftar. Tambahkan hari libur pertama Anda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};