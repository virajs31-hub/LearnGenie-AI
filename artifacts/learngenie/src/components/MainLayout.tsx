import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  CalendarDays, 
  Lightbulb, 
  BrainCircuit, 
  TrendingUp, 
  FileText, 
  User, 
  Menu,
  Moon,
  Sun,
  Sparkles,
  CalendarRange,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Tutor", icon: MessageSquare },
  { href: "/planner", label: "Study Plan", icon: CalendarDays },
  { href: "/quizzes", label: "Quizzes", icon: Lightbulb },
  { href: "/flashcards", label: "Flashcards", icon: BrainCircuit },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: CalendarRange },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex h-16 shrink-0 items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <BrainCircuit className="h-6 w-6" />
            <span>LearnGenie</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <nav className="grid gap-0.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + "/");
              const isPremium = item.href === "/insights";
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm
                    ${isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isPremium && !isActive && (
                    <span className="text-[10px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded">AI</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t space-y-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 px-3 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>
          <Link 
            href="/profile"
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm
              ${location === "/profile" 
                ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
            `}
            onClick={() => setSidebarOpen(false)}
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="font-bold text-lg text-primary flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            LearnGenie
          </div>
          <div className="w-10" />
        </header>
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
