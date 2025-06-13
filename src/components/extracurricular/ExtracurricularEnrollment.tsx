
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock, MapPin, User } from 'lucide-react';

interface Extracurricular {
  id: string;
  name: string;
  description: string;
  schedule_day: string;
  schedule_time: string;
  location: string;
  max_participants: number;
  is_active: boolean;
  coach?: {
    full_name: string;
  };
  _count?: {
    extracurricular_enrollments: number;
  };
}

interface Enrollment {
  id: string;
  enrollment_date: string;
  status: string;
  extracurricular: {
    name: string;
    schedule_day: string;
    schedule_time: string;
  };
}

export const ExtracurricularEnrollment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtracurriculars();
    fetchEnrollments();
  }, []);

  const fetchExtracurriculars = async () => {
    try {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select(`
          *,
          coach:profiles(full_name),
          extracurricular_enrollments(id)
        `)
        .eq('is_active', true);

      if (error) throw error;

      const processedData = data?.map(item => ({
        ...item,
        _count: {
          extracurricular_enrollments: item.extracurricular_enrollments?.length || 0
        }
      })) || [];

      setExtracurriculars(processedData);
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('extracurricular_enrollments')
        .select(`
          *,
          extracurricular:extracurriculars(name, schedule_day, schedule_time)
        `)
        .eq('status', 'active')
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async (extracurricularId: string) => {
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Pilih siswa terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('extracurricular_enrollments')
        .insert({
          student_id: selectedStudent,
          extracurricular_id: extracurricularId,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Siswa berhasil didaftarkan ke ekstrakurikuler"
      });

      fetchExtracurriculars();
      fetchEnrollments();
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "Siswa sudah terdaftar di ekstrakurikuler ini",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal mendaftarkan siswa",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return <div>Memuat data ekstrakurikuler...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="student">Siswa</Label>
            <Input
              id="student"
              placeholder="ID Siswa atau nama siswa"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Extracurriculars */}
      <Card>
        <CardHeader>
          <CardTitle>Ekstrakurikuler Tersedia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extracurriculars.map((extra) => (
              <div key={extra.id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold">{extra.name}</h4>
                  <p className="text-sm text-muted-foreground">{extra.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {extra.schedule_day} - {extra.schedule_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {extra.location}
                  </div>
                  {extra.coach && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {extra.coach.full_name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {extra._count?.extracurricular_enrollments || 0}/{extra.max_participants} peserta
                  </div>
                </div>

                <Button 
                  onClick={() => handleEnrollment(extra.id)}
                  disabled={!selectedStudent || (extra._count?.extracurricular_enrollments || 0) >= extra.max_participants}
                  className="w-full"
                  size="sm"
                >
                  Daftarkan Siswa
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Pendaftaran Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada pendaftaran ekstrakurikuler
            </p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">{enrollment.extracurricular.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {enrollment.extracurricular.schedule_day} - {enrollment.extracurricular.schedule_time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Terdaftar: {new Date(enrollment.enrollment_date).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <Badge variant="default">Aktif</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
