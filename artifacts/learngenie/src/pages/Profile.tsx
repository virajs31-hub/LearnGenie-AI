import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";
import { User, Mail, Settings, Moon, Sun, Monitor } from "lucide-react";

export default function Profile() {
  const { data: summary } = useGetDashboardSummary();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-accent"></div>
            <CardContent className="pt-0 relative">
              <div className="mx-auto w-20 h-20 bg-background rounded-full border-4 border-background flex items-center justify-center -mt-10 mb-4 shadow-sm">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">Student Name</h2>
              <p className="text-sm text-muted-foreground mb-4">student@example.com</p>
              
              <div className="bg-primary/10 rounded-lg p-3 inline-block mx-auto mb-4">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">Level {summary?.level || 1}</div>
                <div className="font-bold text-lg text-primary">{summary?.xpPoints || 0} XP</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Student Name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="student@example.com" />
              </div>
              <Button className="mt-2">Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Moon className="h-5 w-5" /> Appearance</CardTitle>
              <CardDescription>Customize how LearnGenie looks on your device.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button 
                  variant={theme === "light" ? "default" : "outline"} 
                  className="flex flex-col items-center gap-2 h-auto py-6"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-6 w-6" />
                  <span>Light</span>
                </Button>
                <Button 
                  variant={theme === "dark" ? "default" : "outline"} 
                  className="flex flex-col items-center gap-2 h-auto py-6"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-6 w-6" />
                  <span>Dark</span>
                </Button>
                <Button 
                  variant={theme === "system" ? "default" : "outline"} 
                  className="flex flex-col items-center gap-2 h-auto py-6"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="h-6 w-6" />
                  <span>System</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
