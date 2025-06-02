
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Search, Upload, FileText } from 'lucide-react';
import { StudentWithClass } from '@/types/student';

export const PermitForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  const [permitType, setPermitType] = useState<string>('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          current_enrollment:student_enrollments(
            id,
            class_id,
            classes(
              id,
              name,
              grade,
              major:majors(name)
            )
          )
        `)
        .or(`full_name.ilike.%${searchQuery}%,nis.ilike.%${searchQuery}%,nisn.ilike.%${searchQuery}%`)
        .eq('status', 'active')
        .order('full_name')
        .limit(10);
      
      if (error) throw error;
      
      return data.map(student => ({
        ...student,
        current_class: student.current_enrollment?.[0]?.classes,
        current_enrollment: student.current_enrollment?.[0]
      }));
    },
    enabled: searchQuery.length >= 3
  });

  const createPermitMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Create permit
      const { data: permitData, error: permitError } = await supabase
        .from('student_permits')
        .insert([data])
        .select();
      
      if (permitError) throw permitError;
      
      const permitId = permitData?.[0]?.id;
      if (!permitId) throw new Error("Failed to create permit");
      
      // 2. Create approval workflow
      const approvalWorkflow = [
        {
          permit_id: permitId,
          approver_role: 'wali_kelas',
          approval_order: 1
        },
        {
          permit_id: permitId,
          approver_role: 'guru_bk',
          approval_order: 2
        },
        {
          permit_id: permitId,
          approver_role: 'waka_kesiswaan',
          approval_order: 3
        }
      ];
      
      const { error: approvalError } = await supabase
        .from('permit_approvals')
        .insert(approvalWorkflow);
      
      if (approvalError) throw approvalError;
      
      return permitId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-permits'] });
      resetForm();
      toast({ 
        title: 'Pengajuan izin berhasil dibuat',
        description: 'Pengajuan akan diproses oleh wali kelas dan pihak terkait'
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setSelectedStudent(null);
    setPermitType('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setReason('');
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !permitType || !startDate || !endDate || !reason) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive'
      });
      return;
    }

    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      toast({
        title: 'Error',
        description: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
        variant: 'destructive'
      });
      return;
    }
    
    const data = {
      student_id: selectedStudent.id,
      permit_type: permitType,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      submitted_at: new Date().toISOString()
    };

    createPermitMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Cari Siswa (min. 3 karakter)</Label>
          <div className="relative">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukkan nama atau NIS siswa"
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {searchQuery.length >= 3 && (
          <div className="border rounded-md max-h-60 overflow-y-auto">
            {studentsLoading ? (
              <div className="p-4 text-center">Mencari...</div>
            ) : students && students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 cursor-pointer hover:bg-slate-50 border-b last:border-b-0 ${
                    selectedStudent?.id === student.id ? 'bg-slate-100' : ''
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-sm text-gray-500 flex justify-between">
                    <span>NIS: {student.nis}</span>
                    <span>Kelas: {student.current_class?.name || '-'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">Tidak ada siswa ditemukan</div>
            )}
          </div>
        )}

        {selectedStudent && (
          <div className="rounded-lg p-4 bg-slate-50 border">
            <h3 className="font-medium">Siswa Terpilih:</h3>
            <p>Nama: {selectedStudent.full_name}</p>
            <div className="flex gap-4">
              <p>NIS: {selectedStudent.nis}</p>
              <p>Kelas: {selectedStudent.current_class?.name || '-'}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
        <div>
          <Label htmlFor="permit_type">Jenis Izin</Label>
          <Select value={permitType} onValueChange={setPermitType} required>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis izin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sick_leave">Sakit</SelectItem>
              <SelectItem value="family_leave">Keperluan Keluarga</SelectItem>
              <SelectItem value="school_activity">Kegiatan Sekolah</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Tanggal Mulai</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="end_date">Tanggal Selesai</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="reason">Alasan Izin</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan alasan pengajuan izin..."
            required
          />
        </div>

        <div>
          <Label htmlFor="document">Dokumen Pendukung (coming soon)</Label>
          <div className="flex gap-2">
            <Input
              id="document"
              type="file"
              disabled
              className="opacity-50"
            />
            <Button type="button" disabled className="opacity-50">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Surat dokter, surat undangan, atau dokumen pendukung lainnya
          </p>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!selectedStudent || !permitType || !reason || createPermitMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajukan Izin
          </Button>
        </div>
      </form>
    </div>
  );
};
