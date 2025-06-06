
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, User, Award, AlertTriangle } from 'lucide-react';

export const StudentProgressTracking = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    try {
      // Fetch students with their progress data
      const { data: studentsData, error } = await supabase
        .from('students')
        .select(`
          *,
          student_attendances(count),
          student_violations(count),
          student_achievements(count),
          student_discipline_points(*)
        `)
        .eq('status', 'active')
        .limit(20);

      if (error) throw error;
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'excellent': { label: 'Sangat Baik', variant: 'default' },
      'good': { label: 'Baik', variant: 'secondary' },
      'warning': { label: 'Perhatian', variant: 'outline' },
      'critical': { label: 'Kritis', variant: 'destructive' }
    };
    
    const config = statusMap[status] || statusMap.good;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Memuat data progres siswa...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Pelacakan Progres Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Ringkasan</TabsTrigger>
              <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
              <TabsTrigger value="behavior">Perilaku</TabsTrigger>
              <TabsTrigger value="achievements">Prestasi</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                {students.map((student) => (
                  <Card key={student.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{student.full_name}</h3>
                            <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Poin Disiplin</div>
                            <div className={`font-bold ${getProgressColor(student.student_discipline_points?.[0]?.final_score || 100)}`}>
                              {student.student_discipline_points?.[0]?.final_score || 100}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Status</div>
                            {getStatusBadge(student.student_discipline_points?.[0]?.discipline_status || 'good')}
                          </div>

                          <Progress 
                            value={student.student_discipline_points?.[0]?.final_score || 100} 
                            className="w-24"
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span>Kehadiran: 95%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span>Pelanggaran: {student.student_violations?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-600" />
                          <span>Prestasi: {student.student_achievements?.length || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <div className="text-center p-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Analisis Kehadiran Detil</h3>
                <p>Grafik dan statistik kehadiran siswa akan ditampilkan di sini</p>
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <div className="text-center p-8 text-muted-foreground">
                <TrendingDown className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Analisis Perilaku</h3>
                <p>Trend perilaku dan intervensi yang diperlukan</p>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <div className="text-center p-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Capaian Prestasi</h3>
                <p>Prestasi akademik dan non-akademik siswa</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
