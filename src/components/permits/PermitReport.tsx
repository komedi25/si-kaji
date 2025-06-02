
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Download, 
  FileText, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  FileX
} from 'lucide-react';
import { AcademicYear } from '@/types/student';
import { StudentPermit } from '@/types/attendance';

export const PermitReport = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: permits, isLoading } = useQuery({
    queryKey: ['permits-report', startDate, endDate, selectedStatus, searchQuery],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      
      let query = supabase
        .from('student_permits')
        .select(`
          *,
          student:students(
            id, 
            full_name, 
            nis, 
            current_enrollment:student_enrollments(
              id, 
              class:classes(
                id, 
                name,
                grade,
                is_active,
                created_at,
                updated_at,
                major:majors(name)
              )
            )
          ),
          approvals:permit_approvals(*)
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('submitted_at', { ascending: false });
      
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }
      
      // Apply search filter if provided
      if (searchQuery && searchQuery.length >= 3) {
        query = query.or(`student.nis.ilike.%${searchQuery}%,student.full_name.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(permit => ({
        ...permit,
        student: {
          ...permit.student,
          current_class: permit.student?.current_enrollment?.[0]?.class
        }
      })) as (StudentPermit & { approvals: any[] })[];
    },
    enabled: !!startDate && !!endDate && (searchQuery === '' || searchQuery.length >= 3)
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

  const getPermitStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Menunggu', 
        variant: 'secondary' as const,
        icon: <Clock className="h-3.5 w-3.5 mr-1" />
      },
      approved: { 
        label: 'Disetujui', 
        variant: 'default' as const,
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
      },
      rejected: { 
        label: 'Ditolak', 
        variant: 'destructive' as const,
        icon: <XCircle className="h-3.5 w-3.5 mr-1" />
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {config.label}
      </Badge>
    ) : null;
  };

  const getApprovalStatus = (permit: any) => {
    if (!permit.approvals || permit.approvals.length === 0) return null;
    
    const sortedApprovals = permit.approvals.sort((a, b) => a.approval_order - b.approval_order);
    const approved = sortedApprovals.filter(a => a.status === 'approved').length;
    const total = sortedApprovals.length;
    
    return (
      <div className="flex items-center gap-1 text-xs">
        <div className="flex gap-1">
          {sortedApprovals.map((approval, index) => (
            <span 
              key={approval.id} 
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                approval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}
              title={`${approval.approver_role}: ${approval.status}`}
            >
              {approval.status === 'approved' ? <CheckCircle className="h-3 w-3" /> :
               approval.status === 'rejected' ? <XCircle className="h-3 w-3" /> :
               index + 1}
            </span>
          ))}
        </div>
        <span className="text-gray-500 ml-1">
          {approved}/{total}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-1">
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div className="md:col-span-1">
          <Label htmlFor="endDate">Tanggal Selesai</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
          />
        </div>

        <div className="md:col-span-1">
          <Label htmlFor="status">Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="search">Cari Siswa</Label>
          <div className="relative">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama atau NIS siswa (min. 3 karakter)"
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            Laporan Perizinan {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')} 
          </h3>
        </div>
        
        <Button disabled className="opacity-50" title="Fitur akan datang">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : permits && permits.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left">Siswa</th>
                  <th className="px-4 py-3 text-left">Kelas</th>
                  <th className="px-4 py-3 text-left">Jenis</th>
                  <th className="px-4 py-3 text-left">Tanggal Izin</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Persetujuan</th>
                  <th className="px-4 py-3 text-center">Diajukan</th>
                </tr>
              </thead>
              <tbody>
                {permits.map((permit) => (
                  <tr key={permit.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>{permit.student?.full_name}</div>
                      <div className="text-xs text-gray-500">{permit.student?.nis}</div>
                    </td>
                    <td className="px-4 py-3">{permit.student?.current_class?.name || '-'}</td>
                    <td className="px-4 py-3">{getPermitTypeBadge(permit.permit_type)}</td>
                    <td className="px-4 py-3">
                      {format(new Date(permit.start_date), 'dd/MM/yyyy')}
                      {permit.start_date !== permit.end_date && (
                        <> - {format(new Date(permit.end_date), 'dd/MM/yyyy')}</>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{getPermitStatusBadge(permit.status)}</td>
                    <td className="px-4 py-3 text-center">{getApprovalStatus(permit)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-xs text-gray-500">
                        {format(new Date(permit.submitted_at), 'dd/MM/yyyy')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg">Tidak ada data perizinan dalam periode ini</div>
      )}
    </div>
  );
};
