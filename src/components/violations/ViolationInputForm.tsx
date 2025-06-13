
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Save } from 'lucide-react';

interface ViolationType {
  id: string;
  name: string;
  category: string;
  point_deduction: number;
}

interface Student {
  id: string;
  full_name: string;
  nis: string;
}

export const ViolationInputForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    violation_type_id: '',
    violation_date: new Date().toISOString().split('T')[0],
    description: '',
    point_deduction: 0
  });

  useEffect(() => {
    fetchViolationTypes();
    fetchStudents();
  }, []);

  const fetchViolationTypes = async () => {
    const { data, error } = await supabase
      .from('violation_types')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching violation types:', error);
    } else {
      setViolationTypes(data || []);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, nis')
      .eq('status', 'active')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching students:', error);
    } else {
      setStudents(data || []);
    }
  };

  const handleViolationTypeChange = (value: string) => {
    const selectedType = violationTypes.find(type => type.id === value);
    setFormData(prev => ({
      ...prev,
      violation_type_id: value,
      point_deduction: selectedType?.point_deduction || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_violations')
        .insert({
          ...formData,
          reported_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data pelanggaran berhasil dicatat"
      });

      // Reset form
      setFormData({
        student_id: '',
        violation_type_id: '',
        violation_date: new Date().toISOString().split('T')[0],
        description: '',
        point_deduction: 0
      });
    } catch (error) {
      console.error('Error saving violation:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data pelanggaran",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Input Pelanggaran Siswa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_id">Nama Siswa</Label>
              <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siswa..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} - {student.nis}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violation_date">Tanggal Pelanggaran</Label>
              <Input
                id="violation_date"
                type="date"
                value={formData.violation_date}
                onChange={(e) => setFormData(prev => ({ ...prev, violation_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="violation_type_id">Jenis Pelanggaran</Label>
            <Select value={formData.violation_type_id} onValueChange={handleViolationTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis pelanggaran..." />
              </SelectTrigger>
              <SelectContent>
                {violationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} - {type.category} (-{type.point_deduction} poin)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.point_deduction > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                Pengurangan poin: <strong>-{formData.point_deduction} poin</strong>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Pelanggaran</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail pelanggaran yang terjadi..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Pelanggaran'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
