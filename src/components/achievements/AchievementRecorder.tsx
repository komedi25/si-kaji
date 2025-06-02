
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
import { Plus, Search, Upload } from 'lucide-react';
import { AchievementType } from '@/types/masterData';
import { StudentWithClass } from '@/types/student';

export const AchievementRecorder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  const [selectedAchievementType, setSelectedAchievementType] = useState<string>('');
  const [achievementDate, setAchievementDate] = useState(format(new Date(), 'yyyy-MM-dd'));
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

  const { data: achievementTypes } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as AchievementType[];
    }
  });

  const createAchievementMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('student_achievements')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-achievements'] });
      resetForm();
      toast({ title: 'Prestasi berhasil dicatat' });
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
    setSelectedAchievementType('');
    setAchievementDate(format(new Date(), 'yyyy-MM-dd'));
    setDescription('');
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedAchievementType) {
      toast({
        title: 'Error',
        description: 'Pilih siswa dan jenis prestasi terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    const achievementType = achievementTypes?.find(at => at.id === selectedAchievementType);
    
    const { data: userData, error } = await supabase.auth.getUser();
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mendapatkan data pengguna',
        variant: 'destructive'
      });
      return;
    }
    
    const data = {
      student_id: selectedStudent.id,
      achievement_type_id: selectedAchievementType,
      achievement_date: achievementDate,
      description: description || null,
      point_reward: achievementType?.point_reward || 0,
      recorded_by: userData.user?.id || null
    };

    createAchievementMutation.mutate(data);
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      akademik: { variant: 'default' as const },
      non_akademik: { variant: 'secondary' as const },
      prestasi: { variant: 'outline' as const }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return config ? (
      <Badge variant={config.variant}>{category}</Badge>
    ) : null;
  };
  
  const getLevelBadge = (level: string) => {
    const levelConfig = {
      sekolah: { variant: 'outline' as const },
      kecamatan: { variant: 'secondary' as const },
      kabupaten: { variant: 'default' as const },
      provinsi: { variant: 'secondary' as const },
      nasional: { variant: 'secondary' as const },
      internasional: { variant: 'destructive' as const }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig];
    return config ? (
      <Badge variant={config.variant}>
        {level}
      </Badge>
    ) : null;
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
          <Label htmlFor="achievement_type">Jenis Prestasi</Label>
          <Select value={selectedAchievementType} onValueChange={setSelectedAchievementType}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis prestasi" />
            </SelectTrigger>
            <SelectContent>
              {achievementTypes?.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex flex-col">
                    <span>{type.name}</span>
                    <div className="flex gap-2 mt-1">
                      {getCategoryBadge(type.category)}
                      {getLevelBadge(type.level)}
                      <Badge variant="secondary">+{type.point_reward} poin</Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Tanggal Prestasi</Label>
            <Input
              id="date"
              type="date"
              value={achievementDate}
              onChange={(e) => setAchievementDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          
          <div>
            <Label htmlFor="certificate">Sertifikat/Piala (coming soon)</Label>
            <div className="flex gap-2">
              <Input
                id="certificate"
                type="file"
                disabled
                className="opacity-50"
              />
              <Button type="button" disabled className="opacity-50">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Keterangan</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi prestasi..."
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!selectedStudent || !selectedAchievementType || createAchievementMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Catat Prestasi
          </Button>
        </div>
      </form>
    </div>
  );
};
