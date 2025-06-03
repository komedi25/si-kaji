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
import { GraduationCap, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';

import { AppLayout } from './AppLayout';
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
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" to="/">
            <GraduationCap className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              SIAKAD SMK
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </Link>
            <Link
              to="/student-management"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Siswa
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center transition-colors hover:text-foreground/80 text-foreground/60">
                Akademik
                <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/attendance-management">Presensi</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/violation-management">Pelanggaran</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/achievement-management">Prestasi</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/discipline-points-management">Poin Disiplin</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center transition-colors hover:text-foreground/80 text-foreground/60">
                Kegiatan
                <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/activity-proposal">Proposal Kegiatan</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/extracurricular-management">Ekstrakurikuler</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/document-management">Dokumen & Surat</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center transition-colors hover:text-foreground/80 text-foreground/60">
                Konseling
                <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/counseling-management">Sesi Konseling</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/case-management">Manajemen Kasus</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center transition-colors hover:text-foreground/80 text-foreground/60">
                Lainnya
                <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/permit-management">Perizinan</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/parent-portal">Portal Orang Tua</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/user-management">Manajemen User</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/master-data">Data Master</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className="inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
            >
              <span className="hidden lg:inline-flex">Search...</span>
              <span className="inline-flex lg:hidden">Search...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
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
                        {user.email}
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
