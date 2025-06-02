import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import { ViolationType } from '@/types/masterData';
import { StudentWithClass } from '@/types/student';

export const ViolationRecorder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  const [selectedViolationType, setSelectedViolationType] = useState<string>('');
  const [violationDate, setViolationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
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
              is_active,
              created_at,
              updated_at,
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
      })) as StudentWithClass[];
    },
    enabled: searchQuery.length >= 3
  });

  const { data: violationTypes } = useQuery({
    queryKey: ['violation-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('violation_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as ViolationType[];
    }
  });

  const createViolationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('student_violations')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-violations'] });
      resetForm();
      toast({ title: 'Pelanggaran berhasil dicatat' });
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
    setSelectedViolationType('');
    setViolationDate(format(new Date(), 'yyyy-MM-dd'));
    setDescription('');
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedViolationType) {
      toast({
        title: 'Error',
        description: 'Pilih siswa dan jenis pelanggaran terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    const violationType = violationTypes?.find(vt => vt.id === selectedViolationType);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const data = {
      student_id: selectedStudent.id,
      violation_type_id: selectedViolationType,
      violation_date: violationDate,
      description: description || null,
      point_deduction: violationType?.point_deduction || 0,
      reported_by: userData.user?.id || null
    };

    createViolationMutation.mutate(data);
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
          <Label htmlFor="violation_type">Jenis Pelanggaran</Label>
          <Select value={selectedViolationType} onValueChange={setSelectedViolationType}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis pelanggaran" />
            </SelectTrigger>
            <SelectContent>
              {violationTypes?.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex justify-between">
                    <span>{type.name}</span>
                    <Badge variant={
                      type.category === 'ringan' ? 'outline' : 
                      type.category === 'sedang' ? 'secondary' : 'destructive'
                    }>
                      {type.point_deduction} poin
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Tanggal Pelanggaran</Label>
            <Input
              id="date"
              type="date"
              value={violationDate}
              onChange={(e) => setViolationDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Keterangan</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi pelanggaran..."
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!selectedStudent || !selectedViolationType || createViolationMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Catat Pelanggaran
          </Button>
        </div>
      </form>
    </div>
  );
};
