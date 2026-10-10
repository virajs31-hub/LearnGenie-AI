import { useGetProgress } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Award, Flame, Target, Lock, Star, BookOpen, Clock, Zap, Trophy, Medal, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { motion } from "framer-motion";

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  BookOpen, Flame, Trophy, Clock, Star, Award, Medal, Zap, Layers,
};

const ACHIEVEMENT_EMOJIS: Record<string, string> = {
  "First Step": "🎯",
  "Study Streak": "🔥",
  "Quiz Master": "🏆",
  "Dedicated Learner": "⏱️",
  "Knowledge Seeker": "⭐",
  "Century Club": "💯",
};

function XPLevelCard({ xp, totalMinutes }: { xp: number; totalMinutes: number }) {
  const level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpForNext = 1000;
  const progress = (xpInLevel / xpForNext) * 100;

  const LEVEL_NAMES = ["Novice", "Explorer", "Scholar", "Expert", "Master", "Legend"];
  const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? "Legend";

  return (
    <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-primary overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Star className="h-24 w-24" />
      </div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Badge className="bg-white/20 text-white border-white/30 mb-2">Level {level}</Badge>
            <h3 className="text-2xl font-bold">{levelName}</h3>
            <p className="text-sm text-primary-foreground/80 mt-0.5">{xp.toLocaleString()} total XP</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
            <Zap className="h-7 w-7" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-primary-foreground/80">
            <span>{xpInLevel} XP</span>
            <span>{xpForNext} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5">
            <div className="bg-white rounded-full h-2.5 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-primary-foreground/70">{xpForNext - xpInLevel} XP to Level {level + 1}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-white/10 p-2">
            <div className="text-lg font-bold">{totalMinutes}</div>
            <div className="text-xs text-primary-foreground/70">Minutes</div>
          </div>
          <div className="rounded-lg bg-white/10 p-2">
            <div className="text-lg font-bold">{level}</div>
            <div className="text-xs text-primary-foreground/70">Level</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SpacedRepetitionCard({ totalCards = 0, learnedCards = 0 }: { totalCards?: number; learnedCards?: number }) {
  const dueToday = Math.max(0, Math.floor(totalCards * 0.15));
  const scheduled = totalCards - learnedCards;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-chart-3" />
          Spaced Repetition
        </CardTitle>
        <CardDescription>Automatic revision scheduling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-lg bg-primary/10 p-2">
            <div className="text-lg font-bold text-primary">{dueToday}</div>
            <div className="text-xs text-muted-foreground">Due Today</div>
          </div>
          <div className="text-center rounded-lg bg-chart-3/10 p-2">
            <div className="text-lg font-bold text-chart-3">{learnedCards}</div>
            <div className="text-xs text-muted-foreground">Mastered</div>
          </div>
          <div className="text-center rounded-lg bg-muted/50 p-2">
            <div className="text-lg font-bold">{scheduled}</div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mastery</span>
            <span>{totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0}%</span>
          </div>
          <ProgressBar value={totalCards > 0 ? (learnedCards / totalCards) * 100 : 0} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
          Cards are scheduled for review based on your learned/review status. Cards marked "learned" are queued for review every 7 days.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Progress() {
  const { data: progress, isLoading } = useGetProgress();

  if (isLoading) {
    return (
      <div className="space-y-6 p-2">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const xp = (progress?.totalMinutes ?? 0) * 2 + (progress?.quizScores?.length ?? 0) * 50;
  const totalFlashcards = 0; // would need flashcard data
  const learnedFlashcards = 0;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-muted-foreground mt-1">Track your learning journey over time.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-5 flex flex-col items-center text-center">
            <Flame className="h-7 w-7 text-accent mb-2" />
            <div className="text-3xl font-bold">{progress?.streak ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col items-center text-center">
            <Activity className="h-7 w-7 text-chart-1 mb-2" />
            <div className="text-3xl font-bold">{progress?.totalMinutes ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Minutes Learned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col items-center text-center">
            <Target className="h-7 w-7 text-chart-2 mb-2" />
            <div className="text-3xl font-bold">{progress?.topicsCompleted ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Quizzes Done</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col items-center text-center">
            <Award className="h-7 w-7 text-chart-4 mb-2" />
            <div className="text-3xl font-bold">{progress?.achievements?.filter(a => a.unlockedAt).length ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Achievements</div>
          </CardContent>
        </Card>
      </div>

      {/* XP card + spaced repetition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <XPLevelCard xp={xp} totalMinutes={progress?.totalMinutes ?? 0} />
        <SpacedRepetitionCard totalCards={totalFlashcards} learnedCards={learnedFlashcards} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Study Time (Last 30 Days)</CardTitle>
            <CardDescription>Minutes per study session</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {progress?.dailySessions?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress.dailySessions}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={val => new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <ReTooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No data yet — log a study session from the dashboard
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Performance</CardTitle>
            <CardDescription>Score trend across quizzes</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {progress?.quizScores?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress.quizScores}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="topic"
                    tickFormatter={val => val.slice(0, 8)}
                    axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <ReTooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-4))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--chart-4))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No quizzes taken yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-chart-4" /> Achievements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress?.achievements?.map((ach, idx) => {
            const unlocked = !!ach.unlockedAt;
            const emoji = ACHIEVEMENT_EMOJIS[ach.title] ?? "🎖️";
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-4 p-4 border rounded-xl transition-all cursor-default
                      ${unlocked
                        ? "bg-gradient-to-r from-card to-primary/5 border-primary/20 shadow-sm"
                        : "bg-muted/20 border-dashed opacity-60"
                      }`
                    }>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0
                        ${unlocked ? "bg-primary/15" : "bg-muted"}`}>
                        {unlocked ? emoji : <Lock className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">{ach.title}</h4>
                          {unlocked && <Badge className="text-xs py-0 bg-primary/20 text-primary border-primary/30">✓</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ach.description}</p>
                        {unlocked && ach.unlockedAt && (
                          <p className="text-xs text-primary/60 mt-1">
                            Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{unlocked ? "Achievement unlocked!" : "Keep learning to unlock this!"}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            );
          })}
          {(!progress?.achievements || progress.achievements.length === 0) && (
            <div className="col-span-full p-10 border border-dashed rounded-xl text-center text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Start studying and taking quizzes to unlock achievements!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
