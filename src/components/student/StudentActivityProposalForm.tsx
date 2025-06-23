
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, Save, Link } from 'lucide-react';

export const StudentActivityProposalForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'osis',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    estimated_participants: '',
    budget_estimation: '',
    organizer_name: '',
    document_link: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      // Generate proposal number
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-4);
      const proposalNumber = `PROP/${year}/${timestamp}`;

      const { error } = await supabase
        .from('activity_proposals')
        .insert({
          proposal_number: proposalNumber,
          title: formData.title,
          description: formData.description,
          activity_type: formData.activity_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          location: formData.location || null,
          estimated_participants: formData.estimated_participants ? parseInt(formData.estimated_participants) : null,
          budget_estimation: formData.budget_estimation ? parseFloat(formData.budget_estimation) : null,
          organizer_name: formData.organizer_name,
          status: 'draft',
          organizer_id: user.id,
          document_urls: formData.document_link ? [formData.document_link] : null
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Draft proposal kegiatan berhasil disimpan"
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        activity_type: 'osis',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        location: '',
        estimated_participants: '',
        budget_estimation: '',
        organizer_name: '',
        document_link: ''
      });
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan proposal kegiatan",
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
          <ClipboardList className="h-5 w-5" />
          Form Proposal Kegiatan Baru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Judul Kegiatan *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Masukkan judul kegiatan"
              required
            />
          </div>

          <div>
            <Label htmlFor="organizer_name">Nama Penyelenggara *</Label>
            <Input
              id="organizer_name"
              value={formData.organizer_name}
              onChange={(e) => setFormData({...formData, organizer_name: e.target.value})}
              placeholder="Nama organisasi/unit penyelenggara"
              required
            />
          </div>

          <div>
            <Label htmlFor="activity_type">Jenis Kegiatan *</Label>
            <select
              id="activity_type"
              className="w-full p-2 border rounded-md"
              value={formData.activity_type}
              onChange={(e) => setFormData({...formData, activity_type: e.target.value})}
              required
            >
              <option value="osis">OSIS</option>
              <option value="ekstrakurikuler">Ekstrakurikuler</option>
              <option value="sekolah">Sekolah</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi Kegiatan</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Jelaskan detail kegiatan yang akan dilaksanakan"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Tanggal Mulai *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Tanggal Selesai *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Waktu Mulai (Opsional)</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="end_time">Waktu Selesai (Opsional)</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Lokasi Kegiatan</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Tempat pelaksanaan kegiatan"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimated_participants">Estimasi Peserta</Label>
              <Input
                id="estimated_participants"
                type="number"
                value={formData.estimated_participants}
                onChange={(e) => setFormData({...formData, estimated_participants: e.target.value})}
                placeholder="Jumlah peserta yang diharapkan"
              />
            </div>
            <div>
              <Label htmlFor="budget_estimation">Estimasi Anggaran (Rp)</Label>
              <Input
                id="budget_estimation"
                type="number"
                value={formData.budget_estimation}
                onChange={(e) => setFormData({...formData, budget_estimation: e.target.value})}
                placeholder="Estimasi biaya kegiatan"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="document_link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link Dokumen Google Drive (Opsional)
            </Label>
            <Input
              id="document_link"
              type="url"
              value={formData.document_link}
              onChange={(e) => setFormData({...formData, document_link: e.target.value})}
              placeholder="https://drive.google.com/..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Masukkan link Google Drive yang berisi dokumen pendukung proposal (RAB, rundown, dll)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Catatan Penting:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Proposal akan disimpan sebagai draft terlebih dahulu</li>
              <li>• Setelah melengkapi semua dokumen, Anda dapat mengajukan untuk review</li>
              <li>• Proposal akan direview oleh koordinator dan wakil kepala sekolah</li>
              <li>• Pastikan semua informasi yang diisi sudah benar dan lengkap</li>
              <li>• Link Google Drive harus dapat diakses oleh reviewer</li>
            </ul>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Draft Proposal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
