
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentData } from '@/hooks/useStudentData';
import { FileText, Plus, Eye, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const StudentCaseReports = () => {
  const navigate = useNavigate();
  const { studentData, loading: studentLoading } = useStudentData();

  // Query untuk laporan kasus yang dibuat siswa
  const { data: studentReports, isLoading: loadingReports } = useQuery({
    queryKey: ['student-case-reports', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];

      const { data, error } = await supabase
        .from('student_cases')
        .select('*')
        .eq('reported_by', studentData.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentData?.id
  });

  // Query untuk kasus yang melibatkan siswa
  const { data: involvedCases, isLoading: loadingInvolved } = useQuery({
    queryKey: ['student-involved-cases', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];

      const { data, error } = await supabase
        .from('student_cases')
        .select('*')
        .eq('reported_student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentData?.id
  });

  if (studentLoading || loadingReports || loadingInvolved) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Siswa Tidak Ditemukan</h3>
            <p className="text-muted-foreground">
              Silakan hubungi admin untuk menghubungkan akun Anda dengan data siswa.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'investigating': return 'Diselidiki';
      case 'resolved': return 'Selesai';
      case 'closed': return 'Ditutup';
      default: return 'Tidak Diketahui';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'investigating': return Eye;
      case 'resolved': return CheckCircle;
      case 'closed': return FileText;
      default: return FileText;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Rendah';
      case 'medium': return 'Sedang';
      case 'high': return 'Tinggi';
      default: return 'Normal';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Laporan Kasus</h1>
          <p className="text-muted-foreground">
            Daftar laporan kasus yang Anda buat dan yang melibatkan Anda
          </p>
        </div>
        <Button onClick={() => navigate('/cases/report')}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Laporan
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Saya</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{studentReports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total laporan dibuat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kasus Melibatkan Saya</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{involvedCases?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Kasus yang melibatkan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Diproses</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {[...(studentReports || []), ...(involvedCases || [])]
                .filter(c => c.status === 'pending' || c.status === 'investigating').length}
            </div>
            <p className="text-xs text-muted-foreground">Kasus dalam proses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {[...(studentReports || []), ...(involvedCases || [])]
                .filter(c => c.status === 'resolved' || c.status === 'closed').length}
            </div>
            <p className="text-xs text-muted-foreground">Kasus diselesaikan</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Created by Student */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan yang Saya Buat</CardTitle>
        </CardHeader>
        <CardContent>
          {!studentReports?.length ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum Ada Laporan</h3>
              <p className="text-muted-foreground mb-4">
                Anda belum membuat laporan kasus apapun.
              </p>
              <Button onClick={() => navigate('/cases/report')}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Laporan Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {studentReports.map((report) => {
                const StatusIcon = getStatusIcon(report.status);
                return (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <StatusIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{report.title}</h4>
                            <Badge className={getStatusColor(report.status)}>
                              {getStatusText(report.status)}
                            </Badge>
                            <Badge className={getPriorityColor(report.priority)}>
                              {getPriorityText(report.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Nomor Kasus: {report.case_number}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              Dibuat: {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                            </span>
                            {report.incident_date && (
                              <span>
                                Kejadian: {format(new Date(report.incident_date), 'dd MMM yyyy', { locale: id })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cases Involving Student */}
      {involvedCases && involvedCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kasus yang Melibatkan Saya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {involvedCases.map((case_) => {
                const StatusIcon = getStatusIcon(case_.status);
                return (
                  <div key={case_.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <StatusIcon className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{case_.title}</h4>
                            <Badge className={getStatusColor(case_.status)}>
                              {getStatusText(case_.status)}
                            </Badge>
                            <Badge className={getPriorityColor(case_.priority)}>
                              {getPriorityText(case_.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Nomor Kasus: {case_.case_number}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {case_.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              Dibuat: {format(new Date(case_.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                            </span>
                            {case_.incident_date && (
                              <span>
                                Kejadian: {format(new Date(case_.incident_date), 'dd MMM yyyy', { locale: id })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
