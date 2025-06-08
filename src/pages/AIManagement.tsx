
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Brain, FileText, TrendingUp, Users, MessageSquare } from 'lucide-react';

export default function AIManagement() {
  const [usageStats] = useState({
    totalRequests: 1247,
    thisMonth: 89,
    remainingQuota: 75,
    topFeature: 'Analisis Perilaku'
  });

  const recentActivities = [
    {
      id: 1,
      type: 'analyze_behavior',
      title: 'Analisis perilaku siswa kelas XII RPL 1',
      timestamp: '2 jam yang lalu',
      status: 'completed'
    },
    {
      id: 2,
      type: 'generate_letter',
      title: 'Generate surat keterangan berkelakuan baik',
      timestamp: '5 jam yang lalu',
      status: 'completed'
    },
    {
      id: 3,
      type: 'summarize_case',
      title: 'Ringkasan kasus pelanggaran disiplin',
      timestamp: '1 hari yang lalu',
      status: 'completed'
    }
  ];

  const aiFeatures = [
    {
      icon: Users,
      title: 'Analisis Perilaku Siswa',
      description: 'Analisis pola perilaku dan kedisiplinan siswa berdasarkan data historis',
      usage: 245,
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      title: 'Generator Surat',
      description: 'Otomatis generate berbagai jenis surat kesiswaan',
      usage: 189,
      color: 'bg-green-500'
    },
    {
      icon: Brain,
      title: 'Rekomendasi Tindakan',
      description: 'Saran tindakan pembinaan berdasarkan analisis AI',
      usage: 156,
      color: 'bg-purple-500'
    },
    {
      icon: MessageSquare,
      title: 'Chatbot Bantuan',
      description: 'Asisten virtual untuk pertanyaan seputar kesiswaan',
      usage: 98,
      color: 'bg-orange-500'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Management</h1>
            <p className="text-gray-600">Kelola dan gunakan fitur AI untuk kesiswaan</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Bot className="h-4 w-4 mr-1" />
            AI Enabled
          </Badge>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Sejak implementasi</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{usageStats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">Request AI</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quota Tersisa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{usageStats.remainingQuota}%</div>
              <Progress value={usageStats.remainingQuota} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fitur Terpopuler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{usageStats.topFeature}</div>
              <p className="text-xs text-muted-foreground">Paling sering digunakan</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assistant" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
            <TabsTrigger value="features">Fitur AI</TabsTrigger>
            <TabsTrigger value="activity">Aktivitas Terkini</TabsTrigger>
          </TabsList>

          <TabsContent value="assistant">
            <AIAssistant />
          </TabsContent>

          <TabsContent value="features">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${feature.color}`}>
                        <feature.icon className="h-4 w-4 text-white" />
                      </div>
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Penggunaan:</span>
                      <Badge variant="outline">{feature.usage} kali</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas AI Terkini</CardTitle>
                <CardDescription>Riwayat penggunaan AI dalam sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        {activity.status === 'completed' ? 'Selesai' : 'Proses'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
