import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Download, Clock, CheckCircle, 
  AlertCircle, FileCheck, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LetterGenerationItem {
  id: string;
  letter_request_id: string;
  template_id: string;
  status: string;
  pdf_url: string | null;
  generation_data: any;
  error_message: string | null;
  generated_at: string | null;
  created_at: string;
  letter_requests?: {
    request_number: string;
    letter_type: string;
    purpose: string;
    students?: {
      full_name: string;
      nis: string;
    };
  };
  letter_templates?: {
    template_name: string;
  };
}

export const AutoPDFGenerator = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [generationQueue, setGenerationQueue] = useState<LetterGenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchGenerationQueue();
      
      // Set up polling for real-time updates
      const interval = setInterval(fetchGenerationQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchGenerationQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('letter_generation_queue')
        .select(`
          *,
          letter_requests:letter_request_id (
            request_number,
            letter_type,
            purpose,
            students:student_id (
              full_name,
              nis
            )
          ),
          letter_templates:template_id (
            template_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setGenerationQueue(data || []);
    } catch (error) {
      console.error('Error fetching generation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const regeneratePDF = async (queueId: string) => {
    setProcessing(true);
    try {
      // Update status to queued for regeneration
      const { error } = await supabase
        .from('letter_generation_queue')
        .update({ 
          status: 'queued', 
          error_message: null,
          generated_at: null
        })
        .eq('id', queueId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "PDF telah diqueue ulang untuk regenerasi"
      });

      fetchGenerationQueue();
    } catch (error) {
      console.error('Error regenerating PDF:', error);
      toast({
        title: "Error",
        description: "Gagal mequeue ulang PDF",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const processQueue = async () => {
    setProcessing(true);
    try {
      // Simulate PDF generation process
      const queuedItems = generationQueue.filter(item => item.status === 'queued');
      
      for (const item of queuedItems.slice(0, 3)) { // Process 3 at a time
        await processLetterGeneration(item);
      }

      toast({
        title: "Berhasil",
        description: `${Math.min(queuedItems.length, 3)} PDF berhasil diproses`
      });

      fetchGenerationQueue();
    } catch (error) {
      console.error('Error processing queue:', error);
      toast({
        title: "Error",
        description: "Gagal memproses queue",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const processLetterGeneration = async (item: LetterGenerationItem) => {
    try {
      // Update status to processing
      await supabase
        .from('letter_generation_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      // Simulate PDF generation (replace with actual PDF generation logic)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock PDF URL (replace with actual PDF generation)
      const mockPdfUrl = `https://example.com/generated-letters/${item.letter_request_id}.pdf`;

      // Update with completion
      await supabase
        .from('letter_generation_queue')
        .update({ 
          status: 'completed',
          pdf_url: mockPdfUrl,
          generated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      // Update letter request with PDF URL
      await supabase
        .from('letter_requests')
        .update({ 
          status: 'ready',
          generated_letter_url: mockPdfUrl
        })
        .eq('id', item.letter_request_id);

    } catch (error) {
      // Update with error
      await supabase
        .from('letter_generation_queue')
        .update({ 
          status: 'failed',
          error_message: error.message || 'Unknown error'
        })
        .eq('id', item.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'queued':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'processing':
        return 75;
      case 'queued':
        return 25;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  const queueStats = {
    total: generationQueue.length,
    queued: generationQueue.filter(item => item.status === 'queued').length,
    processing: generationQueue.filter(item => item.status === 'processing').length,
    completed: generationQueue.filter(item => item.status === 'completed').length,
    failed: generationQueue.filter(item => item.status === 'failed').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{queueStats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{queueStats.queued}</div>
              <div className="text-sm text-muted-foreground">Antrian</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStats.processing}</div>
              <div className="text-sm text-muted-foreground">Proses</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
              <div className="text-sm text-muted-foreground">Selesai</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
              <div className="text-sm text-muted-foreground">Gagal</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      {hasRole('admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Kontrol Generator PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={processQueue}
              disabled={processing || queueStats.queued === 0}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {processing ? 'Memproses...' : `Proses Queue (${queueStats.queued})`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Generasi PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">Semua ({queueStats.total})</TabsTrigger>
              <TabsTrigger value="queued">Antrian ({queueStats.queued})</TabsTrigger>
              <TabsTrigger value="processing">Proses ({queueStats.processing})</TabsTrigger>
              <TabsTrigger value="completed">Selesai ({queueStats.completed})</TabsTrigger>
              <TabsTrigger value="failed">Gagal ({queueStats.failed})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <GenerationQueueList 
                items={generationQueue} 
                onRegenerate={regeneratePDF}
                processing={processing}
              />
            </TabsContent>
            <TabsContent value="queued">
              <GenerationQueueList 
                items={generationQueue.filter(item => item.status === 'queued')} 
                onRegenerate={regeneratePDF}
                processing={processing}
              />
            </TabsContent>
            <TabsContent value="processing">
              <GenerationQueueList 
                items={generationQueue.filter(item => item.status === 'processing')} 
                onRegenerate={regeneratePDF}
                processing={processing}
              />
            </TabsContent>
            <TabsContent value="completed">
              <GenerationQueueList 
                items={generationQueue.filter(item => item.status === 'completed')} 
                onRegenerate={regeneratePDF}
                processing={processing}
              />
            </TabsContent>
            <TabsContent value="failed">
              <GenerationQueueList 
                items={generationQueue.filter(item => item.status === 'failed')} 
                onRegenerate={regeneratePDF}
                processing={processing}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface GenerationQueueListProps {
  items: LetterGenerationItem[];
  onRegenerate: (queueId: string) => void;
  processing: boolean;
}

const GenerationQueueList: React.FC<GenerationQueueListProps> = ({ 
  items, 
  onRegenerate, 
  processing 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'queued':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'processing':
        return 75;
      case 'queued':
        return 25;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada item dalam kategori ini</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium">
                    {item.letter_requests?.request_number || 'Request Number'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {item.letter_requests?.letter_type || 'Unknown Type'}
                    </Badge>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{item.status.toUpperCase()}</span>
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {item.pdf_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.pdf_url!, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {item.status === 'failed' && (
                    <Button
                      size="sm"
                      onClick={() => onRegenerate(item.id)}
                      disabled={processing}
                    >
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={getProgressValue(item.status)} className="h-2" />
                
                <div className="text-sm text-muted-foreground">
                  <div>Siswa: {item.letter_requests?.students?.full_name || 'Unknown'}</div>
                  <div>Template: {item.letter_templates?.template_name || 'Unknown'}</div>
                  <div>Dibuat: {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</div>
                  
                  {item.generated_at && (
                    <div>
                      Selesai: {format(new Date(item.generated_at), 'dd MMM yyyy HH:mm', { locale: id })}
                    </div>
                  )}
                  
                  {item.error_message && (
                    <div className="text-red-600 mt-2">
                      Error: {item.error_message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};