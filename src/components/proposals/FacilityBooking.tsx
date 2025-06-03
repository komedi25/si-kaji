
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building, Calendar, CheckCircle } from 'lucide-react';

const facilityBookingSchema = z.object({
  proposal_id: z.string().min(1, 'Pilih proposal'),
  facility_ids: z.array(z.string()).min(1, 'Pilih minimal satu fasilitas'),
});

type FacilityBookingFormData = z.infer<typeof facilityBookingSchema>;

interface Facility {
  id: string;
  name: string;
  description: string;
  location: string;
  capacity: number;
  condition: string;
  is_active: boolean;
}

interface Proposal {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  facility_requests: string[];
}

interface FacilityBookingProps {
  proposalId?: string;
  onFacilitiesSelected?: (facilityIds: string[]) => void;
}

export const FacilityBooking = ({ proposalId, onFacilitiesSelected }: FacilityBookingProps) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FacilityBookingFormData>({
    resolver: zodResolver(facilityBookingSchema),
    defaultValues: {
      proposal_id: proposalId || '',
      facility_ids: [],
    },
  });

  useEffect(() => {
    fetchFacilities();
    if (!proposalId) {
      fetchProposals();
    }
  }, [proposalId]);

  useEffect(() => {
    if (proposalId) {
      form.setValue('proposal_id', proposalId);
      fetchProposalById(proposalId);
    }
  }, [proposalId, form]);

  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('school_facilities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      toast.error('Gagal memuat data fasilitas');
    }
  };

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_proposals')
        .select('id, title, start_date, end_date, status, facility_requests')
        .in('status', ['draft', 'submitted'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Gagal memuat data proposal');
    }
  };

  const fetchProposalById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('activity_proposals')
        .select('id, title, start_date, end_date, status, facility_requests')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSelectedProposal(data);
      
      // Set existing facility requests if any
      if (data.facility_requests) {
        form.setValue('facility_ids', data.facility_requests);
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      toast.error('Gagal memuat data proposal');
    }
  };

  const onSubmit = async (data: FacilityBookingFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('activity_proposals')
        .update({
          facility_requests: data.facility_ids
        })
        .eq('id', data.proposal_id);

      if (error) throw error;

      toast.success('Peminjaman fasilitas berhasil diajukan');
      
      if (onFacilitiesSelected) {
        onFacilitiesSelected(data.facility_ids);
      }
    } catch (error) {
      console.error('Error booking facilities:', error);
      toast.error('Gagal mengajukan peminjaman fasilitas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProposalChange = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    setSelectedProposal(proposal || null);
    
    // Reset facility selection when proposal changes
    form.setValue('facility_ids', proposal?.facility_requests || []);
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      baik: 'default',
      rusak_ringan: 'secondary',
      rusak_berat: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[condition as keyof typeof variants] || 'secondary'}>
        {condition}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Peminjaman Fasilitas Sekolah
          </CardTitle>
          <CardDescription>
            Ajukan peminjaman fasilitas untuk kegiatan proposal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!proposalId && (
                <FormField
                  control={form.control}
                  name="proposal_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Proposal</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleProposalChange(value);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih proposal kegiatan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {proposals.map((proposal) => (
                            <SelectItem key={proposal.id} value={proposal.id}>
                              {proposal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedProposal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedProposal.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedProposal.start_date).toLocaleDateString('id-ID')} - 
                      {new Date(selectedProposal.end_date).toLocaleDateString('id-ID')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <FormField
                control={form.control}
                name="facility_ids"
                render={() => (
                  <FormItem>
                    <FormLabel>Pilih Fasilitas yang Diperlukan</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {facilities.map((facility) => (
                        <FormField
                          key={facility.id}
                          control={form.control}
                          name="facility_ids"
                          render={({ field }) => {
                            return (
                              <Card className="relative">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(facility.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, facility.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== facility.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-semibold">
                                          {facility.name}
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                          {facility.description}
                                        </p>
                                      </div>
                                    </FormItem>
                                    {getConditionBadge(facility.condition)}
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <div>
                                      <span className="font-medium">Lokasi:</span> {facility.location}
                                    </div>
                                    <div>
                                      <span className="font-medium">Kapasitas:</span> {facility.capacity} orang
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting || !form.watch('proposal_id')} className="w-full">
                {isSubmitting ? 'Mengajukan...' : 'Ajukan Peminjaman Fasilitas'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {facilities.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada fasilitas yang tersedia</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
