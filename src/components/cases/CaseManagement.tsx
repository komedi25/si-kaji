
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCaseReportForm } from './EnhancedCaseReportForm';
import { CaseWorkflowManager } from './CaseWorkflowManager';
import { CaseTrackingDashboard } from './CaseTrackingDashboard';
import { EnhancedCaseTrackingDashboard } from './EnhancedCaseTrackingDashboard';
import { CaseDetails } from './CaseDetails';
import { CaseTracker } from './CaseTracker';
import { SimpleCaseTracker } from './SimpleCaseTracker';
import { AutomatedCaseAssignment } from './AutomatedCaseAssignment';
import { SecureAnonymousReporting } from './SecureAnonymousReporting';
import { Search, Plus, Filter, BarChart3, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentCase {
  id: string;
  case_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  is_anonymous: boolean;
  reporter_name: string | null;
  reported_student_name: string | null;
  reported_student_class: string | null;
  incident_date: string | null;
  incident_location: string | null;
  assigned_handler: string | null;
  created_at: string;
  updated_at: string;
}

export const CaseManagement = () => {
  const { user, hasRole } = useAuth();
  const [selectedCase, setSelectedCase] = useState<StudentCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Check if user has management access
  const hasManagementAccess = Boolean(user && (hasRole('admin') || hasRole('guru_bk') || hasRole('tppk') || hasRole('arps') || hasRole('p4gn')));

  const { data: cases, isLoading, refetch } = useQuery({
    queryKey: ['student-cases', searchTerm, statusFilter, categoryFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from('student_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }

      if (priorityFilter && priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StudentCase[];
    },
    enabled: hasManagementAccess
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      under_review: { label: 'Ditinjau', variant: 'default' as const },
      investigating: { label: 'Investigasi', variant: 'default' as const },
      escalated: { label: 'Eskalasi', variant: 'destructive' as const },
      resolved: { label: 'Selesai', variant: 'outline' as const },
      closed: { label: 'Ditutup', variant: 'outline' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Rendah', variant: 'outline' as const },
      medium: { label: 'Sedang', variant: 'secondary' as const },
      high: { label: 'Tinggi', variant: 'default' as const },
      critical: { label: 'Kritis', variant: 'destructive' as const },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      bullying: 'Bullying',
      kekerasan: 'Kekerasan',
      narkoba: 'Narkoba',
      pergaulan_bebas: 'Pergaulan Bebas',
      tawuran: 'Tawuran',
      pencurian: 'Pencurian',
      vandalisme: 'Vandalisme',
      lainnya: 'Lainnya',
    };
    
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  if (selectedCase) {
    return (
      <CaseDetails 
        caseData={selectedCase} 
        onBack={() => setSelectedCase(null)}
        onUpdate={() => {
          refetch();
          setSelectedCase(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Sistem Kasus & Pengaduan
          </h1>
          <p className="text-muted-foreground">
            Sistem pelaporan dan penanganan kasus siswa yang terintegrasi
          </p>
        </div>
        <div className="flex gap-2">
          <CaseTracker />
        </div>
      </div>

      <Tabs defaultValue={hasManagementAccess ? "dashboard" : "report"} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className={`grid w-full min-w-fit ${hasRole('admin') ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'} h-auto`}>
            {hasManagementAccess && (
              <>
                <TabsTrigger value="dashboard" className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </TabsTrigger>
                {hasRole('admin') && (
                  <TabsTrigger value="workflow" className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
                    <Users className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Workflow</span>
                    <span className="sm:hidden">Work</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="list" className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
                  <FileText className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Daftar Kasus</span>
                  <span className="sm:hidden">List</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="report" className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Lapor Kasus</span>
              <span className="sm:hidden">Lapor</span>
            </TabsTrigger>
            <TabsTrigger value="track" className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap">
              <Search className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Lacak Kasus</span>
              <span className="sm:hidden">Lacak</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {hasManagementAccess && (
          <TabsContent value="dashboard">
            <EnhancedCaseTrackingDashboard />
          </TabsContent>
        )}

        {hasManagementAccess && hasRole('admin') && (
          <TabsContent value="workflow">
            <AutomatedCaseAssignment />
          </TabsContent>
        )}

        {hasManagementAccess && (
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter & Pencarian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari kasus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="under_review">Ditinjau</SelectItem>
                      <SelectItem value="investigating">Investigasi</SelectItem>
                      <SelectItem value="escalated">Eskalasi</SelectItem>
                      <SelectItem value="resolved">Selesai</SelectItem>
                      <SelectItem value="closed">Ditutup</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="bullying">Bullying</SelectItem>
                      <SelectItem value="kekerasan">Kekerasan</SelectItem>
                      <SelectItem value="narkoba">Narkoba</SelectItem>
                      <SelectItem value="pergaulan_bebas">Pergaulan Bebas</SelectItem>
                      <SelectItem value="tawuran">Tawuran</SelectItem>
                      <SelectItem value="pencurian">Pencurian</SelectItem>
                      <SelectItem value="vandalisme">Vandalisme</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Prioritas</SelectItem>
                      <SelectItem value="low">Rendah</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="high">Tinggi</SelectItem>
                      <SelectItem value="critical">Kritis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {isLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p>Memuat data...</p>
                  </CardContent>
                </Card>
              ) : cases?.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Tidak ada kasus ditemukan</p>
                  </CardContent>
                </Card>
              ) : (
                cases?.map((case_item) => (
                  <Card key={case_item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6" onClick={() => setSelectedCase(case_item)}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{case_item.title}</h3>
                            {case_item.is_anonymous && (
                              <Badge variant="outline">Anonim</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {case_item.case_number} • {getCategoryLabel(case_item.category)}
                          </p>
                          <p className="text-sm line-clamp-2 mb-3">
                            {case_item.description}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {getStatusBadge(case_item.status)}
                          {getPriorityBadge(case_item.priority)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div>
                          {case_item.reported_student_name && (
                            <span>Siswa: {case_item.reported_student_name}</span>
                          )}
                          {case_item.reported_student_class && (
                            <span> ({case_item.reported_student_class})</span>
                          )}
                        </div>
                        <div>
                          {format(new Date(case_item.created_at), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="report">
          <SecureAnonymousReporting />
        </TabsContent>

        <TabsContent value="track">
          <SimpleCaseTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};
