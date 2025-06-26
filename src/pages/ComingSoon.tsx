
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Construction className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sedang Dikembangkan
          </CardTitle>
          <CardDescription>
            Fitur ini sedang dalam tahap pengembangan dan akan segera tersedia
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Tim pengembang kami sedang bekerja keras untuk menghadirkan fitur terbaik untuk Anda.
          </p>
          
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full"
          >
            Ke Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
