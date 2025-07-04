
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudentDetails } from '@/hooks/useStudentData';
import { User, Save, Mail } from 'lucide-react';
import { StudentDataError } from './StudentDataError';

export const StudentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: studentData, isLoading: loading, error, refetch } = useStudentDetails(user?.id || null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: ''
  });

  // Update form data when student data changes
  React.useEffect(() => {
    if (studentData) {
      setFormData({
        phone: studentData.phone || '',
        address: studentData.address || ''
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
    return <StudentDataError error={error instanceof Error ? error.message : String(error || 'Unknown error')} onRetry={refetch} />;
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
              <Label>Status</Label>
              <Input value={studentData.status} disabled />
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
                    address: studentData.address || ''
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
