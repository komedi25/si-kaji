import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { LoadingFallback } from '@/components/common/LoadingFallback';
import { 
  User, Edit, Save, X, Upload, 
  Phone, Mail, MapPin, Calendar 
} from 'lucide-react';

interface StudentProfile {
  id: string;
  nis: string;
  nisn: string;
  full_name: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  address: string;
  phone: string;
  email: string;
  religion: string;
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  photo_url?: string;
}

export const SimpleStudentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<StudentProfile>>({});

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      // Map database fields to component interface
      const profileData = {
        ...data,
        email: (data as any).email || '',
        phone: (data as any).phone || '',
        parent_name: (data as any).parent_name || '',
        parent_phone: (data as any).parent_phone || '',
        parent_address: (data as any).parent_address || ''
      } as StudentProfile;
      
      setProfile(profileData);
      setFormData(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Gagal memuat profil siswa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_address: formData.parent_address
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui"
      });

      setProfile({ ...profile, ...formData });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  const handleInputChange = (field: keyof StudentProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingFallback text="Memuat profil..." />;
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Profil siswa tidak ditemukan. Silakan hubungi administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Pribadi
            </CardTitle>
            {!editing ? (
              <Button onClick={() => setEditing(true)} size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit Profil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Batal
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Photo and Basic Info */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photo_url} />
                <AvatarFallback className="text-lg">
                  {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Ganti Foto
                </Button>
              )}
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>NIS</Label>
                <Input value={profile.nis} disabled className="bg-muted" />
              </div>
              <div>
                <Label>NISN</Label>
                <Input value={profile.nisn} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Nama Lengkap</Label>
                {editing ? (
                  <Input
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                  />
                ) : (
                  <Input value={profile.full_name} disabled className="bg-muted" />
                )}
              </div>
              <div>
                <Label>Jenis Kelamin</Label>
                <Input 
                  value={profile.gender === 'male' ? 'Laki-laki' : 'Perempuan'} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Informasi Kontak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                No. Telepon
              </Label>
              {editing ? (
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              ) : (
                <Input value={profile.phone || '-'} disabled className="bg-muted" />
              )}
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {editing ? (
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Masukkan email"
                />
              ) : (
                <Input value={profile.email || '-'} disabled className="bg-muted" />
              )}
            </div>
          </div>
          
          <div>
            <Label className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Alamat
            </Label>
            {editing ? (
              <Textarea
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Masukkan alamat lengkap"
                rows={3}
              />
            ) : (
              <Textarea value={profile.address || '-'} disabled className="bg-muted" rows={3} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parent Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Orang Tua/Wali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Orang Tua/Wali</Label>
              {editing ? (
                <Input
                  value={formData.parent_name || ''}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                  placeholder="Masukkan nama orang tua/wali"
                />
              ) : (
                <Input value={profile.parent_name || '-'} disabled className="bg-muted" />
              )}
            </div>
            <div>
              <Label>No. Telepon Orang Tua</Label>
              {editing ? (
                <Input
                  value={formData.parent_phone || ''}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  placeholder="Masukkan nomor telepon orang tua"
                />
              ) : (
                <Input value={profile.parent_phone || '-'} disabled className="bg-muted" />
              )}
            </div>
          </div>
          
          <div>
            <Label>Alamat Orang Tua</Label>
            {editing ? (
              <Textarea
                value={formData.parent_address || ''}
                onChange={(e) => handleInputChange('parent_address', e.target.value)}
                placeholder="Masukkan alamat orang tua"
                rows={3}
              />
            ) : (
              <Textarea value={profile.parent_address || '-'} disabled className="bg-muted" rows={3} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informasi Akademik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tempat Lahir</Label>
              <Input value={profile.birth_place || '-'} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Tanggal Lahir</Label>
              <Input 
                value={profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('id-ID') : '-'} 
                disabled 
                className="bg-muted" 
              />
            </div>
            <div>
              <Label>Agama</Label>
              <Input value={profile.religion || '-'} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};