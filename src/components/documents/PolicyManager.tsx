
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Edit, Download, Eye, Shield, BookOpen } from 'lucide-react';

export const PolicyManager = () => {
  const { toast } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    document_type: 'pdf',
    tags: '',
    is_public: true
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('document_repository')
        .select('*')
        .eq('category', 'kebijakan')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kebijakan",
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
      const { error } = await supabase
        .from('document_repository')
        .insert({
          ...formData,
          category: 'kebijakan',
          tags: formData.tags.split(',').map(tag => tag.trim()),
          file_url: '/placeholder-document.pdf' // In real app, handle file upload
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Kebijakan berhasil ditambahkan"
      });

      setShowForm(false);
      setFormData({
        title: '',
        category: '',
        description: '',
        document_type: 'pdf',
        tags: '',
        is_public: true
      });
      fetchPolicies();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan kebijakan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const policyCategories = [
    { value: 'tata_tertib', label: 'Tata Tertib Siswa' },
    { value: 'akademik', label: 'Kebijakan Akademik' },
    { value: 'kesiswaan', label: 'Kebijakan Kesiswaan' },
    { value: 'ekstrakurikuler', label: 'Kebijakan Ekstrakurikuler' },
    { value: 'disiplin', label: 'Kebijakan Disiplin' },
    { value: 'beasiswa', label: 'Kebijakan Beasiswa' },
    { value: 'sarpras', label: 'Kebijakan Sarana Prasarana' }
  ];

  const getStatusBadge = (isActive: boolean, isPublic: boolean) => {
    if (!isActive) return <Badge variant="outline">Tidak Aktif</Badge>;
    if (isPublic) return <Badge className="bg-green-100 text-green-700">Publik</Badge>;
    return <Badge variant="secondary">Internal</Badge>;
  };

  if (loading && policies.length === 0) {
    return <div className="flex justify-center p-8">Memuat kebijakan...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Manajemen Kebijakan Sekolah
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Kebijakan
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Form Kebijakan Baru</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Judul Kebijakan</Label>
                      <Input
                        id="title"
                        placeholder="Masukkan judul kebijakan..."
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kategori Kebijakan</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                          {policyCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      placeholder="Jelaskan isi kebijakan..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Jenis Dokumen</Label>
                      <Select value={formData.document_type} onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="docx">Word Document</SelectItem>
                          <SelectItem value="pptx">PowerPoint</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tag (pisahkan dengan koma)</Label>
                      <Input
                        id="tags"
                        placeholder="tata tertib, siswa, disiplin"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : 'Simpan Kebijakan'}
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
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-muted-foreground">Total Kebijakan</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">8</div>
                      <div className="text-sm text-muted-foreground">Kebijakan Aktif</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-sm text-muted-foreground">Perlu Review</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul Kebijakan</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Versi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Diperbarui</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Mock data - replace with real data */}
                  {[
                    {
                      id: 1,
                      title: 'Tata Tertib Siswa SMK Negeri 1 Kendal',
                      category: 'Tata Tertib',
                      version: 3,
                      isActive: true,
                      isPublic: true,
                      updatedAt: '2024-06-01'
                    },
                    {
                      id: 2,
                      title: 'Kebijakan Anti Bullying',
                      category: 'Kesiswaan',
                      version: 2,
                      isActive: true,
                      isPublic: true,
                      updatedAt: '2024-05-15'
                    },
                    {
                      id: 3,
                      title: 'SOP Penanganan Kasus TPPK',
                      category: 'Internal',
                      version: 1,
                      isActive: true,
                      isPublic: false,
                      updatedAt: '2024-05-10'
                    }
                  ].map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.category}</Badge>
                      </TableCell>
                      <TableCell>v{policy.version}</TableCell>
                      <TableCell>
                        {getStatusBadge(policy.isActive, policy.isPublic)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {policy.updatedAt}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
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
