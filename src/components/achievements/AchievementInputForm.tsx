
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
import { Trophy, Save, Upload } from 'lucide-react';

interface AchievementType {
  id: string;
  name: string;
  category: string;
  level: string;
  point_reward: number;
}

interface Student {
  id: string;
  full_name: string;
  nis: string;
}

export const AchievementInputForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [canInputForOthers, setCanInputForOthers] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    achievement_type_id: '',
    achievement_date: new Date().toISOString().split('T')[0],
    description: '',
    point_reward: 0,
    certificate_url: ''
  });

  useEffect(() => {
    fetchAchievementTypes();
    checkUserRole();
    if (canInputForOthers) {
      fetchStudents();
    }
  }, [canInputForOthers]);

  const checkUserRole = async () => {
    if (!user?.roles) return;
    
    // Wali kelas bisa input untuk siswa lain
    const allowedRoles = ['wali_kelas', 'guru_bk', 'admin'];
    const hasPermission = user.roles.some(role => allowedRoles.includes(role));
    setCanInputForOthers(hasPermission);
  };

  const fetchAchievementTypes = async () => {
    const { data, error } = await supabase
      .from('achievement_types')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching achievement types:', error);
    } else {
      setAchievementTypes(data || []);
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

  const handleAchievementTypeChange = (value: string) => {
    const selectedType = achievementTypes.find(type => type.id === value);
    setFormData(prev => ({
      ...prev,
      achievement_type_id: value,
      point_reward: selectedType?.point_reward || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      // Status: pending jika diinput siswa sendiri, verified jika diinput wali kelas
      const status = canInputForOthers ? 'verified' : 'pending';
      const verifiedBy = canInputForOthers ? user.id : null;
      const verifiedAt = canInputForOthers ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('student_achievements')
        .insert({
          ...formData,
          recorded_by: user.id,
          status,
          verified_by: verifiedBy,
          verified_at: verifiedAt
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: canInputForOthers 
          ? "Data prestasi berhasil dicatat dan terverifikasi"
          : "Data prestasi berhasil dicatat. Menunggu verifikasi wali kelas."
      });

      // Reset form
      setFormData({
        student_id: '',
        achievement_type_id: '',
        achievement_date: new Date().toISOString().split('T')[0],
        description: '',
        point_reward: 0,
        certificate_url: ''
      });
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data prestasi",
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
          <Trophy className="w-5 h-5" />
          Input Prestasi Siswa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {canInputForOthers && (
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
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="achievement_date">Tanggal Prestasi</Label>
              <Input
                id="achievement_date"
                type="date"
                value={formData.achievement_date}
                onChange={(e) => setFormData(prev => ({ ...prev, achievement_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievement_type_id">Jenis Prestasi</Label>
              <Select value={formData.achievement_type_id} onValueChange={handleAchievementTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis prestasi..." />
                </SelectTrigger>
                <SelectContent>
                  {achievementTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.level} (+{type.point_reward} poin)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.point_reward > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                Penambahan poin: <strong>+{formData.point_reward} poin</strong>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Prestasi</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail prestasi yang diraih..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate_url">URL Sertifikat (Opsional)</Label>
            <div className="flex gap-2">
              <Input
                id="certificate_url"
                type="url"
                placeholder="https://example.com/certificate.pdf"
                value={formData.certificate_url}
                onChange={(e) => setFormData(prev => ({ ...prev, certificate_url: e.target.value }))}
              />
              <Button type="button" variant="outline">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Prestasi'}
          </Button>
        </form>

        {!canInputForOthers && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Prestasi yang Anda input akan memerlukan verifikasi dari wali kelas sebelum poin ditambahkan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
