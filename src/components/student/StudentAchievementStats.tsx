
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface StudentAchievementStatsProps {
  studentId: string;
}

export const StudentAchievementStats = ({ studentId }: StudentAchievementStatsProps) => {
  const { data: achievementData, isLoading } = useQuery({
    queryKey: ['student-achievement-stats', studentId],
    queryFn: async () => {
      // Get achievements
      const { data: achievements } = await supabase
        .from('student_achievements')
        .select(`
          *,
          achievement_types(achievement_name, point_reward, category)
        `)
        .eq('student_id', studentId)
        .order('achievement_date', { ascending: false });

      const verified = achievements?.filter(a => a.status === 'verified') || [];
      const pending = achievements?.filter(a => a.status === 'pending') || [];
      const rejected = achievements?.filter(a => a.status === 'rejected') || [];

      const totalPoints = verified.reduce((sum, a) => sum + (a.point_reward || 0), 0);

      // Group by category
      const byCategory: Record<string, number> = {};
      verified.forEach(achievement => {
        const category = achievement.achievement_types?.category || 'Lainnya';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      const categoryData = Object.entries(byCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Group by level/tier
      const byLevel: Record<string, number> = {};
      verified.forEach(achievement => {
        const level = achievement.level || 'Sekolah';
        byLevel[level] = (byLevel[level] || 0) + 1;
      });

      const levelData = Object.entries(byLevel)
        .map(([level, count]) => ({ level, count }));

      // Monthly trend (last 6 months)
      const monthlyTrend: Record<string, number> = {};
      verified.forEach(achievement => {
        const month = format(new Date(achievement.achievement_date), 'MMM yyyy', { locale: localeId });
        monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
      });

      const trendData = Object.entries(monthlyTrend)
        .map(([month, count]) => ({ month, count }))
        .slice(-6);

      return {
        totalAchievements: verified.length,
        pendingCount: pending.length,
        rejectedCount: rejected.length,
        totalPoints,
        recentAchievements: verified.slice(0, 5),
        categoryData,
        levelData,
        trendData
      };
    },
    enabled: !!studentId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { totalAchievements, pendingCount, rejectedCount, totalPoints, recentAchievements, categoryData, levelData, trendData } = achievementData || {};

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prestasi</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalAchievements}</div>
            <p className="text-xs text-muted-foreground">terverifikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poin Prestasi</CardTitle>
            <Star className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">total poin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
            <Medal className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">prestasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend Bulanan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {trendData?.[trendData.length - 1]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prestasi per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Jumlah", color: "#3b82f6" }
              }}
              className="h-[250px]"
            >
              <BarChart data={categoryData}>
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prestasi per Tingkat</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                level: { label: "Tingkat", color: "#10b981" }
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={levelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                >
                  {levelData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Prestasi (6 Bulan Terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: { label: "Jumlah Prestasi", color: "#10b981" }
            }}
            className="h-[250px]"
          >
            <BarChart data={trendData}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Prestasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAchievements?.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {achievement.achievement_types?.achievement_name || achievement.achievement_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(achievement.achievement_date), 'dd MMMM yyyy', { locale: localeId })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tingkat: {achievement.level} • Kategori: {achievement.achievement_types?.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-yellow-600">
                      +{achievement.point_reward}
                    </span>
                    <p className="text-xs text-gray-500">poin</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Prestasi</h3>
              <p className="text-gray-600">Mulai raih prestasi pertama Anda!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
