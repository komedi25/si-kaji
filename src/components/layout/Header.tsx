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
import { GraduationCap, Search } from 'lucide-react';
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
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Mobile Navigation */}
        <MobileSidebar />
        
        <div className="mr-4 flex items-center">
          <Link className="flex items-center space-x-2" to="/dashboard">
            <img 
              src="/lovable-uploads/b258db0b-54a9-4826-a0ce-5850c64b6fc7.png" 
              alt="Logo SMKN 1 Kendal" 
              className="h-8 w-8 object-contain"
            />
            <span className="hidden font-bold sm:inline-block">
              Si-Kaji SMK N 1 Kendal
            </span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari siswa, kelas, atau kegiatan..."
                className="pl-8 md:w-64 lg:w-80"
              />
            </div>
          </div>
          
          <nav className="flex items-center space-x-2">
            <NotificationBell />
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="@user" />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.profile?.full_name || user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      Profile
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Settings
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
