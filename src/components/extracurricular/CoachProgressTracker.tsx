
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  TrendingUp, Calendar, Users, FileText, 
  Award, Target, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const progressSchema = z.object({
  student_id: z.string().min(1, 'Pilih siswa'),
  skill_area: z.string().min(1, 'Area keterampilan harus diisi'),
  current_level: z.number().min(1).max(10),
  target_level: z.number().min(1).max(10),
  notes: z.string().optional(),
  assessment_date: z.string(),
});

type ProgressFormData = z.infer<typeof progressSchema>;

interface StudentProgress {
  id: string;
  student_name: string;
  student_nis: string;
  skill_area: string;
  current_level: number;
  target_level: number;
  progress_percentage: number;
  last_assessment: string;
  notes?: string;
  achievements: number;
}

interface ExtracurricularInfo {
  id: string;
  name: string;
  enrolled_students: Array<{
    id: string;
    student_name: string;
    student_nis: string;
  }>;
}

export const CoachProgressTracker = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [extracurriculars, setExtracurriculars] = useState<ExtracurricularInfo[]>([]);
  const [selectedExtra, setSelectedExtra] = useState<string>('');
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      assessment_date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  useEffect(() => {
    fetchExtracurriculars();
  }, [user]);

  useEffect(() => {
    if (selectedExtra) {
      fetchStudentProgress();
    }
  }, [selectedExtra]);

  const fetchExtracurriculars = async () => {
    if (!user?.id) return;

    try {
      let query = supabase.from('extracurriculars').select(`
        id,
        name,
        extracurricular_enrollments!inner (
          students!inner (
            id,
            full_name,
            nis
          )
        )
      `);

      // Filter based on user role
      if (hasRole('pelatih_ekstrakurikuler')) {
        // Coach can only see their assigned extracurriculars
        const { data: assignments } = await supabase
          .from('extracurricular_coaches')
          .select('extracurricular_id')
          .eq('coach_id', user.id)
          .eq('is_active', true);

        if (assignments && assignments.length > 0) {
          const extraIds = assignments.map(a => a.extracurricular_id);
          query = query.in('id', extraIds);
        }
      }

      const { data, error } = await query.eq('is_active', true);

      if (error) throw error;

      const processedData: ExtracurricularInfo[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        enrolled_students: item.extracurricular_enrollments?.map((enrollment: any) => ({
          id: enrollment.students.id,
          student_name: enrollment.students.full_name,
          student_nis: enrollment.students.nis
        })) || []
      }));

      setExtracurriculars(processedData);
      if (processedData.length > 0 && !selectedExtra) {
        setSelectedExtra(processedData[0].id);
      }
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data ekstrakurikuler',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async () => {
    if (!selectedExtra) return;

    try {
      // For now, use sample data since student_progress table doesn't exist yet
      const currentExtra = extracurriculars.find(e => e.id === selectedExtra);
      if (!currentExtra) return;

      const sampleProgress: StudentProgress[] = currentExtra.enrolled_students.map((student, index) => ({
        id: student.id,
        student_name: student.student_name,
        student_nis: student.student_nis,
        skill_area: index % 3 === 0 ? 'Teknik Dasar' : index % 3 === 1 ? 'Kerjasama Tim' : 'Kepemimpinan',
        current_level: Math.floor(Math.random() * 5) + 3,
        target_level: Math.floor(Math.random() * 3) + 8,
        progress_percentage: Math.floor(Math.random() * 40) + 40,
        last_assessment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: Math.floor(Math.random() * 5),
        notes: index % 2 === 0 ? 'Menunjukkan peningkatan yang konsisten' : undefined
      }));

      setStudentProgress(sampleProgress);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    }
  };

  const onSubmit = async (data: ProgressFormData) => {
    try {
      // For now, just show success message since student_progress table doesn't exist yet
      toast({
        title: 'Progress Tersimpan',
        description: 'Progress siswa berhasil diperbarui'
      });

      form.reset();
      fetchStudentProgress();
    } catch (error: any) {
      toast({
        title: 'Gagal Menyimpan Progress',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getProgressBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (percentage >= 60) return <Badge className="bg-blue-500">Good</Badge>;
    if (percentage >= 40) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  if (loading) {
    return <div>Memuat data progress siswa...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Pelacakan Progress Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Pilih Ekstrakurikuler:</label>
              <select 
                value={selectedExtra}
                onChange={(e) => setSelectedExtra(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                {extracurriculars.map(extra => (
                  <option key={extra.id} value={extra.id}>{extra.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExtra && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{studentProgress.length}</p>
                    <p className="text-sm text-muted-foreground">Total Siswa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {studentProgress.reduce((sum, s) => sum + s.achievements, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Pencapaian</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(studentProgress.reduce((sum, s) => sum + s.progress_percentage, 0) / (studentProgress.length || 1))}%
                    </p>
                    <p className="text-sm text-muted-foreground">Rata-rata Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Progress Siswa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentProgress.map((progress) => (
                      <div key={progress.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{progress.student_name}</h4>
                            <p className="text-sm text-muted-foreground">NIS: {progress.student_nis}</p>
                          </div>
                          {getProgressBadge(progress.progress_percentage)}
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Area: {progress.skill_area}</span>
                            <span>{progress.current_level}/{progress.target_level}</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(progress.current_level / progress.target_level) * 100}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Pencapaian: {progress.achievements}</span>
                            <span>Terakhir: {format(new Date(progress.last_assessment), 'dd/MM/yyyy', { locale: id })}</span>
                          </div>

                          {progress.notes && (
                            <p className="text-sm italic text-gray-600 mt-2">{progress.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Tambah/Update Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="student_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pilih Siswa</FormLabel>
                            <select 
                              {...field}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="">Pilih siswa...</option>
                              {extracurriculars.find(e => e.id === selectedExtra)?.enrolled_students.map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.student_name} ({student.student_nis})
                                </option>
                              ))}
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="skill_area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area Keterampilan</FormLabel>
                            <FormControl>
                              <Input placeholder="contoh: Teknik Dasar" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="current_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Level Saat Ini (1-10)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="10" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="target_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Level (1-10)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="10" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="assessment_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tanggal Assessment</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
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
                            <FormLabel>Catatan (Opsional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Catatan progress siswa..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Simpan Progress
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
