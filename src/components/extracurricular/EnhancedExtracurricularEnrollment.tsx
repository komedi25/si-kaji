
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search } from 'lucide-react';
import { ExtracurricularCard } from './ExtracurricularCard';
import { EnrollmentRequestsList } from './EnrollmentRequestsList';
import { ExtracurricularDetails, EnrollmentRequest, StudentOption } from './types';

export const EnhancedExtracurricularEnrollment = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [extracurriculars, setExtracurriculars] = useState<ExtracurricularDetails[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const canManage = hasRole('koordinator_ekstrakurikuler') || hasRole('admin');

  useEffect(() => {
    fetchExtracurriculars();
    if (canManage) {
      fetchEnrollmentRequests();
      fetchStudents();
    }
  }, [canManage]);

  const fetchExtracurriculars = async () => {
    try {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select(`
          id,
          name,
          description,
          schedule_day,
          schedule_time,
          location,
          max_participants
        `)
        .eq('is_active', true);

      if (error) throw error;

      const extracurricularsWithEnrollments: ExtracurricularDetails[] = [];
      
      for (const extra of data || []) {
        const { data: enrollments } = await supabase
          .from('extracurricular_enrollments')
          .select(`
            id,
            enrollment_date,
            status,
            students (
              id,
              full_name,
              nis
            )
          `)
          .eq('extracurricular_id', extra.id)
          .eq('status', 'active');

        const processedEnrollments = (enrollments || []).map(enrollment => ({
          id: enrollment.id,
          student_name: (enrollment.students as any)?.full_name || '',
          student_nis: (enrollment.students as any)?.nis || '',
          enrollment_date: enrollment.enrollment_date,
          status: enrollment.status
        }));

        extracurricularsWithEnrollments.push({
          ...extra,
          current_participants: processedEnrollments.length,
          enrollments: processedEnrollments
        });
      }

      setExtracurriculars(extracurricularsWithEnrollments);
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data ekstrakurikuler',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentRequests = async () => {
    try {
      const sampleRequests: EnrollmentRequest[] = [
        {
          id: '1',
          student_id: 'std1',
          student_name: 'Ahmad Rizki',
          student_nis: '12345',
          student_class: 'XI RPL 1',
          extracurricular_name: 'Pramuka',
          requested_at: new Date().toISOString(),
          status: 'pending'
        }
      ];
      
      setEnrollmentRequests(sampleRequests);
    } catch (error) {
      console.error('Error fetching enrollment requests:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          nis
        `)
        .eq('is_active', true);

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleManualEnrollment = async (extracurricularId: string) => {
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

      setSelectedStudent('');
      fetchExtracurriculars();
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

  const handleApproveRequest = async (requestId: string, approved: boolean) => {
    try {
      setEnrollmentRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: approved ? 'approved' : 'rejected' }
            : req
        )
      );

      toast({
        title: approved ? "Disetujui" : "Ditolak",
        description: `Permohonan pendaftaran ${approved ? 'disetujui' : 'ditolak'}`
      });

      if (approved) {
        fetchExtracurriculars();
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast({
        title: "Error",
        description: "Gagal memproses permohonan",
        variant: "destructive"
      });
    }
  };

  const filteredExtracurriculars = extracurriculars.filter(extra =>
    extra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    extra.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Memuat data ekstrakurikuler...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manajemen Pendaftaran Ekstrakurikuler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {canManage 
              ? 'Kelola pendaftaran siswa ke ekstrakurikuler dan proses permohonan pendaftaran'
              : 'Daftarkan siswa ke ekstrakurikuler yang tersedia'
            }
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="extracurriculars" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="extracurriculars">Ekstrakurikuler</TabsTrigger>
          {canManage && (
            <TabsTrigger value="requests">Permohonan Pendaftaran</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="extracurriculars" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari ekstrakurikuler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtracurriculars.map((extra) => (
              <ExtracurricularCard
                key={extra.id}
                extracurricular={extra}
                students={students}
                selectedStudent={selectedStudent}
                onStudentSelect={setSelectedStudent}
                onEnroll={handleManualEnrollment}
                canManage={canManage}
              />
            ))}
          </div>
        </TabsContent>

        {canManage && (
          <TabsContent value="requests" className="space-y-4">
            <EnrollmentRequestsList
              requests={enrollmentRequests}
              onApprove={handleApproveRequest}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
