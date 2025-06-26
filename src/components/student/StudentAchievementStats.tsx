
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Star, Plus, Medal, Award, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { StudentAchievementForm } from './StudentAchievementForm';
import { useState } from 'react';

interface StudentAchievementStatsProps {
  studentId: string;
}

export const StudentAchievementStats = ({ studentId }: StudentAchievementStatsProps) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Query untuk statistik prestasi
  const { data: achievementStats, isLoading, refetch } = useQuery({
    queryKey: ['student-achievements', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_achievements')
        .select(`
          *,
          achievement_types (
            name,
            category,
            level,
            point_reward
          )
        `)
        .eq('student_id', studentId)
        .order('achievement_date', { ascending: false });

      if (error) throw error;

      const verified = data?.filter(a => a.status === 'verified').length || 0;
      const pending = data?.filter(a => a.status === 'pending').length || 0;
      const rejected = data?.filter(a => a.status === 'rejected').length || 0;
      const totalPoints = data?.filter(a => a.status === 'verified')
        .reduce((sum, a) => sum + (a.point_reward || 0), 0) || 0;

      // Group by category
      const categoryStats: Record<string, number> = {};
      data?.filter(a => a.status === 'verified').forEach(achievement => {
        const category = achievement.achievement_types?.category || 'lainnya';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      // Group by level
      const levelStats: Record<string, number> = {};
      data?.filter(a => a.status === 'verified').forEach(achievement => {
        const level = achievement.achievement_types?.level || 'sekolah';
        levelStats[level] = (levelStats[level] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        verified,
        pending,
        rejected,
        totalPoints,
        achievements: data || [],
        categoryStats: Object.entries(categoryStats).map(([category, count]) => ({
          category,
          count
        })),
        levelStats: Object.entries(levelStats).map(([level, count]) => ({
          level,
          count
        }))
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const levelColors = {
    sekolah: '#10b981',
    kota: '#3b82f6',
    provinsi: '#8b5cf6',
    nasional: '#f59e0b',
    internasional: '#ef4444'
  };

  return (
    <div className="space-y-6">
      {/* Add Achievement Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prestasi Saya</h2>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Prestasi
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prestasi</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{achievementStats?.verified || 0}</div>
            <p className="text-xs text-muted-foreground">Prestasi terverifikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Verifikasi</CardTitle>
            <Star className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{achievementStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Prestasi pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{achievementStats?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">Poin prestasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Tertinggi</CardTitle>
            <Medal className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {achievementStats?.levelStats.find(l => l.level === 'internasional') ? 'Internasional' :
               achievementStats?.levelStats.find(l => l.level === 'nasional') ? 'Nasional' :
               achievementStats?.levelStats.find(l => l.level === 'provinsi') ? 'Provinsi' :
               achievementStats?.levelStats.find(l => l.level === 'kota') ? 'Kota' : 'Sekolah'}
            </div>
            <p className="text-xs text-muted-foreground">Level tertinggi</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori Prestasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                akademik: { label: "Akademik", color: "#3b82f6" },
                olahraga: { label: "Olahraga", color: "#10b981" },
                seni: { label: "Seni", color: "#8b5cf6" },
                teknologi: { label: "Teknologi", color: "#f59e0b" }
              }}
              className="h-[300px]"
            >
              <BarChart data={achievementStats?.categoryStats || []}>
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#3b82f6" name="Jumlah" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tingkat Prestasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sekolah: { label: "Sekolah", color: "#10b981" },
                kota: { label: "Kota", color: "#3b82f6" },
                provinsi: { label: "Provinsi", color: "#8b5cf6" },
                nasional: { label: "Nasional", color: "#f59e0b" },
                internasional: { label: "Internasional", color: "#ef4444" }
              }}
              className="h-[300px]"
            >
              <PieChart>
                <Pie
                  data={achievementStats?.levelStats || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ level, count }) => `${level} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {achievementStats?.levelStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={levelColors[entry.level as keyof typeof levelColors] || '#8884d8'} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Prestasi</CardTitle>
        </CardHeader>
        <CardContent>
          {achievementStats?.achievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-600 mb-2">Belum Ada Prestasi</h3>
              <p className="text-muted-foreground mb-4">
                Mulai tambahkan prestasi Anda untuk membangun portofolio yang mengesankan!
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Prestasi Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {achievementStats?.achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className={`h-5 w-5 ${
                      achievement.achievement_types?.level === 'internasional' ? 'text-red-600' :
                      achievement.achievement_types?.level === 'nasional' ? 'text-orange-600' :
                      achievement.achievement_types?.level === 'provinsi' ? 'text-purple-600' :
                      achievement.achievement_types?.level === 'kota' ? 'text-blue-600' :
                      'text-green-600'
                    }`} />
                    <div>
                      <p className="font-medium">{achievement.achievement_types?.name || 'Prestasi'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(achievement.achievement_date), 'dd MMMM yyyy', { locale: id })}
                        {achievement.description && ` • ${achievement.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      +{achievement.point_reward} poin
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      achievement.status === 'verified' ? 'bg-green-100 text-green-800' :
                      achievement.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {achievement.status === 'verified' ? 'Terverifikasi' :
                       achievement.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Achievement Form Dialog */}
      {showAddForm && (
        <StudentAchievementForm
          studentId={studentId}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};
