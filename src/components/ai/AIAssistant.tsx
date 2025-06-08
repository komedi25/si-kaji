
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Send, Sparkles, User } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { supabase } from '@/integrations/supabase/client';

type AIProvider = 'openai' | 'gemini' | 'openrouter' | 'deepseek';
type AITask = 'analyze_behavior' | 'generate_letter' | 'summarize_case' | 'discipline_recommendation' | 'custom';

export function AIAssistant() {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini');
  const [selectedTask, setSelectedTask] = useState<AITask>('analyze_behavior');
  const [prompt, setPrompt] = useState('');
  const [studentId, setStudentId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [letterType, setLetterType] = useState('');
  const [result, setResult] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  
  const { 
    loading, 
    analyzeStudentBehavior, 
    generateLetter, 
    summarizeCase, 
    getRecommendations,
    processAIRequest 
  } = useAI();

  // Load students for selection
  const loadStudents = async (search: string) => {
    if (search.length < 2) return;
    
    const { data } = await supabase
      .from('students')
      .select('id, full_name, nis')
      .or(`full_name.ilike.%${search}%,nis.ilike.%${search}%`)
      .limit(10);
    
    setStudents(data || []);
  };

  // Load cases for selection
  const loadCases = async () => {
    const { data } = await supabase
      .from('student_cases')
      .select('id, case_number, title, status')
      .order('created_at', { ascending: false })
      .limit(20);
    
    setCases(data || []);
  };

  const providers = [
    { value: 'gemini', label: 'Google Gemini', description: 'Gratis dengan quota' },
    { value: 'openai', label: 'OpenAI GPT', description: 'Powerful dan reliable' },
    { value: 'openrouter', label: 'OpenRouter', description: 'Multiple models' },
    { value: 'deepseek', label: 'DeepSeek', description: 'Cost-effective' }
  ];

  const tasks = [
    { value: 'analyze_behavior', label: 'Analisis Perilaku Siswa', description: 'Analisis pola perilaku dan disiplin' },
    { value: 'generate_letter', label: 'Generate Surat', description: 'Buat draft surat kesiswaan' },
    { value: 'summarize_case', label: 'Ringkas Kasus', description: 'Ringkas laporan kasus siswa' },
    { value: 'discipline_recommendation', label: 'Rekomendasi Disiplin', description: 'Saran tindakan disiplin' },
    { value: 'custom', label: 'Custom Prompt', description: 'Permintaan khusus' }
  ];

  const handleSubmit = async () => {
    if (!prompt.trim() && selectedTask === 'custom') {
      return;
    }

    let aiResult = null;

    try {
      switch (selectedTask) {
        case 'analyze_behavior':
          if (!studentId) {
            alert('Pilih siswa terlebih dahulu');
            return;
          }
          aiResult = await analyzeStudentBehavior(studentId, selectedProvider);
          break;

        case 'generate_letter':
          if (!studentId || !letterType) {
            alert('Pilih siswa dan jenis surat terlebih dahulu');
            return;
          }
          aiResult = await generateLetter(studentId, letterType, selectedProvider);
          break;

        case 'summarize_case':
          if (!caseId) {
            alert('Pilih kasus terlebih dahulu');
            return;
          }
          aiResult = await summarizeCase(caseId, selectedProvider);
          break;

        case 'discipline_recommendation':
          if (!studentId) {
            alert('Pilih siswa terlebih dahulu');
            return;
          }
          aiResult = await getRecommendations(studentId, selectedProvider);
          break;

        case 'custom':
          aiResult = await processAIRequest({
            provider: selectedProvider,
            task: 'custom',
            prompt: prompt
          });
          break;
      }

      if (aiResult) {
        setResult(aiResult.result);
      }
    } catch (error) {
      console.error('AI processing error:', error);
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

          {/* Task-specific inputs */}
          {(selectedTask === 'analyze_behavior' || selectedTask === 'generate_letter' || selectedTask === 'discipline_recommendation') && (
            <div>
              <label className="text-sm font-medium mb-2 block">Pilih Siswa</label>
              <Input
                placeholder="Ketik nama atau NIS siswa..."
                onChange={(e) => loadStudents(e.target.value)}
              />
              {students.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setStudentId(student.id);
                        setStudents([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-xs text-gray-500">NIS: {student.nis}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {studentId && (
                <div className="mt-2">
                  <Badge variant="secondary">
                    Siswa dipilih: {students.find(s => s.id === studentId)?.full_name || 'Loading...'}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {selectedTask === 'generate_letter' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Jenis Surat</label>
              <Select value={letterType} onValueChange={setLetterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis surat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keterangan_berkelakuan_baik">Surat Keterangan Berkelakuan Baik</SelectItem>
                  <SelectItem value="keterangan_siswa_aktif">Surat Keterangan Siswa Aktif</SelectItem>
                  <SelectItem value="rekomendasi">Surat Rekomendasi</SelectItem>
                  <SelectItem value="izin_kegiatan">Surat Izin Kegiatan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedTask === 'summarize_case' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Pilih Kasus</label>
              <Button 
                variant="outline" 
                onClick={loadCases}
                className="mb-2"
              >
                Muat Kasus Terbaru
              </Button>
              {cases.length > 0 && (
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kasus" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        <div>
                          <div className="font-medium">{caseItem.case_number}</div>
                          <div className="text-xs text-gray-500">{caseItem.title}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {selectedTask === 'custom' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Prompt</label>
              <Textarea
                placeholder="Masukkan instruksi khusus untuk AI..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>
          )}

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
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  {result}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
