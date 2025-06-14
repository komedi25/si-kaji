
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, AlertTriangle, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StatisticsData {
  totalStudents: number;
  activeStudents: number;
  totalViolations: number;
  totalAchievements: number;
  weeklyViolations: number;
  weeklyAchievements: number;
  violationTrend: 'up' | 'down' | 'stable';
  achievementTrend: 'up' | 'down' | 'stable';
}

export function StatisticsCard() {
  const [stats, setStats] = useState<StatisticsData>({
    totalStudents: 0,
    activeStudents: 0,
    totalViolations: 0,
    totalAchievements: 0,
    weeklyViolations: 0,
    weeklyAchievements: 0,
    violationTrend: 'stable',
    achievementTrend: 'stable'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      // Get total and active students
      const { data: students } = await supabase
        .from('students')
        .select('status');

      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter(s => s.status === 'active').length || 0;

      // Get violations data
      const { data: violations } = await supabase
        .from('student_violations')
        .select('violation_date')
        .eq('status', 'active');

      const totalViolations = violations?.length || 0;

      // Get weekly violations
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyViolations = violations?.filter(v => 
        new Date(v.violation_date) >= oneWeekAgo
      ).length || 0;

      // Get previous week violations for trend
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const previousWeekViolations = violations?.filter(v => {
        const violationDate = new Date(v.violation_date);
        return violationDate >= twoWeeksAgo && violationDate < oneWeekAgo;
      }).length || 0;

      const violationTrend = weeklyViolations > previousWeekViolations ? 'up' :
                           weeklyViolations < previousWeekViolations ? 'down' : 'stable';

      // Get achievements data
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select('achievement_date')
        .eq('status', 'verified');

      const totalAchievements = achievements?.length || 0;

      // Get weekly achievements
      const weeklyAchievements = achievements?.filter(a => 
        new Date(a.achievement_date) >= oneWeekAgo
      ).length || 0;

      // Get previous week achievements for trend
      const previousWeekAchievements = achievements?.filter(a => {
        const achievementDate = new Date(a.achievement_date);
        return achievementDate >= twoWeeksAgo && achievementDate < oneWeekAgo;
      }).length || 0;

      const achievementTrend = weeklyAchievements > previousWeekAchievements ? 'up' :
                             weeklyAchievements < previousWeekAchievements ? 'down' : 'stable';

      setStats({
        totalStudents,
        activeStudents,
        totalViolations,
        totalAchievements,
        weeklyViolations,
        weeklyAchievements,
        violationTrend,
        achievementTrend
      });

    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositive: boolean = false) => {
    if (trend === 'stable') return 'text-gray-500';
    if (isPositive) {
      return trend === 'up' ? 'text-green-600' : 'text-red-600';
    } else {
      return trend === 'up' ? 'text-red-600' : 'text-green-600';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeStudents} siswa aktif
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Siswa Aktif</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeStudents.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.activeStudents / stats.totalStudents) * 100).toFixed(1)}% dari total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pelanggaran</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalViolations.toLocaleString()}</div>
          <div className="flex items-center text-xs">
            <span className={getTrendColor(stats.violationTrend, false)}>
              {getTrendIcon(stats.violationTrend)}
              {stats.weeklyViolations} minggu ini
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prestasi</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAchievements.toLocaleString()}</div>
          <div className="flex items-center text-xs">
            <span className={getTrendColor(stats.achievementTrend, true)}>
              {getTrendIcon(stats.achievementTrend)}
              {stats.weeklyAchievements} minggu ini
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
