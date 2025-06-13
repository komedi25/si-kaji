
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Users, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ActivityLog {
  id: string;
  log_date: string;
  session_topic: string;
  session_description: string;
  attendance_count: number;
  student_progress_notes: string;
  materials_used: string;
  next_session_plan: string;
  extracurricular: {
    name: string;
  };
}

interface Extracurricular {
  id: string;
  name: string;
}

export function CoachActivityLog() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [formData, setFormData] = useState({
    extracurricular_id: '',
    log_date: new Date().toISOString().split('T')[0],
    session_topic: '',
    session_description: '',
    attendance_count: 0,
    student_progress_notes: '',
    materials_used: '',
    next_session_plan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch extracurriculars where user is coach
      const { data: extrasData, error: extrasError } = await supabase
        .from('extracurriculars')
        .select('id, name')
        .eq('coach_id', user?.id)
        .eq('is_active', true);

      if (extrasError) throw extrasError;
      setExtracurriculars(extrasData || []);

      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from('coach_activity_logs')
        .select(`
          *,
          extracurricular:extracurriculars(name)
        `)
        .eq('coach_id', user?.id)
        .order('log_date', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data aktivitas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        coach_id: user?.id,
        attendance_count: Number(formData.attendance_count)
      };

      if (editingLog) {
        const { error } = await supabase
          .from('coach_activity_logs')
          .update(payload)
          .eq('id', editingLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coach_activity_logs')
          .insert([payload]);
        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: editingLog ? "Log aktivitas diperbarui" : "Log aktivitas disimpan"
      });

      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan log aktivitas",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      extracurricular_id: '',
      log_date: new Date().toISOString().split('T')[0],
      session_topic: '',
      session_description: '',
      attendance_count: 0,
      student_progress_notes: '',
      materials_used: '',
      next_session_plan: ''
    });
    setEditingLog(null);
  };

  const handleEdit = (log: ActivityLog) => {
    setEditingLog(log);
    setFormData({
      extracurricular_id: log.extracurricular_id,
      log_date: log.log_date,
      session_topic: log.session_topic,
      session_description: log.session_description || '',
      attendance_count: log.attendance_count || 0,
      student_progress_notes: log.student_progress_notes || '',
      materials_used: log.materials_used || '',
      next_session_plan: log.next_session_plan || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus log aktivitas ini?')) return;

    try {
      const { error } = await supabase
        .from('coach_activity_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Log aktivitas dihapus"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus log aktivitas",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Memuat data aktivitas...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Log Aktivitas Pelatih
              </CardTitle>
              <CardDescription>
                Catat dan kelola aktivitas pelatihan ekstrakurikuler
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Log
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLog ? 'Edit Log Aktivitas' : 'Tambah Log Aktivitas'}
                  </DialogTitle>
                  <DialogDescription>
                    Isi detail aktivitas pelatihan yang telah dilakukan
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="extracurricular_id">Ekstrakurikuler</Label>
                      <Select
                        value={formData.extracurricular_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, extracurricular_id: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih ekstrakurikuler" />
                        </SelectTrigger>
                        <SelectContent>
                          {extracurriculars.map((extra) => (
                            <SelectItem key={extra.id} value={extra.id}>
                              {extra.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="log_date">Tanggal</Label>
                      <Input
                        id="log_date"
                        type="date"
                        value={formData.log_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, log_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_topic">Topik Sesi</Label>
                    <Input
                      id="session_topic"
                      value={formData.session_topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, session_topic: e.target.value }))}
                      placeholder="Masukkan topik sesi pelatihan"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_description">Deskripsi Sesi</Label>
                    <Textarea
                      id="session_description"
                      value={formData.session_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, session_description: e.target.value }))}
                      placeholder="Jelaskan aktivitas yang dilakukan dalam sesi ini"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance_count">Jumlah Peserta Hadir</Label>
                    <Input
                      id="attendance_count"
                      type="number"
                      min="0"
                      value={formData.attendance_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, attendance_count: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_progress_notes">Catatan Progress Siswa</Label>
                    <Textarea
                      id="student_progress_notes"
                      value={formData.student_progress_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, student_progress_notes: e.target.value }))}
                      placeholder="Catat perkembangan dan pencapaian siswa"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="materials_used">Materi/Peralatan Digunakan</Label>
                    <Textarea
                      id="materials_used"
                      value={formData.materials_used}
                      onChange={(e) => setFormData(prev => ({ ...prev, materials_used: e.target.value }))}
                      placeholder="Daftar materi, peralatan, atau fasilitas yang digunakan"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="next_session_plan">Rencana Sesi Selanjutnya</Label>
                    <Textarea
                      id="next_session_plan"
                      value={formData.next_session_plan}
                      onChange={(e) => setFormData(prev => ({ ...prev, next_session_plan: e.target.value }))}
                      placeholder="Rencana aktivitas untuk sesi pelatihan berikutnya"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Menyimpan...' : (editingLog ? 'Perbarui' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada log aktivitas. Mulai catat aktivitas pelatihan Anda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Ekstrakurikuler</TableHead>
                  <TableHead>Topik Sesi</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.log_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.extracurricular?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.session_topic}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {log.attendance_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(log)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
