
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';

export const CounselingStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['counseling-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      // Get today's sessions
      const { data: todaySessions } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('session_date', today);

      // Get this month's sessions
      const { data: monthSessions } = await supabase
        .from('counseling_sessions')
        .select('*')
        .gte('session_date', `${thisMonth}-01`)
        .lt('session_date', `${thisMonth}-32`);

      // Get completed sessions
      const { data: completedSessions } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('status', 'completed');

      // Get students who need follow-up
      const { data: followUpSessions } = await supabase
        .from('counseling_sessions')
        .select('*')
        .eq('follow_up_required', true)
        .eq('status', 'completed');

      return {
        todayCount: todaySessions?.length || 0,
        monthCount: monthSessions?.length || 0,
        completedCount: completedSessions?.length || 0,
        followUpCount: followUpSessions?.length || 0
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sesi Hari Ini</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.todayCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Jadwal konseling hari ini
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.monthCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total sesi bulan ini
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completedCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Sesi yang telah selesai
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tindak Lanjut</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.followUpCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Perlu tindak lanjut
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
