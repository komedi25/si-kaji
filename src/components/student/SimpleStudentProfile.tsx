
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Save, Mail, Phone, MapPin, Users } from 'lucide-react';

interface StudentData {
  id: string;
  nis: string;
  full_name: string;
  gender: string;
  birth_place?: string;
  birth_date?: string;
  religion?: string;
  address?: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_address?: string;
  photo_url?: string;
}

export const SimpleStudentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_address: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching student data for user:', user.id);
      
      // Try to find student by user_id first
      let { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching student:', error);
        throw error;
      }

      // If not found by user_id, try to match by profile data
      if (!student) {
        console.log('🔍 Student not found by user_id, checking profile...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        console.log('📋 Profile data:', profile);

        if (profile?.nis) {
          console.log('🔍 Searching by NIS:', profile.nis);
          const { data: studentByNis } = await supabase
            .from('students')
            .select('*')
            .eq('nis', profile.nis)
            .is('user_id', null)
            .maybeSingle();

          if (studentByNis) {
            console.log('✅ Found student by NIS, linking...');
            await supabase
              .from('students')
              .update({ user_id: user.id })
              .eq('id', studentByNis.id);
            
            student = { ...studentByNis, user_id: user.id };
          }
        }
      }

      if (student) {
        console.log('✅ Student data found:', student);
        setStudentData(student);
        setFormData({
          phone: student.phone || '',
          address: student.address || '',
          parent_name: student.parent_name || '',
          parent_phone: student.parent_phone || '',
          parent_address: student.parent_address || ''
        });
      } else {
        console.log('❌ No student data found');
        setStudentData(null);
      }

    } catch (error) {
      console.error('💥 Error in fetchStudentData:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!studentData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update(formData)
        .eq('id', studentData.id);

      if (error) throw error;

      setStudentData({ ...studentData, ...formData });
      toast({
        title: "Berhasil",
        description: "Data pribadi berhasil diperbarui"
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating student data:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui data pribadi",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Memuat data...</span>
      </div>
    );
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Data Tidak Ditemukan</h3>
          <p className="text-gray-500">Data siswa Anda belum tersedia dalam sistem. Silakan hubungi administrator sekolah.</p>
          <Button onClick={fetchStudentData} className="mt-4">
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Pribadi Saya</h1>
          <p className="text-gray-600">Kelola informasi pribadi dan data orang tua/wali</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <User className="h-4 w-4 mr-2" />
            Edit Profil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  phone: studentData.phone || '',
                  address: studentData.address || '',
                  parent_name: studentData.parent_name || '',
                  parent_phone: studentData.parent_phone || '',
                  parent_address: studentData.parent_address || ''
                });
              }}
            >
              Batal
            </Button>
          </div>
        )}
      </div>

      {/* Informasi Akun */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || 'Tidak tersedia'} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Status Akun</Label>
              <Input value="Aktif" disabled className="bg-gray-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Siswa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Data Siswa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>NIS</Label>
              <Input value={studentData.nis} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Nama Lengkap</Label>
              <Input value={studentData.full_name} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Jenis Kelamin</Label>
              <Input value={studentData.gender === 'L' ? 'Laki-laki' : 'Perempuan'} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Tempat Lahir</Label>
              <Input value={studentData.birth_place || '-'} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Tanggal Lahir</Label>
              <Input value={studentData.birth_date || '-'} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Agama</Label>
              <Input value={studentData.religion || '-'} disabled className="bg-gray-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontak & Alamat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Kontak & Alamat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>No. Telepon</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <Input 
                value={formData.phone} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Masukkan nomor telepon"
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
          </div>
          
          <div>
            <Label>Alamat Lengkap</Label>
            <Textarea 
              value={formData.address} 
              disabled={!isEditing}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Masukkan alamat lengkap"
              className={!isEditing ? "bg-gray-50" : ""}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Orang Tua/Wali */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Data Orang Tua / Wali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nama Orang Tua / Wali</Label>
            <Input 
              value={formData.parent_name} 
              disabled={!isEditing}
              onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
              placeholder="Masukkan nama orang tua/wali"
              className={!isEditing ? "bg-gray-50" : ""}
            />
          </div>
          
          <div>
            <Label>No. Telepon Orang Tua</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <Input 
                value={formData.parent_phone} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                placeholder="Masukkan nomor telepon orang tua"
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
          </div>
          
          <div>
            <Label>Alamat Orang Tua</Label>
            <Textarea 
              value={formData.parent_address} 
              disabled={!isEditing}
              onChange={(e) => setFormData({...formData, parent_address: e.target.value})}
              placeholder="Masukkan alamat orang tua/wali"
              className={!isEditing ? "bg-gray-50" : ""}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
