import { useState, useEffect } from "react";
import { useGetDashboardSummary, useLogStudySession, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Activity, BookOpen, BrainCircuit, CalendarDays, Flame, Lightbulb, MessageSquare, Target, TrendingUp, Play, Square, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading } = useGetDashboardSummary();
  const logSession = useLogStudySession();

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [topic, setTopic] = useState("");
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
        setSessionTime(t => t + 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleLogSession();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (sessionTime > 60) {
      handleLogSession();
    }
    setTimeLeft(25 * 60);
    setSessionTime(0);
  };

  const handleLogSession = () => {
    const minutes = Math.floor(sessionTime / 60);
    if (minutes > 0) {
      logSession.mutate({
        data: {
          minutes,
          topic: topic || "General Study"
        }
      }, {
        onSuccess: () => {
          toast.success(`Logged ${minutes} minutes of study time!`);
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        }
      });
    } else {
      toast.info("Session too short to log.");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Student</h1>
          <p className="text-muted-foreground mt-1">Here is an overview of your learning journey today.</p>
        </div>
        <div className="bg-card border rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
          <div className="bg-accent/20 p-2 rounded-full">
            <Flame className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Current Streak</div>
            <div className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : `${summary?.currentStreak || 0} Days`}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${Math.floor((summary?.totalStudyMinutes || 0) / 60)}h ${(summary?.totalStudyMinutes || 0) % 60}m`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total minutes logged</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
            <Lightbulb className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : summary?.quizzesCompleted || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all subjects</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cards Learned</CardTitle>
            <BookOpen className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : summary?.flashcardsLearned || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mastered concepts</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
            <Target className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${summary?.weeklyStudiedMinutes || 0} / ${summary?.weeklyGoalMinutes || 0}m`}
            </div>
            <Progress 
              value={isLoading ? 0 : Math.min(100, ((summary?.weeklyStudiedMinutes || 0) / Math.max(1, summary?.weeklyGoalMinutes || 1)) * 100)} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Study Timer</CardTitle>
              <CardDescription>Stay focused with Pomodoro technique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/30 p-6 rounded-2xl border gap-6">
                <div className="text-6xl font-mono font-bold tracking-tighter">
                  {formatTime(timeLeft)}
                </div>
                <div className="w-full sm:w-auto space-y-4">
                  <Input 
                    placeholder="What are you studying?" 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    disabled={isActive}
                    className="w-full sm:w-64"
                  />
                  <div className="flex gap-2">
                    <Button onClick={toggleTimer} className="flex-1 gap-2" variant={isActive ? "secondary" : "default"}>
                      {isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isActive ? "Pause" : "Start"}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" className="gap-2">
                      <Timer className="h-4 w-4" /> Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>What would you like to do today?</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors" asChild>
                <Link href="/chat">
                  <MessageSquare className="h-6 w-6" />
                  <span>Ask AI Tutor</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 hover:border-chart-4 hover:text-chart-4 transition-colors" asChild>
                <Link href="/quizzes">
                  <Lightbulb className="h-6 w-6" />
                  <span>Generate Quiz</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 hover:border-chart-2 hover:text-chart-2 transition-colors" asChild>
                <Link href="/planner">
                  <CalendarDays className="h-6 w-6" />
                  <span>Create Study Plan</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 hover:border-chart-3 hover:text-chart-3 transition-colors" asChild>
                <Link href="/flashcards">
                  <BrainCircuit className="h-6 w-6" />
                  <span>Review Flashcards</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
          
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground border-primary overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="h-24 w-24" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-primary-foreground">Level {summary?.level || 1}</CardTitle>
              <CardDescription className="text-primary-foreground/80">Learning Scholar</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>{summary?.xpPoints || 0} XP</span>
                <span>{(summary?.level || 1) * 1000} XP</span>
              </div>
              <Progress 
                value={((summary?.xpPoints || 0) % 1000) / 10} 
                className="bg-primary-foreground/20" 
                // @ts-ignore
                indicatorClassName="bg-white"
              />
              <p className="text-xs mt-3 text-primary-foreground/80 font-medium">
                {1000 - ((summary?.xpPoints || 0) % 1000)} XP to next level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : summary?.recentActivity?.length ? (
                <div className="space-y-4">
                  {summary.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div className="bg-secondary p-2 rounded-full">
                        {activity.type === 'quiz' && <Lightbulb className="h-4 w-4 text-chart-4" />}
                        {activity.type === 'flashcard' && <BookOpen className="h-4 w-4 text-chart-3" />}
                        {activity.type === 'plan' && <CalendarDays className="h-4 w-4 text-chart-2" />}
                        {activity.type === 'chat' && <MessageSquare className="h-4 w-4 text-primary" />}
                        {!['quiz', 'flashcard', 'plan', 'chat'].includes(activity.type) && <Activity className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No recent activity.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">💡</div>
              <p className="font-serif italic text-lg text-foreground mb-4">
                "The beautiful thing about learning is nobody can take it away from you."
              </p>
              <p className="text-sm font-medium text-muted-foreground">— B.B. King</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
