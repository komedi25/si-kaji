
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
import { Download, FileText } from 'lucide-react';
import { AcademicYear } from '@/types/student';
import { StudentViolation } from '@/types/attendance';

export const ViolationReport = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');

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

  const { data: violations, isLoading } = useQuery({
    queryKey: ['violations-report', selectedAcademicYearId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      
      let query = supabase
        .from('student_violations')
        .select(`
          *,
          students(id, full_name, nis),
          violation_types(id, name, category, point_deduction)
        `)
        .gte('violation_date', startDate)
        .lte('violation_date', endDate)
        .order('violation_date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (StudentViolation & { students: any, violation_types: any })[];
    },
    enabled: !!startDate && !!endDate
  });

  const getViolationsByStudent = () => {
    if (!violations) return [];

    const byStudent = violations.reduce((acc, violation) => {
      const studentId = violation.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: violation.students,
          violations: [],
          totalPoints: 0,
          categoryCounts: { ringan: 0, sedang: 0, berat: 0 }
        };
      }
      
      acc[studentId].violations.push(violation);
      acc[studentId].totalPoints += violation.point_deduction;
      
      const category = violation.violation_types?.category || 'ringan';
      acc[studentId].categoryCounts[category]++;
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by total points descending
    return Object.values(byStudent).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const getBadgeForCategory = (category: string) => {
    const categoryConfig = {
      ringan: { variant: 'outline' as const },
      sedang: { variant: 'secondary' as const },
      berat: { variant: 'destructive' as const }
    };
    
    return categoryConfig[category as keyof typeof categoryConfig]?.variant || 'default';
  };

  const violationsByStudent = getViolationsByStudent();

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
              <SelectItem value="">Semua tahun ajaran</SelectItem>
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
              Laporan Pelanggaran {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')} 
            </h3>
          </div>
          
          <Button disabled className="opacity-50" title="Fitur akan datang">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : violationsByStudent.length > 0 ? (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left">Nama Siswa</th>
                    <th className="px-4 py-3 text-left">NIS</th>
                    <th className="px-4 py-3 text-center">Pelanggaran Ringan</th>
                    <th className="px-4 py-3 text-center">Pelanggaran Sedang</th>
                    <th className="px-4 py-3 text-center">Pelanggaran Berat</th>
                    <th className="px-4 py-3 text-center">Total Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {violationsByStudent.map((data, index) => (
                    <tr key={data.student.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{data.student.full_name}</td>
                      <td className="px-4 py-3">{data.student.nis}</td>
                      <td className="px-4 py-3 text-center">{data.categoryCounts.ringan}</td>
                      <td className="px-4 py-3 text-center">{data.categoryCounts.sedang}</td>
                      <td className="px-4 py-3 text-center">{data.categoryCounts.berat}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          data.totalPoints >= 50 ? 'destructive' :
                          data.totalPoints >= 25 ? 'secondary' :
                          'outline'
                        }>
                          {data.totalPoints} poin
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <h3 className="text-lg font-semibold mt-8">Detail Pelanggaran</h3>
            <div className="space-y-4">
              {violationsByStudent.map((data) => (
                <div key={data.student.id} className="border rounded-lg">
                  <div className="p-4 border-b bg-slate-50">
                    <h4 className="font-medium">{data.student.full_name} - {data.student.nis}</h4>
                    <div className="text-sm text-gray-500">Total: {data.totalPoints} poin</div>
                  </div>
                  <div className="divide-y">
                    {data.violations.map((violation) => (
                      <div key={violation.id} className="p-4">
                        <div className="flex justify-between">
                          <div className="font-medium">{violation.violation_types?.name}</div>
                          <Badge variant={getBadgeForCategory(violation.violation_types?.category)}>
                            {violation.point_deduction} poin
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Tanggal: {format(new Date(violation.violation_date), 'dd MMMM yyyy', { locale: id })}
                        </div>
                        {violation.description && (
                          <div className="text-sm mt-2">{violation.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">Tidak ada data pelanggaran dalam periode ini</div>
        )}
      </div>
    </div>
  );
};
