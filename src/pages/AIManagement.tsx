
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIRecommendations } from '@/components/ai/AIRecommendations';
import { AIConfiguration } from '@/components/ai/AIConfiguration';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { APIKeyManager } from '@/components/ai/APIKeyManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AIManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('recommendations');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">AI Assistant & Analytics</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Sistem AI untuk analisis otomatis, rekomendasi, dan bantuan cerdas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recommendations">Rekomendasi AI</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
            <TabsTrigger value="configuration">Konfigurasi</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <AIRecommendations />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-4">
            <AIAssistant />
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <AIConfiguration />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-4">
            <APIKeyManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AIManagement;
