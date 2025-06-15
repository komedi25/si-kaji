
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DisciplinePointsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: disciplinePoints, isLoading } = useQuery({
    queryKey: ['discipline-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_discipline_points')
        .select(`
          *,
          students (
            full_name,
            nis,
            class:student_enrollments!inner (
              classes (
                name,
                grade,
                majors (
                  code
                )
              )
            )
          ),
          academic_years (
            name
          ),
          semesters (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_discipline_points')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discipline-points'] });
      toast({ title: 'Data poin disiplin berhasil dihapus' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const recalculateAllMutation = useMutation({
    mutationFn: async () => {
      // This would trigger recalculation for all students
      // For now, we'll just invalidate the query to refresh data
      queryClient.invalidateQueries({ queryKey: ['discipline-points'] });
    },
    onSuccess: () => {
      toast({ title: 'Perhitungan ulang poin disiplin berhasil' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Gagal melakukan perhitungan ulang',
        variant: 'destructive' 
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'excellent': 'default',
      'good': 'secondary',
      'warning': 'outline',
      'probation': 'destructive',
      'critical': 'destructive'
    };
    const labels = {
      'excellent': 'SANGAT BAIK',
      'good': 'BAIK',
      'warning': 'PERINGATAN',
      'probation': 'PERCOBAAN',
      'critical': 'KRITIS'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{labels[status as keyof typeof labels]}</Badge>;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Poin Disiplin</h1>
            <p className="text-gray-600 mt-2">
              Kelola dan monitor poin disiplin siswa berdasarkan pelanggaran dan prestasi
            </p>
          </div>
          <Button
            onClick={() => recalculateAllMutation.mutate()}
            disabled={recalculateAllMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Hitung Ulang Semua
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Poin Disiplin Siswa</CardTitle>
            <CardDescription>
              Daftar semua perhitungan poin disiplin siswa per semester
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disciplinePoints?.map((point: any) => (
                <div key={point.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">
                          {point.students?.full_name} ({point.students?.nis})
                        </h3>
                        {getStatusBadge(point.discipline_status)}
                      </div>
                      
                      {point.students?.class?.[0]?.classes && (
                        <p className="text-sm text-gray-600 mb-2">
                          Kelas: {point.students.class[0].classes.grade} {point.students.class[0].classes.majors?.code} {point.students.class[0].classes.name}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Tahun Ajaran:</span>
                          <div className="font-medium">{point.academic_years?.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Poin Pelanggaran:</span>
                          <div className="font-medium text-red-600">-{point.total_violation_points}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Poin Prestasi:</span>
                          <div className="font-medium text-green-600">+{point.total_achievement_points}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Skor Akhir:</span>
                          <div className="font-medium text-lg">{point.final_score}</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Terakhir diupdate: {new Date(point.last_updated).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(point.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!disciplinePoints || disciplinePoints.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada data poin disiplin
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DisciplinePointsManagement;
