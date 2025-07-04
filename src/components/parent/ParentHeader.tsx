
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';

interface StudentData {
  id: string;
  full_name: string;
  nis: string;
  class?: {
    name: string;
    grade: number;
  };
}

interface ParentHeaderProps {
  studentData: StudentData;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({ studentData }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {studentData.full_name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-xl">{studentData.full_name}</CardTitle>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>NIS: {studentData.nis}</div>
                {studentData.class && (
                  <div>Kelas: {studentData.class.grade} {studentData.class.name}</div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Phone className="w-4 h-4 mr-2" />
              Hubungi Sekolah
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Kirim Pesan
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
