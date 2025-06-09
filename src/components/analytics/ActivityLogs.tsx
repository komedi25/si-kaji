
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Activity, AlertTriangle, Eye, User } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  page_url: string;
  metadata: Record<string, any>;
  created_at: string;
  user_name?: string;
}

interface ErrorLog {
  id: string;
  user_id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  page_url: string;
  metadata: Record<string, any>;
  created_at: string;
  user_name?: string;
}

export function ActivityLogs() {
  const [logType, setLogType] = useState<'activity' | 'error'>('activity');
  const [timeRange, setTimeRange] = useState('24h');

  const { data: activityLogs, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-logs', timeRange],
    queryFn: async () => {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data?.map(log => ({
        ...log,
        user_name: log.profiles?.full_name || 'Unknown User'
      })) as ActivityLog[];
    },
    enabled: logType === 'activity'
  });

  const { data: errorLogs, isLoading: errorLoading } = useQuery({
    queryKey: ['error-logs', timeRange],
    queryFn: async () => {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('error_logs')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return data?.map(log => ({
        ...log,
        user_name: log.profiles?.full_name || 'Unknown User'
      })) as ErrorLog[];
    },
    enabled: logType === 'error'
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'page_visit':
        return <Eye className="h-4 w-4" />;
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'login':
        return 'default';
      case 'logout':
        return 'secondary';
      case 'page_visit':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Logs</h2>
          <p className="text-muted-foreground">Monitor aktivitas dan error aplikasi</p>
        </div>
        <div className="flex gap-4">
          <Select value={logType} onValueChange={(value: 'activity' | 'error') => setLogType(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activity">Activity Logs</SelectItem>
              <SelectItem value="error">Error Logs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Jam Terakhir</SelectItem>
              <SelectItem value="7d">7 Hari Terakhir</SelectItem>
              <SelectItem value="30d">30 Hari Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {logType === 'activity' ? (
              <>
                <Activity className="h-5 w-5" />
                Activity Logs
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                Error Logs
              </>
            )}
          </CardTitle>
          <CardDescription>
            {logType === 'activity' 
              ? 'Log aktivitas pengguna di aplikasi'
              : 'Log error dan masalah aplikasi'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logType === 'activity' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Halaman</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : activityLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Tidak ada data</TableCell>
                  </TableRow>
                ) : (
                  activityLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                      </TableCell>
                      <TableCell>{log.user_name}</TableCell>
                      <TableCell>
                        <Badge variant={getActivityBadgeVariant(log.activity_type)} className="flex items-center gap-1 w-fit">
                          {getActivityIcon(log.activity_type)}
                          {log.activity_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{log.description}</TableCell>
                      <TableCell className="font-mono text-sm">{log.page_url}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Tipe Error</TableHead>
                  <TableHead>Pesan Error</TableHead>
                  <TableHead>Halaman</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : errorLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Tidak ada data</TableCell>
                  </TableRow>
                ) : (
                  errorLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                      </TableCell>
                      <TableCell>{log.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          {log.error_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={log.error_message}>
                        {log.error_message}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.page_url}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
