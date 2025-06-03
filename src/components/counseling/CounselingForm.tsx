
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const counselingSchema = z.object({
  student_id: z.string().min(1, 'Pilih siswa'),
  session_date: z.date({
    required_error: 'Pilih tanggal sesi',
  }),
  session_time: z.string().min(1, 'Tentukan waktu sesi'),
  duration_minutes: z.number().min(15, 'Durasi minimal 15 menit'),
  session_type: z.enum(['individual', 'group', 'family']),
  topic: z.string().optional(),
  follow_up_required: z.boolean(),
  follow_up_date: z.date().optional(),
});

type CounselingFormData = z.infer<typeof counselingSchema>;

interface CounselingFormProps {
  onSuccess: () => void;
}

export const CounselingForm = ({ onSuccess }: CounselingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CounselingFormData>({
    resolver: zodResolver(counselingSchema),
    defaultValues: {
      session_type: 'individual',
      duration_minutes: 60,
      follow_up_required: false,
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students-for-counseling'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          nis,
          current_class:student_enrollments!inner(
            class:classes!inner(name)
          )
        `)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      
      return data.map(student => ({
        ...student,
        current_class: student.current_class?.[0]?.class
      }));
    },
  });

  const onSubmit = async (data: CounselingFormData) => {
    setIsSubmitting(true);
    try {
      const sessionData = {
        student_id: data.student_id,
        counselor_id: user?.id!,
        session_date: format(data.session_date, 'yyyy-MM-dd'),
        session_time: data.session_time,
        duration_minutes: data.duration_minutes,
        session_type: data.session_type,
        topic: data.topic || null,
        follow_up_required: data.follow_up_required,
        follow_up_date: data.follow_up_required && data.follow_up_date 
          ? format(data.follow_up_date, 'yyyy-MM-dd') 
          : null,
        status: 'scheduled',
      };

      const { error } = await supabase
        .from('counseling_sessions')
        .insert(sessionData);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Sesi konseling berhasil dijadwalkan',
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating counseling session:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menjadwalkan sesi konseling',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Jadwal Sesi Konseling</CardTitle>
        <CardDescription>
          Buat jadwal sesi bimbingan konseling untuk siswa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Siswa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih siswa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.nis}) - {student.current_class?.name || 'Tanpa Kelas'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="session_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Sesi</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: id })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="session_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu Sesi</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durasi (menit)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="15"
                        max="240"
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
                name="session_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Sesi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis sesi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="group">Kelompok</SelectItem>
                        <SelectItem value="family">Keluarga</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topik/Tujuan Konseling</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan topik atau tujuan sesi konseling..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="follow_up_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Perlu Tindak Lanjut</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Centang jika sesi ini memerlukan tindak lanjut
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('follow_up_required') && (
              <FormField
                control={form.control}
                name="follow_up_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Tindak Lanjut</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: id })
                            ) : (
                              <span>Pilih tanggal tindak lanjut</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Menjadwalkan...' : 'Jadwalkan Sesi'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
