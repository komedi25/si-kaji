
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ExtracurricularService, type ExtracurricularData, type StudentData } from './ExtracurricularService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search } from 'lucide-react';
import { ExtracurricularCard } from './ExtracurricularCard';
import { EnrollmentRequestsList } from './EnrollmentRequestsList';

interface SimpleEnrollmentRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class?: string;
  extracurricular_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export const EnhancedExtracurricularEnrollment = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [extracurriculars, setExtracurriculars] = useState<ExtracurricularData[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<SimpleEnrollmentRequest[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState<StudentData[]>([]);
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
      const data = await ExtracurricularService.fetchExtracurriculars();
      setExtracurriculars(data);
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
      // For now, we'll implement a simple pending requests system
      // This could be expanded to have a separate enrollment_requests table
      const requests: SimpleEnrollmentRequest[] = [];
      
      setEnrollmentRequests(requests);
    } catch (error) {
      console.error('Error fetching enrollment requests:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await ExtracurricularService.fetchStudents();
      setStudents(data);
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
      await ExtracurricularService.enrollStudent(selectedStudent, extracurricularId);

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
