
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Eye, Edit, History, FileText, Globe, Lock } from 'lucide-react';

const mockDocuments = [
  {
    id: '1',
    title: 'Panduan Akademik 2024/2025',
    category: 'panduan',
    documentType: 'pdf',
    isPublic: true,
    fileSize: 2048576,
    versionNumber: 2,
    tags: ['akademik', 'panduan', '2024'],
    uploadedAt: '2024-06-01',
    uploadedBy: 'Admin Sistem'
  },
  {
    id: '2',
    title: 'SOP Penilaian Siswa',
    category: 'prosedur',
    documentType: 'doc',
    isPublic: false,
    fileSize: 1536000,
    versionNumber: 1,
    tags: ['sop', 'penilaian', 'guru'],
    uploadedAt: '2024-05-28',
    uploadedBy: 'Waka Kurikulum'
  },
  {
    id: '3',
    title: 'Formulir Izin Keluar Sekolah',
    category: 'formulir',
    documentType: 'pdf',
    isPublic: true,
    fileSize: 512000,
    versionNumber: 1,
    tags: ['formulir', 'izin', 'siswa'],
    uploadedAt: '2024-05-25',
    uploadedBy: 'Admin Kesiswaan'
  },
  {
    id: '4',
    title: 'Kebijakan Anti Bullying',
    category: 'kebijakan',
    documentType: 'pdf',
    isPublic: true,
    fileSize: 1024000,
    versionNumber: 3,
    tags: ['kebijakan', 'bullying', 'disiplin'],
    uploadedAt: '2024-05-20',
    uploadedBy: 'Kepala Sekolah'
  }
];

export const DocumentRepository = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesType = selectedType === 'all' || doc.documentType === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'xls':
        return <FileText className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'kebijakan': 'bg-red-100 text-red-700',
      'prosedur': 'bg-blue-100 text-blue-700',
      'formulir': 'bg-green-100 text-green-700',
      'panduan': 'bg-yellow-100 text-yellow-700',
      'regulasi': 'bg-purple-100 text-purple-700',
      'kurikulum': 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Repositori Dokumen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari dokumen atau tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="kebijakan">Kebijakan</SelectItem>
                <SelectItem value="prosedur">Prosedur</SelectItem>
                <SelectItem value="formulir">Formulir</SelectItem>
                <SelectItem value="panduan">Panduan</SelectItem>
                <SelectItem value="regulasi">Regulasi</SelectItem>
                <SelectItem value="kurikulum">Kurikulum</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="doc">DOC</SelectItem>
                <SelectItem value="xls">XLS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dokumen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Versi</TableHead>
                  <TableHead>Upload</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getFileTypeIcon(doc.documentType)}
                          <span className="font-medium">{doc.title}</span>
                          {doc.isPublic ? (
                            <Globe className="w-3 h-3 text-green-500" />
                          ) : (
                            <Lock className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(doc.category)}>
                        {doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="uppercase font-mono text-sm">
                      {doc.documentType}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{doc.versionNumber}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{new Date(doc.uploadedAt).toLocaleDateString('id-ID')}</div>
                      <div className="text-gray-500">{doc.uploadedBy}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" title="Lihat">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" title="Download">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" title="Riwayat Versi">
                          <History className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" title="Edit">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada dokumen yang ditemukan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
