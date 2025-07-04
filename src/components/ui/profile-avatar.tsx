
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  nameClassName?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg'
};

export const ProfileAvatar = ({
  src,
  name,
  size = 'md',
  className,
  showName = false,
  nameClassName
}: ProfileAvatarProps) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const avatarElement = (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src || undefined} alt={name} />
      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );

  if (showName) {
    return (
      <div className="flex items-center gap-2">
        {avatarElement}
        <span className={cn("font-medium truncate", nameClassName)}>
          {name}
        </span>
      </div>
    );
  }

  return avatarElement;
};
