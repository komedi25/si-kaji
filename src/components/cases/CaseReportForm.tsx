
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const caseSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  category: z.enum(['bullying', 'kekerasan', 'narkoba', 'pergaulan_bebas', 'tawuran', 'pencurian', 'vandalisme', 'lainnya']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  is_anonymous: z.boolean(),
  reporter_name: z.string().optional(),
  reporter_contact: z.string().optional(),
  reported_student_name: z.string().optional(),
  reported_student_class: z.string().optional(),
  incident_date: z.date().optional(),
  incident_location: z.string().optional(),
  witnesses: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

export const CaseReportForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      priority: 'medium',
      is_anonymous: false,
    },
  });

  const onSubmit = async (data: CaseFormData) => {
    setIsSubmitting(true);
    try {
      const caseData = {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        is_anonymous: data.is_anonymous,
        reporter_name: data.reporter_name || null,
        reporter_contact: data.reporter_contact || null,
        reported_student_name: data.reported_student_name || null,
        reported_student_class: data.reported_student_class || null,
        incident_date: data.incident_date ? format(data.incident_date, 'yyyy-MM-dd') : null,
        incident_location: data.incident_location || null,
        witnesses: data.witnesses || null,
        reported_by: data.is_anonymous ? null : user?.id,
      };

      const { error } = await supabase
        .from('student_cases')
        .insert(caseData);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Laporan kasus berhasil dikirim',
      });

      form.reset();
    } catch (error) {
      console.error('Error submitting case:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengirim laporan kasus',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'bullying', label: 'Bullying/Perundungan' },
    { value: 'kekerasan', label: 'Kekerasan' },
    { value: 'narkoba', label: 'Narkoba/NAPZA' },
    { value: 'pergaulan_bebas', label: 'Pergaulan Bebas' },
    { value: 'tawuran', label: 'Tawuran' },
    { value: 'pencurian', label: 'Pencurian' },
    { value: 'vandalisme', label: 'Vandalisme' },
    { value: 'lainnya', label: 'Lainnya' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Rendah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'high', label: 'Tinggi' },
    { value: 'critical', label: 'Kritis' },
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Laporan Kasus Siswa</CardTitle>
        <CardDescription>
          Laporkan kejadian atau kasus yang memerlukan penanganan khusus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="is_anonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Laporan Anonim</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Centang jika ingin melaporkan secara anonim
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {!form.watch('is_anonymous') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reporter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pelapor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap pelapor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporter_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontak Pelapor</FormLabel>
                      <FormControl>
                        <Input placeholder="No. HP atau email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Kasus</FormLabel>
                  <FormControl>
                    <Input placeholder="Judul singkat kasus" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori Kasus</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Kasus</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan detail kejadian dengan lengkap..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reported_student_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Siswa Terlibat</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama siswa (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reported_student_class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas Siswa</FormLabel>
                    <FormControl>
                      <Input placeholder="Kelas siswa (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="incident_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Kejadian</FormLabel>
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
                            date > new Date() || date < new Date('1900-01-01')
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
                name="incident_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi Kejadian</FormLabel>
                    <FormControl>
                      <Input placeholder="Tempat kejadian (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="witnesses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saksi-saksi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nama saksi atau orang yang melihat kejadian (opsional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
