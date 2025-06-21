
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, QrCode } from 'lucide-react';
import { StudentWithClass } from '@/types/student';

interface StudentSearchWithQRProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const StudentSearchWithQR: React.FC<StudentSearchWithQRProps> = ({
  value,
  onValueChange,
  placeholder = "Cari siswa berdasarkan nama atau NIS",
  disabled = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<StudentWithClass[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nis.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_enrollments!inner (
            classes (
              name,
              grade
            )
          )
        `)
        .eq('student_enrollments.status', 'active')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;

      const studentsWithClass = (data || []).map((student: any): StudentWithClass => {
        const enrollment = student.student_enrollments?.[0];
        return {
          ...student,
          current_class: enrollment?.classes ? 
            `${enrollment.classes.grade} ${enrollment.classes.name}` : '-'
        };
      });

      setStudents(studentsWithClass);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    }
  };

  const handleStudentSelect = (studentId: string) => {
    onValueChange(studentId);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const selectedStudent = students.find(s => s.id === value);

  const startQRScanner = async () => {
    setIsScanning(true);
    setIsQROpen(true);
    
    try {
      // Check if device has camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      // Create video element for QR scanning
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.play();

      // Simple QR code detection simulation
      // In a real implementation, you'd use a library like @zxing/library
      toast({
        title: "QR Scanner",
        description: "Arahkan kamera ke QR code siswa. Fitur ini akan dikembangkan lebih lanjut.",
      });

      // Stop camera after 10 seconds (demo)
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        setIsScanning(false);
        setIsQROpen(false);
      }, 10000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses kamera. Silakan gunakan pencarian manual.",
        variant: "destructive"
      });
      setIsScanning(false);
      setIsQROpen(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1">
          {selectedStudent ? (
            <div className="p-2 border rounded-md bg-green-50 border-green-200">
              <div className="font-medium">{selectedStudent.full_name}</div>
              <div className="text-sm text-gray-600">
                NIS: {selectedStudent.nis} • Kelas: {selectedStudent.current_class}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onValueChange('')}
                className="text-red-600 h-6 px-2 mt-1"
              >
                Hapus
              </Button>
            </div>
          ) : (
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={disabled}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {placeholder}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Cari Siswa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Ketik nama atau NIS siswa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="p-2 rounded-md hover:bg-gray-100 cursor-pointer border"
                          onClick={() => handleStudentSelect(student.id)}
                        >
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-gray-600">
                            NIS: {student.nis} • Kelas: {student.current_class}
                          </div>
                        </div>
                      ))
                    ) : searchTerm.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        Tidak ada siswa yang ditemukan
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Ketik minimal 2 karakter untuk mencari
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startQRScanner}
          disabled={disabled}
          title="Scan QR Code"
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan QR Code Siswa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isScanning ? (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Scanning QR Code...</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Arahkan kamera ke QR code siswa
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <Button onClick={startQRScanner}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Mulai Scan
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
