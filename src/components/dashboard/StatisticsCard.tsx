
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const StatisticsCard = ({ 
  title, 
  value, 
  description, 
  trend, 
  trendValue, 
  icon: Icon,
  className 
}: StatisticsCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-600" />;
      case 'neutral':
        return <Minus className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
        <CardTitle className="text-xs md:text-sm font-medium line-clamp-2">{title}</CardTitle>
        {Icon && <Icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-lg md:text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-xs text-muted-foreground mt-1">
            {trend && (
              <>
                {getTrendIcon()}
                {trendValue && <span className={getTrendColor()}>{trendValue}</span>}
              </>
            )}
            {description && <span className="line-clamp-1">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
