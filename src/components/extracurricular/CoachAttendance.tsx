
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
import { Calendar, Clock, Users, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Attendance {
  id: string;
  attendance_date: string;
  start_time: string;
  end_time: string;
  status: string;
  participant_count: number;
  activities_conducted: string;
  notes: string;
  extracurricular: {
    name: string;
  };
}

interface Extracurricular {
  id: string;
  name: string;
}

export function CoachAttendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [formData, setFormData] = useState({
    extracurricular_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '16:00',
    status: 'present',
    participant_count: 0,
    activities_conducted: '',
    notes: ''
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

      // Fetch coach attendances
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('coach_attendances')
        .select(`
          *,
          extracurricular:extracurriculars(name)
        `)
        .eq('coach_id', user?.id)
        .order('attendance_date', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendances(attendanceData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kehadiran",
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
        participant_count: Number(formData.participant_count)
      };

      if (editingAttendance) {
        const { error } = await supabase
          .from('coach_attendances')
          .update(payload)
          .eq('id', editingAttendance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coach_attendances')
          .insert([payload]);
        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: editingAttendance ? "Kehadiran diperbarui" : "Kehadiran dicatat"
      });

      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan kehadiran",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      extracurricular_id: '',
      attendance_date: new Date().toISOString().split('T')[0],
      start_time: '14:00',
      end_time: '16:00',
      status: 'present',
      participant_count: 0,
      activities_conducted: '',
      notes: ''
    });
    setEditingAttendance(null);
  };

  const handleEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setFormData({
      extracurricular_id: attendance.extracurricular_id,
      attendance_date: attendance.attendance_date,
      start_time: attendance.start_time,
      end_time: attendance.end_time || '16:00',
      status: attendance.status,
      participant_count: attendance.participant_count || 0,
      activities_conducted: attendance.activities_conducted || '',
      notes: attendance.notes || ''
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hadir
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Tidak Hadir
          </Badge>
        );
      case 'sick':
        return (
          <Badge variant="secondary">
            Sakit
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Memuat data kehadiran...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Kehadiran Pelatih
              </CardTitle>
              <CardDescription>
                Catat kehadiran dan aktivitas pelatihan ekstrakurikuler
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Catat Kehadiran
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingAttendance ? 'Edit Kehadiran' : 'Catat Kehadiran'}
                  </DialogTitle>
                  <DialogDescription>
                    Isi detail kehadiran dan aktivitas pelatihan
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
                      <Label htmlFor="attendance_date">Tanggal</Label>
                      <Input
                        id="attendance_date"
                        type="date"
                        value={formData.attendance_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, attendance_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Waktu Mulai</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Waktu Selesai</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status Kehadiran</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Hadir</SelectItem>
                          <SelectItem value="absent">Tidak Hadir</SelectItem>
                          <SelectItem value="sick">Sakit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="participant_count">Jumlah Peserta</Label>
                    <Input
                      id="participant_count"
                      type="number"
                      min="0"
                      value={formData.participant_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, participant_count: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activities_conducted">Aktivitas yang Dilakukan</Label>
                    <Textarea
                      id="activities_conducted"
                      value={formData.activities_conducted}
                      onChange={(e) => setFormData(prev => ({ ...prev, activities_conducted: e.target.value }))}
                      placeholder="Jelaskan aktivitas pelatihan yang dilakukan"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Catatan tambahan (opsional)"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Menyimpan...' : (editingAttendance ? 'Perbarui' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada catatan kehadiran. Mulai catat kehadiran pelatihan Anda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Ekstrakurikuler</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      {new Date(attendance.attendance_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {attendance.extracurricular?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {attendance.start_time} - {attendance.end_time || '--:--'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(attendance.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {attendance.participant_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(attendance)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
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
