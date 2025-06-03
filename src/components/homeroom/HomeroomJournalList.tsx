
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Edit, Download, Calendar } from 'lucide-react';

const mockJournals = [
  {
    id: '1',
    journalDate: '2024-06-03',
    className: 'X RPL 1',
    activityDescription: 'Pembelajaran Pemrograman Dasar - Array dan Looping',
    attendanceSummary: 'H: 32, I: 2, S: 1, A: 0',
    lastUpdated: '2024-06-03 15:30'
  },
  {
    id: '2',
    journalDate: '2024-06-02',
    className: 'X RPL 1',
    activityDescription: 'Review tugas minggu lalu dan pendalaman materi HTML/CSS',
    attendanceSummary: 'H: 34, I: 1, S: 0, A: 0',
    lastUpdated: '2024-06-02 14:45'
  },
  {
    id: '3',
    journalDate: '2024-06-01',
    className: 'X RPL 1',
    activityDescription: 'Praktik membuat website sederhana dengan HTML dan CSS',
    attendanceSummary: 'H: 33, I: 0, S: 2, A: 0',
    lastUpdated: '2024-06-01 16:20'
  }
];

export const HomeroomJournalList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJournals = mockJournals.filter(journal =>
    journal.activityDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    journal.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Jurnal Perwalian
          </span>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Cetak Laporan
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari jurnal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Deskripsi Kegiatan</TableHead>
                  <TableHead>Kehadiran</TableHead>
                  <TableHead>Terakhir Diupdate</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJournals.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableCell className="font-medium">
                      {new Date(journal.journalDate).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{journal.className}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {journal.activityDescription}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {journal.attendanceSummary}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {journal.lastUpdated}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
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
  );
};
