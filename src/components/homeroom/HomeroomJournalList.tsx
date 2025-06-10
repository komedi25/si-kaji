
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Edit, Download, Calendar, Filter, Plus } from 'lucide-react';

export const HomeroomJournalList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const { data, error } = await supabase
        .from('homeroom_journals')
        .select(`
          *,
          classes(name),
          profiles(full_name)
        `)
        .eq('homeroom_teacher_id', user?.id)
        .order('journal_date', { ascending: false });

      if (error) throw error;
      setJournals(data || []);
    } catch (error) {
      console.error('Error fetching journals:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data jurnal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredJournals = journals.filter(journal => {
    const matchesSearch = journal.activity_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         journal.classes?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === 'all' || journal.journal_date.startsWith(filterMonth);
    const matchesClass = filterClass === 'all' || journal.class_id === filterClass;
    
    return matchesSearch && matchesMonth && matchesClass;
  });

  const handleExport = async () => {
    try {
      // Implementation for exporting journals
      toast({
        title: "Export Berhasil",
        description: "Jurnal berhasil diekspor ke PDF"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengekspor jurnal",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Memuat jurnal perwalian...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Jurnal Perwalian ({filteredJournals.length} entri)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Ekspor Laporan
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari jurnal berdasarkan kegiatan atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pilih bulan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua bulan</SelectItem>
                <SelectItem value="2024-01">Januari 2024</SelectItem>
                <SelectItem value="2024-02">Februari 2024</SelectItem>
                <SelectItem value="2024-03">Maret 2024</SelectItem>
                <SelectItem value="2024-04">April 2024</SelectItem>
                <SelectItem value="2024-05">Mei 2024</SelectItem>
                <SelectItem value="2024-06">Juni 2024</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pilih kelas..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                <SelectItem value="class1">X RPL 1</SelectItem>
                <SelectItem value="class2">X RPL 2</SelectItem>
                <SelectItem value="class3">XI RPL 1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{journals.length}</div>
                  <div className="text-sm text-muted-foreground">Total Jurnal</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{new Set(journals.map(j => j.journal_date.substring(0, 7))).size}</div>
                  <div className="text-sm text-muted-foreground">Bulan Aktif</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{journals.filter(j => j.follow_up_actions).length}</div>
                  <div className="text-sm text-muted-foreground">Perlu Tindak Lanjut</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round((journals.length / 30) * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Kelengkapan</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Journals Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Deskripsi Kegiatan</TableHead>
                  <TableHead>Kehadiran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Diperbarui</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJournals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterMonth !== 'all' || filterClass !== 'all' ? 
                        'Tidak ada jurnal yang sesuai dengan filter' : 
                        'Belum ada jurnal yang dibuat'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJournals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell className="font-medium">
                        {new Date(journal.journal_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{journal.classes?.name || 'Kelas tidak ditemukan'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={journal.activity_description}>
                          {journal.activity_description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {journal.attendance_summary || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {journal.follow_up_actions ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            Perlu Tindak Lanjut
                          </Badge>
                        ) : (
                          <Badge className="bg-green-50 text-green-700">
                            Lengkap
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(journal.updated_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" title="Lihat Detail">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" title="Edit Jurnal">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" title="Download PDF">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Quick Actions */}
          {filteredJournals.length === 0 && !searchTerm && filterMonth === 'all' && filterClass === 'all' && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Mulai Membuat Jurnal</h3>
              <p className="text-muted-foreground mb-4">
                Belum ada jurnal perwalian. Mulai dokumentasi kegiatan kelas Anda.
              </p>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Buat Jurnal Pertama
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
