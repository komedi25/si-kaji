import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, User, MapPin, Calendar, Users, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CaseDetailsProps {
  caseData: any;
  onBack: () => void;
  onUpdate: () => void;
}

export const CaseDetails = ({ caseData, onBack, onUpdate }: CaseDetailsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState(caseData.status);
  const [assignedHandler, setAssignedHandler] = useState(caseData.assigned_handler || 'none');
  const [resolutionNotes, setResolutionNotes] = useState(caseData.resolution_notes || '');

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['case-activities', caseData.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_activities')
        .select(`
          *,
          performed_by_profile:profiles!case_activities_performed_by_fkey(full_name)
        `)
        .eq('case_id', caseData.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('student_cases')
        .update(updates)
        .eq('id', caseData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Kasus berhasil diperbarui',
      });
      queryClient.invalidateQueries({ queryKey: ['case-activities', caseData.id] });
      onUpdate();
    },
    onError: (error) => {
      console.error('Error updating case:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memperbarui kasus',
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = () => {
    const updates: any = {
      status: newStatus,
      assigned_handler: assignedHandler === 'none' ? null : assignedHandler,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'resolved' || newStatus === 'closed') {
      updates.resolved_at = new Date().toISOString();
      updates.resolution_notes = resolutionNotes;
    }

    updateCaseMutation.mutate(updates);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{caseData.title}</h1>
          <p className="text-muted-foreground">{caseData.case_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detail Kasus */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Kasus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {getStatusBadge(caseData.status)}
                {getPriorityBadge(caseData.priority)}
                <Badge variant="outline">{getCategoryLabel(caseData.category)}</Badge>
                {caseData.is_anonymous && <Badge variant="outline">Anonim</Badge>}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Deskripsi:</h3>
                <p className="text-sm bg-muted p-3 rounded">{caseData.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {caseData.incident_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Tanggal: {format(new Date(caseData.incident_date), 'dd MMMM yyyy', { locale: id })}</span>
                  </div>
                )}

                {caseData.incident_location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Lokasi: {caseData.incident_location}</span>
                  </div>
                )}

                {caseData.reported_student_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Siswa: {caseData.reported_student_name}
                      {caseData.reported_student_class && ` (${caseData.reported_student_class})`}
                    </span>
                  </div>
                )}

                {caseData.witnesses && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Saksi: {caseData.witnesses}</span>
                  </div>
                )}
              </div>

              {!caseData.is_anonymous && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Pelapor:</h4>
                  <p className="text-sm">{caseData.reporter_name}</p>
                  {caseData.reporter_contact && (
                    <p className="text-sm text-muted-foreground">{caseData.reporter_contact}</p>
                  )}
                </div>
              )}

              {caseData.resolution_notes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Catatan Penyelesaian:</h4>
                  <p className="text-sm bg-muted p-3 rounded">{caseData.resolution_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Riwayat Aktivitas */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <p>Memuat riwayat...</p>
              ) : activities?.length === 0 ? (
                <p className="text-muted-foreground">Belum ada aktivitas</p>
              ) : (
                <div className="space-y-4">
                  {activities?.map((activity) => (
                    <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-b-0">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        {(activity.old_value || activity.new_value) && (
                          <p className="text-xs text-muted-foreground">
                            {activity.old_value && `Dari: ${activity.old_value}`}
                            {activity.old_value && activity.new_value && ' → '}
                            {activity.new_value && `Ke: ${activity.new_value}`}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{activity.performed_by_profile?.full_name || 'Sistem'}</span>
                          <span>•</span>
                          <span>{format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel Aksi */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi Kasus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status:</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="under_review">Ditinjau</SelectItem>
                    <SelectItem value="investigating">Investigasi</SelectItem>
                    <SelectItem value="escalated">Eskalasi</SelectItem>
                    <SelectItem value="resolved">Selesai</SelectItem>
                    <SelectItem value="closed">Ditutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Penanganan:</label>
                <Select value={assignedHandler} onValueChange={setAssignedHandler}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih penanganan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada</SelectItem>
                    <SelectItem value="tppk">TPPK</SelectItem>
                    <SelectItem value="arps">ARPS</SelectItem>
                    <SelectItem value="p4gn">P4GN</SelectItem>
                    <SelectItem value="guru_bk">Guru BK</SelectItem>
                    <SelectItem value="waka_kesiswaan">Waka Kesiswaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newStatus === 'resolved' || newStatus === 'closed') && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Catatan Penyelesaian:</label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Catatan penyelesaian kasus..."
                    className="min-h-[80px]"
                  />
                </div>
              )}

              <Button 
                onClick={handleStatusUpdate} 
                disabled={updateCaseMutation.isPending}
                className="w-full"
              >
                {updateCaseMutation.isPending ? 'Menyimpan...' : 'Perbarui Kasus'}
              </Button>

              {/* Escalation Button */}
              {caseData.status !== 'escalated' && caseData.status !== 'resolved' && caseData.status !== 'closed' && (
                <Button 
                  onClick={() => {
                    setNewStatus('escalated');
                    setAssignedHandler('waka_kesiswaan');
                    handleStatusUpdate();
                  }}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                  disabled={updateCaseMutation.isPending}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Eskalasi ke Waka Kesiswaan
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Kasus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat:</span>
                <span>{format(new Date(caseData.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terakhir Update:</span>
                <span>{format(new Date(caseData.updated_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
              </div>
              {caseData.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diselesaikan:</span>
                  <span>{format(new Date(caseData.resolved_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
