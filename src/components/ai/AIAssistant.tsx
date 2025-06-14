
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/hooks/useAI';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RefreshCw,
  Copy,
  Download,
  Settings
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  task?: string;
  provider?: string;
  tokens?: number;
}

interface AITaskOption {
  value: string;
  label: string;
  description: string;
}

const AI_TASKS: AITaskOption[] = [
  {
    value: 'general_inquiry',
    label: 'Pertanyaan Umum',
    description: 'Bertanya tentang sistem, kebijakan, atau prosedur sekolah'
  },
  {
    value: 'student_analysis',
    label: 'Analisis Siswa', 
    description: 'Analisis perilaku, prestasi, atau perkembangan siswa'
  },
  {
    value: 'discipline_advice',
    label: 'Saran Disiplin',
    description: 'Mendapatkan saran tindakan disiplin yang tepat'
  },
  {
    value: 'data_insight',
    label: 'Insight Data',
    description: 'Analisis data dan trend dalam sistem kesiswaan'
  },
  {
    value: 'case_consultation',
    label: 'Konsultasi Kasus',
    description: 'Diskusi tentang penanganan kasus siswa'
  },
  {
    value: 'recommendation',
    label: 'Rekomendasi',
    description: 'Mendapatkan rekomendasi untuk berbagai situasi'
  }
];

export function AIAssistant() {
  const { toast } = useToast();
  const { processAIRequest, loading: aiLoading } = useAI();
  const { preferences } = useAIPreferences();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTask, setSelectedTask] = useState('general_inquiry');
  const [selectedProvider, setSelectedProvider] = useState(preferences.preferred_provider);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setSelectedProvider(preferences.preferred_provider);
  }, [preferences.preferred_provider]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || aiLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      task: selectedTask
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const aiResponse = await processAIRequest({
        provider: selectedProvider as any,
        task: selectedTask,
        prompt: inputMessage,
        context: {
          conversation_history: messages.slice(-5), // Last 5 messages for context
          task_type: selectedTask
        }
      });

      if (aiResponse) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.result,
          timestamp: new Date(),
          provider: selectedProvider,
          tokens: aiResponse.usage.tokens
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan ke AI",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Berhasil",
      description: "Riwayat chat telah dihapus"
    });
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Berhasil",
        description: "Pesan berhasil disalin"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyalin pesan",
        variant: "destructive"
      });
    }
  };

  const exportChat = () => {
    const chatText = messages.map(msg => 
      `[${msg.timestamp.toLocaleString('id-ID')}] ${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Berhasil",
      description: "Chat berhasil diekspor"
    });
  };

  const getTaskInfo = (taskValue: string) => {
    return AI_TASKS.find(task => task.value === taskValue);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Assistant
          </h3>
          <p className="text-sm text-muted-foreground">
            Chat dengan AI untuk mendapatkan bantuan dan insight
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportChat} disabled={messages.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={clearChat} disabled={messages.length === 0}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Konfigurasi Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Jenis Tugas</label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_TASKS.map(task => (
                    <SelectItem key={task.value} value={task.value}>
                      <div>
                        <div className="font-medium">{task.label}</div>
                        <div className="text-xs text-muted-foreground">{task.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">AI Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI GPT</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTask && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>{getTaskInfo(selectedTask)?.label}:</strong> {getTaskInfo(selectedTask)?.description}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="min-h-96">
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Mulai percakapan dengan AI Assistant</p>
                <p className="text-sm">Pilih jenis tugas dan ajukan pertanyaan Anda</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-4xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-full p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{message.timestamp.toLocaleTimeString('id-ID')}</span>
                        {message.task && (
                          <Badge variant="outline" className="text-xs">
                            {getTaskInfo(message.task)?.label}
                          </Badge>
                        )}
                        {message.provider && (
                          <Badge variant="secondary" className="text-xs">
                            {message.provider}
                          </Badge>
                        )}
                        {message.tokens && (
                          <span>{message.tokens} tokens</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan Anda di sini... (Enter untuk kirim, Shift+Enter untuk baris baru)"
              className="min-h-12 max-h-32 resize-none"
              disabled={aiLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || aiLoading}
              className="px-4"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
