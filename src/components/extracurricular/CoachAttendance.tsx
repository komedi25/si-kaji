
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCheck, Calendar, Clock, Users } from 'lucide-react';

const attendanceSchema = z.object({
  extracurricular_id: z.string().min(1, 'Pilih ekstrakurikuler'),
  attendance_date: z.string().min(1, 'Tanggal wajib diisi'),
  start_time: z.string().min(1, 'Waktu mulai wajib diisi'),
  end_time: z.string().optional(),
  status: z.enum(['present', 'absent', 'late']),
  participant_count: z.number().min(0).optional(),
  activities_conducted: z.string().optional(),
  notes: z.string().optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface Extracurricular {
  id: string;
  name: string;
  coach_id: string;
}

interface CoachAttendance {
  id: string;
  attendance_date: string;
  start_time: string;
  end_time: string;
  status: string;
  participant_count: number;
  activities_conducted: string;
  extracurriculars: { name: string };
}

export const CoachAttendance = () => {
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [attendances, setAttendances] = useState<CoachAttendance[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      attendance_date: new Date().toISOString().split('T')[0],
      status: 'present',
      participant_count: 0,
    },
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchExtracurriculars();
      fetchAttendances();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchExtracurriculars = async () => {
    try {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select('id, name, coach_id')
        .eq('coach_id', currentUserId)
        .eq('is_active', true);

      if (error) throw error;
      setExtracurriculars(data || []);
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
      toast.error('Gagal memuat data ekstrakurikuler');
    }
  };

  const fetchAttendances = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_attendances')
        .select(`
          id,
          attendance_date,
          start_time,
          end_time,
          status,
          participant_count,
          activities_conducted,
          extracurriculars (name)
        `)
        .eq('coach_id', currentUserId)
        .order('attendance_date', { ascending: false });

      if (error) throw error;
      setAttendances(data || []);
    } catch (error) {
      console.error('Error fetching attendances:', error);
      toast.error('Gagal memuat data presensi');
    }
  };

  const onSubmit = async (data: AttendanceFormData) => {
    setIsSubmitting(true);
    try {
      const attendanceData = {
        coach_id: currentUserId,
        extracurricular_id: data.extracurricular_id,
        attendance_date: data.attendance_date,
        start_time: data.start_time,
        end_time: data.end_time,
        status: data.status,
        participant_count: data.participant_count,
        activities_conducted: data.activities_conducted,
        notes: data.notes,
      };

      const { error } = await supabase
        .from('coach_attendances')
        .insert([attendanceData]);

      if (error) throw error;

      toast.success('Presensi berhasil disimpan');
      form.reset();
      fetchAttendances();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Gagal menyimpan presensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary'
    } as const;
    
    const labels = {
      present: 'Hadir',
      absent: 'Tidak Hadir',
      late: 'Terlambat'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Presensi Pelatih
          </CardTitle>
          <CardDescription>
            Catat kehadiran Anda sebagai pelatih ekstrakurikuler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="extracurricular_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ekstrakurikuler</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih ekstrakurikuler" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {extracurriculars.map((extra) => (
                            <SelectItem key={extra.id} value={extra.id}>
                              {extra.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attendance_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Waktu Mulai
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Selesai</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Kehadiran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="present">Hadir</SelectItem>
                          <SelectItem value="late">Terlambat</SelectItem>
                          <SelectItem value="absent">Tidak Hadir</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participant_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Jumlah Peserta
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Jumlah siswa yang hadir"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="activities_conducted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kegiatan yang Dilakukan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Deskripsi kegiatan yang dilakukan"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Catatan tambahan"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Presensi</CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada data presensi
            </p>
          ) : (
            <div className="space-y-4">
              {attendances.map((attendance) => (
                <div key={attendance.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{attendance.extracurriculars?.name}</h4>
                    {getStatusBadge(attendance.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Tanggal:</span> {new Date(attendance.attendance_date).toLocaleDateString('id-ID')}
                    </div>
                    <div>
                      <span className="font-medium">Waktu:</span> {attendance.start_time} - {attendance.end_time}
                    </div>
                    <div>
                      <span className="font-medium">Peserta:</span> {attendance.participant_count} siswa
                    </div>
                  </div>
                  {attendance.activities_conducted && (
                    <p className="text-sm mt-2">{attendance.activities_conducted}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
