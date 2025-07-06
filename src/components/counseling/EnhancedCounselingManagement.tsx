
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCounselingBooking } from './EnhancedCounselingBooking';
import { CounselingBookingManagement } from './CounselingBookingManagement';
import { CounselingScheduleManager } from './CounselingScheduleManager';
import { useAuth } from '@/hooks/useAuth';

export const EnhancedCounselingManagement = () => {
  const { hasRole } = useAuth();

  const renderContent = () => {
    // If user is a student, show booking interface
    if (hasRole('siswa')) {
      return (
        <Tabs defaultValue="booking" className="w-full">
          <TabsList>
            <TabsTrigger value="booking">Booking Konseling</TabsTrigger>
            <TabsTrigger value="history">Riwayat Konseling</TabsTrigger>
          </TabsList>
          
          <TabsContent value="booking">
            <EnhancedCounselingBooking />
          </TabsContent>
          
          <TabsContent value="history">
            <div className="text-center py-8 text-gray-500">
              <p>Fitur riwayat konseling akan segera hadir</p>
            </div>
          </TabsContent>
        </Tabs>
      );
    }

    // For counselors and admin, show management interface
    return (
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList>
          <TabsTrigger value="bookings">Manajemen Booking</TabsTrigger>
          <TabsTrigger value="schedules">Jadwal Konseling</TabsTrigger>
          <TabsTrigger value="sessions">Sesi Konseling</TabsTrigger>
          <TabsTrigger value="referrals">Rujukan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <CounselingBookingManagement />
        </TabsContent>
        
        <TabsContent value="schedules">
          <CounselingScheduleManager />
        </TabsContent>
        
        <TabsContent value="sessions">
          <div className="text-center py-8 text-gray-500">
            <p>Manajemen sesi konseling akan segera hadir</p>
          </div>
        </TabsContent>
        
        <TabsContent value="referrals">
          <div className="text-center py-8 text-gray-500">
            <p>Manajemen rujukan konseling akan segera hadir</p>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {hasRole('siswa') ? 'Konseling BK' : 'Manajemen Konseling BK'}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {hasRole('siswa') 
            ? 'Ajukan booking konseling dengan mudah dan pantau riwayat konseling Anda'
            : 'Kelola sistem booking konseling, jadwal, dan sesi konseling siswa'
          }
        </p>
      </div>

      <div className="space-y-4">
        {renderContent()}
      </div>
    </div>
  );
};
