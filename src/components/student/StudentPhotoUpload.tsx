
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, User } from 'lucide-react';
import { Student } from '@/types/student';

interface StudentPhotoUploadProps {
  student?: Student;
  onPhotoUploaded: (photoUrl: string) => void;
  currentPhotoUrl?: string;
}

export const StudentPhotoUpload = ({ student, onPhotoUploaded, currentPhotoUrl }: StudentPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || '');
  const { toast } = useToast();

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Silakan pilih file foto');
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar');
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran file maksimal 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${student?.id || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old photo if exists
      if (photoUrl && student?.id) {
        const oldPath = photoUrl.split('/').pop();
        if (oldPath && oldPath !== fileName) {
          await supabase.storage
            .from('student-photos')
            .remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);
      onPhotoUploaded(publicUrl);

      toast({
        title: "Berhasil",
        description: "Foto berhasil diupload",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengupload foto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!photoUrl) return;

    try {
      setUploading(true);
      
      const fileName = photoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('student-photos')
          .remove([fileName]);
      }

      setPhotoUrl('');
      onPhotoUploaded('');

      toast({
        title: "Berhasil",
        description: "Foto berhasil dihapus",
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus foto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Foto Siswa</Label>
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={photoUrl} />
          <AvatarFallback>
            <User className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={uploadPhoto}
              disabled={uploading}
              className="hidden"
              id="photo-upload"
            />
            <Label htmlFor="photo-upload" asChild>
              <Button variant="outline" disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Mengupload...' : 'Upload Foto'}
              </Button>
            </Label>
            
            {photoUrl && (
              <Button 
                variant="outline" 
                onClick={removePhoto}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Format: JPG, PNG, WebP. Maksimal 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};
