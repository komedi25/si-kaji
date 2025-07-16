
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { CalendarIcon, AlertTriangle, AlertCircle, FileText, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StudentSearchWithQR } from '@/components/common/StudentSearchWithQR';
import { QRScanner } from '@/components/common/QRScanner';
import { id } from 'date-fns/locale';

interface ViolationType {
  id: string;
  name: string;
  category: string;
  point_deduction: number;
  description?: string;
}

export const ViolationRecorder = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    violation_type_id: '',
    violation_date: new Date(),
    description: ''
  });

  useEffect(() => {
    fetchViolationTypes();
  }, []);

  const fetchViolationTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('violation_types')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setViolationTypes(data || []);
    } catch (error) {
      console.error('Error fetching violation types:', error);
      toast({
        title: "Error",
        description: "Gagal memuat jenis pelanggaran",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('tppk')) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mencatat pelanggaran",
        variant: "destructive"
      });
      return;
    }

    if (!formData.student_id || !formData.violation_type_id) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap pilih siswa dan jenis pelanggaran",
        variant: "destructive"
      });
      return;
    }

    // Validasi tanggal tidak boleh di masa depan
    const selectedDate = new Date(formData.violation_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      toast({
        title: "Tanggal Tidak Valid",
        description: "Tanggal pelanggaran tidak boleh di masa depan",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get violation type details for point calculation
      const selectedViolationType = violationTypes.find(vt => vt.id === formData.violation_type_id);
      
      const { error } = await supabase
        .from('student_violations')
        .insert({
          student_id: formData.student_id,
          violation_type_id: formData.violation_type_id,
          violation_date: format(formData.violation_date, 'yyyy-MM-dd'),
          description: formData.description || null,
          point_deduction: selectedViolationType?.point_deduction || 0,
          reported_by: user?.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Pelanggaran berhasil dicatat. Poin dikurangi: ${selectedViolationType?.point_deduction || 0}`,
        variant: "default"
      });

      // Reset form
      setFormData({
        student_id: '',
        violation_type_id: '',
        violation_date: new Date(),
        description: ''
      });
    } catch (error) {
      console.error('Error recording violation:', error);
      toast({
        title: "Error",
        description: "Gagal mencatat pelanggaran",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      // Extract NIS from QR data
      // Assuming QR format: "student_nis_12345" or just "12345"
      const nis = qrData.includes('_') ? qrData.split('_').pop() : qrData;
      
      if (!nis) {
        toast({
          title: "QR Code Tidak Valid",
          description: "QR code tidak mengandung data NIS yang valid",
          variant: "destructive"
        });
        return;
      }

      // Find student by NIS
      const { data: student, error } = await supabase
        .from('students')
        .select('id, full_name, nis')
        .eq('nis', nis)
        .single();

      if (error || !student) {
        toast({
          title: "Siswa Tidak Ditemukan",
          description: `Tidak ada siswa dengan NIS: ${nis}`,
          variant: "destructive"
        });
        return;
      }

      // Set student in form
      setFormData(prev => ({ ...prev, student_id: student.id }));
      
      toast({
        title: "Berhasil",
        description: `Siswa ${student.full_name} (${student.nis}) berhasil dipilih`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing QR scan:', error);
      toast({
        title: "Error",
        description: "Gagal memproses hasil scan QR code",
        variant: "destructive"
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ringan':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'sedang':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'berat':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ringan':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'sedang':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'berat':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('tppk')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Akses Terbatas</h3>
              <p className="text-gray-500 mt-2">
                Anda tidak memiliki akses untuk mencatat pelanggaran siswa. 
                Fitur ini hanya tersedia untuk wali kelas, TPPK, dan administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedViolationType = violationTypes.find(vt => vt.id === formData.violation_type_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Catat Pelanggaran Siswa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="student">Siswa *</Label>
            <div className="space-y-2">
              <StudentSearchWithQR
                value={formData.student_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                placeholder="Cari siswa berdasarkan nama atau NIS"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowQRScanner(true)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code Kartu Siswa
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="violation_type">Jenis Pelanggaran *</Label>
            <Select 
              value={formData.violation_type_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, violation_type_id: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Memuat jenis pelanggaran..." : "Pilih jenis pelanggaran"} />
              </SelectTrigger>
              <SelectContent>
                {violationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(type.category)}
                      <span>{type.name}</span>
                      <span className="text-xs text-gray-500">
                        ({type.category.toUpperCase()} - {type.point_deduction} poin)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedViolationType && (
              <div className={`mt-2 p-3 rounded-lg border ${getCategoryColor(selectedViolationType.category)}`}>
                <div className="flex items-center space-x-2 mb-1">
                  {getCategoryIcon(selectedViolationType.category)}
                  <span className="font-medium text-sm">
                    {selectedViolationType.name} - Kategori {selectedViolationType.category.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm mb-1">
                  <strong>Pengurangan Poin:</strong> {selectedViolationType.point_deduction} poin
                </p>
                {selectedViolationType.description && (
                  <p className="text-sm">
                    <strong>Deskripsi:</strong> {selectedViolationType.description}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label>Tanggal Pelanggaran *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.violation_date, 'dd MMMM yyyy', { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.violation_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, violation_date: date }))}
                  disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi Pelanggaran</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Jelaskan secara detail mengenai pelanggaran yang terjadi..."
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Deskripsi detail akan membantu dalam penanganan dan tindak lanjut
            </p>
          </div>

          {formData.student_id && formData.violation_type_id && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Konfirmasi Pencatatan:</p>
                  <p>
                    Pelanggaran "{selectedViolationType?.name}" akan dicatat untuk siswa yang dipilih 
                    dengan pengurangan {selectedViolationType?.point_deduction || 0} poin disiplin.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={submitting || !formData.student_id || !formData.violation_type_id} 
            className="w-full"
          >
            {submitting ? 'Menyimpan...' : 'Catat Pelanggaran'}
          </Button>
        </form>

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={showQRScanner}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      </CardContent>
    </Card>
  );
};
