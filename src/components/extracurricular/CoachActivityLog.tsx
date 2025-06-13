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
import { Calendar, FileText, Users, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  log_date: string;
  extracurricular_id: string;
  session_topic: string;
  session_description?: string;
  attendance_count?: number;
  student_progress_notes?: string;
  materials_used?: string;
  next_session_plan?: string;
  coach_id: string;
  created_at: string;
}

interface Extracurricular {
  id: string;
  name: string;
  coach_id: string;
}

export function CoachActivityLog() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    log_date: format(new Date(), 'yyyy-MM-dd'),
    extracurricular_id: '',
    session_topic: '',
    session_description: '',
    attendance_count: 0,
    student_progress_notes: '',
    materials_used: '',
    next_session_plan: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load extracurriculars where user is coach
      const { data: extracurricularData, error: extracurricularError } = await supabase
        .from('extracurriculars')
        .select('*')
        .eq('coach_id', user?.id);

      if (extracurricularError) throw extracurricularError;
      setExtracurriculars(extracurricularData || []);

      // Load activity logs from coach_activity_logs table
      const { data: activityData, error: activityError } = await supabase
        .from('coach_activity_logs')
        .select('*')
        .eq('coach_id', user?.id)
        .order('log_date', { ascending: false });

      if (activityError) throw activityError;
      setActivities(activityData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
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
        .from('coach_activity_logs')
        .insert({
          log_date: formData.log_date,
          extracurricular_id: formData.extracurricular_id,
          session_topic: formData.session_topic,
          session_description: formData.session_description,
          attendance_count: formData.attendance_count,
          student_progress_notes: formData.student_progress_notes,
          materials_used: formData.materials_used,
          next_session_plan: formData.next_session_plan,
          coach_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jurnal kegiatan berhasil disimpan"
      });

      setShowForm(false);
      setFormData({
        log_date: format(new Date(), 'yyyy-MM-dd'),
        extracurricular_id: '',
        session_topic: '',
        session_description: '',
        attendance_count: 0,
        student_progress_notes: '',
        materials_used: '',
        next_session_plan: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error saving activity log:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan jurnal kegiatan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'latihan':
        return 'bg-blue-100 text-blue-800';
      case 'pertandingan':
        return 'bg-green-100 text-green-800';
      case 'evaluasi':
        return 'bg-yellow-100 text-yellow-800';
      case 'rapat':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && activities.length === 0) {
    return <div>Memuat jurnal kegiatan...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Jurnal Kegiatan Pelatih</h2>
          <p className="text-muted-foreground">
            Catat dan pantau kegiatan ekstrakurikuler
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jurnal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Jurnal Kegiatan</CardTitle>
            <CardDescription>
              Catat kegiatan ekstrakurikuler yang telah dilaksanakan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="log_date">Tanggal Kegiatan</Label>
                  <Input
                    id="log_date"
                    type="date"
                    value={formData.log_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, log_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="extracurricular">Ekstrakurikuler</Label>
                  <Select value={formData.extracurricular_id} onValueChange={(value) => setFormData(prev => ({ ...prev, extracurricular_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ekstrakurikuler" />
                    </SelectTrigger>
                    <SelectContent>
                      {extracurriculars.map((ext) => (
                        <SelectItem key={ext.id} value={ext.id}>
                          {ext.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_topic">Topik Sesi</Label>
                  <Input
                    id="session_topic"
                    value={formData.session_topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, session_topic: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="attendance_count">Jumlah Peserta</Label>
                  <Input
                    id="attendance_count"
                    type="number"
                    min="0"
                    value={formData.attendance_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendance_count: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_description">Deskripsi Kegiatan</Label>
                <Textarea
                  id="session_description"
                  value={formData.session_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materials_used">Materi yang Digunakan</Label>
                <Textarea
                  id="materials_used"
                  value={formData.materials_used}
                  onChange={(e) => setFormData(prev => ({ ...prev, materials_used: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Riwayat Jurnal Kegiatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada jurnal kegiatan yang tercatat
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Ekstrakurikuler</TableHead>
                  <TableHead>Topik Sesi</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Peserta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => {
                  const extracurricular = extracurriculars.find(ext => ext.id === activity.extracurricular_id);
                  return (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(activity.log_date), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {extracurricular?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {activity.session_topic}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {activity.session_description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {activity.attendance_count || 0}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
