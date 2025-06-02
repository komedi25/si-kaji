
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  features?: string[];
}

export default function ComingSoon({ title, description, features }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Construction className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Status:</strong> Dalam Pengembangan
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Fitur ini akan tersedia di fase pengembangan selanjutnya
            </p>
          </div>
          
          {features && features.length > 0 && (
            <div className="text-left">
              <h4 className="font-medium text-gray-900 mb-2">Fitur yang akan tersedia:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
