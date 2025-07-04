
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Si-Kaji Login</CardTitle>
          <p className="text-gray-600">Sistem Informasi Kesiswaan SMKJI</p>
        </CardHeader>
        <CardContent>
          <AuthForm />
        </CardContent>
      </Card>
    </div>
  );
}
