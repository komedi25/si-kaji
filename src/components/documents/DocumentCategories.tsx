
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Edit, Trash2, FolderTree } from 'lucide-react';

export const DocumentCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_category_id: null
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Gagal memuat kategori dokumen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('document_categories')
          .update(formData)
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Kategori berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('document_categories')
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Kategori berhasil ditambahkan"
        });
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', parent_category_id: null });
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: editingCategory ? "Gagal memperbarui kategori" : "Gagal menambahkan kategori",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_category_id: category.parent_category_id
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;

    try {
      const { error } = await supabase
        .from('document_categories')
        .update({ is_active: false })
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus"
      });

      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus kategori",
        variant: "destructive"
      });
    }
  };

  const defaultCategories = [
    { id: 'cat1', name: 'Kebijakan Sekolah', description: 'Dokumen kebijakan dan peraturan sekolah', is_active: true },
    { id: 'cat2', name: 'Tata Tertib', description: 'Peraturan tata tertib siswa dan guru', is_active: true },
    { id: 'cat3', name: 'Panduan Akademik', description: 'Panduan dan prosedur akademik', is_active: true },
    { id: 'cat4', name: 'SOP Kesiswaan', description: 'Standard Operating Procedure bidang kesiswaan', is_active: true },
    { id: 'cat5', name: 'Formulir', description: 'Template formulir dan surat', is_active: true },
    { id: 'cat6', name: 'Laporan', description: 'Template dan contoh laporan', is_active: true }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5" />
            Manajemen Kategori Dokumen
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingCategory ? 'Edit Kategori' : 'Kategori Baru'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Kategori</Label>
                    <Input
                      id="name"
                      placeholder="Masukkan nama kategori..."
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      placeholder="Jelaskan kategori ini..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowForm(false);
                        setEditingCategory(null);
                        setFormData({ name: '', description: '', parent_category_id: null });
                      }}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : (editingCategory ? 'Perbarui' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{displayCategories.length}</div>
                      <div className="text-sm text-muted-foreground">Total Kategori</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Sub Kategori</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-sm text-muted-foreground">Total Dokumen</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Jumlah Dokumen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-blue-600" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{Math.floor(Math.random() * 10) + 1} dokumen</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">
                          Aktif
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
