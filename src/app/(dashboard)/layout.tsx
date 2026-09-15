"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Receipt, Users, Truck, Package, Warehouse, 
  ShoppingCart, RotateCcw, RotateCw, CreditCard, FileCheck, 
  FileText, BarChart3, Settings, LogOut, Menu, X, Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  role: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "New Invoice", href: "/invoices/new", icon: Receipt, sub: true },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Suppliers", href: "/suppliers", icon: Truck },
    { name: "Products", href: "/products", icon: Package },
    { name: "Stock", href: "/stock", icon: Warehouse },
    { name: "Purchases", href: "/purchases", icon: ShoppingCart },
    { name: "Sales Returns", href: "/sales-returns", icon: RotateCcw },
    { name: "Purchase Returns", href: "/purchase-returns", icon: RotateCw },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "E-Invoice", href: "/e-invoice", icon: FileCheck },
    { name: "E-Way Bill", href: "/e-way-bill", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  if (user?.role === "ADMIN") {
    navItems.push({ name: "Settings", href: "/settings", icon: Settings });
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Clean White Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-slate-200 text-slate-700 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shadow-sm flex flex-col justify-between",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-5 bg-white">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                SV
              </div>
              <div className="truncate">
                <span className="block text-sm font-bold tracking-wide text-slate-900">SRI VAISHNAVI</span>
                <span className="block text-[10px] font-semibold tracking-[0.2em] text-blue-600 uppercase">TRADERS</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="h-[calc(100vh-8rem)] overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' 
                ? pathname === '/' 
                : pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    item.sub ? "ml-4" : "",
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon size={17} className={cn(isActive ? "text-blue-600" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info Bottom Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-slate-100">
        
        {/* Clean White Top Header */}
        <header className="flex h-16 items-center justify-between bg-white border-b border-slate-200 px-4 shadow-2xs z-30 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-slate-100 lg:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-bold tracking-tight text-slate-900 hidden sm:block">
              SRI VAISHNAVI TRADERS
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-700">{user.name} ({user.role})</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Main Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}

