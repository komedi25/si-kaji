
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CaseData {
  id: string;
  case_number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assigned_handler: string;
}

interface CaseStats {
  total: number;
  pending: number;
  under_review: number;
  investigating: number;
  resolved: number;
  by_handler: Record<string, number>;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

export const CaseTrackingDashboard = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchResult, setSearchResult] = useState<CaseData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Get overall case statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['case-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_cases')
        .select('category, priority, status, assigned_handler');

      if (error) throw error;

      const stats: CaseStats = {
        total: data.length,
        pending: 0,
        under_review: 0,
        investigating: 0,
        resolved: 0,
        by_handler: {},
        by_category: {},
        by_priority: {}
      };

      data.forEach((item) => {
        // Count by status
        switch (item.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'under_review':
            stats.under_review++;
            break;
          case 'investigating':
            stats.investigating++;
            break;
          case 'resolved':
            stats.resolved++;
            break;
        }

        // Count by handler
        if (item.assigned_handler) {
          stats.by_handler[item.assigned_handler] = (stats.by_handler[item.assigned_handler] || 0) + 1;
        }

        // Count by category
        stats.by_category[item.category] = (stats.by_category[item.category] || 0) + 1;

        // Count by priority
        stats.by_priority[item.priority] = (stats.by_priority[item.priority] || 0) + 1;
      });

      return stats;
    }
  });

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from('student_cases')
        .select('*')
        .eq('case_number', trackingNumber.trim().toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
      } else {
        setSearchResult(data as CaseData);
      }
    } catch (error) {
      console.error('Error searching case:', error);
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock },
      under_review: { label: 'Ditinjau', variant: 'default' as const, icon: FileText },
      investigating: { label: 'Investigasi', variant: 'default' as const, icon: Users },
      escalated: { label: 'Eskalasi', variant: 'destructive' as const, icon: AlertTriangle },
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

  const getHandlerLabel = (handler: string) => {
    const handlerLabels = {
      tppk: 'TPPK',
      p4gn: 'P4GN',
      arps: 'ARPS',
    };
    
    return handlerLabels[handler as keyof typeof handlerLabels] || handler?.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Tracking Kasus</h1>
        <p className="text-muted-foreground">
          Lacak status kasus dan lihat statistik penanganan
        </p>
      </div>

      {/* Case Tracking Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lacak Kasus
          </CardTitle>
          <CardDescription>
            Masukkan nomor tiket untuk melacak status kasus Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Masukkan nomor tiket (contoh: CASE/2024/0001)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Mencari...' : 'Lacak'}
            </Button>
          </div>

          {notFound && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nomor tiket tidak ditemukan. Pastikan nomor tiket yang Anda masukkan benar.
              </AlertDescription>
            </Alert>
          )}

          {searchResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{searchResult.title}</span>
                  {getStatusBadge(searchResult.status)}
                </CardTitle>
                <CardDescription>
                  {searchResult.case_number} • {getCategoryLabel(searchResult.category)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Informasi Kasus</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Prioritas:</span>
                        {getPriorityBadge(searchResult.priority)}
                      </div>
                      <div className="flex justify-between">
                        <span>Penanganan:</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {getHandlerLabel(searchResult.assigned_handler)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Dibuat:</span>
                        <span>{format(new Date(searchResult.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terakhir Update:</span>
                        <span>{format(new Date(searchResult.updated_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                      </div>
                      {searchResult.resolved_at && (
                        <div className="flex justify-between">
                          <span>Diselesaikan:</span>
                          <span>{format(new Date(searchResult.resolved_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Timeline Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Laporan Diterima</span>
                      </div>
                      {(searchResult.status === 'under_review' || searchResult.status === 'investigating' || searchResult.status === 'resolved') && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span>Sedang Ditinjau</span>
                        </div>
                      )}
                      {(searchResult.status === 'investigating' || searchResult.status === 'resolved') && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span>Dalam Investigasi</span>
                        </div>
                      )}
                      {searchResult.status === 'resolved' && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Kasus Selesai</span>
                        </div>
                      )}
                      {searchResult.status === 'escalated' && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span>Dieskalasi ke Level Tinggi</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Statistics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kasus</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Semua kasus yang dilaporkan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Kasus baru belum ditangani
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sedang Proses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.under_review + stats.investigating}</div>
              <p className="text-xs text-muted-foreground">
                Sedang ditinjau dan investigasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">
                Kasus berhasil diselesaikan
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Berdasarkan Tim Penanganan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.by_handler).map(([handler, count]) => (
                  <div key={handler} className="flex justify-between items-center">
                    <span className="text-sm">{getHandlerLabel(handler)}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Berdasarkan Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.by_category).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm">{getCategoryLabel(category)}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Berdasarkan Prioritas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.by_priority).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{priority}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
