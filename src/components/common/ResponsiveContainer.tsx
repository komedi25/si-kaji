import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  desktopClassName
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        className,
        isMobile ? mobileClassName : desktopClassName
      )}
    >
      {children}
    </div>
  );
};

// Mobile-first responsive grid
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: number;
  className?: string;
}> = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 }, 
  gap = 4,
  className 
}) => {
  const gridCols = `grid-cols-${cols.mobile || 1} md:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3}`;
  const gridGap = `gap-${gap}`;

  return (
    <div className={cn('grid', gridCols, gridGap, className)}>
      {children}
    </div>
  );
};

// Responsive card layout
export const ResponsiveCardLayout: React.FC<{
  children: React.ReactNode;
  variant?: 'stack' | 'grid' | 'flex';
  className?: string;
}> = ({ children, variant = 'grid', className }) => {
  const isMobile = useIsMobile();

  const getLayoutClasses = () => {
    if (isMobile) {
      return 'flex flex-col space-y-4';
    }

    switch (variant) {
      case 'stack':
        return 'space-y-6';
      case 'flex':
        return 'flex flex-wrap gap-4';
      case 'grid':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  };

  return (
    <div className={cn(getLayoutClasses(), className)}>
      {children}
    </div>
  );
};

// Responsive text sizing
export const ResponsiveText: React.FC<{
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}> = ({ children, size = 'base', className }) => {
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm md:text-base',
    base: 'text-sm md:text-base lg:text-lg',
    lg: 'text-base md:text-lg lg:text-xl',
    xl: 'text-lg md:text-xl lg:text-2xl',
    '2xl': 'text-xl md:text-2xl lg:text-3xl',
    '3xl': 'text-2xl md:text-3xl lg:text-4xl'
  };

  return (
    <span className={cn(textSizes[size], className)}>
      {children}
    </span>
  );
};

// Mobile-aware spacing
export const ResponsiveSpacing: React.FC<{
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'x' | 'y' | 'all';
  className?: string;
}> = ({ children, size = 'md', direction = 'y', className }) => {
  const spacingMap = {
    sm: { x: 'space-x-2 md:space-x-4', y: 'space-y-2 md:space-y-4', all: 'gap-2 md:gap-4' },
    md: { x: 'space-x-4 md:space-x-6', y: 'space-y-4 md:space-y-6', all: 'gap-4 md:gap-6' },
    lg: { x: 'space-x-6 md:space-x-8', y: 'space-y-6 md:space-y-8', all: 'gap-6 md:gap-8' },
    xl: { x: 'space-x-8 md:space-x-12', y: 'space-y-8 md:space-y-12', all: 'gap-8 md:gap-12' }
  };

  return (
    <div className={cn(spacingMap[size][direction], className)}>
      {children}
    </div>
  );
};