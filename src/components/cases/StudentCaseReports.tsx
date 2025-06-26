
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  Clock,
  Eye,
  Plus,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const StudentCaseReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [reportForm, setReportForm] = useState({
    category: '',
    title: '',
    description: '',
    incident_location: '',
    incident_date: '',
    witnesses: '',
    is_anonymous: false
  });

  // Get student's case reports
  const { data: studentCases, isLoading } = useQuery({
    queryKey: ['student-cases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_cases')
        .select('*')
        .eq('reported_by', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Submit case report mutation
  const submitCaseMutation = useMutation({
    mutationFn: async (data: typeof reportForm) => {
      const { error } = await supabase
        .from('student_cases')
        .insert({
          category: data.category as any,
          title: data.title,
          description: data.description,
          incident_location: data.incident_location,
          incident_date: data.incident_date || null,
          witnesses: data.witnesses || null,
          reported_by: data.is_anonymous ? null : user?.id,
          is_anonymous: data.is_anonymous,
          status: 'pending',
          priority: 'medium'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Berhasil!",
        description: "Laporan kasus berhasil disubmit. Tim akan segera menindaklanjuti.",
      });
      setReportForm({
        category: '',
        title: '',
        description: '',
        incident_location: '',
        incident_date: '',
        witnesses: '',
        is_anonymous: false
      });
      queryClient.invalidateQueries({ queryKey: ['student-cases'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal mengirim laporan. Silakan coba lagi.",
        variant: "destructive",
      });
      console.error('Error submitting case:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.category || !reportForm.title || !reportForm.description) {
      toast({
        title: "Error",
        description: "Mohon lengkapi form yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }
    submitCaseMutation.mutate(reportForm);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'investigating':
        return <Badge className="bg-yellow-100 text-yellow-800">Sedang Ditangani</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Menunggu</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Tinggi</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Sedang</Badge>;
      case 'low':
        return <Badge variant="secondary">Rendah</Badge>;
      default:
        return <Badge variant="secondary">Sedang</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'bullying': 'Bullying/Perundungan',
      'violence': 'Kekerasan',
      'drugs': 'Penyalahgunaan Narkoba',
      'theft': 'Pencurian',
      'vandalism': 'Vandalisme',
      'other': 'Lainnya'
    };
    return categories[category] || category;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Laporan Kasus</h1>
      </div>

      <Tabs defaultValue="report" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="report">Buat Laporan</TabsTrigger>
          <TabsTrigger value="history">Riwayat Laporan</TabsTrigger>
        </TabsList>

        {/* Form Laporan */}
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Laporkan Kasus/Insiden
              </CardTitle>
              <CardDescription>
                Laporkan kejadian yang memerlukan penanganan dari tim sekolah. 
                Laporan akan ditangani sesuai dengan prosedur yang berlaku.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori Kasus*</Label>
                    <Select
                      value={reportForm.category}
                      onValueChange={(value) => setReportForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bullying">Bullying/Perundungan</SelectItem>
                        <SelectItem value="violence">Kekerasan</SelectItem>
                        <SelectItem value="drugs">Penyalahgunaan Narkoba</SelectItem>
                        <SelectItem value="theft">Pencurian</SelectItem>
                        <SelectItem value="vandalism">Vandalisme</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incident_date">Tanggal Kejadian</Label>
                    <Input
                      id="incident_date"
                      type="date"
                      value={reportForm.incident_date}
                      onChange={(e) => setReportForm(prev => ({ ...prev, incident_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Judul Laporan*</Label>
                  <Input
                    id="title"
                    placeholder="Ringkas kejadian dalam satu kalimat"
                    value={reportForm.title}
                    onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Kejadian*</Label>
                  <Textarea
                    id="description"
                    placeholder="Jelaskan kronologi kejadian secara detail..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incident_location">Lokasi Kejadian</Label>
                    <Input
                      id="incident_location"
                      placeholder="Dimana kejadian terjadi?"
                      value={reportForm.incident_location}
                      onChange={(e) => setReportForm(prev => ({ ...prev, incident_location: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="witnesses">Saksi</Label>
                    <Input
                      id="witnesses"
                      placeholder="Nama saksi (jika ada)"
                      value={reportForm.witnesses}
                      onChange={(e) => setReportForm(prev => ({ ...prev, witnesses: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_anonymous"
                    checked={reportForm.is_anonymous}
                    onChange={(e) => setReportForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_anonymous" className="text-sm">
                    Kirim laporan secara anonim (identitas disembunyikan)
                  </Label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Penting!</p>
                      <p>Laporan akan ditangani oleh tim yang sesuai (TPPK, ARPS, atau P4GN). 
                         Mohon berikan informasi yang akurat dan lengkap.</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitCaseMutation.isPending}
                >
                  {submitCaseMutation.isPending ? (
                    "Mengirim Laporan..."
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Kirim Laporan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Riwayat Laporan */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Riwayat Laporan Anda
              </CardTitle>
              <CardDescription>
                Daftar laporan kasus yang pernah Anda buat dan status penanganannya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : studentCases?.length ? (
                  studentCases.map((caseItem: any) => (
                    <div key={caseItem.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{caseItem.title}</h4>
                            {getStatusBadge(caseItem.status)}
                            {getPriorityBadge(caseItem.priority)}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(caseItem.category)}
                              </Badge>
                              <span className="text-xs">#{caseItem.case_number}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(caseItem.created_at), 'dd MMM yyyy', { locale: id })}
                              </div>
                              {caseItem.incident_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Kejadian: {format(new Date(caseItem.incident_date), 'dd MMM yyyy', { locale: id })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </div>

                      <div className="text-sm text-gray-700 bg-gray-50 rounded p-3">
                        <p className="line-clamp-2">{caseItem.description}</p>
                      </div>

                      {caseItem.incident_location && (
                        <div className="text-xs text-gray-500">
                          <strong>Lokasi:</strong> {caseItem.incident_location}
                        </div>
                      )}

                      {caseItem.resolution_notes && caseItem.status === 'resolved' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-green-800">Penyelesaian:</p>
                              <p className="text-green-700">{caseItem.resolution_notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Belum ada laporan</p>
                    <p className="text-sm">Anda belum pernah membuat laporan kasus</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
