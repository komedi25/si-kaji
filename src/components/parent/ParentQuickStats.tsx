
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Target, Star, Bell } from 'lucide-react';

interface AttendanceStats {
  percentage: number;
}

interface DisciplineData {
  final_score: number;
  recent_achievements: Array<{
    id: string;
    achievement_date: string;
    achievement_type: string;
    point_reward: number;
  }>;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface ParentQuickStatsProps {
  attendanceStats: AttendanceStats | null;
  disciplineData: DisciplineData | null;
  notifications: NotificationData[];
}

export const ParentQuickStats: React.FC<ParentQuickStatsProps> = ({
  attendanceStats,
  disciplineData,
  notifications
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Kehadiran</div>
              <div className={`text-xl font-bold ${getAttendanceColor(attendanceStats?.percentage || 0)}`}>
                {attendanceStats?.percentage || 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Disiplin</div>
              <div className={`text-xl font-bold ${getDisciplineColor(disciplineData?.final_score || 0)}`}>
                {disciplineData?.final_score || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Prestasi</div>
              <div className="text-xl font-bold text-yellow-600">
                {disciplineData?.recent_achievements?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Notifikasi</div>
              <div className="text-xl font-bold text-red-600">
                {notifications.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
