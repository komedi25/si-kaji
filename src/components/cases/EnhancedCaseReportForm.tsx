
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, FileText, Send, CheckCircle, Upload, X, Eye, EyeOff, Shield, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const caseReportSchema = z.object({
  title: z.string().min(5, 'Judul laporan minimal 5 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter'),
  category: z.enum(['bullying', 'kekerasan', 'narkoba', 'pergaulan_bebas', 'tawuran', 'pencurian', 'vandalisme', 'lainnya']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  is_anonymous: z.boolean().default(false),
  reporter_name: z.string().optional(),
  reporter_contact: z.string().optional(),
  reported_student_name: z.string().optional(),
  reported_student_class: z.string().optional(),
  incident_date: z.string().optional(),
  incident_time: z.string().optional(),
  incident_location: z.string().optional(),
  witnesses: z.string().optional(),
  immediate_action_needed: z.boolean().default(false),
  evidence_description: z.string().optional(),
});

type CaseReportFormData = z.infer<typeof caseReportSchema>;

interface FileUpload {
  id: string;
  file: File;
  preview?: string;
  uploaded?: boolean;
}

export const EnhancedCaseReportForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCaseNumber, setSubmittedCaseNumber] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [showSensitiveWarning, setShowSensitiveWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CaseReportFormData>({
    resolver: zodResolver(caseReportSchema),
    defaultValues: {
      priority: 'medium',
      is_anonymous: false,
      immediate_action_needed: false,
    },
  });

  const watchIsAnonymous = form.watch('is_anonymous');
  const watchCategory = form.watch('category');
  const watchPriority = form.watch('priority');
  const watchImmediateAction = form.watch('immediate_action_needed');

  // Auto-adjust priority based on category
  React.useEffect(() => {
    if (watchCategory === 'narkoba' || watchCategory === 'kekerasan') {
      form.setValue('priority', 'high');
    } else if (watchCategory === 'bullying') {
      form.setValue('priority', 'medium');
    }
  }, [watchCategory, form]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File terlalu besar",
          description: `File ${file.name} melebihi batas 10MB`,
          variant: "destructive"
        });
        return;
      }

      const fileUpload: FileUpload = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        uploaded: false
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileUpload.id ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      setUploadedFiles(prev => [...prev, fileUpload]);
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    const uploadPromises = uploadedFiles.map(async (fileUpload) => {
      if (fileUpload.uploaded) return fileUpload;

      const fileName = `evidence/${Date.now()}-${fileUpload.file.name}`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(fileName, fileUpload.file);

      if (error) throw error;

      return { ...fileUpload, uploaded: true, url: fileName };
    });

    return Promise.all(uploadPromises);
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return form.getValues('title') && form.getValues('category') && form.getValues('description');
      case 2:
        return watchIsAnonymous || (form.getValues('reporter_name') && form.getValues('reporter_contact'));
      case 3:
        return true; // Optional step
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Lengkapi informasi",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const onSubmit = async (data: CaseReportFormData) => {
    setIsSubmitting(true);
    
    try {
      // Upload files first
      let evidenceUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        const uploadedFileData = await uploadFiles();
        evidenceUrls = uploadedFileData
          .filter(f => f.uploaded && 'url' in f)
          .map(f => (f as any).url);
      }

      // Determine handler based on category
      let assigned_handler = null;
      if (data.category === 'narkoba') {
        assigned_handler = 'p4gn';
      } else if (data.category === 'kekerasan' || data.category === 'bullying') {
        assigned_handler = 'tppk';
      }

      // Prepare the case data
      const caseData = {
        case_number: '',
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.immediate_action_needed ? 'critical' : data.priority,
        is_anonymous: data.is_anonymous,
        reporter_name: data.is_anonymous ? null : data.reporter_name,
        reporter_contact: data.is_anonymous ? null : data.reporter_contact,
        reported_student_name: data.reported_student_name || null,
        reported_student_class: data.reported_student_class || null,
        incident_date: data.incident_date ? new Date(data.incident_date + 'T' + (data.incident_time || '00:00')).toISOString().split('T')[0] : null,
        incident_location: data.incident_location || null,
        witnesses: data.witnesses || null,
        evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
        reported_by: user?.id || null,
        status: data.immediate_action_needed ? 'urgent' : 'pending',
        assigned_handler,
      };

      const { data: insertedCase, error } = await supabase
        .from('student_cases')
        .insert(caseData)
        .select('case_number')
        .single();

      if (error) throw error;

      setSubmittedCaseNumber(insertedCase.case_number);
      
      toast({
        title: 'Laporan Berhasil Dikirim',
        description: `Nomor tiket: ${insertedCase.case_number}. ${data.immediate_action_needed ? 'Tim akan segera menangani kasus ini.' : 'Laporan akan ditinjau dalam 1x24 jam.'}`,
      });

      form.reset();
      setUploadedFiles([]);
      setCurrentStep(1);
      
    } catch (error: any) {
      console.error('Error submitting case report:', error);
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
      bullying: { label: 'Bullying/Perundungan', color: 'bg-orange-100 text-orange-800', handler: 'TPPK' },
      kekerasan: { label: 'Kekerasan', color: 'bg-red-100 text-red-800', handler: 'TPPK' },
      narkoba: { label: 'Narkoba/NAPZA', color: 'bg-purple-100 text-purple-800', handler: 'P4GN' },
      pergaulan_bebas: { label: 'Pergaulan Bebas', color: 'bg-pink-100 text-pink-800', handler: 'ARPS/TPPK' },
      tawuran: { label: 'Tawuran', color: 'bg-red-100 text-red-800', handler: 'TPPK' },
      pencurian: { label: 'Pencurian', color: 'bg-yellow-100 text-yellow-800', handler: 'TPPK' },
      vandalisme: { label: 'Vandalisme', color: 'bg-gray-100 text-gray-800', handler: 'TPPK' },
      lainnya: { label: 'Lainnya', color: 'bg-blue-100 text-blue-800', handler: 'TPPK' },
    };
    return categoryInfo[category as keyof typeof categoryInfo] || categoryInfo.lainnya;
  };

  const getPriorityBadge = (level: string) => {
    const badges = {
      'low': <Badge className="bg-blue-100 text-blue-800">Rendah</Badge>,
      'medium': <Badge className="bg-green-100 text-green-800">Sedang</Badge>,
      'high': <Badge className="bg-yellow-100 text-yellow-800">Tinggi</Badge>,
      'critical': <Badge className="bg-red-100 text-red-800">Kritis</Badge>
    };
    return badges[level as keyof typeof badges];
  };

  if (submittedCaseNumber) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-700">Laporan Berhasil Dikirim</CardTitle>
          <CardDescription>
            Laporan Anda telah berhasil dikirim dan akan segera ditangani oleh tim terkait
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Nomor Tiket: {submittedCaseNumber}</strong>
              <br />
              Simpan nomor tiket ini untuk melacak status laporan Anda
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => setSubmittedCaseNumber(null)} variant="outline">
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
          <AlertCircle className="h-5 w-5" />
          Form Pelaporan Kasus - Langkah {currentStep} dari 4
        </CardTitle>
        <CardDescription>
          Laporkan kasus atau masalah yang terjadi dengan sistem yang aman dan terpercaya
        </CardDescription>
        <Progress value={(currentStep / 4) * 100} className="w-full" />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informasi Dasar Kasus</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori Kasus *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
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
                        {watchCategory && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getCategoryInfo(watchCategory).color}>
                              {getCategoryInfo(watchCategory).label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              → Akan ditangani oleh: {getCategoryInfo(watchCategory).handler}
                            </span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tingkat Prioritas *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih prioritas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Rendah - Tidak mendesak</SelectItem>
                            <SelectItem value="medium">Sedang - Perlu perhatian</SelectItem>
                            <SelectItem value="high">Tinggi - Perlu tindakan segera</SelectItem>
                            <SelectItem value="critical">Kritis - Darurat</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="mt-2">
                          {getPriorityBadge(watchPriority)}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Laporan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ringkasan singkat tentang kasus yang dilaporkan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Kasus *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Jelaskan kronologi kejadian secara detail..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Berikan informasi selengkap mungkin tentang kejadian yang dilaporkan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="immediate_action_needed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Membutuhkan Tindakan Segera
                        </FormLabel>
                        <FormDescription>
                          Centang jika kasus ini memerlukan penanganan darurat (dalam 1-2 jam)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Reporter Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Identitas Pelapor</h3>
                
                <FormField
                  control={form.control}
                  name="is_anonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) setShowSensitiveWarning(true);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          {watchIsAnonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          Laporan Anonim
                        </FormLabel>
                        <FormDescription>
                          Centang jika Anda ingin melaporkan secara anonim. Identitas akan dirahasiakan sepenuhnya.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {showSensitiveWarning && watchIsAnonymous && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Laporan Anonim Aktif:</strong> Identitas Anda akan sepenuhnya dirahasiakan. 
                      Tim penanganan tidak akan dapat menghubungi Anda untuk klarifikasi tambahan.
                    </AlertDescription>
                  </Alert>
                )}

                {!watchIsAnonymous && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reporter_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pelapor *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap pelapor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reporter_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kontak Pelapor *</FormLabel>
                          <FormControl>
                            <Input placeholder="Email atau nomor telepon" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Incident Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Detail Kejadian</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reported_student_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Siswa Terlibat</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama siswa yang terlibat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reported_student_class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelas Siswa</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: X TKJ 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incident_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Kejadian</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incident_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waktu Kejadian</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="incident_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi Kejadian</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Ruang kelas XII TKJ 1, kantin, lapangan, dll" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="witnesses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saksi/Informasi Tambahan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nama saksi atau informasi tambahan yang relevan..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Evidence Upload */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bukti Pendukung (Opsional)</h3>
                
                <FormField
                  control={form.control}
                  name="evidence_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Bukti</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Jelaskan bukti yang Anda miliki..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload File Bukti
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Foto, PDF, atau dokumen. Maksimal 10MB per file
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">File yang diunggah:</h4>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {file.preview && (
                            <img src={file.preview} alt="Preview" className="h-8 w-8 object-cover rounded" />
                          )}
                          <span className="text-sm">{file.file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Review */}
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Review Final:</strong> Pastikan semua informasi sudah benar sebelum mengirim laporan.
                    {watchImmediateAction && (
                      <div className="mt-2 text-red-600 font-medium">
                        ⚠️ Laporan ini akan ditangani sebagai DARURAT
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Sebelumnya
                  </Button>
                )}
              </div>
              
              <div>
                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    Selanjutnya
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                    {isSubmitting ? (
                      'Mengirim...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Kirim Laporan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
