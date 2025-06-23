
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, FolderOpen, LinkIcon } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string;
  document_type: string;
  file_url: string;
  tags: string[];
  version_number: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  uploaded_by: string | null;
}

export const DocumentRepositoryManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'kebijakan',
    document_type: 'pdf',
    file_url: '',
    tags: '',
    is_active: true,
    is_public: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_repository')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('document_repository')
        .insert([{
          ...data,
          tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      resetForm();
      toast({ title: 'Dokumen berhasil ditambahkan' });
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
        .from('document_repository')
        .update({
          ...data,
          tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
          version_number: data.version_number + 1
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      resetForm();
      toast({ title: 'Dokumen berhasil diupdate' });
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
      const { error } = await supabase
        .from('document_repository')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Dokumen berhasil dihapus' });
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
      title: '',
      description: '',
      category: 'kebijakan',
      document_type: 'pdf',
      file_url: '',
      tags: '',
      is_active: true,
      is_public: false
    });
    setEditingId(null);
  };

  const handleEdit = (document: Document) => {
    setFormData({
      title: document.title,
      description: document.description || '',
      category: document.category,
      document_type: document.document_type,
      file_url: document.file_url,
      tags: document.tags ? document.tags.join(', ') : '',
      is_active: document.is_active,
      is_public: document.is_public
    });
    setEditingId(document.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Google Drive URL
    if (formData.file_url && !isValidGoogleDriveUrl(formData.file_url)) {
      toast({
        title: "URL Tidak Valid",
        description: "Harap masukkan link Google Drive yang valid",
        variant: "destructive"
      });
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      document_type: formData.document_type,
      file_url: formData.file_url,
      tags: formData.tags,
      is_active: formData.is_active,
      is_public: formData.is_public,
      version_number: editingId ? (documents?.find(d => d.id === editingId)?.version_number || 1) : 1
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const isValidGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      'kebijakan': 'default',
      'panduan': 'secondary',
      'formulir': 'outline'
    };
    return <Badge variant={variants[category as keyof typeof variants] as any}>{category.toUpperCase()}</Badge>;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Judul Dokumen</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Kebijakan Tata Tertib Siswa"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kebijakan">Kebijakan</SelectItem>
                    <SelectItem value="panduan">Panduan</SelectItem>
                    <SelectItem value="formulir">Formulir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi dokumen..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="file_url">Link Google Drive</Label>
              <div className="flex gap-2">
                <LinkIcon className="h-4 w-4 mt-3 text-gray-400" />
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pastikan file Google Drive dapat diakses oleh siapa saja dengan link
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="document_type">Jenis Dokumen</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="doc">DOC</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="xls">XLS</SelectItem>
                    <SelectItem value="xlsx">XLSX</SelectItem>
                    <SelectItem value="ppt">PPT</SelectItem>
                    <SelectItem value="pptx">PPTX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tata tertib, siswa, kebijakan"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label htmlFor="is_public">Publik</Label>
              </div>
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

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents?.map((document) => (
          <Card key={document.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{document.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getCategoryBadge(document.category)}
                    <Badge variant="outline">{document.document_type.toUpperCase()}</Badge>
                    <Badge variant="secondary">v{document.version_number}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {document.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{document.description}</p>
                )}
                
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(document.created_at).toLocaleDateString('id-ID')}</span>
                  <div className="flex gap-1">
                    {document.is_active && <Badge variant="default" className="text-xs">Aktif</Badge>}
                    {document.is_public && <Badge variant="secondary" className="text-xs">Publik</Badge>}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(document.file_url, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Buka
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(document)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(document.id)}
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

      {documents?.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Belum Ada Dokumen</h3>
                <p className="text-gray-500 mt-2">
                  Tambahkan dokumen pertama untuk memulai repositori.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
