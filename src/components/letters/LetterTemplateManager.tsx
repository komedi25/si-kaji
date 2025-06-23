
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface LetterTemplate {
  id: string;
  template_name: string;
  letter_type: string;
  template_content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export const LetterTemplateManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<LetterTemplate | null>(null);
  const [formData, setFormData] = useState({
    template_name: '',
    letter_type: '',
    template_content: '',
    variables: [] as string[],
    is_active: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['letter-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('letter_templates')
        .select('*')
        .order('template_name');
      
      if (error) throw error;
      return data as LetterTemplate[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('letter_templates')
        .insert([{
          ...data,
          variables: data.variables || []
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      resetForm();
      toast({ title: 'Template surat berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('letter_templates')
        .update({
          ...data,
          variables: data.variables || []
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      resetForm();
      toast({ title: 'Template surat berhasil diupdate' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if template is used in letter_requests
      const { data: requests, error: checkError } = await supabase
        .from('letter_requests')
        .select('id')
        .eq('letter_type', (templates?.find(t => t.id === id)?.letter_type || ''))
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (requests && requests.length > 0) {
        throw new Error('Template tidak dapat dihapus karena sudah digunakan dalam permohonan surat');
      }

      const { error } = await supabase
        .from('letter_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      toast({ title: 'Template surat berhasil dihapus' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      letter_type: '',
      template_content: '',
      variables: [],
      is_active: true
    });
    setEditingId(null);
  };

  const handleEdit = (template: LetterTemplate) => {
    setFormData({
      template_name: template.template_name,
      letter_type: template.letter_type,
      template_content: template.template_content,
      variables: template.variables || [],
      is_active: template.is_active
    });
    setEditingId(template.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract variables from template content
    const variableMatches = formData.template_content.match(/\{\{[^}]+\}\}/g);
    const extractedVariables = variableMatches 
      ? [...new Set(variableMatches.map(match => match.slice(2, -2).trim()))]
      : [];

    const data = {
      template_name: formData.template_name,
      letter_type: formData.letter_type,
      template_content: formData.template_content,
      variables: extractedVariables,
      is_active: formData.is_active
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Template Surat' : 'Tambah Template Surat Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template_name">Nama Template</Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="Surat Keterangan Aktif Kuliah"
                  required
                />
              </div>
              <div>
                <Label htmlFor="letter_type">Jenis Surat</Label>
                <Input
                  id="letter_type"
                  value={formData.letter_type}
                  onChange={(e) => setFormData({ ...formData, letter_type: e.target.value })}
                  placeholder="keterangan_aktif"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="template_content">Isi Template</Label>
              <Textarea
                id="template_content"
                value={formData.template_content}
                onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                placeholder="Yang bertanda tangan di bawah ini menerangkan bahwa:&#10;&#10;Nama: {{nama_siswa}}&#10;NIS: {{nis}}&#10;Kelas: {{kelas}}&#10;&#10;Adalah benar-benar siswa aktif..."
                rows={10}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Gunakan {'{{}}'} untuk variabel, contoh: {'{nama_siswa}'}, {'{nis}'}, {'{kelas}'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <Plus className="h-4 w-4 mr-1" />
                {editingId ? 'Update' : 'Tambah'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <p className="text-sm text-gray-500">{template.letter_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {template.is_active && (
                    <Badge variant="default">Aktif</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Variabel:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{template.template_name}</DialogTitle>
                        <DialogDescription>
                          Preview template surat - {template.letter_type}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {template.template_content}
                        </pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates?.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Belum Ada Template</h3>
                <p className="text-gray-500 mt-2">
                  Tambahkan template surat pertama untuk memulai.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
