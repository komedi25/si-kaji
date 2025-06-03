
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, RotateCcw, History } from 'lucide-react';

const mockVersions = [
  {
    id: '1',
    versionNumber: 3,
    changesDescription: 'Update kebijakan sanksi dan penambahan klausul baru',
    uploadedBy: 'Kepala Sekolah',
    uploadedAt: '2024-06-01 14:30',
    fileSize: 1024000,
    isActive: true
  },
  {
    id: '2',
    versionNumber: 2,
    changesDescription: 'Perbaikan typo dan update kontak emergency',
    uploadedBy: 'Admin Sistem',
    uploadedAt: '2024-05-15 09:15',
    fileSize: 1020000,
    isActive: false
  },
  {
    id: '3',
    versionNumber: 1,
    changesDescription: 'Versi awal dokumen kebijakan',
    uploadedBy: 'Admin Sistem',
    uploadedAt: '2024-03-01 16:45',
    fileSize: 980000,
    isActive: false
  }
];

export const DocumentVersionHistory = ({ documentTitle = "Kebijakan Anti Bullying" }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRestore = (versionId: string, versionNumber: number) => {
    console.log(`Restoring version ${versionNumber} for document`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Riwayat Versi: {documentTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versi</TableHead>
                <TableHead>Perubahan</TableHead>
                <TableHead>Upload Oleh</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVersions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={version.isActive ? "default" : "outline"}>
                        v{version.versionNumber}
                      </Badge>
                      {version.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          AKTIF
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm">{version.changesDescription}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{version.uploadedBy}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{version.uploadedAt}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatFileSize(version.fileSize)}</span>
                  </TableCell>
                  <TableCell>
                    {version.isActive ? (
                      <Badge className="bg-green-100 text-green-700">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Arsip
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" title="Lihat">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" title="Download">
                        <Download className="w-3 h-3" />
                      </Button>
                      {!version.isActive && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          title="Restore sebagai versi aktif"
                          onClick={() => handleRestore(version.id, version.versionNumber)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Informasi Version Control</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Setiap perubahan dokumen akan membuat versi baru secara otomatis</li>
            <li>• Versi lama tetap tersimpan dan dapat diakses kapan saja</li>
            <li>• Anda dapat mengembalikan (restore) versi sebelumnya jika diperlukan</li>
            <li>• Hanya satu versi yang aktif pada satu waktu</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
