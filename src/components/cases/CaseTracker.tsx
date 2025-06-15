
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const trackingSchema = z.object({
  caseNumber: z.string().min(1, 'Nomor kasus harus diisi'),
});

type TrackingFormData = z.infer<typeof trackingSchema>;

interface CaseData {
  id: string;
  case_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  incident_date: string | null;
  incident_location: string | null;
  resolution_notes: string | null;
}

export const CaseTracker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchedCase, setSearchedCase] = useState<CaseData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const form = useForm<TrackingFormData>({
    resolver: zodResolver(trackingSchema),
  });

  const onSubmit = async (data: TrackingFormData) => {
    setIsSearching(true);
    try {
      const { data: caseData, error } = await supabase
        .from('student_cases')
        .select('*')
        .eq('case_number', data.caseNumber.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (caseData) {
        setSearchedCase(caseData as CaseData);
      } else {
        toast({
          title: 'Tidak Ditemukan',
          description: 'Nomor kasus tidak ditemukan. Pastikan nomor kasus sudah benar.',
          variant: 'destructive',
        });
        setSearchedCase(null);
      }
    } catch (error) {
      console.error('Error searching case:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mencari kasus. Silakan coba lagi.',
        variant: 'destructive',
      });
      setSearchedCase(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      under_review: { label: 'Ditinjau', variant: 'default' as const },
      investigating: { label: 'Investigasi', variant: 'default' as const },
      escalated: { label: 'Eskalasi', variant: 'destructive' as const },
      resolved: { label: 'Selesai', variant: 'outline' as const },
      closed: { label: 'Ditutup', variant: 'outline' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Rendah', variant: 'outline' as const },
      medium: { label: 'Sedang', variant: 'secondary' as const },
      high: { label: 'Tinggi', variant: 'default' as const },
      critical: { label: 'Kritis', variant: 'destructive' as const },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      bullying: 'Bullying/Perundungan',
      kekerasan: 'Kekerasan',
      narkoba: 'Narkoba/NAPZA',
      pergaulan_bebas: 'Pergaulan Bebas',
      tawuran: 'Tawuran',
      pencurian: 'Pencurian',
      vandalisme: 'Vandalisme',
      lainnya: 'Lainnya',
    };
    
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    setSearchedCase(null);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Lacak Status Laporan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lacak Status Laporan Kasus
          </DialogTitle>
          <DialogDescription>
            Masukkan nomor tiket kasus untuk melihat status laporan Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="caseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Tiket Kasus</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: CASE/2024/0001"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSearching} className="w-full">
                {isSearching ? 'Mencari...' : 'Cari Laporan'}
              </Button>
            </form>
          </Form>

          {searchedCase && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{searchedCase.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{searchedCase.case_number}</span>
                      <span>•</span>
                      <span>{getCategoryLabel(searchedCase.category)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(searchedCase.status)}
                    {getPriorityBadge(searchedCase.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Deskripsi:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {searchedCase.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Dilaporkan: {format(new Date(searchedCase.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Update Terakhir: {format(new Date(searchedCase.updated_at), 'dd MMMM yyyy HH:mm', { locale: id })}</span>
                  </div>

                  {searchedCase.incident_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Tanggal Kejadian: {format(new Date(searchedCase.incident_date), 'dd MMMM yyyy', { locale: id })}</span>
                    </div>
                  )}

                  {searchedCase.incident_location && (
                    <div className="text-sm">
                      <span className="font-medium">Lokasi: </span>
                      <span className="text-muted-foreground">{searchedCase.incident_location}</span>
                    </div>
                  )}
                </div>

                {searchedCase.resolution_notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Catatan Penyelesaian:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {searchedCase.resolution_notes}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Status Saat Ini:</h4>
                  <p className="text-sm text-blue-800">
                    {searchedCase.status === 'pending' && 'Laporan Anda sedang menunggu untuk ditinjau oleh tim terkait.'}
                    {searchedCase.status === 'under_review' && 'Laporan Anda sedang ditinjau dan dievaluasi oleh tim yang berwenang.'}
                    {searchedCase.status === 'investigating' && 'Tim sedang melakukan investigasi mendalam terkait laporan Anda.'}
                    {searchedCase.status === 'escalated' && 'Kasus telah dieskalasi ke tingkat yang lebih tinggi untuk penanganan khusus.'}
                    {searchedCase.status === 'resolved' && 'Kasus telah selesai ditangani. Terima kasih atas laporan Anda.'}
                    {searchedCase.status === 'closed' && 'Kasus telah ditutup. Jika ada pertanyaan lebih lanjut, silakan hubungi kami.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
