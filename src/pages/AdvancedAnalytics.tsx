
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StudentProgressReport } from '@/components/analytics/StudentProgressReport';
import { PredictiveAnalytics } from '@/components/analytics/PredictiveAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, Users, BarChart3 } from 'lucide-react';

const AdvancedAnalytics = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('predictive');

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
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Advanced Analytics & Insights
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Analisis mendalam dan insights prediktif untuk pengambilan keputusan yang lebih baik
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold">AI</div>
                <div className="text-sm text-muted-foreground">Powered Analytics</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold">Real-time</div>
                <div className="text-sm text-muted-foreground">Data Processing</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">Predictive</div>
                <div className="text-sm text-muted-foreground">Modeling</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold">Interactive</div>
                <div className="text-sm text-muted-foreground">Visualizations</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Predictive Analytics</span>
              <span className="sm:hidden">Predictive</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progress Reports</span>
              <span className="sm:hidden">Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Predictive Analytics & Early Warning
                </CardTitle>
                <CardDescription>
                  Sistem prediksi berbasis AI untuk identifikasi dini siswa yang memerlukan intervensi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PredictiveAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Student Progress Analytics
                </CardTitle>
                <CardDescription>
                  Laporan komprehensif perkembangan akademik dan non-akademik siswa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentProgressReport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdvancedAnalytics;
