
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

export const RealtimeUpdates = () => {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Set up realtime subscriptions for critical tables
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_violations'
        },
        (payload) => {
          console.log('New violation recorded:', payload);
          queryClient.invalidateQueries({ queryKey: ['real-database-stats'] });
          queryClient.invalidateQueries({ queryKey: ['violation-trends'] });
          
          toast({
            title: "Pelanggaran Baru",
            description: "Pelanggaran siswa baru telah dicatat",
            variant: "destructive"
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_achievements'
        },
        (payload) => {
          console.log('New achievement recorded:', payload);
          queryClient.invalidateQueries({ queryKey: ['real-database-stats'] });
          queryClient.invalidateQueries({ queryKey: ['achievements-by-level'] });
          
          toast({
            title: "Prestasi Baru",
            description: "Prestasi siswa baru telah dicatat",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_cases'
        },
        (payload) => {
          console.log('New case reported:', payload);
          queryClient.invalidateQueries({ queryKey: ['real-database-stats'] });
          
          toast({
            title: "Kasus Baru",
            description: "Kasus baru telah dilaporkan dan perlu tindak lanjut",
            variant: "destructive"
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          toast({
            title: "Koneksi Realtime Aktif",
            description: "Sistem akan otomatis memperbarui data terbaru",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [queryClient, toast]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-gray-100 text-gray-800 border border-gray-200'
      }`}>
        <Bell className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-gray-600'}`} />
        <span>{isConnected ? 'Realtime Aktif' : 'Menghubungkan...'}</span>
        {isConnected && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </div>
  );
};
