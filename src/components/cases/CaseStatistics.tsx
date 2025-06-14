
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export const CaseStatistics = () => {
  const { data: caseStats, isLoading } = useQuery({
    queryKey: ['case-statistics'],
    queryFn: async () => {
      const { data: cases } = await supabase
        .from('student_cases')
        .select('status, priority, category, created_at');

      if (!cases) return null;

      const stats = {
        total: cases.length,
        pending: cases.filter(c => c.status === 'pending').length,
        resolved: cases.filter(c => c.status === 'resolved').length,
        thisMonth: cases.filter(c => {
          const caseDate = new Date(c.created_at);
          const thisMonth = new Date();
          return caseDate.getMonth() === thisMonth.getMonth() && 
                 caseDate.getFullYear() === thisMonth.getFullYear();
        }).length,
        byCategory: cases.reduce((acc: Record<string, number>, case_item) => {
          acc[case_item.category] = (acc[case_item.category] || 0) + 1;
          return acc;
        }, {}),
        byPriority: cases.reduce((acc: Record<string, number>, case_item) => {
          acc[case_item.priority] = (acc[case_item.priority] || 0) + 1;
          return acc;
        }, {})
      };

      return stats;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!caseStats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kasus</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Semua kasus yang dilaporkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Memerlukan tindak lanjut
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terselesaikan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseStats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Kasus yang telah selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseStats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Kasus baru bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(caseStats.byCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="capitalize">{category.replace('_', ' ')}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Prioritas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(caseStats.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className="capitalize">{priority}</span>
                  <Badge 
                    variant={priority === 'critical' ? 'destructive' : 
                            priority === 'high' ? 'default' : 'outline'}
                  >
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
