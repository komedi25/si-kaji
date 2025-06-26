
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { GraduationCap, Search, Bell, Settings, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { MobileSidebar } from './MobileSidebar';
import { NotificationBell } from './NotificationBell';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Navigation */}
        <MobileSidebar />
        
        {/* Logo and Title */}
        <div className="mr-4 flex items-center">
          <Link className="flex items-center space-x-2" to="/dashboard">
            <img 
              src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
              alt="Logo SMKN 1 Kendal" 
              className="h-8 w-8 object-contain"
            />
            <span className="hidden lg:inline-block font-bold">
              Si-Kaji SMK N 1 Kendal
            </span>
            <span className="hidden sm:inline-block lg:hidden font-bold text-sm">
              Si-Kaji
            </span>
          </Link>
        </div>
        
        {/* Center - Search Bar */}
        <div className="flex-1 flex justify-center px-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari siswa, kelas, atau data..."
              className="pl-10 w-full"
            />
          </div>
        </div>
        
        {/* Right Side - User Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <NotificationBell />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/avatars/01.png" alt="@user" />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.profile?.full_name || 'Pengguna'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {user.roles && user.roles.length > 0 && (
                      <p className="text-xs text-blue-600 font-medium">
                        Role: {user.roles.join(', ')}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">
                Masuk
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
