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
import { Clock, Plus, Edit, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

interface UserPermissions {
  user_id: string;
  user_roles: string[];
  can_manage_schedules: boolean;
}

const dayNames = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export const ScheduleManager = () => {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AttendanceSchedule | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    day_of_week: '',
    check_in_start: '',
    check_in_end: '',
    check_out_start: '',
    check_out_end: '',
    late_threshold_minutes: '15',
    class_id: 'all'
  });

  // Check user permissions
  const checkUserPermissions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('debug_user_schedule_permissions');
      
      if (error) {
        console.error('Error checking permissions:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setUserPermissions(data[0]);
        console.log('User permissions:', data[0]);
      }
    } catch (error) {
      console.error('Error in checkUserPermissions:', error);
    }
  };

  // Fetch schedules and classes
  const fetchData = async () => {
    try {
      console.log('Fetching schedules with user:', user?.id);
      
      // Fetch schedules with detailed error logging
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
        console.error('Error fetching schedules:', schedulesError);
        toast({
          title: "Error",
          description: `Gagal memuat data jadwal: ${schedulesError.message} (Code: ${schedulesError.code})`,
          variant: "destructive"
        });
        
        // Check if it's a permission error
        if (schedulesError.code === '42501' || schedulesError.message.includes('permission')) {
          toast({
            title: "Permission Error",
            description: "Anda tidak memiliki izin untuk mengakses jadwal presensi. Hubungi administrator.",
            variant: "destructive"
          });
        }
        return;
      }

      console.log('Schedules fetched successfully:', schedulesData?.length || 0, 'items');
      setSchedules(schedulesData || []);

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (classesError) {
        console.error('Error fetching classes:', classesError);
        toast({
          title: "Error",
          description: "Gagal memuat data kelas: " + classesError.message,
          variant: "destructive"
        });
        return;
      }

      setClasses(classesData || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan tidak terduga",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkUserPermissions();
      fetchData();
    }
  }, [user]);

  // Check if user can manage schedules
  const canManageSchedules = () => {
    return hasRole('admin') || hasRole('waka_kesiswaan') || hasRole('tppk');
  };

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
      class_id: 'all'
    });
    setEditingSchedule(null);
  };

  // Handle form submit with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageSchedules()) {
      toast({
        title: "Permission Denied",
        description: "Anda tidak memiliki izin untuk mengelola jadwal presensi",
        variant: "destructive"
      });
      return;
    }
    
    // Validasi form
    if (!formData.name || !formData.day_of_week || !formData.check_in_start || !formData.check_in_end) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const data = {
        name: formData.name,
        day_of_week: parseInt(formData.day_of_week),
        check_in_start: formData.check_in_start,
        check_in_end: formData.check_in_end,
        check_out_start: formData.check_out_start || '15:15:00',
        check_out_end: formData.check_out_end || '17:15:00',
        late_threshold_minutes: parseInt(formData.late_threshold_minutes) || 15,
        class_id: formData.class_id === 'all' ? null : formData.class_id
      };

      console.log('Attempting to save schedule:', data);

      if (editingSchedule) {
        const { error } = await supabase
          .from('attendance_schedules')
          .update(data)
          .eq('id', editingSchedule.id);

        if (error) {
          console.error('Update error:', error);
          throw new Error(`Gagal memperbarui jadwal: ${error.message} (Code: ${error.code})`);
        }

        toast({
          title: "Berhasil",
          description: "Jadwal berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('attendance_schedules')
          .insert(data);

        if (error) {
          console.error('Insert error:', error);
          throw new Error(`Gagal menambahkan jadwal: ${error.message} (Code: ${error.code})`);
        }

        toast({
          title: "Berhasil",
          description: "Jadwal berhasil ditambahkan"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan jadwal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (schedule: AttendanceSchedule) => {
    if (!canManageSchedules()) {
      toast({
        title: "Permission Denied",
        description: "Anda tidak memiliki izin untuk mengedit jadwal presensi",
        variant: "destructive"
      });
      return;
    }

    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      day_of_week: schedule.day_of_week.toString(),
      check_in_start: schedule.check_in_start,
      check_in_end: schedule.check_in_end,
      check_out_start: schedule.check_out_start,
      check_out_end: schedule.check_out_end,
      late_threshold_minutes: schedule.late_threshold_minutes.toString(),
      class_id: schedule.class_id || 'all'
    });
    setIsDialogOpen(true);
  };

  // Handle delete with improved permission checking and error handling
  const handleDelete = async (id: string) => {
    if (!canManageSchedules()) {
      toast({
        title: "Permission Denied",
        description: "Anda tidak memiliki izin untuk menghapus jadwal presensi",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    setLoading(true);
    console.log('Attempting to delete schedule with ID:', id);

    try {
      // First, verify the record exists and user has access
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance_schedules')
        .select('id, name')
        .eq('id', id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking record existence:', checkError);
        throw new Error(`Gagal memverifikasi data: ${checkError.message} (Code: ${checkError.code})`);
      }

      if (!existingRecord) {
        console.log('Record not found, may have been already deleted');
        setSchedules(prevSchedules => 
          prevSchedules.filter(schedule => schedule.id !== id)
        );
        toast({
          title: "Info",
          description: "Data sudah tidak ada di database"
        });
        return;
      }

      console.log('Found record to delete:', existingRecord);

      // Proceed with deletion
      const { error: deleteError, count } = await supabase
        .from('attendance_schedules')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Gagal menghapus jadwal: ${deleteError.message} (Code: ${deleteError.code})`);
      }

      console.log('Delete operation completed. Rows affected:', count);

      if (count === 0) {
        console.warn('No rows were deleted - possible permission issue');
        throw new Error('Tidak ada data yang dihapus. Kemungkinan masalah permission atau data sudah tidak ada.');
      }

      // Update local state immediately
      setSchedules(prevSchedules => 
        prevSchedules.filter(schedule => schedule.id !== id)
      );

      toast({
        title: "Berhasil",
        description: `Jadwal "${existingRecord.name}" berhasil dihapus`
      });

      // Verify deletion and refresh data
      setTimeout(async () => {
        await fetchData();
      }, 500);

    } catch (error: any) {
      console.error('Error in handleDelete:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus jadwal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, isActive: boolean) => {
    if (!canManageSchedules()) {
      toast({
        title: "Permission Denied",
        description: "Anda tidak memiliki izin untuk mengubah status jadwal",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance_schedules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('Toggle error:', error);
        throw new Error(`Gagal mengubah status: ${error.message} (Code: ${error.code})`);
      }

      toast({
        title: "Berhasil",
        description: `Jadwal berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error toggling schedule:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status jadwal",
        variant: "destructive"
      });
    }
  };

  // Permission warning component
  const PermissionWarning = () => {
    if (canManageSchedules()) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Akses Terbatas</span>
        </div>
        <div className="text-sm text-yellow-600 mt-1">
          Anda hanya dapat melihat jadwal presensi. Untuk mengelola jadwal, diperlukan role: Admin, Waka Kesiswaan, atau TPPK.
        </div>
      </div>
    );
  };

  // Debug info component
  const DebugInfo = () => {
    if (!debugMode || !userPermissions) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Debug Information</span>
        </div>
        <div className="text-xs space-y-1">
          <div>User ID: {userPermissions.user_id}</div>
          <div>Roles: {userPermissions.user_roles?.join(', ') || 'No roles'}</div>
          <div>Can Manage: {userPermissions.can_manage_schedules ? '✅' : '❌'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PermissionWarning />
      <DebugInfo />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Manajemen Jadwal Presensi
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
                className="text-xs"
              >
                Debug
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  disabled={!canManageSchedules()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Jadwal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Nama Jadwal *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Senin - Kamis"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="day_of_week">Hari *</Label>
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

                    <div>
                      <Label htmlFor="late_threshold">Toleransi Terlambat (menit)</Label>
                      <Input
                        id="late_threshold"
                        type="number"
                        value={formData.late_threshold_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, late_threshold_minutes: e.target.value }))}
                        placeholder="15"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="check_in_start">Mulai Check In *</Label>
                      <Input
                        id="check_in_start"
                        type="time"
                        value={formData.check_in_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, check_in_start: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="check_in_end">Batas Check In *</Label>
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
                      <Label htmlFor="check_out_start">Pulang Normal Mulai</Label>
                      <Input
                        id="check_out_start"
                        type="time"
                        value={formData.check_out_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, check_out_start: e.target.value }))}
                        placeholder="15:15"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default: 15:15</p>
                    </div>
                    <div>
                      <Label htmlFor="check_out_end">Pulang Normal Sampai</Label>
                      <Input
                        id="check_out_end"
                        type="time"
                        value={formData.check_out_end}
                        onChange={(e) => setFormData(prev => ({ ...prev, check_out_end: e.target.value }))}
                        placeholder="17:15"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default: 17:15</p>
                    </div>
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
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg text-sm">
                    <div className="font-medium mb-1">Info Integrasi Presensi Mandiri:</div>
                    <ul className="text-xs space-y-1">
                      <li>• Jadwal ini akan otomatis digunakan oleh sistem presensi mandiri siswa</li>
                      <li>• Check in: Siswa harus di dalam area sekolah</li>
                      <li>• Check out: Siswa harus di luar area sekolah</li>
                      <li>• Pelanggaran otomatis tercatat jika pulang &lt; 15:15 atau &gt; 17:15</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Nama</TableHead>
                  <TableHead className="min-w-[80px]">Hari</TableHead>
                  <TableHead className="min-w-[120px]">Check In</TableHead>
                  <TableHead className="min-w-[120px]">Pulang Normal</TableHead>
                  <TableHead className="min-w-[80px]">Toleransi</TableHead>
                  <TableHead className="min-w-[100px]">Kelas</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Belum ada jadwal presensi. {canManageSchedules() ? 'Klik "Tambah Jadwal" untuk menambahkan jadwal baru.' : 'Hubungi administrator untuk menambahkan jadwal.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
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
                            disabled={!canManageSchedules()}
                          />
                          <Badge variant={schedule.is_active ? "default" : "secondary"}>
                            {schedule.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                            disabled={loading || !canManageSchedules()}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(schedule.id)}
                            disabled={loading || !canManageSchedules()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {schedules.length > 0 && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium text-green-800 mb-2">✅ Status Integrasi Presensi Mandiri</div>
                <div className="text-green-700 space-y-1">
                  <div>• Jadwal presensi telah terintegrasi penuh dengan sistem presensi mandiri siswa</div>
                  <div>• Siswa akan menggunakan jadwal aktif sesuai hari ini untuk validasi check in/out</div>
                  <div>• Sistem otomatis mencatat pelanggaran berdasarkan jadwal yang telah ditentukan</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
