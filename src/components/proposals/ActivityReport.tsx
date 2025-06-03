
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
import { FileUpload } from '@/components/common/FileUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Camera, CheckCircle } from 'lucide-react';

const reportSchema = z.object({
  proposal_id: z.string().min(1, 'Pilih proposal'),
  activity_report: z.string().min(1, 'Laporan kegiatan wajib diisi'),
  actual_participants: z.number().min(0),
  actual_budget: z.number().min(0),
  outcomes_achieved: z.string().optional(),
  challenges_faced: z.string().optional(),
  recommendations: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface Proposal {
  id: string;
  title: string;
  organizer_name: string;
  start_date: string;
  end_date: string;
  status: string;
  estimated_participants: number;
  budget_estimation: number;
  activity_report: string;
  documentation_urls: string[];
}

export const ActivityReport = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentationUrls, setDocumentationUrls] = useState<string[]>([]);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      actual_participants: 0,
      actual_budget: 0,
    },
  });

  useEffect(() => {
    fetchApprovedProposals();
  }, []);

  const fetchApprovedProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_proposals')
        .select('*')
        .eq('status', 'approved')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Gagal memuat data proposal');
    }
  };

  const handleProposalChange = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    setSelectedProposal(proposal || null);
    
    if (proposal) {
      // Pre-fill form with existing data if available
      form.setValue('actual_participants', proposal.estimated_participants || 0);
      form.setValue('actual_budget', proposal.budget_estimation || 0);
      
      if (proposal.activity_report) {
        form.setValue('activity_report', proposal.activity_report);
      }
      
      if (proposal.documentation_urls) {
        setDocumentationUrls(proposal.documentation_urls);
      }
    }
  };

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const reportData = {
        activity_report: data.activity_report,
        documentation_urls: documentationUrls,
        budget_breakdown: {
          estimated: selectedProposal?.budget_estimation || 0,
          actual: data.actual_budget,
          participants_estimated: selectedProposal?.estimated_participants || 0,
          participants_actual: data.actual_participants,
          outcomes_achieved: data.outcomes_achieved,
          challenges_faced: data.challenges_faced,
          recommendations: data.recommendations,
        }
      };

      const { error } = await supabase
        .from('activity_proposals')
        .update(reportData)
        .eq('id', data.proposal_id);

      if (error) throw error;

      toast.success('Laporan pertanggungjawaban berhasil disimpan');
      form.reset();
      setSelectedProposal(null);
      setDocumentationUrls([]);
      fetchApprovedProposals();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Gagal menyimpan laporan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      completed: 'outline'
    } as const;
    
    const labels = {
      approved: 'Disetujui',
      completed: 'Selesai'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const isReportCompleted = (proposal: Proposal) => {
    return proposal.activity_report && proposal.documentation_urls && proposal.documentation_urls.length > 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Laporan Pertanggungjawaban Kegiatan (LPJ)
          </CardTitle>
          <CardDescription>
            Buat laporan untuk kegiatan yang telah disetujui dan dilaksanakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="proposal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Kegiatan</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      handleProposalChange(value);
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kegiatan yang telah dilaksanakan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {proposals.map((proposal) => (
                          <SelectItem key={proposal.id} value={proposal.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{proposal.title}</span>
                              {isReportCompleted(proposal) && (
                                <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProposal && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedProposal.title}</CardTitle>
                        <CardDescription>
                          {selectedProposal.organizer_name} • 
                          {new Date(selectedProposal.start_date).toLocaleDateString('id-ID')} - 
                          {new Date(selectedProposal.end_date).toLocaleDateString('id-ID')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(selectedProposal.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Estimasi Peserta:</span> {selectedProposal.estimated_participants} orang
                      </div>
                      <div>
                        <span className="font-medium">Estimasi Budget:</span> Rp {selectedProposal.budget_estimation?.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="actual_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Peserta Aktual</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Jumlah peserta yang hadir"
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
                  name="actual_budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Aktual Terpakai</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Budget yang benar-benar terpakai"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="activity_report"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Laporan Kegiatan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Deskripsikan jalannya kegiatan, capaian yang diperoleh, dan evaluasi"
                        rows={6}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outcomes_achieved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capaian dan Hasil</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Jelaskan capaian dan hasil yang diperoleh dari kegiatan"
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
                name="challenges_faced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kendala yang Dihadapi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Sebutkan kendala atau hambatan yang dihadapi selama kegiatan"
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
                name="recommendations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saran dan Rekomendasi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Berikan saran untuk perbaikan kegiatan serupa di masa depan"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4" />
                    Dokumentasi Kegiatan
                  </label>
                  <FileUpload
                    onFilesUploaded={setDocumentationUrls}
                    existingFiles={documentationUrls}
                    maxFiles={10}
                    folder="activity-documentation"
                    accept="image/*"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting || !form.watch('proposal_id')} className="w-full">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {proposals.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada kegiatan yang perlu dilaporkan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
