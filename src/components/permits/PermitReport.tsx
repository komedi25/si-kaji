
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { StudentPermit } from '@/types/student';
import { PermitLetter } from './PermitLetter';

const PermitReport = () => {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: permits, isLoading } = useQuery({
    queryKey: ['permit-report', startDate, endDate, selectedStatus, selectedType, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('student_permits')
        .select(`
          *,
          student:students(
            id, 
            full_name, 
            nis,
            current_enrollment:student_enrollments(
              id, 
              class:classes(
                id, 
                name,
                grade,
                is_active,
                created_at,
                updated_at,
                major:majors(name)
              )
            )
          ),
          approvals:permit_approvals(*)
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('submitted_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      if (selectedType) {
        query = query.eq('permit_type', selectedType);
      }

      // Apply search filter if provided
      if (searchQuery && searchQuery.length >= 3) {
        query = query.or(`student.nis.ilike.%${searchQuery}%,student.full_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(permit => ({
        ...permit,
        student: {
          ...permit.student,
          current_class: permit.student?.current_enrollment?.[0]?.class || null
        }
      })) as (StudentPermit & { approvals: any[]; student: any })[];
    },
    enabled: !!startDate && !!endDate && (searchQuery === '' || searchQuery.length >= 3)
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      approved: { label: 'Disetujui', variant: 'default' as const },
      rejected: { label: 'Ditolak', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  const getPermitTypeBadge = (type: string) => {
    const typeConfig = {
      sick: { label: 'Sakit', variant: 'outline' as const },
      family_emergency: { label: 'Keperluan Keluarga', variant: 'outline' as const },
      medical_checkup: { label: 'Pemeriksaan Kesehatan', variant: 'outline' as const },
      competition: { label: 'Lomba/Kompetisi', variant: 'outline' as const },
      other: { label: 'Lainnya', variant: 'outline' as const }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  const exportToCSV = () => {
    if (!permits || permits.length === 0) return;

    const csvData = permits.map(permit => ({
      'Tanggal Pengajuan': format(new Date(permit.submitted_at), 'dd/MM/yyyy HH:mm', { locale: id }),
      'NIS': permit.student?.nis || '',
      'Nama Siswa': permit.student?.full_name || '',
      'Kelas': permit.student?.current_class?.name || '',
      'Jenis Izin': permit.permit_type,
      'Tanggal Mulai': format(new Date(permit.start_date), 'dd/MM/yyyy', { locale: id }),
      'Tanggal Selesai': format(new Date(permit.end_date), 'dd/MM/yyyy', { locale: id }),
      'Alasan': permit.reason,
      'Status': permit.status
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-perizinan-${startDate}-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan Perizinan</h1>
        <p className="text-gray-600 mt-2">
          Laporan dan analisis data perizinan siswa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
          <CardDescription>
            Pilih rentang tanggal dan filter untuk melihat laporan perizinan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end_date">Tanggal Selesai</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Jenis Izin</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Jenis</SelectItem>
                  <SelectItem value="sick">Sakit</SelectItem>
                  <SelectItem value="family_emergency">Keperluan Keluarga</SelectItem>
                  <SelectItem value="medical_checkup">Pemeriksaan Kesehatan</SelectItem>
                  <SelectItem value="competition">Lomba/Kompetisi</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Cari Siswa</Label>
              <div className="relative">
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama atau NIS"
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={exportToCSV} disabled={!permits || permits.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Perizinan</CardTitle>
          <CardDescription>
            {permits ? `Menampilkan ${permits.length} data perizinan` : 'Memuat data...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : permits && permits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jenis Izin</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits.map((permit) => (
                    <TableRow key={permit.id}>
                      <TableCell>
                        {format(new Date(permit.submitted_at), 'dd/MM/yyyy', { locale: id })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permit.student?.full_name}</div>
                          <div className="text-sm text-gray-500">{permit.student?.nis}</div>
                        </div>
                      </TableCell>
                      <TableCell>{permit.student?.current_class?.name || '-'}</TableCell>
                      <TableCell>{getPermitTypeBadge(permit.permit_type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(permit.start_date), 'dd/MM/yyyy', { locale: id })}</div>
                          {permit.start_date !== permit.end_date && (
                            <div>s.d. {format(new Date(permit.end_date), 'dd/MM/yyyy', { locale: id })}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(permit.status)}</TableCell>
                      <TableCell>
                        {permit.status === 'approved' && (
                          <PermitLetter permit={permit} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">Tidak ada data perizinan dalam rentang tanggal yang dipilih</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermitReport;
