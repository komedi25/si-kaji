import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Clock, 
  Download,
  FileCheck,
  FileX,
  Eye
} from 'lucide-react';
import { StudentPermit } from '@/types/attendance';

export const PermitApproval = () => {
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingPermits, isLoading } = useQuery({
    queryKey: ['pending-permits'],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Get user roles
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (roleError) throw roleError;
      
      const roles = userRoles.map(ur => ur.role);
      
      // Get permits that need approval from this user's role
      const { data: permits, error: permitError } = await supabase
        .from('student_permits')
        .select(`
          *,
          student:students(id, full_name, nis, current_enrollment:student_enrollments(
            id, 
            class:classes(
              id, 
              name,
              grade,
              is_active,
              created_at,
              updated_at
            )
          )),
          approvals:permit_approvals(*)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
      
      if (permitError) throw permitError;
      
      // Filter permits for which the user can approve (based on role and approval order)
      return permits
        .filter(permit => {
          // Process approvals to find the next pending one
          const sortedApprovals = permit.approvals.sort((a, b) => a.approval_order - b.approval_order);
          const nextApproval = sortedApprovals.find(a => a.status === 'pending');
          
          // If there's no next approval or user doesn't have the required role, can't approve
          return nextApproval && roles.includes(nextApproval.approver_role as any);
        })
        .map(permit => ({
          ...permit,
          student: {
            ...permit.student,
            current_class: permit.student?.current_enrollment?.[0]?.class
          }
        }));
    }
  });

  const { data: selectedPermit } = useQuery({
    queryKey: ['permit-details', selectedPermitId],
    queryFn: async () => {
      if (!selectedPermitId) return null;
      
      const { data, error } = await supabase
        .from('student_permits')
        .select(`
          *,
          student:students(id, full_name, nis, current_enrollment:student_enrollments(
            id, 
            class:classes(
              id, 
              name,
              grade,
              is_active,
              created_at,
              updated_at
            )
          )),
          approvals:permit_approvals(*)
        `)
        .eq('id', selectedPermitId)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        student: {
          ...data.student,
          current_class: data.student?.current_enrollment?.[0]?.class
        }
      };
    },
    enabled: !!selectedPermitId
  });

  const approvePermitMutation = useMutation({
    mutationFn: async ({ permitId, approved, notes }: { permitId: string, approved: boolean, notes: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      // Get user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      const roles = userRoles.map(ur => ur.role);
      
      // Get the permit details
      const { data: permit } = await supabase
        .from('student_permits')
        .select(`
          *,
          approvals:permit_approvals(*)
        `)
        .eq('id', permitId)
        .single();
      
      // Find the next pending approval that matches user's role
      const sortedApprovals = permit.approvals.sort((a, b) => a.approval_order - b.approval_order);
      const approval = sortedApprovals.find(a => 
        a.status === 'pending' && roles.includes(a.approver_role as any)
      );
      
      if (!approval) throw new Error('No pending approval found for your role');
      
      // Update the approval
      const { error: updateError } = await supabase
        .from('permit_approvals')
        .update({
          status: approved ? 'approved' : 'rejected',
          approver_id: userId,
          approved_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', approval.id);
      
      if (updateError) throw updateError;
      
      // Check if this is the final approval or a rejection
      const isLastApproval = sortedApprovals.every(a => 
        a.id === approval.id || a.status === 'approved'
      );
      
      if (approved && isLastApproval) {
        // All approvals completed, update permit status
        const { error } = await supabase
          .from('student_permits')
          .update({
            status: 'approved',
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            review_notes: notes || null
          })
          .eq('id', permitId);
        
        if (error) throw error;
      } else if (!approved) {
        // Rejected, update permit status
        const { error } = await supabase
          .from('student_permits')
          .update({
            status: 'rejected',
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            review_notes: notes || null
          })
          .eq('id', permitId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit-details'] });
      setSelectedPermitId(null);
      setReviewNotes('');
      toast({ title: 'Berhasil memproses perizinan' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getPermitTypeBadge = (type: string) => {
    const typeConfig = {
      sick_leave: { label: 'Sakit', variant: 'destructive' as const },
      family_leave: { label: 'Keluarga', variant: 'secondary' as const },
      school_activity: { label: 'Kegiatan Sekolah', variant: 'default' as const },
      other: { label: 'Lainnya', variant: 'outline' as const }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig];
    return config ? (
      <Badge variant={config.variant}>{config.label}</Badge>
    ) : null;
  };

  const handleApprove = () => {
    if (!selectedPermitId) return;
    approvePermitMutation.mutate({ 
      permitId: selectedPermitId, 
      approved: true,
      notes: reviewNotes
    });
  };

  const handleReject = () => {
    if (!selectedPermitId) return;
    if (!reviewNotes) {
      toast({
        title: 'Error',
        description: 'Mohon berikan catatan alasan penolakan',
        variant: 'destructive'
      });
      return;
    }
    
    approvePermitMutation.mutate({ 
      permitId: selectedPermitId, 
      approved: false,
      notes: reviewNotes
    });
  };

  const getApprovalStatus = (permit: any) => {
    const sortedApprovals = permit.approvals.sort((a, b) => a.approval_order - b.approval_order);
    const approved = sortedApprovals.filter(a => a.status === 'approved').length;
    const total = sortedApprovals.length;
    
    return {
      count: `${approved}/${total}`,
      nextRole: sortedApprovals.find(a => a.status === 'pending')?.approver_role
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Menunggu Persetujuan
            </h3>
            
            {isLoading ? (
              <div className="text-center py-10">Loading...</div>
            ) : pendingPermits && pendingPermits.length > 0 ? (
              <div className="space-y-2">
                {pendingPermits.map((permit) => {
                  const approvalStatus = getApprovalStatus(permit);
                  let nextRoleLabel = '';
                  switch (approvalStatus.nextRole) {
                    case 'wali_kelas': nextRoleLabel = 'Wali Kelas'; break;
                    case 'guru_bk': nextRoleLabel = 'Guru BK'; break;
                    case 'waka_kesiswaan': nextRoleLabel = 'Waka Kesiswaan'; break;
                    default: nextRoleLabel = approvalStatus.nextRole || '';
                  }
                  
                  return (
                    <div 
                      key={permit.id} 
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${
                        selectedPermitId === permit.id ? 'bg-slate-100 border-primary' : ''
                      }`}
                      onClick={() => setSelectedPermitId(permit.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{permit.student?.full_name}</div>
                          <div className="text-sm">
                            {permit.student?.nis} - {permit.student?.current_class?.name || '-'}
                          </div>
                        </div>
                        {getPermitTypeBadge(permit.permit_type)}
                      </div>
                      <div className="text-sm mt-1">
                        {format(new Date(permit.start_date), 'dd/MM/yyyy')} - {format(new Date(permit.end_date), 'dd/MM/yyyy')}
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <div>Menunggu: {nextRoleLabel}</div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> {approvalStatus.count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-4 border rounded-lg">
                Tidak ada perizinan yang menunggu persetujuan Anda
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {selectedPermit ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Detail Perizinan</CardTitle>
                    <CardDescription>
                      Diajukan pada {format(new Date(selectedPermit.submitted_at), 'dd MMMM yyyy, HH:mm')}
                    </CardDescription>
                  </div>
                  {getPermitTypeBadge(selectedPermit.permit_type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm font-semibold">Nama Siswa</div>
                      <div>{selectedPermit.student?.full_name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">NIS</div>
                      <div>{selectedPermit.student?.nis}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Kelas</div>
                      <div>{selectedPermit.student?.current_class?.name || '-'}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="font-semibold mb-1">Tanggal Izin</div>
                  <div className="flex gap-2 items-center">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(selectedPermit.start_date), 'dd MMMM yyyy')} 
                      {selectedPermit.start_date !== selectedPermit.end_date && (
                        <> s/d {format(new Date(selectedPermit.end_date), 'dd MMMM yyyy')}</>
                      )}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="font-semibold mb-1">Alasan</div>
                  <div className="p-3 border rounded-lg">
                    {selectedPermit.reason}
                  </div>
                </div>
                
                <div>
                  <div className="font-semibold mb-1">Status Persetujuan</div>
                  <div className="flex gap-2">
                    {selectedPermit.approvals
                      .sort((a, b) => a.approval_order - b.approval_order)
                      .map((approval, index) => {
                        let roleName = '';
                        switch (approval.approver_role) {
                          case 'wali_kelas': roleName = 'Wali Kelas'; break;
                          case 'guru_bk': roleName = 'Guru BK'; break;
                          case 'waka_kesiswaan': roleName = 'Waka Kesiswaan'; break;
                          default: roleName = approval.approver_role;
                        }
                        
                        return (
                          <div 
                            key={approval.id} 
                            className={`px-3 py-2 rounded-full flex items-center gap-2 text-sm ${
                              approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                              approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {approval.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
                             approval.status === 'rejected' ? <FileX className="h-4 w-4" /> :
                             <Clock className="h-4 w-4" />}
                            {roleName}
                          </div>
                        );
                      })}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="review_notes">Catatan Peninjauan</Label>
                  <Textarea
                    id="review_notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Tambahkan catatan untuk izin ini (wajib jika menolak)"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPermitId(null)}
                >
                  Kembali
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleReject}
                    disabled={approvePermitMutation.isPending}
                  >
                    <FileX className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button 
                    onClick={handleApprove}
                    disabled={approvePermitMutation.isPending}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full border rounded-lg p-10 text-center text-gray-500">
              <Eye className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Pilih perizinan</h3>
              <p className="text-sm">Pilih salah satu perizinan dari daftar untuk melihat detailnya</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
