
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
import { FileText, User, Clock, CheckCircle } from 'lucide-react';

const letterRequestSchema = z.object({
  student_id: z.string().min(1, 'Pilih siswa'),
  letter_type: z.enum(['aktif', 'mutasi', 'keterangan', 'rekomendasi', 'lulus']),
  purpose: z.string().min(1, 'Tujuan penggunaan wajib diisi'),
  additional_notes: z.string().optional(),
});

type LetterRequestFormData = z.infer<typeof letterRequestSchema>;

interface Student {
  id: string;
  full_name: string;
  nis: string;
}

interface LetterRequest {
  id: string;
  request_number: string;
  letter_type: string;
  purpose: string;
  status: string;
  created_at: string;
  students: { full_name: string; nis: string };
}

export const LetterRequestForm = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [letterRequests, setLetterRequests] = useState<LetterRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<LetterRequestFormData>({
    resolver: zodResolver(letterRequestSchema),
  });

  useEffect(() => {
    fetchStudents();
    fetchLetterRequests();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, nis')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Gagal memuat data siswa');
    }
  };

  const fetchLetterRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('letter_requests')
        .select(`
          id,
          request_number,
          letter_type,
          purpose,
          status,
          created_at,
          students (full_name, nis)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLetterRequests(data || []);
    } catch (error) {
      console.error('Error fetching letter requests:', error);
      toast.error('Gagal memuat riwayat permohonan surat');
    }
  };

  const onSubmit = async (data: LetterRequestFormData) => {
    setIsSubmitting(true);
    try {
      const requestData = {
        request_number: '', // Will be auto-generated
        student_id: data.student_id,
        letter_type: data.letter_type,
        purpose: data.purpose,
        additional_notes: data.additional_notes,
        status: 'pending',
      };

      const { error } = await supabase
        .from('letter_requests')
        .insert([requestData]);

      if (error) throw error;

      toast.success('Permohonan surat berhasil diajukan');
      form.reset();
      fetchLetterRequests();
    } catch (error) {
      console.error('Error creating letter request:', error);
      toast.error('Gagal mengajukan permohonan surat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Menunggu' },
      processing: { variant: 'default' as const, label: 'Diproses' },
      ready: { variant: 'outline' as const, label: 'Siap' },
      completed: { variant: 'default' as const, label: 'Selesai' },
      rejected: { variant: 'destructive' as const, label: 'Ditolak' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLetterTypeLabel = (type: string) => {
    const types = {
      aktif: 'Surat Keterangan Aktif',
      mutasi: 'Surat Mutasi',
      keterangan: 'Surat Keterangan',
      rekomendasi: 'Surat Rekomendasi',
      lulus: 'Surat Keterangan Lulus',
    };
    return types[type as keyof typeof types] || type;
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Permohonan Surat
          </CardTitle>
          <CardDescription>
            Ajukan permohonan surat keterangan untuk siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cari Siswa</label>
                <Input
                  placeholder="Cari nama atau NIS siswa"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Pilih Siswa
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih siswa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name} - {student.nis}
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
                name="letter_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Surat</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis surat" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aktif">Surat Keterangan Aktif</SelectItem>
                        <SelectItem value="mutasi">Surat Mutasi</SelectItem>
                        <SelectItem value="keterangan">Surat Keterangan</SelectItem>
                        <SelectItem value="rekomendasi">Surat Rekomendasi</SelectItem>
                        <SelectItem value="lulus">Surat Keterangan Lulus</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tujuan Penggunaan</FormLabel>
                    <FormControl>
                      <Input placeholder="Untuk keperluan apa surat ini digunakan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additional_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Tambahan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informasi tambahan yang diperlukan (opsional)"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Mengajukan...' : 'Ajukan Permohonan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Riwayat Permohonan Surat
          </CardTitle>
        </CardHeader>
        <CardContent>
          {letterRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada permohonan surat yang diajukan
            </p>
          ) : (
            <div className="space-y-4">
              {letterRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{request.request_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {request.students?.full_name} - {request.students?.nis}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Jenis:</span> {getLetterTypeLabel(request.letter_type)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Tujuan:</span> {request.purpose}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Diajukan: {new Date(request.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
