
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelfAttendanceWidget } from '@/components/attendance/SelfAttendanceWidget';
import { AttendanceLocationManager } from '@/components/attendance/AttendanceLocationManager';
import { AttendanceScheduleManager } from '@/components/attendance/AttendanceScheduleManager';
import { ActivityAttendanceManager } from '@/components/attendance/ActivityAttendanceManager';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const SelfAttendanceManagement = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserRoles(data?.map(r => r.role) || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const isAdmin = userRoles.includes('admin');

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Presensi Mandiri</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Lakukan presensi masuk dan pulang secara mandiri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelfAttendanceWidget />
            </CardContent>
          </Card>
        );
      case 'locations':
        if (!isAdmin) {
          return (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Akses ditolak. Hanya administrator yang dapat mengelola lokasi presensi.
                </div>
              </CardContent>
            </Card>
          );
        }
        return <AttendanceLocationManager />;
      case 'schedules':
        if (!isAdmin) {
          return (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Akses ditolak. Hanya administrator yang dapat mengelola jadwal presensi.
                </div>
              </CardContent>
            </Card>
          );
        }
        return <AttendanceScheduleManager />;
      case 'activities':
        if (!isAdmin) {
          return (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Akses ditolak. Hanya administrator yang dapat mengelola kegiatan presensi.
                </div>
              </CardContent>
            </Card>
          );
        }
        return <ActivityAttendanceManager />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Presensi Mandiri</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Lakukan presensi masuk dan pulang secara mandiri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelfAttendanceWidget />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Presensi Mandiri</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Sistem presensi mandiri berbasis lokasi dengan integrasi pelanggaran otomatis
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">Presensi</TabsTrigger>
            {isAdmin && <TabsTrigger value="locations">Lokasi</TabsTrigger>}
            {isAdmin && <TabsTrigger value="schedules">Jadwal</TabsTrigger>}
            {isAdmin && <TabsTrigger value="activities">Kegiatan</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="attendance" className="space-y-4 md:space-y-6">
            {renderContent()}
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="locations" className="space-y-4 md:space-y-6">
              {renderContent()}
            </TabsContent>
          )}
          
          {isAdmin && (
            <TabsContent value="schedules" className="space-y-4 md:space-y-6">
              {renderContent()}
            </TabsContent>
          )}
          
          {isAdmin && (
            <TabsContent value="activities" className="space-y-4 md:space-y-6">
              {renderContent()}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SelfAttendanceManagement;
