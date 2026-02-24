import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  LogOut,
  Megaphone,
  Package,
  PanelLeft,
  PawPrint,
  Scissors,
  Settings,
  Users,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const mainMenuItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Package, label: "Produtos", path: "/produtos" },
  { icon: Scissors, label: "Banho & Tosa", path: "/banho-tosa" },
];

const managementMenuItems = [
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: PawPrint, label: "Pets", path: "/pets" },
  { icon: Megaphone, label: "Marketing", path: "/marketing" },
];

const SIDEBAR_WIDTH_KEY = "petflow-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 380;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <PawPrint className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">PetFlow</span>
              <Badge variant="secondary" className="text-xs">CRM</Badge>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-center">
              Acesse o sistema
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Faça login para acessar o painel de gestão do seu pet shop.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Entrar no sistema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const allMenuItems = [...mainMenuItems, ...managementMenuItems];
  const activeMenuItem = allMenuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const NavItem = ({ item }: { item: typeof mainMenuItems[0] }) => {
    const isActive = location === item.path;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setLocation(item.path)}
          tooltip={item.label}
          className={`h-10 transition-all font-normal rounded-lg ${
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
          }`}
        >
          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-sidebar-primary-foreground" : ""}`} />
          <span className="font-medium">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-sidebar"
          disableTransition={isResizing}
        >
          {/* Header / Logo */}
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring shrink-0 hover:bg-sidebar-accent"
                aria-label="Toggle navigation"
              >
                <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <PawPrint className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-sidebar-foreground text-lg tracking-tight truncate">
                    PetFlow
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-sidebar-border text-sidebar-foreground/60 font-medium"
                  >
                    CRM
                  </Badge>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="gap-0 py-3">
            <SidebarGroup>
              {!isCollapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider font-semibold px-4 mb-1">
                  Principal
                </SidebarGroupLabel>
              )}
              <SidebarMenu className="px-2 gap-0.5">
                {mainMenuItems.map(item => <NavItem key={item.path} item={item} />)}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              {!isCollapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] uppercase tracking-wider font-semibold px-4 mb-1">
                  Gestão
                </SidebarGroupLabel>
              )}
              <SidebarMenu className="px-2 gap-0.5">
                {managementMenuItems.map(item => <NavItem key={item.path} item={item} />)}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer / User */}
          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                  <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                    <AvatarFallback className="text-xs font-semibold bg-sidebar-primary text-sidebar-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                        {user?.name ?? "-"}
                      </p>
                      <p className="text-xs text-sidebar-foreground/50 truncate mt-1">
                        {user?.email ?? "-"}
                      </p>
                    </div>
                  )}
                  {!isCollapsed && (
                    <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors"
            onMouseDown={() => !isCollapsed && setIsResizing(true)}
            style={{ zIndex: 50 }}
          />
        )}
      </div>

      <SidebarInset className="bg-background">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{activeMenuItem?.label ?? "PetFlow CRM"}</span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
