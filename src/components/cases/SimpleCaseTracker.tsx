import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  Eye,
  Calendar,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CaseSearchResult {
  id: string;
  case_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  incident_date: string | null;
  incident_location: string | null;
  resolution_notes: string | null;
  reported_student_name: string | null;
  reported_student_class: string | null;
  students?: {
    id: string;
    nis: string;
    full_name: string;
    classes?: {
      name: string;
      grade: number;
    } | null;
  } | null;
}

export const SimpleCaseTracker = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchResult, setSearchResult] = useState<CaseSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!trackingNumber.trim()) {
      toast({
        title: 'Input Kosong',
        description: 'Masukkan nomor kasus untuk melakukan pencarian',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setNotFound(false);
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from('student_cases')
        .select(`
          *,
          students:reported_student_id (
            id,
            nis,
            full_name,
            classes:class_id (
              name,
              grade
            )
          )
        `)
        .eq('case_number', trackingNumber.trim().toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('Error searching case:', error);
        throw error;
      }

      if (data) {
        console.log('Found case data:', data);
        setSearchResult(data as any);
        setNotFound(false);
      } else {
        setNotFound(true);
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Error searching case:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mencari kasus. Silakan coba lagi.',
        variant: 'destructive',
      });
      setNotFound(true);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock },
      under_review: { label: 'Ditinjau', variant: 'default' as const, icon: Eye },
      investigating: { label: 'Investigasi', variant: 'default' as const, icon: Users },
      escalated: { label: 'Eskalasi', variant: 'destructive' as const, icon: AlertTriangle },
      resolved: { label: 'Selesai', variant: 'outline' as const, icon: CheckCircle },
      closed: { label: 'Ditutup', variant: 'outline' as const, icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Rendah', variant: 'outline' as const },
      medium: { label: 'Sedang', variant: 'secondary' as const },
      high: { label: 'Tinggi', variant: 'default' as const },
      critical: { label: 'Kritis', variant: 'destructive' as const },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      bullying: 'Bullying/Perundungan',
      kekerasan: 'Kekerasan',
      narkoba: 'Narkoba/NAPZA',
      pergaulan_bebas: 'Pergaulan Bebas',
      tawuran: 'Tawuran',
      pencurian: 'Pencurian',
      vandalisme: 'Vandalisme',
      lainnya: 'Lainnya',
    };
    
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      pending: 'Laporan Anda sedang menunggu untuk ditinjau oleh tim terkait.',
      under_review: 'Laporan Anda sedang ditinjau dan dievaluasi oleh tim yang berwenang.',
      investigating: 'Tim sedang melakukan investigasi mendalam terkait laporan Anda.',
      escalated: 'Kasus telah dieskalasi ke tingkat yang lebih tinggi untuk penanganan khusus.',
      resolved: 'Kasus telah selesai ditangani. Terima kasih atas laporan Anda.',
      closed: 'Kasus telah ditutup. Jika ada pertanyaan lebih lanjut, silakan hubungi kami.'
    };
    
    return descriptions[status as keyof typeof descriptions] || 'Status tidak diketahui.';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lacak Status Kasus
          </CardTitle>
          <CardDescription>
            Masukkan nomor kasus untuk melihat status dan informasi detail laporan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Masukkan nomor kasus (contoh: CASE/2024/0001)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isSearching ? 'Mencari...' : 'Cari Kasus'}
            </Button>
          </div>

          {notFound && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nomor kasus "{trackingNumber}" tidak ditemukan. Pastikan nomor kasus sudah benar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {searchResult && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl">{searchResult.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <span>{searchResult.case_number}</span>
                  <span>•</span>
                  <span>{getCategoryLabel(searchResult.category)}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                {getStatusBadge(searchResult.status)}
                {getPriorityBadge(searchResult.priority)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Deskripsi Kasus:</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {searchResult.description}
              </p>
            </div>

            {/* Student Information */}
            {(searchResult.students || searchResult.reported_student_name) && (
              <div>
                <h4 className="font-medium mb-2">Informasi Siswa:</h4>
                <div className="text-sm bg-muted p-3 rounded">
                  {searchResult.students ? (
                    <div className="space-y-1">
                      <p><span className="font-medium">Nama:</span> {searchResult.students.full_name}</p>
                      <p><span className="font-medium">NIS:</span> {searchResult.students.nis}</p>
                      {searchResult.students.classes && (
                        <p><span className="font-medium">Kelas:</span> {searchResult.students.classes.grade} {searchResult.students.classes.name}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p><span className="font-medium">Nama:</span> {searchResult.reported_student_name}</p>
                      {searchResult.reported_student_class && (
                        <p><span className="font-medium">Kelas:</span> {searchResult.reported_student_class}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Dilaporkan: {format(new Date(searchResult.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Update Terakhir: {format(new Date(searchResult.updated_at), 'dd MMMM yyyy HH:mm', { locale: id })}</span>
              </div>

              {searchResult.incident_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Tanggal Kejadian: {format(new Date(searchResult.incident_date), 'dd MMMM yyyy', { locale: id })}</span>
                </div>
              )}

              {searchResult.incident_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Lokasi: {searchResult.incident_location}</span>
                </div>
              )}
            </div>

            {searchResult.resolution_notes && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Catatan Penyelesaian:</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {searchResult.resolution_notes}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Status Saat Ini:</h4>
              <p className="text-sm text-blue-800">
                {getStatusDescription(searchResult.status)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};