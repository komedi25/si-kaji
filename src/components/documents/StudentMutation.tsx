
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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserX, School, FileText, CheckCircle } from 'lucide-react';

const mutationSchema = z.object({
  student_id: z.string().min(1, 'Pilih siswa'),
  mutation_type: z.enum(['masuk', 'keluar']),
  mutation_date: z.string().min(1, 'Tanggal mutasi wajib diisi'),
  origin_school: z.string().optional(),
  destination_school: z.string().optional(),
  reason: z.string().min(1, 'Alasan mutasi wajib diisi'),
  documents_required: z.array(z.string()).min(1, 'Pilih minimal satu dokumen'),
  notes: z.string().optional(),
});

type MutationFormData = z.infer<typeof mutationSchema>;

interface Student {
  id: string;
  full_name: string;
  nis: string;
}

interface StudentMutation {
  id: string;
  mutation_type: string;
  mutation_date: string;
  status: string;
  destination_school: string;
  origin_school: string;
  reason: string;
  students: { full_name: string; nis: string };
}

const documentOptions = [
  'Surat Keterangan Kelakuan Baik',
  'Transkrip Nilai',
  'Raport',
  'Surat Keterangan Sehat',
  'Kartu Keluarga',
  'Akta Kelahiran',
  'Surat Pernyataan Orang Tua',
  'Pas Foto'
];

export const StudentMutation = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [mutations, setMutations] = useState<StudentMutation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MutationFormData>({
    resolver: zodResolver(mutationSchema),
    defaultValues: {
      mutation_type: 'keluar',
      mutation_date: new Date().toISOString().split('T')[0],
      documents_required: [],
    },
  });

  useEffect(() => {
    fetchStudents();
    fetchMutations();
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

  const fetchMutations = async () => {
    try {
      const { data, error } = await supabase
        .from('student_mutations')
        .select(`
          id,
          mutation_type,
          mutation_date,
          status,
          destination_school,
          origin_school,
          reason,
          students (full_name, nis)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMutations(data || []);
    } catch (error) {
      console.error('Error fetching mutations:', error);
      toast.error('Gagal memuat data mutasi');
    }
  };

  const onSubmit = async (data: MutationFormData) => {
    setIsSubmitting(true);
    try {
      const mutationData = {
        student_id: data.student_id,
        mutation_type: data.mutation_type,
        mutation_date: data.mutation_date,
        origin_school: data.origin_school,
        destination_school: data.destination_school,
        reason: data.reason,
        documents_required: data.documents_required,
        notes: data.notes,
        status: 'pending',
      };

      const { error } = await supabase
        .from('student_mutations')
        .insert([mutationData]);

      if (error) throw error;

      toast.success('Permohonan mutasi berhasil diajukan');
      form.reset();
      fetchMutations();
    } catch (error) {
      console.error('Error creating mutation:', error);
      toast.error('Gagal mengajukan mutasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (mutationId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {
        status,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('student_mutations')
        .update(updateData)
        .eq('id', mutationId);

      if (error) throw error;

      toast.success(`Mutasi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      fetchMutations();
    } catch (error) {
      console.error('Error updating mutation:', error);
      toast.error('Gagal memproses mutasi');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      completed: 'outline'
    } as const;
    
    const labels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      completed: 'Selesai'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getMutationTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'masuk' ? 'default' : 'outline'}>
        {type === 'masuk' ? 'Mutasi Masuk' : 'Mutasi Keluar'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Form Mutasi Siswa
          </CardTitle>
          <CardDescription>
            Ajukan permohonan mutasi siswa masuk atau keluar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mutation_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Mutasi</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis mutasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masuk">Mutasi Masuk</SelectItem>
                          <SelectItem value="keluar">Mutasi Keluar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Siswa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih siswa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
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
                  name="mutation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Mutasi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="origin_school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        Sekolah Asal
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nama sekolah asal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination_school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sekolah Tujuan</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama sekolah tujuan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Mutasi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Jelaskan alasan mutasi"
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
                name="documents_required"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Dokumen yang Diperlukan
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {documentOptions.map((doc) => (
                        <FormField
                          key={doc}
                          control={form.control}
                          name="documents_required"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={doc}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(doc)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, doc])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== doc
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {doc}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Tambahan</FormLabel>
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
                {isSubmitting ? 'Mengajukan...' : 'Ajukan Mutasi'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mutasi Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {mutations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada data mutasi siswa
            </p>
          ) : (
            <div className="space-y-4">
              {mutations.map((mutation) => (
                <div key={mutation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        {mutation.students?.full_name} - {mutation.students?.nis}
                      </h4>
                      {getMutationTypeBadge(mutation.mutation_type)}
                    </div>
                    {getStatusBadge(mutation.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                    <div>
                      <span className="font-medium">Tanggal:</span> {new Date(mutation.mutation_date).toLocaleDateString('id-ID')}
                    </div>
                    <div>
                      <span className="font-medium">Asal:</span> {mutation.origin_school || '-'}
                    </div>
                    <div>
                      <span className="font-medium">Tujuan:</span> {mutation.destination_school || '-'}
                    </div>
                  </div>
                  <p className="text-sm mb-3">{mutation.reason}</p>
                  
                  {mutation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(mutation.id, 'approved')}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApproval(mutation.id, 'rejected')}
                      >
                        Tolak
                      </Button>
                    </div>
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
