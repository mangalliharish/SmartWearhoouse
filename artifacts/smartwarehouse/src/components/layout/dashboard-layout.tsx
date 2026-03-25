import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  LogOut, 
  Building2, 
  UserCircle 
} from "lucide-react";
import { getUser, clearAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    setLocation("/login");
  };

  const navLinks = {
    buyer: [
      { href: "/buyer", label: "My Orders", icon: Package },
    ],
    dealer: [
      { href: "/dealer", label: "Open Requests", icon: LayoutDashboard },
      { href: "/dealer/suborders", label: "My Allocations", icon: Truck },
    ],
    admin: [
      { href: "/admin", label: "All Orders", icon: LayoutDashboard },
    ]
  };

  const links = navLinks[(user?.role as keyof typeof navLinks) || "buyer"] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col justify-between border-r border-sidebar-border shadow-xl z-20">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-border/20">
            <Building2 className="w-6 h-6 text-primary mr-3" />
            <span className="font-display font-bold text-lg text-sidebar-foreground tracking-tight">SmartWarehouse</span>
          </div>
          <div className="p-4">
            <p className="px-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4">Menu</p>
            <nav className="space-y-1.5">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-primary/20 hover:text-primary"
                >
                  <link.icon className="w-5 h-5 mr-3 opacity-70" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="p-4 border-t border-sidebar-border bg-sidebar-border/10">
          <div className="flex items-center mb-4 px-2">
            <UserCircle className="w-8 h-8 text-sidebar-foreground/70 mr-3" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground leading-none">{user?.name || 'User'}</span>
              <span className="text-xs text-sidebar-foreground/50 mt-1 capitalize">{user?.role}</span>
            </div>
          </div>
          <Button 
            variant="destructive" 
            className="w-full justify-start text-sm shadow-none bg-red-500/10 text-red-400 hover:bg-red-500/20"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 z-10 shadow-sm shadow-black/5">
          <h2 className="font-display font-semibold text-xl text-foreground capitalize">
            {user?.role} Dashboard
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-muted/30 p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
