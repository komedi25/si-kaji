
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StudentAchievementFormProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentAchievementForm = ({ studentId, onClose, onSuccess }: StudentAchievementFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    achievement_type_id: '',
    achievement_date: '',
    description: '',
    certificate_url: ''
  });

  // Query untuk tipe prestasi
  const { data: achievementTypes } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedType = achievementTypes?.find(t => t.id === formData.achievement_type_id);
      
      // Insert sebagai siswa - tidak perlu cek role admin
      const { error } = await supabase
        .from('student_achievements')
        .insert({
          student_id: studentId,
          achievement_type_id: formData.achievement_type_id,
          achievement_date: formData.achievement_date,
          description: formData.description,
          certificate_url: formData.certificate_url || null,
          point_reward: selectedType?.point_reward || 0,
          status: 'pending', // Menunggu verifikasi wali kelas
          recorded_by: user?.id // Dicatat oleh siswa sendiri
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Prestasi berhasil ditambahkan dan menunggu verifikasi wali kelas",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Implementasi upload file sertifikat
    // Untuk sementara hanya simpan nama file
    setFormData(prev => ({
      ...prev,
      certificate_url: file.name
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Prestasi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="achievement_type_id">Jenis Prestasi</Label>
            <Select 
              value={formData.achievement_type_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, achievement_type_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis prestasi" />
              </SelectTrigger>
              <SelectContent>
                {achievementTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.category} - {type.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="achievement_date">Tanggal Prestasi</Label>
            <Input
              id="achievement_date"
              type="date"
              value={formData.achievement_date}
              onChange={(e) => setFormData(prev => ({ ...prev, achievement_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan prestasi yang diraih..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label>Sertifikat/Bukti (Opsional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag & drop file atau klik untuk upload
              </p>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="certificate-upload"
              />
              <Label htmlFor="certificate-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm">
                  Pilih File
                </Button>
              </Label>
              {formData.certificate_url && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="text-sm text-green-600">{formData.certificate_url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, certificate_url: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
