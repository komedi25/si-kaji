
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
import { BookOpen, Calendar, Users, FileText } from 'lucide-react';

const activityLogSchema = z.object({
  extracurricular_id: z.string().min(1, 'Pilih ekstrakurikuler'),
  log_date: z.string().min(1, 'Tanggal wajib diisi'),
  session_topic: z.string().min(1, 'Topik sesi wajib diisi'),
  session_description: z.string().optional(),
  materials_used: z.string().optional(),
  student_progress_notes: z.string().optional(),
  next_session_plan: z.string().optional(),
  attendance_count: z.number().min(0).optional(),
});

type ActivityLogFormData = z.infer<typeof activityLogSchema>;

interface Extracurricular {
  id: string;
  name: string;
  coach_id: string;
}

interface ActivityLog {
  id: string;
  log_date: string;
  session_topic: string;
  session_description: string;
  attendance_count: number;
  extracurricular: { name: string };
}

export const CoachActivityLog = () => {
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const form = useForm<ActivityLogFormData>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      attendance_count: 0,
    },
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchExtracurriculars();
      fetchActivityLogs();
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

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_activity_logs')
        .select(`
          id,
          log_date,
          session_topic,
          session_description,
          attendance_count,
          extracurriculars (name)
        `)
        .eq('coach_id', currentUserId)
        .order('log_date', { ascending: false });

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Gagal memuat jurnal kegiatan');
    }
  };

  const onSubmit = async (data: ActivityLogFormData) => {
    setIsSubmitting(true);
    try {
      const logData = {
        coach_id: currentUserId,
        extracurricular_id: data.extracurricular_id,
        log_date: data.log_date,
        session_topic: data.session_topic,
        session_description: data.session_description,
        materials_used: data.materials_used,
        student_progress_notes: data.student_progress_notes,
        next_session_plan: data.next_session_plan,
        attendance_count: data.attendance_count,
      };

      const { error } = await supabase
        .from('coach_activity_logs')
        .insert([logData]);

      if (error) throw error;

      toast.success('Jurnal kegiatan berhasil disimpan');
      form.reset();
      fetchActivityLogs();
    } catch (error) {
      console.error('Error saving activity log:', error);
      toast.error('Gagal menyimpan jurnal kegiatan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Jurnal Kegiatan Pelatih
          </CardTitle>
          <CardDescription>
            Catat kegiatan harian ekstrakurikuler yang Anda latih
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
                  name="log_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="session_topic"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Topik Sesi</FormLabel>
                      <FormControl>
                        <Input placeholder="Topik yang diajarkan hari ini" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attendance_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Jumlah Hadir
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
                name="session_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Kegiatan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Jelaskan detail kegiatan yang dilakukan"
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
                name="materials_used"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materi/Alat yang Digunakan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Daftar materi, alat, atau perlengkapan yang digunakan"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="student_progress_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Perkembangan Siswa</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Catat perkembangan dan prestasi siswa"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_session_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rencana Sesi Berikutnya</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Rencana materi atau kegiatan untuk sesi selanjutnya"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Riwayat Jurnal Kegiatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada jurnal kegiatan yang dicatat
            </p>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{log.session_topic}</h4>
                    <Badge variant="outline">
                      {new Date(log.log_date).toLocaleDateString('id-ID')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {log.extracurricular?.name}
                  </p>
                  {log.session_description && (
                    <p className="text-sm">{log.session_description}</p>
                  )}
                  {log.attendance_count && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">Kehadiran:</span> {log.attendance_count} siswa
                    </p>
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
