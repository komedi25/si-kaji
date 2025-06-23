
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StudentSearchWithQR } from '@/components/common/StudentSearchWithQR';
import { FileText, Send, AlertCircle } from 'lucide-react';

interface LetterRequestFormProps {
  onSuccess?: () => void;
}

interface LetterTemplate {
  id: string;
  template_name: string;
  letter_type: string;
  template_content: string;
  variables: any[];
}

export const LetterRequestForm = ({ onSuccess }: LetterRequestFormProps) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    letter_type: '',
    purpose: '',
    additional_notes: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (formData.letter_type) {
      const template = templates.find(t => t.letter_type === formData.letter_type);
      setSelectedTemplate(template || null);
    }
  }, [formData.letter_type, templates]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('letter_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Gagal memuat template surat",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.letter_type || !formData.purpose) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap lengkapi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('letter_requests')
        .insert({
          student_id: formData.student_id,
          letter_type: formData.letter_type,
          purpose: formData.purpose,
          additional_notes: formData.additional_notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan surat berhasil diajukan"
      });

      // Reset form
      setFormData({
        student_id: '',
        letter_type: '',
        purpose: '',
        additional_notes: ''
      });
      setSelectedTemplate(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating letter request:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan permohonan surat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUniqueLetterTypes = () => {
    const types = [...new Set(templates.map(t => t.letter_type))];
    return types.map(type => ({
      value: type,
      label: type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }));
  };

  if (!hasRole('admin') && !hasRole('siswa') && !hasRole('wali_kelas')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Akses Terbatas</h3>
              <p className="text-gray-500 mt-2">
                Anda tidak memiliki akses untuk mengajukan permohonan surat.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Permohonan Surat Keterangan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="student">Siswa *</Label>
              <StudentSearchWithQR
                value={formData.student_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                placeholder="Cari siswa berdasarkan nama atau NIS"
              />
            </div>

            <div>
              <Label htmlFor="letter_type">Jenis Surat *</Label>
              <Select 
                value={formData.letter_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, letter_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis surat" />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueLetterTypes().map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purpose">Tujuan/Keperluan *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Jelaskan tujuan atau keperluan surat ini"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="additional_notes">Catatan Tambahan</Label>
              <Textarea
                id="additional_notes"
                value={formData.additional_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
              />
            </div>

            {selectedTemplate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Preview Template: {selectedTemplate.template_name}</h4>
                <div className="text-sm text-blue-800 whitespace-pre-wrap bg-white p-3 rounded border">
                  {selectedTemplate.template_content}
                </div>
                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-blue-600 font-medium">Variabel yang akan diisi otomatis:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTemplate.variables.map((variable: string, index: number) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Informasi Penting:</p>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Permohonan akan diproses dalam 1-3 hari kerja</li>
                    <li>• Pastikan data yang dimasukkan sudah benar</li>
                    <li>• Anda akan mendapat notifikasi jika surat sudah siap</li>
                    <li>• Surat dapat diambil di bagian administrasi</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={loading || !formData.student_id || !formData.letter_type || !formData.purpose}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ajukan Permohonan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
