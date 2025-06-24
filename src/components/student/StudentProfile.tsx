
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudentData } from '@/hooks/useStudentData';
import { User, Save, AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const StudentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { studentData, loading, error, refetch } = useStudentData();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_address: ''
  });

  // Update form data when student data changes
  React.useEffect(() => {
    if (studentData) {
      setFormData({
        phone: studentData.phone || '',
        address: studentData.address || '',
        parent_name: studentData.parent_name || '',
        parent_phone: studentData.parent_phone || '',
        parent_address: studentData.parent_address || ''
      });
    }
  }, [studentData]);

  const handleSave = async () => {
    if (!studentData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update(formData)
        .eq('id', studentData.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data pribadi berhasil diperbarui"
      });
      setIsEditing(false);
      refetch(); // Refresh data
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
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Data Siswa Tidak Ditemukan</strong><br/>
            User ID: {user?.id}<br/>
            Email: {user?.email}<br/>
            Error: {error}<br/>
            Sistem telah mencoba menghubungkan data siswa dengan berbagai metode namun tidak berhasil. Hubungi admin untuk memastikan data siswa Anda terdaftar dengan benar.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Data Siswa Belum Tersedia</h3>
                <p className="text-gray-500 mt-2">
                  Data pribadi Anda belum terdaftar dalam sistem atau belum terhubung dengan akun ini.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Informasi Debug:</h4>
                <div className="text-sm text-blue-700 space-y-1 text-left">
                  <div>User ID: {user?.id}</div>
                  <div>Email: {user?.email}</div>
                  <div>Error: {error}</div>
                </div>
                <h4 className="font-medium text-blue-800 mb-2 mt-4">Langkah Selanjutnya:</h4>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Hubungi bagian tata usaha sekolah</li>
                  <li>• Berikan informasi akun Anda: {user?.email}</li>
                  <li>• Administrator akan menghubungkan data siswa dengan akun Anda</li>
                  <li>• Atau pastikan NIS dan nama di profil Anda sudah benar</li>
                </ul>
              </div>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || 'Tidak tersedia'} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Data Pribadi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>NIS</Label>
              <Input value={studentData.nis} disabled />
            </div>
            <div>
              <Label>Nama Lengkap</Label>
              <Input value={studentData.full_name} disabled />
            </div>
            <div>
              <Label>Jenis Kelamin</Label>
              <Input value={studentData.gender} disabled />
            </div>
            <div>
              <Label>Tempat Lahir</Label>
              <Input value={studentData.birth_place || '-'} disabled />
            </div>
            <div>
              <Label>Tanggal Lahir</Label>
              <Input value={studentData.birth_date || '-'} disabled />
            </div>
            <div>
              <Label>Agama</Label>
              <Input value={studentData.religion || '-'} disabled />
            </div>
            <div>
              <Label>No. Telepon</Label>
              <Input 
                value={formData.phone} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Masukkan nomor telepon"
              />
            </div>
          </div>
          
          <div>
            <Label>Alamat</Label>
            <Textarea 
              value={formData.address} 
              disabled={!isEditing}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Masukkan alamat lengkap"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Orang Tua / Wali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Orang Tua / Wali</Label>
              <Input 
                value={formData.parent_name} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                placeholder="Masukkan nama orang tua/wali"
              />
            </div>
            <div>
              <Label>No. Telepon Orang Tua</Label>
              <Input 
                value={formData.parent_phone} 
                disabled={!isEditing}
                onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                placeholder="Masukkan nomor telepon orang tua"
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
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Edit Data
          </Button>
        ) : (
          <>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                // Reset form data
                if (studentData) {
                  setFormData({
                    phone: studentData.phone || '',
                    address: studentData.address || '',
                    parent_name: studentData.parent_name || '',
                    parent_phone: studentData.parent_phone || '',
                    parent_address: studentData.parent_address || ''
                  });
                }
              }}
            >
              Batal
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
