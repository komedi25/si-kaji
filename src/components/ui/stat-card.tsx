
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  onClick?: () => void;
}

export const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend = 'neutral',
  className,
  onClick
}: StatCardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const displayValue = typeof value === 'string' ? value : value.toLocaleString();

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all duration-200 cursor-pointer",
        "min-w-0", // Prevent flex item from overflowing
        onClick && "hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate pr-2">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl sm:text-2xl font-bold truncate" title={displayValue}>
          {displayValue}
        </div>
        {description && (
          <p className={cn("text-xs mt-1 truncate", getTrendColor())} title={description}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
