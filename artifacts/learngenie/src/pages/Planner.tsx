import { useState } from "react";
import { useListStudyPlans, useCreateStudyPlan, useDeleteStudyPlan, getListStudyPlansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, Loader2, Plus, Target, Trash2, ChevronDown, BookOpen, ListChecks, Lightbulb, Clock, Flag, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface PlanData {
  dailySchedule?: Array<{ day: string; tasks: string[]; hours: number }>;
  weeklyPlan?: Array<{ week: number; focus: string; topics: string[] }>;
  priorityTopics?: string[];
  milestones?: Array<{ week: number; milestone: string }>;
  revisionSchedule?: string;
  tips?: string[];
}

function PlanView({ planContent }: { planContent: string }) {
  let plan: PlanData = {};
  try {
    plan = JSON.parse(planContent);
  } catch {
    return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{planContent}</p>;
  }

  return (
    <Accordion type="multiple" defaultValue={["weekly", "priority"]} className="w-full">
      {plan.weeklyPlan && plan.weeklyPlan.length > 0 && (
        <AccordionItem value="weekly">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Weekly Plan</span>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-3 pr-2">
                {plan.weeklyPlan.map((w) => (
                  <div key={w.week} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">Week {w.week}</Badge>
                      <span className="text-sm font-medium">{w.focus}</span>
                    </div>
                    <ul className="space-y-1">
                      {w.topics.map((t, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      )}

      {plan.dailySchedule && plan.dailySchedule.length > 0 && (
        <AccordionItem value="daily">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-chart-2" /> Daily Schedule</span>
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-3 pr-2">
                {plan.dailySchedule.map((d) => (
                  <div key={d.day} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{d.day}</span>
                      <Badge variant="outline" className="text-xs">{d.hours}h</Badge>
                    </div>
                    <ul className="space-y-1">
                      {d.tasks.map((t, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ListChecks className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      )}

      {plan.priorityTopics && plan.priorityTopics.length > 0 && (
        <AccordionItem value="priority">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2"><Flag className="h-4 w-4 text-chart-4" /> Priority Topics</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {plan.priorityTopics.map((t, i) => (
                <Badge key={i} variant="secondary">{t}</Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {plan.milestones && plan.milestones.length > 0 && (
        <AccordionItem value="milestones">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2"><Target className="h-4 w-4 text-chart-3" /> Milestones</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {plan.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="shrink-0">Wk {m.week}</Badge>
                  <span className="text-muted-foreground">{m.milestone}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {plan.revisionSchedule && (
        <AccordionItem value="revision">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-chart-1" /> Revision Strategy</span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">{plan.revisionSchedule}</p>
          </AccordionContent>
        </AccordionItem>
      )}

      {plan.tips && plan.tips.length > 0 && (
        <AccordionItem value="tips">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent" /> Study Tips</span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {plan.tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

export default function Planner() {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useListStudyPlans();
  const createPlan = useCreateStudyPlan();
  const deletePlan = useDeleteStudyPlan();
  
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    goal: "",
    targetExam: "",
    hoursPerDay: "2",
    deadline: "",
    skillLevel: "beginner"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlan.mutate({
      data: { ...formData, hoursPerDay: parseInt(formData.hoursPerDay) || 2 }
    }, {
      onSuccess: (plan) => {
        queryClient.invalidateQueries({ queryKey: getListStudyPlansQueryKey() });
        setOpen(false);
        setFormData({ subject: "", goal: "", targetExam: "", hoursPerDay: "2", deadline: "", skillLevel: "beginner" });
        setExpandedId(plan.id);
        toast.success("Study plan created!");
      },
      onError: () => toast.error("Failed to create study plan")
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-muted-foreground mt-1">AI-generated structured study schedules.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Plan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input required value={formData.subject} onChange={e => setFormData(p => ({...p, subject: e.target.value}))} placeholder="e.g. Calculus I" />
              </div>
              <div className="space-y-2">
                <Label>Main Goal</Label>
                <Input required value={formData.goal} onChange={e => setFormData(p => ({...p, goal: e.target.value}))} placeholder="e.g. Master integration" />
              </div>
              <div className="space-y-2">
                <Label>Target Exam (optional)</Label>
                <Input value={formData.targetExam} onChange={e => setFormData(p => ({...p, targetExam: e.target.value}))} placeholder="e.g. Final Exam, SAT" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select value={formData.skillLevel} onValueChange={v => setFormData(p => ({...p, skillLevel: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hours/Day</Label>
                  <Input type="number" min="1" max="12" required value={formData.hoursPerDay} onChange={e => setFormData(p => ({...p, hoursPerDay: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deadline (optional)</Label>
                <Input type="date" value={formData.deadline} onChange={e => setFormData(p => ({...p, deadline: e.target.value}))} />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createPlan.isPending}>
                {createPlan.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Plan…</> : "Generate Plan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : plans?.length === 0 ? (
          <div className="text-center py-16 border rounded-xl bg-muted/20">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No study plans yet</h3>
            <p className="text-muted-foreground mb-4">Create your first AI-generated study plan.</p>
            <Button onClick={() => setOpen(true)} variant="outline">Create Plan</Button>
          </div>
        ) : (
          plans?.map(plan => (
            <motion.div key={plan.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs text-primary border-primary/30 capitalize">{plan.skillLevel}</Badge>
                        <Badge variant="secondary" className="text-xs">{plan.hoursPerDay}h / day</Badge>
                        {plan.deadline && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(plan.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{plan.subject}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        <Target className="h-3.5 w-3.5" /> {plan.goal}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === plan.id ? 'rotate-180' : ''}`} />
                        {expandedId === plan.id ? 'Hide' : 'View Plan'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePlan.mutate({ id: plan.id }, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListStudyPlansQueryKey() })
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {expandedId === plan.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 border-t">
                        <div className="pt-4">
                          <PlanView planContent={plan.planContent} />
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
