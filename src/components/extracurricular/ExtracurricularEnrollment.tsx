
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Clock, MapPin, User } from 'lucide-react';

interface Extracurricular {
  id: string;
  name: string;
  description: string;
  coach_id: string;
  max_participants: number;
  schedule_day: string;
  schedule_time: string;
  location: string;
  is_active: boolean;
}

interface Student {
  id: string;
  full_name: string;
  nis: string;
}

export const ExtracurricularEnrollment = () => {
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExtracurricular, setSelectedExtracurricular] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchExtracurriculars();
    fetchStudents();
  }, []);

  const fetchExtracurriculars = async () => {
    try {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setExtracurriculars(data || []);
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
      toast.error('Gagal memuat data ekstrakurikuler');
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, nis')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Gagal memuat data siswa');
    }
  };

  const handleEnroll = async () => {
    if (!selectedExtracurricular || !selectedStudent) {
      toast.error('Pilih ekstrakurikuler dan siswa terlebih dahulu');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('extracurricular_enrollments')
        .insert([{
          student_id: selectedStudent,
          extracurricular_id: selectedExtracurricular,
          status: 'active'
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Siswa sudah terdaftar di ekstrakurikuler ini');
        } else {
          throw error;
        }
      } else {
        toast.success('Siswa berhasil didaftarkan');
        setSelectedStudent('');
        setSelectedExtracurricular('');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error('Gagal mendaftarkan siswa');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm)
  );

  const selectedExtraData = extracurriculars.find(ext => ext.id === selectedExtracurricular);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pendaftaran Ekstrakurikuler
          </CardTitle>
          <CardDescription>
            Daftarkan siswa ke ekstrakurikuler yang tersedia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Ekstrakurikuler</label>
              <Select value={selectedExtracurricular} onValueChange={setSelectedExtracurricular}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ekstrakurikuler" />
                </SelectTrigger>
                <SelectContent>
                  {extracurriculars.map((extra) => (
                    <SelectItem key={extra.id} value={extra.id}>
                      {extra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cari Siswa</label>
              <Input
                placeholder="Cari nama atau NIS siswa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {searchTerm && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Siswa</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siswa" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} - {student.nis}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleEnroll} 
            disabled={!selectedExtracurricular || !selectedStudent || isLoading}
            className="w-full"
          >
            {isLoading ? 'Mendaftarkan...' : 'Daftarkan Siswa'}
          </Button>
        </CardContent>
      </Card>

      {selectedExtraData && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Ekstrakurikuler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg">{selectedExtraData.name}</h4>
                <p className="text-muted-foreground">{selectedExtraData.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Jadwal</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedExtraData.schedule_day} - {selectedExtraData.schedule_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Lokasi</p>
                    <p className="text-sm text-muted-foreground">{selectedExtraData.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Kapasitas</p>
                    <p className="text-sm text-muted-foreground">Max {selectedExtraData.max_participants} siswa</p>
                  </div>
                </div>
              </div>

              <Badge variant="outline" className="w-fit">
                {selectedExtraData.is_active ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
