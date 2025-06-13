
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
  date: string;
  extracurricular: string;
  activity_type: string;
  description: string;
  participant_count: number;
  notes?: string;
  created_by: string;
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
    date: format(new Date(), 'yyyy-MM-dd'),
    extracurricular_id: '',
    activity_type: '',
    description: '',
    participant_count: 0,
    notes: ''
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

      // Load activity logs
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('created_by', user?.id)
        .order('date', { ascending: false });

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
      const selectedExtracurricular = extracurriculars.find(ext => ext.id === formData.extracurricular_id);
      
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          date: formData.date,
          extracurricular: selectedExtracurricular?.name || '',
          activity_type: formData.activity_type,
          description: formData.description,
          participant_count: formData.participant_count,
          notes: formData.notes,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Jurnal kegiatan berhasil disimpan"
      });

      setShowForm(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        extracurricular_id: '',
        activity_type: '',
        description: '',
        participant_count: 0,
        notes: ''
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
                  <Label htmlFor="date">Tanggal Kegiatan</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                  <Label htmlFor="activity_type">Jenis Kegiatan</Label>
                  <Select value={formData.activity_type} onValueChange={(value) => setFormData(prev => ({ ...prev, activity_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kegiatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latihan">Latihan</SelectItem>
                      <SelectItem value="pertandingan">Pertandingan</SelectItem>
                      <SelectItem value="evaluasi">Evaluasi</SelectItem>
                      <SelectItem value="rapat">Rapat</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="participant_count">Jumlah Peserta</Label>
                  <Input
                    id="participant_count"
                    type="number"
                    min="0"
                    value={formData.participant_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, participant_count: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Kegiatan</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                  <TableHead>Jenis Kegiatan</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Peserta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(activity.date), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {activity.extracurricular}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActivityTypeColor(activity.activity_type)}>
                        {activity.activity_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {activity.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {activity.participant_count}
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
