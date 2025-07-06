
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Plus, Edit, Trash2 } from 'lucide-react';

interface CounselingSchedule {
  id: string;
  counselor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_sessions_per_slot: number;
  is_active: boolean;
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

export const CounselingScheduleManager = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<CounselingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CounselingSchedule | null>(null);
  
  const [formData, setFormData] = useState({
    day_of_week: '',
    start_time: '',
    end_time: '',
    max_sessions_per_slot: 1
  });

  const canManageSchedules = hasRole('guru_bk') || hasRole('admin') || hasRole('waka_kesiswaan');

  useEffect(() => {
    if (canManageSchedules) {
      fetchSchedules();
    }
  }, [user, canManageSchedules]);

  const fetchSchedules = async () => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from('counseling_schedules')
        .select('*')
        .order('day_of_week')
        .order('start_time');

      // If user is counselor, only show their schedules
      if (hasRole('guru_bk') && !hasRole('admin')) {
        query = query.eq('counselor_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Gagal memuat jadwal konseling",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.day_of_week || !formData.start_time || !formData.end_time) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field",
        variant: "destructive"
      });
      return;
    }

    try {
      const scheduleData = {
        counselor_id: user.id,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_sessions_per_slot: formData.max_sessions_per_slot,
        is_active: true
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('counseling_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast({ title: "Berhasil", description: "Jadwal berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from('counseling_schedules')
          .insert(scheduleData);

        if (error) throw error;
        toast({ title: "Berhasil", description: "Jadwal berhasil ditambahkan" });
      }

      // Reset form
      setFormData({
        day_of_week: '',
        start_time: '',
        end_time: '',
        max_sessions_per_slot: 1
      });
      setShowAddForm(false);
      setEditingSchedule(null);
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

  const handleEdit = (schedule: CounselingSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      day_of_week: schedule.day_of_week.toString(),
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_sessions_per_slot: schedule.max_sessions_per_slot
    });
    setShowAddForm(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    try {
      const { error } = await supabase
        .from('counseling_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Jadwal berhasil dihapus" });
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

  const toggleScheduleStatus = async (scheduleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('counseling_schedules')
        .update({ is_active: !currentStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Jadwal ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status jadwal",
        variant: "destructive"
      });
    }
  };

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || 'Unknown';
  };

  if (!canManageSchedules) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Anda tidak memiliki akses untuk mengelola jadwal konseling</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Konseling BK
            </CardTitle>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Jadwal
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="day">Hari</Label>
                      <Select
                        value={formData.day_of_week}
                        onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih hari" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="maxSessions">Maks Sesi per Slot</Label>
                      <Input
                        id="maxSessions"
                        type="number"
                        min="1"
                        max="5"
                        value={formData.max_sessions_per_slot}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          max_sessions_per_slot: parseInt(e.target.value) || 1 
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="startTime">Waktu Mulai</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="endTime">Waktu Selesai</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingSchedule ? 'Perbarui' : 'Tambah'} Jadwal
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingSchedule(null);
                        setFormData({
                          day_of_week: '',
                          start_time: '',
                          end_time: '',
                          max_sessions_per_slot: 1
                        });
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada jadwal konseling yang dibuat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {getDayLabel(schedule.day_of_week)}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule.start_time} - {schedule.end_time}
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Maks {schedule.max_sessions_per_slot} sesi per slot</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={schedule.is_active ? "default" : "secondary"}>
                          {schedule.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleScheduleStatus(schedule.id, schedule.is_active)}
                        >
                          {schedule.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
