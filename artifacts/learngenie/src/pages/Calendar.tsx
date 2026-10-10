import { useState } from "react";
import { useGetProgress, useListStudyPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { CalendarDays, Clock, BookOpen, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function Calendar() {
  const { data: progress, isLoading: loadingProgress } = useGetProgress();
  const { data: plans, isLoading: loadingPlans } = useListStudyPlans();
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());

  const isLoading = loadingProgress || loadingPlans;

  // Build a map: date string → { minutes, sessions }
  const sessionMap = new Map<string, { minutes: number; sessions: number }>();
  for (const session of progress?.dailySessions ?? []) {
    const key = session.date;
    const existing = sessionMap.get(key) ?? { minutes: 0, sessions: 0 };
    sessionMap.set(key, { minutes: existing.minutes + session.minutes, sessions: existing.sessions + 1 });
  }

  // Highlight days with sessions
  const studyDays = Array.from(sessionMap.keys()).map(k => new Date(k + "T12:00:00"));

  const selectedKey = selected ? formatDate(selected) : null;
  const selectedData = selectedKey ? sessionMap.get(selectedKey) : null;

  // Build activity data for the 7-day summary
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const maxMinutes = Math.max(...last7.map(d => sessionMap.get(formatDate(d))?.minutes ?? 0), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          Study Calendar
        </h1>
        <p className="text-muted-foreground mt-1">Your study sessions and schedule at a glance.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly View</CardTitle>
              <CardDescription className="text-xs">Highlighted days = study sessions logged</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-0">
              <CalendarUI
                mode="single"
                selected={selected}
                onSelect={setSelected}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                modifiers={{ studied: studyDays }}
                modifiersClassNames={{
                  studied: "bg-primary/20 text-primary font-semibold rounded-lg",
                }}
                className="rounded-lg"
              />
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Selected day detail */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {selected
                    ? selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                    : "Select a day"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div key={selectedKey ?? "none"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {selectedData ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-primary/10 p-3 text-center">
                            <div className="text-2xl font-bold text-primary">{selectedData.minutes}</div>
                            <div className="text-xs text-muted-foreground">Minutes studied</div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <div className="text-2xl font-bold">{selectedData.sessions}</div>
                            <div className="text-xs text-muted-foreground">Sessions</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                          <Flame className="h-4 w-4 text-accent" />
                          Great work! You spent {selectedData.minutes} minute{selectedData.minutes !== 1 ? "s" : ""} studying on this day.
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No study sessions recorded for this day.</p>
                        <p className="text-xs mt-1">Use the Dashboard timer to log study time.</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* 7-day bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Last 7 Days Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-24">
                  {last7.map((d, i) => {
                    const data = sessionMap.get(formatDate(d));
                    const mins = data?.minutes ?? 0;
                    const height = Math.max(4, (mins / maxMinutes) * 100);
                    const isToday = formatDate(d) === formatDate(today);
                    const isSelected = selected && formatDate(d) === formatDate(selected);
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                        onClick={() => setSelected(d)}
                      >
                        <span className="text-xs text-muted-foreground">{mins > 0 ? mins : ""}</span>
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            isSelected
                              ? "bg-primary"
                              : mins > 0
                                ? "bg-primary/40"
                                : "bg-muted"
                          } ${isToday ? "ring-2 ring-primary/50 ring-offset-1" : ""}`}
                          style={{ height: `${height}%`, minHeight: "4px" }}
                        />
                        <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                          {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Active study plans */}
            {plans && plans.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Active Study Plans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {plans.slice(0, 3).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{plan.subject}</p>
                          <p className="text-xs text-muted-foreground">{plan.hoursPerDay}h/day · {plan.skillLevel}</p>
                        </div>
                      </div>
                      {plan.deadline && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Due {new Date(plan.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{progress?.streak ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Flame className="h-3 w-3 text-accent" /> Day Streak
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{sessionMap.size}</div>
                  <div className="text-xs text-muted-foreground mt-1">Study Days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{progress?.totalMinutes ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Mins</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
