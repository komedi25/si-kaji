
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';

const proposalSchema = z.object({
  title: z.string().min(1, 'Judul proposal wajib diisi'),
  description: z.string().optional(),
  activity_type: z.enum(['osis', 'ekstrakurikuler', 'akademik', 'lainnya']),
  organizer_name: z.string().min(1, 'Nama penyelenggara wajib diisi'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  estimated_participants: z.number().min(1).optional(),
  budget_estimation: z.number().min(0).optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export const ActivityProposalForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      activity_type: 'osis',
      estimated_participants: 0,
      budget_estimation: 0,
    },
  });

  const onSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      const proposalData = {
        proposal_number: '', // Will be auto-generated
        title: data.title,
        description: data.description,
        activity_type: data.activity_type,
        organizer_id: user.id,
        organizer_name: data.organizer_name,
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
        estimated_participants: data.estimated_participants,
        budget_estimation: data.budget_estimation,
        status: 'draft',
      };

      const { error } = await supabase
        .from('activity_proposals')
        .insert([proposalData]);

      if (error) throw error;

      toast.success('Proposal kegiatan berhasil dibuat');
      form.reset();
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Gagal membuat proposal kegiatan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Form Proposal Kegiatan
        </CardTitle>
        <CardDescription>
          Buat proposal kegiatan OSIS/Ekstrakurikuler dengan lengkap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Judul Kegiatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan judul kegiatan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kegiatan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kegiatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="osis">OSIS</SelectItem>
                        <SelectItem value="ekstrakurikuler">Ekstrakurikuler</SelectItem>
                        <SelectItem value="akademik">Akademik</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Penyelenggara</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama organisasi/ekstrakurikuler" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai</FormLabel>
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
                    <FormLabel>Waktu Mulai</FormLabel>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Lokasi
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Lokasi kegiatan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Estimasi Peserta
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Jumlah peserta"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget_estimation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Estimasi Anggaran
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Anggaran dalam Rupiah"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Deskripsi Kegiatan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Jelaskan detail kegiatan, tujuan, dan rencana pelaksanaan"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
              <Button type="button" variant="outline" className="flex-1">
                Submit untuk Persetujuan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
