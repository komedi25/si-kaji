import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Filter, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StudentDisciplinePoint {
  id: string;
  student_id: string;
  total_points: number;
  violation_points: number;
  achievement_points: number;
  student: {
    full_name: string;
    nis: string;
    current_class?: {
      name: string;
      major?: {
        name: string;
      };
    };
  };
}

export default function DisciplinePointsManagement() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentDisciplinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDisciplinePoints = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual database query
      // For now, using mock data
      const mockData: StudentDisciplinePoint[] = [
        {
          id: '1',
          student_id: '1',
          total_points: 85,
          violation_points: -15,
          achievement_points: 100,
          student: {
            full_name: 'Ahmad Rizki',
            nis: '2023001',
            current_class: {
              name: 'XII RPL 1',
              major: { name: 'Rekayasa Perangkat Lunak' }
            }
          }
        },
        {
          id: '2',
          student_id: '2',
          total_points: 70,
          violation_points: -30,
          achievement_points: 100,
          student: {
            full_name: 'Siti Nurhaliza',
            nis: '2023002',
            current_class: {
              name: 'XII TKJ 1',
              major: { name: 'Teknik Komputer dan Jaringan' }
            }
          }
        }
      ];
      
      setStudents(mockData);
    } catch (error) {
      console.error('Error fetching discipline points:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data poin disiplin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk')) {
      fetchDisciplinePoints();
    }
  }, [hasRole]);

  const filteredStudents = students.filter(student =>
    student.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student.nis.includes(searchTerm)
  );

  const getPointsBadgeVariant = (points: number) => {
    if (points >= 80) return 'default'; // Green
    if (points >= 60) return 'secondary'; // Yellow
    return 'destructive'; // Red
  };

  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('guru_bk')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Poin Disiplin</h1>
            <p className="text-gray-600">Kelola dan pantau poin disiplin siswa</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Siswa terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Poin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.length > 0 
                  ? Math.round(students.reduce((sum, s) => sum + s.total_points, 0) / students.length)
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground">Poin disiplin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perlu Perhatian</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {students.filter(s => s.total_points < 60).length}
              </div>
              <p className="text-xs text-muted-foreground">Siswa poin rendah</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Cari Siswa</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nama atau NIS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Poin Disiplin Siswa</CardTitle>
            <CardDescription>
              Pantau poin disiplin setiap siswa berdasarkan prestasi dan pelanggaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Total Poin</TableHead>
                      <TableHead>Poin Prestasi</TableHead>
                      <TableHead>Poin Pelanggaran</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.student.full_name}</div>
                            <div className="text-sm text-gray-500">{student.student.nis}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.student.current_class?.name || '-'}</div>
                            <div className="text-sm text-gray-500">
                              {student.student.current_class?.major?.name || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPointsBadgeVariant(student.total_points)}>
                            {student.total_points}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            +{student.achievement_points}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">
                            {student.violation_points}
                          </span>
                        </TableCell>
                        <TableCell>
                          {student.total_points >= 80 ? (
                            <Badge variant="default">Baik</Badge>
                          ) : student.total_points >= 60 ? (
                            <Badge variant="secondary">Perlu Perbaikan</Badge>
                          ) : (
                            <Badge variant="destructive">Perlu Perhatian</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
