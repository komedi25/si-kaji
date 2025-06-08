
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AIProvider = 'openai' | 'gemini' | 'openrouter' | 'deepseek';
type AITask = 'analyze_behavior' | 'generate_letter' | 'summarize_case' | 'discipline_recommendation' | 'activity_description';

interface AIRequest {
  provider: AIProvider;
  task: AITask;
  prompt: string;
  context?: any;
}

export function AIAssistant() {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [selectedTask, setSelectedTask] = useState<AITask>('analyze_behavior');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const { toast } = useToast();

  const providers = [
    { value: 'openai', label: 'OpenAI GPT', description: 'Powerful dan reliable' },
    { value: 'gemini', label: 'Google Gemini', description: 'Gratis dengan quota' },
    { value: 'openrouter', label: 'OpenRouter', description: 'Multiple models' },
    { value: 'deepseek', label: 'DeepSeek', description: 'Cost-effective' }
  ];

  const tasks = [
    { value: 'analyze_behavior', label: 'Analisis Perilaku Siswa', description: 'Analisis pola perilaku dan disiplin' },
    { value: 'generate_letter', label: 'Generate Surat', description: 'Buat draft surat kesiswaan' },
    { value: 'summarize_case', label: 'Ringkas Kasus', description: 'Ringkas laporan kasus siswa' },
    { value: 'discipline_recommendation', label: 'Rekomendasi Disiplin', description: 'Saran tindakan disiplin' },
    { value: 'activity_description', label: 'Deskripsi Kegiatan', description: 'Generate deskripsi kegiatan siswa' }
  ];

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Mohon masukkan prompt terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = generateMockResult(selectedTask, prompt);
      setResult(mockResult);
      
      toast({
        title: "Sukses",
        description: "AI telah memproses permintaan Anda",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memproses permintaan AI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockResult = (task: AITask, prompt: string): string => {
    switch (task) {
      case 'analyze_behavior':
        return `Berdasarkan analisis data kesiswaan:

**Pola Perilaku:**
- Siswa menunjukkan trend perbaikan dalam kedisiplinan
- Tingkat kehadiran meningkat 15% dalam 3 bulan terakhir
- Partisipasi dalam kegiatan ekstrakurikuler aktif

**Rekomendasi:**
- Lanjutkan pembinaan positif
- Berikan apresiasi atas perbaikan yang dicapai
- Monitor konsistensi perilaku dalam 2 bulan ke depan`;

      case 'generate_letter':
        return `SURAT KETERANGAN SISWA

Nomor: 421.3/SK-SMKN1KDL/VII/2024
Hal: Keterangan Siswa

Yang bertanda tangan di bawah ini:
Nama: [Nama Kepala Sekolah]
Jabatan: Kepala SMK Negeri 1 Kendal

Dengan ini menerangkan bahwa:
Nama: [Nama Siswa]
NIS: [NIS Siswa]
Kelas: [Kelas Siswa]

Adalah benar siswa SMK Negeri 1 Kendal yang aktif dan memiliki catatan perilaku baik.

Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`;

      case 'summarize_case':
        return `**Ringkasan Kasus:**

**Kategori:** Pelanggaran Disiplin Ringan
**Tanggal:** ${new Date().toLocaleDateString('id-ID')}

**Kronologi:**
Siswa terlambat masuk kelas sebanyak 3 kali dalam seminggu.

**Tindak Lanjut:**
1. Pembinaan oleh wali kelas
2. Panggilan orang tua
3. Pembuatan surat pernyataan

**Status:** Dalam pembinaan`;

      default:
        return "Hasil AI akan muncul di sini...";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant Si-Kaji
          </CardTitle>
          <CardDescription>
            Asisten AI untuk membantu analisis data kesiswaan dan pembuatan dokumen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Provider AI</label>
              <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as AIProvider)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Provider AI" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div>
                        <div className="font-medium">{provider.label}</div>
                        <div className="text-xs text-gray-500">{provider.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Tugas</label>
              <Select value={selectedTask} onValueChange={(value) => setSelectedTask(value as AITask)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis Tugas" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.value} value={task.value}>
                      <div>
                        <div className="font-medium">{task.label}</div>
                        <div className="text-xs text-gray-500">{task.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Prompt / Instruksi</label>
            <Textarea
              placeholder="Masukkan instruksi untuk AI..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Jalankan AI
              </>
            )}
          </Button>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4" />
                  Hasil AI
                  <Badge variant="secondary">{providers.find(p => p.value === selectedProvider)?.label}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
