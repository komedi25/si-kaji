import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Users, 
  CheckCircle, 
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Eye,
  Calendar,
  Filter
} from 'lucide-react';
import { format, subDays, differenceInHours } from 'date-fns';
import { id } from 'date-fns/locale';

interface CaseStats {
  total_cases: number;
  pending_cases: number;
  under_review_cases: number;
  escalated_cases: number;
  resolved_cases: number;
  avg_resolution_time: number;
  cases_by_category: Array<{ category: string; count: number }>;
  cases_by_handler: Array<{ handler: string; count: number }>;
  recent_trends: Array<{ date: string; count: number }>;
}

interface CaseOverdue {
  id: string;
  case_number: string;
  title: string;
  category: string;
  priority: string;
  assigned_handler: string | null;
  assigned_to: string | null;
  created_at: string;
  hours_overdue: number;
  handler_name?: string;
}

interface EscalationActivity {
  id: string;
  case_number: string;
  case_title: string;
  escalated_from: string;
  escalated_to: string;
  escalation_reason: string;
  escalated_at: string;
  automated: boolean;
}

export const EnhancedCaseTrackingDashboard = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [overdueCases, setOverdueCases] = useState<CaseOverdue[]>([]);
  const [escalations, setEscalations] = useState<EscalationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // days

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCaseStats(),
        fetchOverdueCases(),
        fetchEscalationActivities()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseStats = async () => {
    const daysAgo = parseInt(timeRange);
    const startDate = subDays(new Date(), daysAgo);

    // Get case counts by status with student data
    const { data: statusCounts } = await supabase
      .from('student_cases')
      .select(`
        status,
        reported_student_id,
        students:reported_student_id (
          id,
          nis,
          full_name,
          class_id,
          classes:class_id (
            name,
            grade
          )
        )
      `)
      .gte('created_at', startDate.toISOString());

    // Get cases by category with student data
    const { data: categoryData } = await supabase
      .from('student_cases')
      .select(`
        category,
        reported_student_id,
        students:reported_student_id (
          id,
          nis,
          full_name,
          class_id,
          classes:class_id (
            name,
            grade
          )
        )
      `)
      .gte('created_at', startDate.toISOString());

    // Get cases by handler with student data
    const { data: handlerData } = await supabase
      .from('student_cases')
      .select(`
        assigned_handler,
        reported_student_id,
        students:reported_student_id (
          id,
          nis,
          full_name,
          class_id,
          classes:class_id (
            name,
            grade
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .not('assigned_handler', 'is', null);

    // Calculate stats
    const total_cases = statusCounts?.length || 0;
    const pending_cases = statusCounts?.filter(c => c.status === 'pending').length || 0;
    const under_review_cases = statusCounts?.filter(c => c.status === 'under_review').length || 0;
    const escalated_cases = statusCounts?.filter(c => c.status === 'escalated').length || 0;
    const resolved_cases = statusCounts?.filter(c => c.status === 'resolved').length || 0;

    // Group by category
    const categoryGroups = categoryData?.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {}) || {};

    const cases_by_category = Object.entries(categoryGroups).map(([category, count]) => ({
      category,
      count: count as number
    }));

    // Group by handler
    const handlerGroups = handlerData?.reduce((acc: any, curr) => {
      acc[curr.assigned_handler] = (acc[curr.assigned_handler] || 0) + 1;
      return acc;
    }, {}) || {};

    const cases_by_handler = Object.entries(handlerGroups).map(([handler, count]) => ({
      handler,
      count: count as number
    }));

    setStats({
      total_cases,
      pending_cases,
      under_review_cases,
      escalated_cases,
      resolved_cases,
      avg_resolution_time: 24, // Mock data
      cases_by_category,
      cases_by_handler,
      recent_trends: [] // Mock data
    });
  };

  const fetchOverdueCases = async () => {
    const { data: cases } = await supabase
      .from('student_cases')
      .select(`
        id,
        case_number,
        title,
        category,
        priority,
        assigned_handler,
        assigned_to,
        created_at,
        reported_student_id,
        profiles:assigned_to (full_name),
        students:reported_student_id (
          id,
          nis,
          full_name,
          class_id,
          classes:class_id (
            name,
            grade
          )
        )
      `)
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: true });

    const overdue = cases?.map(caseItem => {
      const hoursElapsed = differenceInHours(new Date(), new Date(caseItem.created_at));
      const isOverdue = hoursElapsed > 24; // Simple 24h rule for demo
      
      return {
        ...caseItem,
        hours_overdue: hoursElapsed - 24,
        handler_name: (caseItem.profiles as any)?.full_name
      };
    }).filter(c => c.hours_overdue > 0) || [];

    setOverdueCases(overdue);
  };

  const fetchEscalationActivities = async () => {
    const { data: escalationData } = await supabase
      .from('case_escalations')
      .select(`
        id,
        escalated_from,
        escalated_to,
        escalation_reason,
        escalated_at,
        automated,
        student_cases (case_number, title)
      `)
      .order('escalated_at', { ascending: false })
      .limit(10);

    const formatted = escalationData?.map(esc => ({
      id: esc.id,
      case_number: (esc.student_cases as any)?.case_number || '',
      case_title: (esc.student_cases as any)?.title || '',
      escalated_from: esc.escalated_from,
      escalated_to: esc.escalated_to,
      escalation_reason: esc.escalation_reason,
      escalated_at: esc.escalated_at,
      automated: esc.automated
    })) || [];

    setEscalations(formatted);
  };

  const handleManualEscalation = async (caseId: string) => {
    try {
      const { error } = await supabase.rpc('check_case_escalations');
      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Proses eskalasi manual dijalankan"
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error running manual escalation:', error);
      toast({
        title: "Error",
        description: "Gagal menjalankan eskalasi manual",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock },
      under_review: { label: 'Ditinjau', variant: 'default' as const, icon: Eye },
      investigating: { label: 'Investigasi', variant: 'default' as const, icon: Users },
      escalated: { label: 'Eskalasi', variant: 'destructive' as const, icon: ArrowUp },
      resolved: { label: 'Selesai', variant: 'outline' as const, icon: CheckCircle },
      closed: { label: 'Ditutup', variant: 'outline' as const, icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      tppk: 'bg-blue-100 text-blue-800',
      p4gn: 'bg-purple-100 text-purple-800',
      arps: 'bg-green-100 text-green-800',
      waka_kesiswaan: 'bg-red-100 text-red-800',
      guru_bk: 'bg-yellow-100 text-yellow-800'
    };
    
    const roleLabels = {
      tppk: 'TPPK',
      p4gn: 'P4GN',
      arps: 'ARPS',
      waka_kesiswaan: 'Waka Kesiswaan',
      guru_bk: 'Guru BK'
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600', 
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Pelacakan Kasus</h2>
          <p className="text-muted-foreground">Monitor dan kelola kasus secara real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="1">1 Hari</option>
            <option value="7">7 Hari</option>
            <option value="30">30 Hari</option>
            <option value="90">90 Hari</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Kasus</p>
                  <p className="text-2xl font-bold">{stats.total_cases}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Menunggu</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_cases}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dieskalasi</p>
                  <p className="text-2xl font-bold text-red-600">{stats.escalated_cases}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selesai</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved_cases}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overdue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overdue">Kasus Terlambat</TabsTrigger>
          <TabsTrigger value="escalations">Riwayat Eskalasi</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        {/* Overdue Cases */}
        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Kasus yang Terlambat ({overdueCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueCases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada kasus yang terlambat</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overdueCases.map((caseItem) => (
                    <Card key={caseItem.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{caseItem.title}</h4>
                              <Badge variant="outline">{caseItem.case_number}</Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="secondary">{caseItem.category}</Badge>
                              <Badge className={getPriorityColor(caseItem.priority)}>
                                {caseItem.priority}
                              </Badge>
                              {caseItem.assigned_handler && getRoleBadge(caseItem.assigned_handler)}
                            </div>

                            <div className="text-sm text-muted-foreground">
                              <p>Terlambat: {Math.round(caseItem.hours_overdue)} jam</p>
                              {caseItem.handler_name && (
                                <p>Handler: {caseItem.handler_name}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleManualEscalation(caseItem.id)}
                              className="flex items-center gap-1"
                            >
                              <ArrowUp className="h-3 w-3" />
                              Eskalasi
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation History */}
        <TabsContent value="escalations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUp className="h-5 w-5" />
                Riwayat Eskalasi Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              {escalations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada eskalasi kasus</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {escalations.map((escalation) => (
                    <Card key={escalation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{escalation.case_title}</h4>
                              <Badge variant="outline">{escalation.case_number}</Badge>
                              {escalation.automated && (
                                <Badge className="bg-blue-100 text-blue-800">Otomatis</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              {getRoleBadge(escalation.escalated_from)}
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              {getRoleBadge(escalation.escalated_to)}
                            </div>

                            <p className="text-sm text-muted-foreground mb-1">
                              {escalation.escalation_reason}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(escalation.escalated_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Kasus per Kategori</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.cases_by_category.map((item) => (
                        <div key={item.category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(item.count / stats.total_cases) * 100} 
                              className="w-20 h-2" 
                            />
                            <span className="text-sm font-medium">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Kasus per Handler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.cases_by_handler.map((item) => (
                        <div key={item.handler} className="flex items-center justify-between">
                          {getRoleBadge(item.handler)}
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(item.count / stats.total_cases) * 100} 
                              className="w-20 h-2" 
                            />
                            <span className="text-sm font-medium">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};