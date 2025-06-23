
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Calendar, User, Clock, Download, Filter } from 'lucide-react';
import { StudentSearchWithQR } from '@/components/common/StudentSearchWithQR';
import { ClassSelector } from '@/components/common/ClassSelector';

interface PermitReport {
  id: string;
  permit_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  students: {
    id: string;
    nis: string;
    full_name: string;
  };
  reviewed_by_profile?: {
    full_name: string;
  };
}

export const PermitReportsPage = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [permits, setPermits] = useState<PermitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: '',
    class_id: '',
    permit_type: '',
    status: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchPermits();
  }, []);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('student_permits')
        .select(`
          *,
          students (
            id,
            nis,
            full_name
          )
        `)
        .order('submitted_at', { ascending: false });

      // Apply filters
      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters.permit_type) {
        query = query.eq('permit_type', filters.permit_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('end_date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If class filter is applied, filter by class
      let filteredData = data || [];
      if (filters.class_id && filters.class_id !== 'all') {
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .select('student_id')
          .eq('class_id', filters.class_id)
          .eq('status', 'active');

        if (enrollmentError) throw enrollmentError;

        const studentIds = enrollments?.map(e => e.student_id) || [];
        filteredData = filteredData.filter(permit => 
          studentIds.includes(permit.student_id)
        );
      }

      setPermits(filteredData);
    } catch (error) {
      console.error('Error fetching permits:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data perizinan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchPermits();
  };

  const clearFilters = () => {
    setFilters({
      student_id: '',
      class_id: '',
      permit_type: '',
      status: '',
      start_date: '',
      end_date: ''
    });
    setTimeout(() => fetchPermits(), 100);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    };
    const labels = {
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const csvContent = [
      ['NIS', 'Nama Siswa', 'Jenis Izin', 'Alasan', 'Tanggal Mulai', 'Tanggal Selesai', 'Status', 'Tanggal Pengajuan'],
      ...permits.map(permit => [
        permit.students.nis,
        permit.students.full_name,
        permit.permit_type,
        permit.reason,
        permit.start_date,
        permit.end_date,
        permit.status,
        new Date(permit.submitted_at).toLocaleDateString('id-ID')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-perizinan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('waka_kesiswaan') && !hasRole('tppk')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Akses Terbatas</h3>
              <p className="text-gray-500 mt-2">
                Anda tidak memiliki akses untuk melihat laporan perizinan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Laporan Perizinan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Siswa</Label>
              <StudentSearchWithQR
                value={filters.student_id}
                onValueChange={(value) => handleFilterChange('student_id', value)}
                placeholder="Pilih siswa"
              />
            </div>

            <div>
              <Label>Kelas</Label>
              <ClassSelector
                value={filters.class_id}
                onValueChange={(value) => handleFilterChange('class_id', value)}
                placeholder="Semua kelas"
                allowAll={true}
              />
            </div>

            <div>
              <Label>Jenis Izin</Label>
              <Select value={filters.permit_type} onValueChange={(value) => handleFilterChange('permit_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua jenis</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="dispensasi">Dispensasi</SelectItem>
                  <SelectItem value="kegiatan_sekolah">Kegiatan Sekolah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div>
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Terapkan Filter
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Reset Filter
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Perizinan Siswa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ditemukan {permits.length} data perizinan
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : permits.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Tidak ada data perizinan ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {permits.map((permit) => (
                <div key={permit.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{permit.students.full_name}</span>
                        <Badge variant="outline">NIS: {permit.students.nis}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span className="capitalize">{permit.permit_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(permit.start_date).toLocaleDateString('id-ID')} - {new Date(permit.end_date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(permit.submitted_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700">
                        <strong>Alasan:</strong> {permit.reason}
                      </p>
                      
                      {permit.review_notes && (
                        <p className="text-sm text-gray-700">
                          <strong>Catatan:</strong> {permit.review_notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {getStatusBadge(permit.status)}
                      {permit.reviewed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Direview: {new Date(permit.reviewed_at).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
