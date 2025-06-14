
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/hooks/useAI';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  FileText, 
  BarChart3,
  Users,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  task_type?: string;
}

export function AIAssistant() {
  const { toast } = useToast();
  const { processAIRequest, loading } = useAI();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Halo! Saya AI Assistant untuk SMK Negeri 1 Kendal. Saya bisa membantu Anda dengan:\n\n• Analisis perilaku siswa\n• Rekomendasi tindakan disiplin\n• Insight dari data presensi dan pelanggaran\n• Saran penanganan kasus siswa\n\nAda yang bisa saya bantu hari ini?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [taskType, setTaskType] = useState('general_inquiry');

  const taskTypes = [
    { value: 'general_inquiry', label: 'Pertanyaan Umum', icon: MessageSquare },
    { value: 'student_analysis', label: 'Analisis Siswa', icon: Users },
    { value: 'discipline_advice', label: 'Saran Disiplin', icon: AlertCircle },
    { value: 'data_insight', label: 'Insight Data', icon: BarChart3 },
    { value: 'case_consultation', label: 'Konsultasi Kasus', icon: FileText },
    { value: 'recommendation', label: 'Rekomendasi', icon: Lightbulb }
  ];

  const getTaskTypeLabel = (type: string) => {
    return taskTypes.find(t => t.value === type)?.label || 'Pertanyaan Umum';
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      task_type: taskType
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Create context-aware prompt based on task type
      let systemPrompt = `Anda adalah AI Assistant untuk SMK Negeri 1 Kendal. Anda membantu staf sekolah dalam manajemen siswa, analisis perilaku, dan pengambilan keputusan akademik.

Konteks tugas: ${getTaskTypeLabel(taskType)}

Berikan jawaban yang:
1. Profesional dan mudah dipahami
2. Relevan dengan konteks pendidikan SMK
3. Actionable dan praktis untuk diterapkan
4. Menggunakan bahasa Indonesia yang formal namun ramah
5. Menyertakan saran konkret jika diminta

Jika ditanya tentang data spesifik yang tidak Anda miliki, sarankan untuk mengecek sistem database sekolah.`;

      const response = await processAIRequest({
        provider: 'gemini', // Default to free provider
        task: taskType,
        prompt: `${systemPrompt}\n\nPertanyaan: ${input}`,
        context: {
          conversation_history: messages.slice(-5), // Last 5 messages for context
          task_type: taskType,
          timestamp: new Date().toISOString()
        }
      });

      if (response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.result,
          timestamp: new Date(),
          task_type: taskType
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response from AI');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, saya mengalami masalah teknis. Silakan coba lagi dalam beberapa saat atau hubungi administrator jika masalah berlanjut.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Gagal mengirim pesan ke AI Assistant",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    {
      text: "Bagaimana cara menangani siswa yang sering terlambat?",
      type: "discipline_advice"
    },
    {
      text: "Analisis trend kehadiran siswa bulan ini",
      type: "data_insight"
    },
    {
      text: "Rekomendasi program pembinaan untuk siswa bermasalah",
      type: "recommendation"
    },
    {
      text: "Cara efektif berkomunikasi dengan orang tua siswa",
      type: "case_consultation"
    }
  ];

  const useQuickPrompt = (prompt: string, type: string) => {
    setInput(prompt);
    setTaskType(type);
  };

  return (
    <div className="space-y-4">
      {/* Task Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <CardDescription>
            Pilih jenis pertanyaan untuk mendapatkan jawaban yang lebih tepat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Jenis Pertanyaan</label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Prompts */}
            <div>
              <label className="text-sm font-medium mb-2 block">Contoh Pertanyaan</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left h-auto p-2 whitespace-normal"
                    onClick={() => useQuickPrompt(prompt.text, prompt.type)}
                  >
                    <div className="text-xs">{prompt.text}</div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card>
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                
                <div className={`flex-1 space-y-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.role === 'user' ? 'Anda' : 'AI Assistant'}
                    </span>
                    {message.task_type && (
                      <Badge variant="outline" className="text-xs">
                        {getTaskTypeLabel(message.task_type)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-lg max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">AI sedang mengetik...</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                AI Assistant menggunakan data umum dan tidak memiliki akses real-time ke database sekolah. 
                Untuk informasi spesifik, silakan cek sistem database langsung.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ketik pertanyaan Anda tentang ${getTaskTypeLabel(taskType).toLowerCase()}...`}
                className="min-h-[80px] resize-none"
                disabled={loading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={loading || !input.trim()}
                className="self-end flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Kirim
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Tekan Shift+Enter untuk baris baru. Enter untuk mengirim.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
