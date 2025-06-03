
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Plus, Edit, Trash2, Eye } from 'lucide-react';

const templateSchema = z.object({
  template_name: z.string().min(1, 'Nama template wajib diisi'),
  letter_type: z.string().min(1, 'Jenis surat wajib diisi'),
  template_content: z.string().min(1, 'Konten template wajib diisi'),
  variables: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface LetterTemplate {
  id: string;
  template_name: string;
  letter_type: string;
  template_content: string;
  variables: any;
  is_active: boolean;
  created_at: string;
}

const letterTypes = [
  'surat_keterangan_aktif',
  'surat_keterangan_kelakuan_baik',
  'surat_rekomendasi',
  'surat_izin_kegiatan',
  'surat_undangan',
  'surat_pemberitahuan'
];

const defaultVariables = [
  '{{nama_siswa}}',
  '{{nis}}',
  '{{kelas}}',
  '{{tahun_ajaran}}',
  '{{tanggal_surat}}',
  '{{kepala_sekolah}}',
  '{{nip_kepsek}}',
  '{{nama_sekolah}}',
  '{{alamat_sekolah}}'
];

export const LetterTemplates = () => {
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LetterTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<LetterTemplate | null>(null);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      letter_type: 'surat_keterangan_aktif',
    },
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('letter_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Gagal memuat template surat');
    }
  };

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      const templateData = {
        template_name: data.template_name,
        letter_type: data.letter_type,
        template_content: data.template_content,
        variables: data.variables ? JSON.parse(data.variables) : null,
        created_by: user.id,
        is_active: true,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('letter_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('letter_templates')
          .insert([templateData]);

        if (error) throw error;
        toast.success('Template berhasil dibuat');
      }

      form.reset();
      setEditingTemplate(null);
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Gagal menyimpan template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (template: LetterTemplate) => {
    setEditingTemplate(template);
    form.reset({
      template_name: template.template_name,
      letter_type: template.letter_type,
      template_content: template.template_content,
      variables: template.variables ? JSON.stringify(template.variables, null, 2) : '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;

    try {
      const { error } = await supabase
        .from('letter_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Template berhasil dihapus');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Gagal menghapus template');
    }
  };

  const toggleActive = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('letter_templates')
        .update({ is_active: !isActive })
        .eq('id', templateId);

      if (error) throw error;
      toast.success(`Template berhasil ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      toast.error('Gagal mengubah status template');
    }
  };

  const getLetterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      surat_keterangan_aktif: 'Surat Keterangan Aktif',
      surat_keterangan_kelakuan_baik: 'Surat Keterangan Kelakuan Baik',
      surat_rekomendasi: 'Surat Rekomendasi',
      surat_izin_kegiatan: 'Surat Izin Kegiatan',
      surat_undangan: 'Surat Undangan',
      surat_pemberitahuan: 'Surat Pemberitahuan'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Template Surat</h2>
          <p className="text-muted-foreground">Kelola template surat untuk berbagai keperluan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Tambah Template Baru'}
              </DialogTitle>
              <DialogDescription>
                Buat atau edit template surat dengan variabel yang dapat diganti otomatis
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="template_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Template</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama template" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="letter_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Surat</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis surat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {letterTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {getLetterTypeLabel(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="template_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konten Template</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Isi template surat dengan variabel seperti {{nama_siswa}}, {{nis}}, dll"
                          rows={10}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Variabel yang Tersedia:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {defaultVariables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="variables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variabel Kustom (JSON)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"custom_variable": "nilai default"}'
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : (editingTemplate ? 'Perbarui' : 'Simpan')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.template_name}</CardTitle>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <CardDescription>
                {getLetterTypeLabel(template.letter_type)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.template_content.substring(0, 150)}...
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(template.id, template.is_active)}
                  >
                    {template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              {getLetterTypeLabel(previewTemplate?.letter_type || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">
              {previewTemplate?.template_content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada template surat yang dibuat</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
