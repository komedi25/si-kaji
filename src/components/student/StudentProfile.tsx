
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Save, Camera } from 'lucide-react';

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

export const StudentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching student data:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data pribadi",
          variant: "destructive"
        });
        return;
      }

      setStudentData(data);
    } catch (error) {
      console.error('Error:', error);
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
        .update({
          phone: studentData.phone,
          address: studentData.address,
          parent_name: studentData.parent_name,
          parent_phone: studentData.parent_phone,
          parent_address: studentData.parent_address
        })
        .eq('id', studentData.id);

      if (error) throw error;

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
      </div>
    );
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Data siswa tidak ditemukan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
                value={studentData.phone || ''} 
                disabled={!isEditing}
                onChange={(e) => setStudentData({...studentData, phone: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label>Alamat</Label>
            <Textarea 
              value={studentData.address || ''} 
              disabled={!isEditing}
              onChange={(e) => setStudentData({...studentData, address: e.target.value})}
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
                value={studentData.parent_name || ''} 
                disabled={!isEditing}
                onChange={(e) => setStudentData({...studentData, parent_name: e.target.value})}
              />
            </div>
            <div>
              <Label>No. Telepon Orang Tua</Label>
              <Input 
                value={studentData.parent_phone || ''} 
                disabled={!isEditing}
                onChange={(e) => setStudentData({...studentData, parent_phone: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label>Alamat Orang Tua</Label>
            <Textarea 
              value={studentData.parent_address || ''} 
              disabled={!isEditing}
              onChange={(e) => setStudentData({...studentData, parent_address: e.target.value})}
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
                fetchStudentData();
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
