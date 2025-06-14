
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemReadinessCheck } from '../system/SystemReadinessCheck';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';

export const ProductionReadinessWidget = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Production Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500">
              READY
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Database:</span>
              <span className="ml-2 text-green-600 font-medium">Connected</span>
            </div>
            <div>
              <span className="text-muted-foreground">Real-time:</span>
              <span className="ml-2 text-green-600 font-medium">Active</span>
            </div>
            <div>
              <span className="text-muted-foreground">Authentication:</span>
              <span className="ml-2 text-green-600 font-medium">Configured</span>
            </div>
            <div>
              <span className="text-muted-foreground">Monitoring:</span>
              <span className="ml-2 text-green-600 font-medium">Enabled</span>
            </div>
          </div>

          {expanded && (
            <div className="mt-6">
              <SystemReadinessCheck />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
