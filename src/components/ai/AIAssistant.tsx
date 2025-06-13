
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Sparkles, TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export const AIAssistant = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Halo! Saya adalah asisten AI untuk sistem manajemen sekolah. Saya dapat membantu Anda menganalisis data siswa, memberikan rekomendasi, dan menjawab pertanyaan tentang sistem. Bagaimana saya bisa membantu Anda hari ini?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Siswa dengan Poin Disiplin Rendah',
      description: '5 siswa memiliki poin disiplin di bawah 60. Pertimbangkan untuk mengadakan sesi konseling.',
      priority: 'high',
      category: 'Disiplin'
    },
    {
      id: '2',
      title: 'Peningkatan Prestasi Akademik',
      description: 'Kelas 12 IPA menunjukkan peningkatan prestasi 15% bulan ini.',
      priority: 'medium',
      category: 'Akademik'
    },
    {
      id: '3',
      title: 'Kehadiran Ekstrakurikuler',
      description: 'Partisipasi ekstrakurikuler menurun 8% dibanding bulan lalu.',
      priority: 'medium',
      category: 'Ekstrakurikuler'
    }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1500);
  };

  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('poin') || lowerQuestion.includes('disiplin')) {
      return 'Berdasarkan analisis data, sistem poin disiplin menunjukkan bahwa 87% siswa memiliki status "Baik" atau lebih tinggi. Namun, ada 5 siswa yang perlu perhatian khusus dengan poin di bawah 60. Saya merekomendasikan sesi konseling individual untuk siswa-siswa tersebut.';
    }
    
    if (lowerQuestion.includes('prestasi') || lowerQuestion.includes('achievement')) {
      return 'Data prestasi menunjukkan tren positif dengan peningkatan 12% dalam pencapaian akademik bulan ini. Bidang olahraga dan seni menjadi kategori dengan prestasi tertinggi. Saya sarankan untuk mengadakan program mentoring untuk meningkatkan prestasi di bidang sains.';
    }
    
    if (lowerQuestion.includes('absen') || lowerQuestion.includes('kehadiran')) {
      return 'Tingkat kehadiran siswa saat ini 94,2%, sedikit di atas target 94%. Namun, ada pola ketidakhadiran yang meningkat pada hari Senin dan Jumat. Saya merekomendasikan analisis lebih lanjut dan program motivasi kehadiran.';
    }
    
    return 'Terima kasih atas pertanyaan Anda. Saya sedang menganalisis data yang relevan. Untuk hasil yang lebih akurat, Anda bisa memberikan pertanyaan yang lebih spesifik tentang data siswa, prestasi, disiplin, atau kehadiran.';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default:
        return <Users className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Interface */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              AI Assistant Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages */}
              <div className="h-96 overflow-y-auto space-y-3 p-4 border rounded bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm">AI sedang mengetik...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Tanyakan tentang data siswa, analisis, atau rekomendasi..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={loading}
                />
                <Button onClick={handleSendMessage} disabled={loading || !inputMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Rekomendasi AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={getPriorityColor(rec.priority) as any} className="text-xs">
                      {rec.category}
                    </Badge>
                    <Button size="sm" variant="outline" className="text-xs h-6">
                      Terapkan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Analisis Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs"
                onClick={() => setInputMessage('Analisis poin disiplin siswa bulan ini')}
              >
                Analisis Poin Disiplin
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs"
                onClick={() => setInputMessage('Laporan kehadiran siswa')}
              >
                Laporan Kehadiran
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs"
                onClick={() => setInputMessage('Tren prestasi akademik')}
              >
                Tren Prestasi
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-xs"
                onClick={() => setInputMessage('Rekomendasi program konseling')}
              >
                Rekomendasi Konseling
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
