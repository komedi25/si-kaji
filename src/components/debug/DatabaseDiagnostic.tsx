
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DiagnosticResult {
  studentsTableAccess: boolean;
  studentsCount: number;
  profilesTableAccess: boolean;
  profilesCount: number;
  userHasProfile: boolean;
  unlinkedStudentsCount: number;
  sampleStudents: any[];
  error?: string;
}

export const DatabaseDiagnostic = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const diagnostic: DiagnosticResult = {
      studentsTableAccess: false,
      studentsCount: 0,
      profilesTableAccess: false,
      profilesCount: 0,
      userHasProfile: false,
      unlinkedStudentsCount: 0,
      sampleStudents: []
    };

    try {
      // Test students table access
      const { data: students, error: studentsError, count: studentsCount } = await supabase
        .from('students')
        .select('id, nis, full_name, user_id', { count: 'exact' });

      if (studentsError) {
        diagnostic.error = `Students table error: ${studentsError.message}`;
      } else {
        diagnostic.studentsTableAccess = true;
        diagnostic.studentsCount = studentsCount || 0;
        diagnostic.sampleStudents = students?.slice(0, 5) || [];
        diagnostic.unlinkedStudentsCount = students?.filter(s => !s.user_id).length || 0;
      }

      // Test profiles table access
      const { data: profiles, error: profilesError, count: profilesCount } = await supabase
        .from('profiles')
        .select('id, full_name, nis', { count: 'exact' });

      if (profilesError) {
        diagnostic.error += ` Profiles table error: ${profilesError.message}`;
      } else {
        diagnostic.profilesTableAccess = true;
        diagnostic.profilesCount = profilesCount || 0;
        
        // Check if current user has profile
        if (user?.id) {
          const userProfile = profiles?.find(p => p.id === user.id);
          diagnostic.userHasProfile = !!userProfile;
        }
      }

    } catch (error) {
      diagnostic.error = `Critical error: ${error}`;
    }

    setResult(diagnostic);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Running database diagnostic...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Database Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{result.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              Students Table
              {result?.studentsTableAccess ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </h4>
            <div className="text-sm space-y-1">
              <div>Access: <Badge variant={result?.studentsTableAccess ? "default" : "destructive"}>
                {result?.studentsTableAccess ? "OK" : "Failed"}
              </Badge></div>
              <div>Total Records: {result?.studentsCount || 0}</div>
              <div>Unlinked Records: {result?.unlinkedStudentsCount || 0}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              Profiles Table
              {result?.profilesTableAccess ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </h4>
            <div className="text-sm space-y-1">
              <div>Access: <Badge variant={result?.profilesTableAccess ? "default" : "destructive"}>
                {result?.profilesTableAccess ? "OK" : "Failed"}
              </Badge></div>
              <div>Total Records: {result?.profilesCount || 0}</div>
              <div>User Has Profile: <Badge variant={result?.userHasProfile ? "default" : "destructive"}>
                {result?.userHasProfile ? "Yes" : "No"}
              </Badge></div>
            </div>
          </div>
        </div>

        {result?.sampleStudents && result.sampleStudents.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Sample Student Records</h4>
            <div className="bg-gray-50 rounded p-3 text-xs space-y-1">
              {result.sampleStudents.map((student, index) => (
                <div key={index} className="flex justify-between">
                  <span>{student.nis} - {student.full_name}</span>
                  <span>{student.user_id ? "Linked" : "Unlinked"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <div>User ID: {user?.id}</div>
          <div>Email: {user?.email}</div>
          <div>Diagnostic Time: {new Date().toISOString()}</div>
        </div>

        <Button onClick={runDiagnostic} variant="outline" className="w-full">
          <Database className="h-4 w-4 mr-2" />
          Run Diagnostic Again
        </Button>
      </CardContent>
    </Card>
  );
};
