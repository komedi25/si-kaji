import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download,
  Search
} from 'lucide-react';
import { AcademicYear, Semester } from '@/types/student';
import { StudentDisciplinePoint } from '@/types/attendance';

const DisciplinePointsManagement = () => {
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_start', { ascending: false });
      
      if (error) throw error;
      
      // Set default to active academic year
      const activeYear = data.find(y => y.is_active);
      if (activeYear && !selectedAcademicYearId) {
        setSelectedAcademicYearId(activeYear.id);
      }
      
      return data as AcademicYear[];
    }
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters', selectedAcademicYearId],
    queryFn: async () => {
      if (!selectedAcademicYearId) return [];
      
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .eq('academic_year_id', selectedAcademicYearId)
        .order('semester_number');
      
      if (error) throw error;

      // Set default to active semester
      const activeSemester = data.find(s => s.is_active);
      if (activeSemester && !selectedSemesterId) {
        setSelectedSemesterId(activeSemester.id);
      }
      
      return data as Semester[];
    },
    enabled: !!selectedAcademicYearId
  });

  const { data: disciplinePoints, isLoading } = useQuery({
    queryKey: ['discipline-points', selectedAcademicYearId, selectedSemesterId, searchQuery],
    queryFn: async () => {
      if (!selectedAcademicYearId) return [];
      
      let query = supabase
        .from('student_discipline_points')
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
          )
        `)
        .eq('academic_year_id', selectedAcademicYearId);
        
      if (selectedSemesterId) {
        query = query.eq('semester_id', selectedSemesterId);
      } else {
        query = query.is('semester_id', null);
      }

      // Apply search filter if provided
      if (searchQuery && searchQuery.length >= 3) {
        query = query.or(`student.nis.ilike.%${searchQuery}%,student.full_name.ilike.%${searchQuery}%`);
      }
      
      query = query.order('final_score', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(point => ({
        ...point,
        student: {
          ...point.student,
          current_class: point.student?.current_enrollment?.[0]?.class
        }
      })) as StudentDisciplinePoint[];
    },
    enabled: !!selectedAcademicYearId && (searchQuery === '' || searchQuery.length >= 3)
  });

  const getDisciplineStatusBadge = (status: string) => {
    const statusConfig = {
      excellent: { label: 'Sangat Baik', variant: 'default' as const },
      good: { label: 'Baik', variant: 'secondary' as const },
      warning: { label: 'Peringatan', variant: 'secondary' as const },
      probation: { label: 'Masa Percobaan', variant: 'destructive' as const },
      critical: { label: 'Kritis', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const className = status === 'warning' ? 'bg-yellow-100 text-yellow-800' : '';
    
    return config ? (
      <Badge 
        variant={config.variant} 
        className={className}
      >
        {config.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Poin Disiplin Siswa</h1>
        <p className="text-gray-600 mt-2">
          Pantau poin disiplin siswa dari pelanggaran dan prestasi
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekap Poin Disiplin</CardTitle>
          <CardDescription>
            Laporan akumulasi poin disiplin siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="academic_year">Tahun Ajaran</Label>
              <Select value={selectedAcademicYearId} onValueChange={setSelectedAcademicYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((ay) => (
                    <SelectItem key={ay.id} value={ay.id}>
                      {ay.name} {ay.is_active && '(Aktif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Semester</SelectItem>
                  {semesters?.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name} {sem.is_active && '(Aktif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Cari Siswa</Label>
              <div className="relative">
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama atau NIS siswa"
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                Data Poin Disiplin {semesters?.find(s => s.id === selectedSemesterId)?.name || 'Semua Semester'}
              </h3>
            </div>
            
            <Button disabled className="opacity-50" title="Fitur akan datang">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : disciplinePoints && disciplinePoints.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left">Nama Siswa</th>
                    <th className="px-4 py-3 text-left">NIS</th>
                    <th className="px-4 py-3 text-left">Kelas</th>
                    <th className="px-4 py-3 text-center">Poin Prestasi</th>
                    <th className="px-4 py-3 text-center">Poin Pelanggaran</th>
                    <th className="px-4 py-3 text-center">Skor Akhir</th>
                    <th className="px-4 py-3 text-center">Status Disiplin</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplinePoints.map((point) => (
                    <tr key={point.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{point.student?.full_name}</td>
                      <td className="px-4 py-3">{point.student?.nis}</td>
                      <td className="px-4 py-3">{point.student?.current_class?.name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary">+{point.total_achievement_points}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={point.total_violation_points > 0 ? 'destructive' : 'outline'}>
                          -{point.total_violation_points}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{point.final_score}</td>
                      <td className="px-4 py-3 text-center">
                        {getDisciplineStatusBadge(point.discipline_status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">Tidak ada data poin disiplin</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DisciplinePointsManagement;
