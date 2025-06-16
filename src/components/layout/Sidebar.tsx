import {
  LayoutDashboard,
  Calendar,
  User,
  Book,
  Settings,
  AlertTriangle,
  Award,
  FileText,
  Users,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from '@/hooks/useSidebar';

interface SidebarMenuItemProps {
  children: React.ReactNode;
}

const SidebarMenuItem = ({ children }: SidebarMenuItemProps) => {
  return (
    <li className="mb-1">
      {children}
    </li>
  );
};

interface SidebarMenuButtonProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarMenuButton = ({ children, className }: SidebarMenuButtonProps) => {
  return (
    <Button variant="ghost" className={cn("justify-start w-full hover:bg-accent hover:text-accent-foreground", className)}>
      {children}
    </Button>
  );
};

export const Sidebar = () => {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <div className={cn(
      "flex flex-col w-64 border-r border-primary/10 dark:bg-[#272935] bg-white",
      collapsed ? "w-16" : "w-64",
    )}>
      <div className="flex-1">
        <div className="px-3 py-2 flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold">SIMS</h1>
          <Button type="button" size="icon" variant="ghost" onClick={toggleCollapsed}>
            {collapsed ? "<<" : ">>"}
          </Button>
        </div>
        <Accordion type="single" collapsible className="w-full border-b border-primary/10">
          <AccordionItem value="item-1">
            <AccordionTrigger>Menu Utama</AccordionTrigger>
            <AccordionContent>
              <ul className="mt-2 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/attendance" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Presensi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/violations" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Pelanggaran</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/achievements" className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>Prestasi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/permits" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Perizinan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/student-cases" className="flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      <span>Kasus Siswa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible className="w-full border-b border-primary/10">
          <AccordionItem value="item-2">
            <AccordionTrigger>Data Master</AccordionTrigger>
            <AccordionContent>
              <ul className="mt-2 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/students" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Siswa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/classes" className="flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      <span>Kelas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/academic-years" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Tahun Ajaran</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/majors" className="flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      <span>Jurusan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/semesters" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Semester</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible className="w-full border-b border-primary/10">
          <AccordionItem value="item-3">
            <AccordionTrigger>Manajemen Pengguna</AccordionTrigger>
            <AccordionContent>
              <ul className="mt-2 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/users" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Pengguna</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/roles" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Roles</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible className="w-full border-b border-primary/10">
          <AccordionItem value="item-4">
            <AccordionTrigger>Komunikasi</AccordionTrigger>
            <AccordionContent>
              <ul className="mt-2 px-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/messages" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Pesan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Add Self Attendance menu item */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/self-attendance" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Presensi Mandiri</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </div>
    </div>
  );
};
