import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Download, FileText } from 'lucide-react';
import { AcademicYear } from '@/types/student';
import { StudentAchievement } from '@/types/attendance';

export const AchievementReport = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('all');

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_start', { ascending: false });
      
      if (error) throw error;
      return data as AcademicYear[];
    }
  });

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements-report', selectedAcademicYearId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      
      let query = supabase
        .from('student_achievements')
        .select(`
          *,
          students(id, full_name, nis),
          achievement_types(id, name, category, level, point_reward)
        `)
        .gte('achievement_date', startDate)
        .lte('achievement_date', endDate)
        .order('achievement_date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (StudentAchievement & { students: any, achievement_types: any })[];
    },
    enabled: !!startDate && !!endDate
  });

  const getAchievementsByStudent = () => {
    if (!achievements) return [];

    const byStudent = achievements.reduce((acc, achievement) => {
      const studentId = achievement.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: achievement.students,
          achievements: [],
          totalPoints: 0,
          categoryCounts: { akademik: 0, non_akademik: 0, prestasi: 0 },
          levelCounts: { 
            sekolah: 0, 
            kecamatan: 0, 
            kabupaten: 0,
            provinsi: 0,
            nasional: 0,
            internasional: 0 
          }
        };
      }
      
      acc[studentId].achievements.push(achievement);
      acc[studentId].totalPoints += achievement.point_reward;
      
      const category = achievement.achievement_types?.category || 'akademik';
      acc[studentId].categoryCounts[category]++;
      
      const level = achievement.achievement_types?.level || 'sekolah';
      acc[studentId].levelCounts[level]++;
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by total points descending
    return Object.values(byStudent).sort((a, b) => b.totalPoints - a.totalPoints);
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
    const className = level === 'provinsi' ? 'bg-purple-100 text-purple-800' : 
                    level === 'nasional' ? 'bg-blue-100 text-blue-800' : '';
    
    return config ? (
      <Badge 
        variant={config.variant}
        className={className}
      >
        {level}
      </Badge>
    ) : null;
  };

  const achievementsByStudent = getAchievementsByStudent();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="endDate">Tanggal Selesai</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
          />
        </div>
        
        <div>
          <Label htmlFor="academic_year">Tahun Ajaran (Opsional)</Label>
          <Select value={selectedAcademicYearId} onValueChange={setSelectedAcademicYearId}>
            <SelectTrigger>
              <SelectValue placeholder="Semua tahun ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua tahun ajaran</SelectItem>
              {academicYears?.map((ay) => (
                <SelectItem key={ay.id} value={ay.id}>
                  {ay.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Laporan Prestasi {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')} 
            </h3>
          </div>
          
          <Button disabled className="opacity-50" title="Fitur akan datang">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : achievementsByStudent.length > 0 ? (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left">Nama Siswa</th>
                    <th className="px-4 py-3 text-left">NIS</th>
                    <th className="px-4 py-3 text-center">Prestasi Akademik</th>
                    <th className="px-4 py-3 text-center">Prestasi Non-Akademik</th>
                    <th className="px-4 py-3 text-center">Prestasi Lainnya</th>
                    <th className="px-4 py-3 text-center">Total Poin Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {achievementsByStudent.map((data, index) => (
                    <tr key={data.student.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{data.student.full_name}</td>
                      <td className="px-4 py-3">{data.student.nis}</td>
                      <td className="px-4 py-3 text-center">{data.categoryCounts.akademik}</td>
                      <td className="px-4 py-3 text-center">{data.categoryCounts.non_akademik}</td>
                      <td className="px-4 py-3 text-center">{data.categoryCounts.prestasi}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary">
                          +{data.totalPoints} poin
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <h3 className="text-lg font-semibold mt-8">Detail Prestasi</h3>
            <div className="space-y-4">
              {achievementsByStudent.map((data) => (
                <div key={data.student.id} className="border rounded-lg">
                  <div className="p-4 border-b bg-slate-50">
                    <h4 className="font-medium">{data.student.full_name} - {data.student.nis}</h4>
                    <div className="text-sm text-gray-500">Total: +{data.totalPoints} poin</div>
                  </div>
                  <div className="divide-y">
                    {data.achievements.map((achievement) => (
                      <div key={achievement.id} className="p-4">
                        <div className="flex justify-between">
                          <div className="font-medium">{achievement.achievement_types?.name}</div>
                          <Badge variant="secondary">
                            +{achievement.point_reward} poin
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {getCategoryBadge(achievement.achievement_types?.category)}
                          {getLevelBadge(achievement.achievement_types?.level)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Tanggal: {format(new Date(achievement.achievement_date), 'dd MMMM yyyy')}
                        </div>
                        {achievement.description && (
                          <div className="text-sm mt-2">{achievement.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">Tidak ada data prestasi dalam periode ini</div>
        )}
      </div>
    </div>
  );
};
