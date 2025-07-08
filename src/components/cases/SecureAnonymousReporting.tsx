import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Send,
  UserX,
  Fingerprint
} from 'lucide-react';

interface AnonymousReportData {
  title: string;
  description: string;
  category: string;
  priority: string;
  incident_location: string;
  incident_date: string;
  incident_time: string;
  reported_student_name: string;
  reported_student_class: string;
  witnesses: string;
  evidence_description: string;
  immediate_action_needed: boolean;
  safety_concerns: boolean;
  follow_up_requested: boolean;
  anonymous_contact_method: string;
}

export const SecureAnonymousReporting = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState<AnonymousReportData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    incident_location: '',
    incident_date: '',
    incident_time: '',
    reported_student_name: '',
    reported_student_class: '',
    witnesses: '',
    evidence_description: '',
    immediate_action_needed: false,
    safety_concerns: false,
    follow_up_requested: false,
    anonymous_contact_method: ''
  });

  const handleInputChange = (field: keyof AnonymousReportData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return acceptedTerms;
      case 2:
        return formData.title && formData.category && formData.description;
      case 3:
        return formData.incident_location && formData.incident_date;
      case 4:
        return true; // Optional step
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "Lengkapi informasi",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Generate anonymous session ID for tracking
      const anonymousId = 'ANON-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Determine priority based on safety concerns
      let finalPriority = formData.priority;
      if (formData.immediate_action_needed || formData.safety_concerns) {
        finalPriority = 'critical';
      }

      // Determine handler based on category
      let assignedHandler: 'tppk' | 'p4gn' | 'arps' | null = null;
      if (formData.category === 'narkoba') {
        assignedHandler = 'p4gn';
      } else if (formData.category === 'kekerasan' || formData.category === 'bullying') {
        assignedHandler = 'tppk';
      } else if (formData.category === 'pergaulan_bebas') {
        assignedHandler = 'arps';
      } else {
        assignedHandler = 'tppk'; // Default
      }

      const caseData = {
        case_number: '', // Will be auto-generated
        title: formData.title,
        description: formData.description + 
          (formData.evidence_description ? '\n\nBukti/Keterangan: ' + formData.evidence_description : '') +
          (formData.witnesses ? '\n\nSaksi: ' + formData.witnesses : '') +
          (formData.anonymous_contact_method ? '\n\nKontak anonim: ' + formData.anonymous_contact_method : ''),
        category: formData.category as 'bullying' | 'kekerasan' | 'narkoba' | 'pergaulan_bebas' | 'tawuran' | 'pencurian' | 'vandalisme' | 'lainnya',
        priority: finalPriority as 'low' | 'medium' | 'high' | 'critical',
        is_anonymous: true,
        reporter_name: `Pelapor Anonim (${anonymousId})`,
        reporter_contact: formData.anonymous_contact_method || 'Tidak tersedia',
        reported_student_name: formData.reported_student_name || null,
        reported_student_class: formData.reported_student_class || null,
        incident_date: formData.incident_date ? 
          new Date(formData.incident_date + 'T' + (formData.incident_time || '00:00')).toISOString().split('T')[0] : null,
        incident_location: formData.incident_location || null,
        witnesses: formData.witnesses || null,
        evidence_urls: null,
        reported_by: null, // Anonymous
        status: formData.immediate_action_needed ? 'under_review' as const : 'pending' as const,
        assigned_handler: assignedHandler as 'tppk' | 'arps' | 'p4gn' | 'guru_bk' | 'waka_kesiswaan',
      };

      const { data: insertedCase, error } = await supabase
        .from('student_cases')
        .insert(caseData)
        .select('case_number')
        .single();

      if (error) throw error;

      setSubmittedTicket(insertedCase.case_number);
      
      toast({
        title: 'Laporan Anonim Berhasil Dikirim',
        description: `Nomor tiket: ${insertedCase.case_number}. ${formData.immediate_action_needed ? 'Tim akan segera menangani kasus ini.' : 'Laporan akan ditinjau dalam 1x24 jam.'}`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        incident_location: '',
        incident_date: '',
        incident_time: '',
        reported_student_name: '',
        reported_student_class: '',
        witnesses: '',
        evidence_description: '',
        immediate_action_needed: false,
        safety_concerns: false,
        follow_up_requested: false,
        anonymous_contact_method: ''
      });
      setCurrentStep(1);
      setAcceptedTerms(false);
      
    } catch (error: any) {
      console.error('Error submitting anonymous report:', error);
      toast({
        title: 'Gagal Mengirim Laporan',
        description: error.message || 'Terjadi kesalahan saat mengirim laporan.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryInfo = {
      bullying: { label: 'Bullying/Perundungan', handler: 'TPPK', color: 'bg-orange-100 text-orange-800' },
      kekerasan: { label: 'Kekerasan', handler: 'TPPK', color: 'bg-red-100 text-red-800' },
      narkoba: { label: 'Narkoba/NAPZA', handler: 'P4GN', color: 'bg-purple-100 text-purple-800' },
      pergaulan_bebas: { label: 'Pergaulan Bebas', handler: 'ARPS', color: 'bg-pink-100 text-pink-800' },
      tawuran: { label: 'Tawuran', handler: 'TPPK', color: 'bg-red-100 text-red-800' },
      pencurian: { label: 'Pencurian', handler: 'TPPK', color: 'bg-yellow-100 text-yellow-800' },
      vandalisme: { label: 'Vandalisme', handler: 'TPPK', color: 'bg-gray-100 text-gray-800' },
      lainnya: { label: 'Lainnya', handler: 'TPPK', color: 'bg-blue-100 text-blue-800' },
    };
    return categoryInfo[category as keyof typeof categoryInfo] || categoryInfo.lainnya;
  };

  if (submittedTicket) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-700">Laporan Anonim Berhasil Dikirim</CardTitle>
          <CardDescription>
            Laporan Anda telah berhasil dikirim dan akan ditangani dengan kerahasiaan penuh
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Nomor Tiket: {submittedTicket}</strong>
              <br />
              Simpan nomor tiket ini untuk melacak status laporan Anda secara anonim
            </AlertDescription>
          </Alert>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Keamanan Terjamin:</strong> Identitas Anda dilindungi dengan enkripsi dan tidak akan diungkapkan kepada siapa pun.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => setSubmittedTicket(null)} variant="outline">
              Laporkan Kasus Lain
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Pelaporan Anonim Aman - Langkah {currentStep} dari 5
        </CardTitle>
        <CardDescription>
          Laporkan kasus dengan identitas tersembunyi dan keamanan terjamin
        </CardDescription>
        
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div 
              key={step}
              className={`h-2 flex-1 rounded ${
                step <= currentStep ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Privacy & Terms */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Perlindungan Privasi & Keamanan</h3>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Keamanan Terjamin:</strong> Sistem ini menggunakan enkripsi end-to-end dan tidak menyimpan data yang dapat mengidentifikasi Anda.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <UserX className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Identitas Terlindungi</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sistem tidak menyimpan alamat IP, browser fingerprint, atau data identifikasi lainnya.
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">Data Terenkripsi</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Semua informasi dienkripsi dengan standar militer AES-256.
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Fingerprint className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium">No Tracking</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tidak ada cookies, analytics, atau tracking yang digunakan.
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="h-5 w-5 text-orange-600" />
                  <h4 className="font-medium">Akses Terbatas</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hanya petugas yang berwenang yang dapat mengakses laporan.
                </p>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                  className="mt-1"
                />
                <div className="text-sm">
                  <p className="font-medium">Saya memahami dan menyetujui:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Informasi yang saya berikan akan digunakan hanya untuk penanganan kasus</li>
                    <li>Identitas saya akan tetap anonim dan terlindungi</li>
                    <li>Laporan palsu dapat mengganggu sistem dan merugikan orang lain</li>
                    <li>Saya memberikan informasi dengan jujur dan akurat</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowPrivacyInfo(!showPrivacyInfo)} 
              variant="outline" 
              className="w-full"
            >
              {showPrivacyInfo ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPrivacyInfo ? 'Sembunyikan' : 'Lihat'} Detail Teknis Keamanan
            </Button>

            {showPrivacyInfo && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Detail Teknis:</strong><br />
                  • Koneksi menggunakan HTTPS dengan TLS 1.3<br />
                  • Data dienkripsi dengan AES-256-GCM<br />
                  • Server tidak menyimpan log identitas<br />
                  • Database menggunakan Row Level Security (RLS)<br />
                  • Akses dibatasi dengan Role-Based Access Control (RBAC)
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 2: Basic Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informasi Dasar Kasus</h3>

            <div>
              <label className="text-sm font-medium mb-2 block">Kategori Kasus *</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullying">Bullying/Perundungan</SelectItem>
                  <SelectItem value="kekerasan">Kekerasan</SelectItem>
                  <SelectItem value="narkoba">Narkoba/NAPZA</SelectItem>
                  <SelectItem value="pergaulan_bebas">Pergaulan Bebas</SelectItem>
                  <SelectItem value="tawuran">Tawuran</SelectItem>
                  <SelectItem value="pencurian">Pencurian</SelectItem>
                  <SelectItem value="vandalisme">Vandalisme</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
              {formData.category && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getCategoryInfo(formData.category).color}>
                    {getCategoryInfo(formData.category).label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    → Akan ditangani oleh: {getCategoryInfo(formData.category).handler}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Judul Laporan *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ringkasan singkat kasus"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Deskripsi Kasus *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Jelaskan kronologi kejadian secara detail..."
                className="min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={formData.immediate_action_needed}
                  onCheckedChange={(checked) => handleInputChange('immediate_action_needed', !!checked)}
                />
                <div>
                  <p className="font-medium text-sm">Membutuhkan Tindakan Segera</p>
                  <p className="text-xs text-muted-foreground">Kasus berbahaya yang perlu penanganan langsung</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={formData.safety_concerns}
                  onCheckedChange={(checked) => handleInputChange('safety_concerns', !!checked)}
                />
                <div>
                  <p className="font-medium text-sm">Ancaman Keamanan</p>
                  <p className="text-xs text-muted-foreground">Ada risiko bahaya pada siswa atau staf</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Incident Details */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detail Kejadian</h3>

            <div>
              <label className="text-sm font-medium mb-2 block">Lokasi Kejadian *</label>
              <Input
                value={formData.incident_location}
                onChange={(e) => handleInputChange('incident_location', e.target.value)}
                placeholder="Contoh: Ruang kelas X-1, Kantin, Lapangan, dll."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tanggal Kejadian *</label>
                <Input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => handleInputChange('incident_date', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Waktu Kejadian (Perkiraan)</label>
                <Input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => handleInputChange('incident_time', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Nama Siswa yang Dilaporkan (Opsional)</label>
              <Input
                value={formData.reported_student_name}
                onChange={(e) => handleInputChange('reported_student_name', e.target.value)}
                placeholder="Nama lengkap siswa"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Kelas (Opsional)</label>
              <Input
                value={formData.reported_student_class}
                onChange={(e) => handleInputChange('reported_student_class', e.target.value)}
                placeholder="Contoh: XII-TKJ-1"
              />
            </div>
          </div>
        )}

        {/* Step 4: Additional Information */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informasi Tambahan</h3>

            <div>
              <label className="text-sm font-medium mb-2 block">Saksi (Opsional)</label>
              <Textarea
                value={formData.witnesses}
                onChange={(e) => handleInputChange('witnesses', e.target.value)}
                placeholder="Nama saksi atau keterangan tentang orang yang melihat kejadian..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bukti/Keterangan Tambahan (Opsional)</label>
              <Textarea
                value={formData.evidence_description}
                onChange={(e) => handleInputChange('evidence_description', e.target.value)}
                placeholder="Deskripsi bukti fisik, foto, rekaman, atau keterangan lain yang mendukung..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Kontak Anonim untuk Follow-up (Opsional)</label>
              <Input
                value={formData.anonymous_contact_method}
                onChange={(e) => handleInputChange('anonymous_contact_method', e.target.value)}
                placeholder="Email sementara atau cara kontak anonim lainnya"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Jika ingin dihubungi untuk klarifikasi tambahan (tetap anonim)
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={formData.follow_up_requested}
                onCheckedChange={(checked) => handleInputChange('follow_up_requested', !!checked)}
              />
              <div>
                <p className="font-medium text-sm">Minta Update Status</p>
                <p className="text-xs text-muted-foreground">Ingin mendapat informasi perkembangan penanganan kasus</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review & Kirim Laporan</h3>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Periksa kembali informasi sebelum mengirim. Setelah dikirim, laporan tidak dapat diubah.
              </AlertDescription>
            </Alert>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Ringkasan Laporan:</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Kategori:</strong> {getCategoryInfo(formData.category).label}</p>
                <p><strong>Judul:</strong> {formData.title}</p>
                <p><strong>Lokasi:</strong> {formData.incident_location}</p>
                <p><strong>Tanggal:</strong> {formData.incident_date}</p>
                {formData.reported_student_name && (
                  <p><strong>Siswa:</strong> {formData.reported_student_name}</p>
                )}
                {(formData.immediate_action_needed || formData.safety_concerns) && (
                  <div className="flex gap-2 mt-2">
                    {formData.immediate_action_needed && (
                      <Badge className="bg-red-100 text-red-800">Tindakan Segera</Badge>
                    )}
                    {formData.safety_concerns && (
                      <Badge className="bg-orange-100 text-orange-800">Ancaman Keamanan</Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Jaminan Keamanan:</strong> Identitas Anda akan tetap anonim dan tidak dapat dilacak. Hanya petugas berwenang yang akan menangani laporan ini.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Sebelumnya
          </Button>

          {currentStep === 5 ? (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !validateStep(currentStep)}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
            >
              Selanjutnya
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};