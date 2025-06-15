
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, FileText, Send, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const caseReportSchema = z.object({
  title: z.string().min(5, 'Judul laporan minimal 5 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  category: z.enum(['bullying', 'kekerasan', 'narkoba', 'pergaulan_bebas', 'tawuran', 'pencurian', 'vandalisme', 'lainnya']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  is_anonymous: z.boolean().default(false),
  reporter_name: z.string().optional(),
  reporter_contact: z.string().optional(),
  reported_student_name: z.string().optional(),
  reported_student_class: z.string().optional(),
  incident_date: z.string().optional(),
  incident_location: z.string().optional(),
  witnesses: z.string().optional(),
});

type CaseReportFormData = z.infer<typeof caseReportSchema>;

export const CaseReportForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCaseNumber, setSubmittedCaseNumber] = useState<string | null>(null);

  const form = useForm<CaseReportFormData>({
    resolver: zodResolver(caseReportSchema),
    defaultValues: {
      priority: 'medium',
      is_anonymous: false,
    },
  });

  const watchIsAnonymous = form.watch('is_anonymous');

  const onSubmit = async (data: CaseReportFormData) => {
    setIsSubmitting(true);
    console.log('Submitting case report:', data);
    
    try {
      // Prepare the case data for submission - provide empty case_number for trigger to generate
      const caseData = {
        case_number: '', // This will be overridden by the database trigger
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        is_anonymous: data.is_anonymous,
        reporter_name: data.is_anonymous ? null : data.reporter_name,
        reporter_contact: data.is_anonymous ? null : data.reporter_contact,
        reported_student_name: data.reported_student_name || null,
        reported_student_class: data.reported_student_class || null,
        incident_date: data.incident_date ? new Date(data.incident_date).toISOString().split('T')[0] : null,
        incident_location: data.incident_location || null,
        witnesses: data.witnesses || null,
        reported_by: user?.id || null,
        status: 'pending' as const,
        assigned_handler: null,
      };

      console.log('Prepared case data:', caseData);

      const { data: insertedCase, error } = await supabase
        .from('student_cases')
        .insert(caseData)
        .select('case_number')
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Case inserted successfully:', insertedCase);

      setSubmittedCaseNumber(insertedCase.case_number);
      
      toast({
        title: 'Laporan Berhasil Dikirim',
        description: `Nomor tiket: ${insertedCase.case_number}. Simpan nomor ini untuk melacak status laporan Anda.`,
      });

      // Reset form
      form.reset();
      
    } catch (error: any) {
      console.error('Error submitting case report:', error);
      toast({
        title: 'Gagal Mengirim Laporan',
        description: error.message || 'Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedCaseNumber) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-700">Laporan Berhasil Dikirim</CardTitle>
          <CardDescription>
            Laporan Anda telah berhasil dikirim dan akan segera ditinjau oleh tim terkait
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Nomor Tiket Anda: {submittedCaseNumber}</strong>
              <br />
              Simpan nomor tiket ini untuk melacak status laporan Anda
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => setSubmittedCaseNumber(null)} variant="outline">
              Laporkan Kasus Lain
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Form Pelaporan Kasus
        </CardTitle>
        <CardDescription>
          Laporkan kasus atau masalah yang terjadi di lingkungan sekolah. 
          Semua laporan akan ditangani dengan serius dan terjaga kerahasiaannya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori Kasus *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bullying">Bullying/Perundungan</SelectItem>
                        <SelectItem value="kekerasan">Kekerasan</SelectItem>
                        <SelectItem value="narkoba">Narkoba/NAPZA</SelectItem>
                        <SelectItem value="pergaulan_bebas">Pergaulan Bebas</SelectItem>
                        <SelectItem value="tawuran">Tawuran</SelectItem>
                        <SelectItem value="pencurian">Pencurian</SelectItem>
                        <SelectItem value="vandalisme">Vandalisme</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
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
                    <FormLabel>Tingkat Prioritas *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Rendah</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="high">Tinggi</SelectItem>
                        <SelectItem value="critical">Kritis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Laporan *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ringkasan singkat tentang kasus yang dilaporkan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Kasus *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Jelaskan kronologi kejadian secara detail..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Berikan informasi selengkap mungkin tentang kejadian yang dilaporkan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <FormLabel>
                      Laporan Anonim
                    </FormLabel>
                    <FormDescription>
                      Centang jika Anda ingin melaporkan secara anonim (identitas tidak dicantumkan)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!watchIsAnonymous && (
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
                        <Input placeholder="Email atau nomor telepon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Informasi Tambahan (Opsional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reported_student_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Siswa Terlibat</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama siswa yang terlibat" {...field} />
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
                        <Input placeholder="Contoh: X TKJ 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incident_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Kejadian</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
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
                        <Input placeholder="Contoh: Ruang kelas, kantin, dll" {...field} />
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
                    <FormLabel>Saksi/Informasi Tambahan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nama saksi atau informasi tambahan yang relevan..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  'Mengirim...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Laporan
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
