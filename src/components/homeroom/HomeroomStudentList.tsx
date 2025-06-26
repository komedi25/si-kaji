
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageCircle, FileText, Trophy, AlertTriangle } from 'lucide-react';

interface HomeroomStudentListProps {
  classId: string;
}

export const HomeroomStudentList = ({ classId }: HomeroomStudentListProps) => {
  const { data: students, isLoading } = useQuery({
    queryKey: ['homeroom-students', classId],
    queryFn: async () => {
      const { data: enrollments, error } = await supabase
        .from('student_enrollments')
        .select(`
          students (
            id,
            nis,
            full_name,
            photo_url,
            status
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (error) throw error;

      const students = enrollments?.map(e => e.students).filter(Boolean) || [];
      
      // Get additional stats for each student
      const studentsWithStats = await Promise.all(
        students.map(async (student) => {
          // Get recent attendance
          const { data: recentAttendance } = await supabase
            .from('student_self_attendances')
            .select('status')
            .eq('student_id', student.id)
            .order('attendance_date', { ascending: false })
            .limit(7);

          // Get discipline points
          const { data: disciplinePoints } = await supabase
            .from('student_discipline_points')
            .select('final_score, discipline_status')
            .eq('student_id', student.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get pending achievements
          const { data: pendingAchievements } = await supabase
            .from('student_achievements')
            .select('id')
            .eq('student_id', student.id)
            .eq('status', 'pending');

          const presentDays = recentAttendance?.filter(a => a.status === 'present').length || 0;
          const attendanceRate = recentAttendance?.length ? (presentDays / recentAttendance.length) * 100 : 0;

          return {
            ...student,
            attendanceRate: Math.round(attendanceRate),
            disciplineScore: disciplinePoints?.final_score || 100,
            disciplineStatus: disciplinePoints?.discipline_status || 'good',
            pendingAchievements: pendingAchievements?.length || 0
          };
        })
      );

      return studentsWithStats;
    },
    enabled: !!classId
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'probation': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Sangat Baik';
      case 'good': return 'Baik';
      case 'warning': return 'Peringatan';
      case 'probation': return 'Percobaan';
      case 'critical': return 'Kritis';
      default: return 'Normal';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Siswa Kelas ({students?.length || 0} siswa)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students?.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={student.photo_url || undefined} alt={student.full_name} />
                  <AvatarFallback>
                    {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h4 className="font-medium">{student.full_name}</h4>
                  <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Kehadiran:</span>
                      <span className={`text-xs font-medium ${
                        student.attendanceRate >= 90 ? 'text-green-600' : 
                        student.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.attendanceRate}%
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Disiplin:</span>
                      <Badge className={`text-xs ${getStatusColor(student.disciplineStatus)}`}>
                        {getStatusText(student.disciplineStatus)}
                      </Badge>
                    </div>
                    
                    {student.pendingAchievements > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs text-yellow-600">
                          {student.pendingAchievements} prestasi pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Detail
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Kontak
                </Button>
              </div>
            </div>
          ))}
          
          {!students?.length && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada siswa di kelas ini</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
