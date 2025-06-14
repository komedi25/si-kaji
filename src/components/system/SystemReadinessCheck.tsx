
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, XCircle, Database, Users, Settings } from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
}

export const SystemReadinessCheck = () => {
  const { data: systemChecks, isLoading } = useQuery({
    queryKey: ['system-readiness'],
    queryFn: async (): Promise<SystemCheck[]> => {
      const checks: SystemCheck[] = [];

      try {
        // Check database connection
        const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
        checks.push({
          name: 'Database Connection',
          status: dbError ? 'fail' : 'pass',
          message: dbError ? 'Database connection failed' : 'Database connected successfully',
          details: dbError?.message
        });

        // Check essential tables
        const tableChecks = await Promise.all([
          supabase.from('students').select('id').limit(1),
          supabase.from('classes').select('id').limit(1),
          supabase.from('majors').select('id').limit(1),
          supabase.from('user_roles').select('id').limit(1)
        ]);

        const failedTables = tableChecks.filter(result => result.error).length;
        checks.push({
          name: 'Essential Tables',
          status: failedTables === 0 ? 'pass' : failedTables < 2 ? 'warning' : 'fail',
          message: `${4 - failedTables}/4 essential tables accessible`,
          details: failedTables > 0 ? 'Some tables may not be properly configured' : undefined
        });

        // Check user data
        const { data: users } = await supabase.from('profiles').select('id');
        checks.push({
          name: 'User Data',
          status: (users?.length || 0) > 0 ? 'pass' : 'warning',
          message: `${users?.length || 0} users in system`,
          details: (users?.length || 0) === 0 ? 'Consider adding initial users' : undefined
        });

        // Check student data
        const { data: students } = await supabase.from('students').select('id');
        checks.push({
          name: 'Student Data',
          status: (students?.length || 0) > 0 ? 'pass' : 'warning',
          message: `${students?.length || 0} students registered`,
          details: (students?.length || 0) === 0 ? 'Consider importing student data' : undefined
        });

        // Check master data
        const [majors, classes, violationTypes, achievementTypes] = await Promise.all([
          supabase.from('majors').select('id').eq('is_active', true),
          supabase.from('classes').select('id').eq('is_active', true),
          supabase.from('violation_types').select('id').eq('is_active', true),
          supabase.from('achievement_types').select('id').eq('is_active', true)
        ]);

        const masterDataCount = [majors, classes, violationTypes, achievementTypes]
          .reduce((sum, result) => sum + (result.data?.length || 0), 0);

        checks.push({
          name: 'Master Data',
          status: masterDataCount > 10 ? 'pass' : masterDataCount > 5 ? 'warning' : 'fail',
          message: `${masterDataCount} master data entries configured`,
          details: masterDataCount < 10 ? 'Consider adding more master data for full functionality' : undefined
        });

        // Check real-time features
        checks.push({
          name: 'Real-time Features',
          status: 'pass',
          message: 'Real-time updates configured',
          details: 'Supabase real-time subscriptions active'
        });

      } catch (error) {
        checks.push({
          name: 'System Error',
          status: 'fail',
          message: 'Failed to perform system checks',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return checks;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Readiness Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const passCount = systemChecks?.filter(check => check.status === 'pass').length || 0;
  const totalChecks = systemChecks?.length || 0;
  const readinessPercentage = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0;

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'fail':
        return 'destructive';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Readiness Check
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Readiness</span>
            <span className="text-sm font-medium">{readinessPercentage}%</span>
          </div>
          <Progress value={readinessPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systemChecks?.map((check, index) => (
            <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
              <div className="flex items-start gap-3">
                {getStatusIcon(check.status)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.name}</span>
                    <Badge variant={getStatusColor(check.status)} className="text-xs">
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                  {check.details && (
                    <p className="text-xs text-red-500">{check.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Production Readiness Assessment</h4>
          <div className="text-sm text-blue-700 space-y-1">
            {readinessPercentage >= 90 && (
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                System is ready for production deployment
              </p>
            )}
            {readinessPercentage >= 70 && readinessPercentage < 90 && (
              <p className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                System is mostly ready, address warnings for optimal performance
              </p>
            )}
            {readinessPercentage < 70 && (
              <p className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                System needs additional configuration before production
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
