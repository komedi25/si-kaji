
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, Award, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  percentage: number;
}

interface DisciplineData {
  final_score: number;
  total_violations: number;
  total_achievements: number;
  recent_violations: Array<{
    id: string;
    violation_date: string;
    violation_type: string;
    point_deduction: number;
  }>;
  recent_achievements: Array<{
    id: string;
    achievement_date: string;
    achievement_type: string;
    point_reward: number;
  }>;
}

interface ParentOverviewTabProps {
  attendanceStats: AttendanceStats | null;
  disciplineData: DisciplineData | null;
}

export const ParentOverviewTab: React.FC<ParentOverviewTabProps> = ({
  attendanceStats,
  disciplineData
}) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-blue-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDisciplineColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDisciplineLabel = (score: number) => {
    if (score >= 90) return 'Sangat Baik';
    if (score >= 75) return 'Baik';
    if (score >= 60) return 'Cukup';
    return 'Perlu Perhatian';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Ringkasan Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Persentase Kehadiran</span>
              <span className={`font-bold ${getAttendanceColor(attendanceStats?.percentage || 0)}`}>
                {attendanceStats?.percentage || 0}%
              </span>
            </div>
            <Progress value={attendanceStats?.percentage || 0} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 font-semibold">{attendanceStats?.present_days || 0}</div>
                <div className="text-muted-foreground">Hadir</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-semibold">{attendanceStats?.late_days || 0}</div>
                <div className="text-muted-foreground">Terlambat</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-semibold">{attendanceStats?.absent_days || 0}</div>
                <div className="text-muted-foreground">Tidak Hadir</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discipline Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Status Disiplin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getDisciplineColor(disciplineData?.final_score || 0)}`}>
                {disciplineData?.final_score || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {getDisciplineLabel(disciplineData?.final_score || 0)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-red-600 font-semibold">-{disciplineData?.total_violations || 0}</div>
                <div className="text-muted-foreground">Poin Pelanggaran</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-green-600 font-semibold">+{disciplineData?.total_achievements || 0}</div>
                <div className="text-muted-foreground">Poin Prestasi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prestasi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {disciplineData?.recent_achievements?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Belum ada prestasi</p>
            ) : (
              <div className="space-y-3">
                {disciplineData?.recent_achievements?.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-2 bg-green-50 rounded">
                    <Award className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{achievement.achievement_type}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(achievement.achievement_date), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </div>
                    <Badge variant="default">+{achievement.point_reward}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pelanggaran Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {disciplineData?.recent_violations?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Tidak ada pelanggaran</p>
            ) : (
              <div className="space-y-3">
                {disciplineData?.recent_violations?.slice(0, 3).map((violation) => (
                  <div key={violation.id} className="flex items-center gap-3 p-2 bg-red-50 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{violation.violation_type}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(violation.violation_date), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </div>
                    <Badge variant="destructive">-{violation.point_deduction}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
