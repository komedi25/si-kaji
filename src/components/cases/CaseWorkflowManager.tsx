
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AppRole } from '@/types/auth';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  FileText,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CaseWorkflow {
  id: string;
  case_number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  assigned_handler: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  reporter_name: string | null;
  reported_student_name: string | null;
  reported_student_class: string | null;
  description: string;
}

interface CaseActivity {
  id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  performed_by: string | null;
}

interface TeamMember {
  user_id: string;
  role: string;
  full_name: string;
}

export const CaseWorkflowManager = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCase, setSelectedCase] = useState<CaseWorkflow | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // Get cases based on user role
  const { data: cases, isLoading } = useQuery({
    queryKey: ['workflow-cases', user?.id],
    queryFn: async () => {
      let query = supabase
        .from('student_cases')
        .select('*')
        .in('status', ['pending', 'under_review', 'investigating', 'escalated']);

      // Filter based on role
      if (hasRole('tppk')) {
        query = query.in('category', ['bullying', 'kekerasan', 'tawuran', 'pencurian', 'vandalisme']);
      } else if (hasRole('p4gn')) {
        query = query.eq('category', 'narkoba');
      } else if (hasRole('arps')) {
        query = query.eq('category', 'pergaulan_bebas');
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as CaseWorkflow[];
    },
    enabled: Boolean(user && (hasRole('admin') || hasRole('tppk') || hasRole('p4gn') || hasRole('arps')))
  });

  // Get case activities
  const { data: activities } = useQuery({
    queryKey: ['case-activities', selectedCase?.id],
    queryFn: async () => {
      if (!selectedCase) return [];
      
      const { data, error } = await supabase
        .from('case_activities')
        .select('*')
        .eq('case_id', selectedCase.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CaseActivity[];
    },
    enabled: Boolean(selectedCase)
  });

  // Get available team members for assignment
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const targetRoles: AppRole[] = ['tppk', 'p4gn', 'arps', 'guru_bk', 'waka_kesiswaan'];
      
      // First get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', targetRoles)
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      // Then get profiles for these users
      const userIds = userRoles.map(ur => ur.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const teamMembers: TeamMember[] = userRoles.map(ur => {
        const profile = profiles.find(p => p.id === ur.user_id);
        return {
          user_id: ur.user_id,
          role: ur.role,
          full_name: profile?.full_name || 'Unknown User'
        };
      });

      return teamMembers;
    }
  });

  // Update case status mutation
  const updateCaseMutation = useMutation({
    mutationFn: async ({ caseId, updates }: { caseId: string; updates: any }) => {
      const { error } = await supabase
        .from('student_cases')
        .update(updates)
        .eq('id', caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-cases'] });
      queryClient.invalidateQueries({ queryKey: ['case-activities'] });
      toast({
        title: "Berhasil",
        description: "Status kasus berhasil diperbarui"
      });
      setActionNotes('');
      setAssigneeId('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui kasus",
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = (status: string) => {
    if (!selectedCase) return;

    const updates: any = { status, updated_at: new Date().toISOString() };
    
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    if (assigneeId && status === 'investigating') {
      updates.assigned_to = assigneeId;
    }

    updateCaseMutation.mutate({ 
      caseId: selectedCase.id, 
      updates 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock },
      under_review: { label: 'Ditinjau', variant: 'default' as const, icon: FileText },
      investigating: { label: 'Investigasi', variant: 'default' as const, icon: Users },
      escalated: { label: 'Eskalasi', variant: 'destructive' as const, icon: AlertTriangle },
      resolved: { label: 'Selesai', variant: 'outline' as const, icon: CheckCircle },
      closed: { label: 'Ditutup', variant: 'outline' as const, icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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

  const getHandlerBadge = (handler: string) => {
    const handlerConfig = {
      tppk: { label: 'TPPK', color: 'bg-blue-100 text-blue-800' },
      p4gn: { label: 'P4GN', color: 'bg-purple-100 text-purple-800' },
      arps: { label: 'ARPS', color: 'bg-green-100 text-green-800' },
    };
    
    const config = handlerConfig[handler as keyof typeof handlerConfig];
    return config ? (
      <Badge className={config.color}>{config.label}</Badge>
    ) : null;
  };

  const canManageCase = (caseItem: CaseWorkflow) => {
    if (hasRole('admin')) return true;
    if (hasRole('tppk') && ['bullying', 'kekerasan', 'tawuran', 'pencurian', 'vandalisme'].includes(caseItem.category)) return true;
    if (hasRole('p4gn') && caseItem.category === 'narkoba') return true;
    if (hasRole('arps') && caseItem.category === 'pergaulan_bebas') return true;
    return false;
  };

  if (!user || !hasRole('admin') && !hasRole('tppk') && !hasRole('p4gn') && !hasRole('arps')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Anda tidak memiliki akses ke fitur ini</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workflow Manajemen Kasus</h1>
          <p className="text-muted-foreground">
            Kelola dan pantau penanganan kasus sesuai dengan tim khusus
          </p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Kasus Aktif</TabsTrigger>
          <TabsTrigger value="my-cases">Kasus Saya</TabsTrigger>
          <TabsTrigger value="urgent">Mendesak</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p>Memuat data...</p>
                </CardContent>
              </Card>
            ) : cases?.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Tidak ada kasus aktif</p>
                </CardContent>
              </Card>
            ) : (
              cases?.map((caseItem) => (
                <Card key={caseItem.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{caseItem.title}</h3>
                          {getHandlerBadge(caseItem.assigned_handler)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {caseItem.case_number} • {caseItem.category}
                        </p>
                        <p className="text-sm line-clamp-2 mb-3">
                          {caseItem.description}
                        </p>
                        {caseItem.reported_student_name && (
                          <p className="text-sm text-muted-foreground">
                            Siswa: {caseItem.reported_student_name} 
                            {caseItem.reported_student_class && ` (${caseItem.reported_student_class})`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {getStatusBadge(caseItem.status)}
                        {getPriorityBadge(caseItem.priority)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(caseItem.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </div>
                      <div className="flex gap-2">
                        {canManageCase(caseItem) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedCase(caseItem)}
                              >
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Kelola
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Kelola Kasus: {selectedCase?.case_number}</DialogTitle>
                              </DialogHeader>
                              
                              {selectedCase && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Status Saat Ini</Label>
                                      <div className="mt-1">
                                        {getStatusBadge(selectedCase.status)}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Prioritas</Label>
                                      <div className="mt-1">
                                        {getPriorityBadge(selectedCase.priority)}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Ubah Status</Label>
                                    <div className="flex gap-2 mt-2">
                                      {selectedCase.status === 'pending' && (
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleStatusUpdate('under_review')}
                                          disabled={updateCaseMutation.isPending}
                                        >
                                          Mulai Tinjau
                                        </Button>
                                      )}
                                      {selectedCase.status === 'under_review' && (
                                        <>
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleStatusUpdate('investigating')}
                                            disabled={updateCaseMutation.isPending}
                                          >
                                            Mulai Investigasi
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive"
                                            onClick={() => handleStatusUpdate('escalated')}
                                            disabled={updateCaseMutation.isPending}
                                          >
                                            Eskalasi
                                          </Button>
                                        </>
                                      )}
                                      {selectedCase.status === 'investigating' && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleStatusUpdate('resolved')}
                                          disabled={updateCaseMutation.isPending}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Selesaikan
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {selectedCase.status === 'under_review' && teamMembers && (
                                    <div>
                                      <Label>Tugaskan ke</Label>
                                      <Select value={assigneeId} onValueChange={setAssigneeId}>
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Pilih penanggung jawab" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teamMembers.map((member) => (
                                            <SelectItem key={member.user_id} value={member.user_id}>
                                              {member.full_name} ({member.role.toUpperCase()})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  <div>
                                    <Label>Catatan Tindakan</Label>
                                    <Textarea
                                      placeholder="Tambahkan catatan tentang tindakan yang diambil..."
                                      value={actionNotes}
                                      onChange={(e) => setActionNotes(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>

                                  {/* Case Activities */}
                                  {activities && activities.length > 0 && (
                                    <div>
                                      <Label>Riwayat Aktivitas</Label>
                                      <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                                        {activities.map((activity) => (
                                          <div key={activity.id} className="text-sm p-2 bg-gray-50 rounded">
                                            <div className="font-medium">{activity.activity_type}</div>
                                            <div className="text-muted-foreground">{activity.description}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-cases">
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Fitur kasus yang ditugaskan akan segera hadir</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent">
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Fitur kasus mendesak akan segera hadir</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
