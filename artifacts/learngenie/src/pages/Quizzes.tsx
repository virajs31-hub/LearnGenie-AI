import { useState } from "react";
import { useListQuizzes, useCreateQuiz, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Lightbulb, PlayCircle, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function Quizzes() {
  const queryClient = useQueryClient();
  const { data: quizzes, isLoading } = useListQuizzes();
  const createQuiz = useCreateQuiz();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    difficulty: "medium",
    questionCount: "5",
    questionType: "multiple_choice"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuiz.mutate({
      data: {
        ...formData,
        questionCount: parseInt(formData.questionCount) || 5
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey() });
        setOpen(false);
        setFormData({ topic: "", difficulty: "medium", questionCount: "5", questionType: "multiple_choice" });
        toast.success("Quiz generated!");
      },
      onError: () => toast.error("Failed to generate quiz")
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Quizzes</h1>
          <p className="text-muted-foreground mt-1">Test your knowledge on any topic.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Generate Quiz</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate AI Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input required value={formData.topic} onChange={e => setFormData(p => ({...p, topic: e.target.value}))} placeholder="e.g. French Revolution" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={v => setFormData(p => ({...p, difficulty: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Questions</Label>
                  <Select value={formData.questionCount} onValueChange={v => setFormData(p => ({...p, questionCount: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createQuiz.isPending}>
                {createQuiz.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Quiz"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : quizzes?.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-xl bg-muted/20">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No quizzes generated</h3>
            <p className="text-muted-foreground mb-4">Challenge yourself by generating a quiz.</p>
            <Button onClick={() => setOpen(true)} variant="outline">Generate Quiz</Button>
          </div>
        ) : (
          quizzes?.map(quiz => (
            <Card key={quiz.id} className="hover-elevate transition-all border-l-4 border-l-chart-4">
              <CardHeader className="pb-3">
                <CardDescription className="capitalize font-semibold text-xs text-muted-foreground mb-1 flex items-center justify-between">
                  <span>{quiz.difficulty}</span>
                  <span>{quiz.questions?.length || 0} Qs</span>
                </CardDescription>
                <CardTitle className="text-xl line-clamp-1">{quiz.topic}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-6 text-sm">
                  {quiz.lastScore != null ? (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Trophy className="h-4 w-4" /> Last Score: {quiz.lastScore}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not attempted yet</span>
                  )}
                </div>
                <Button asChild className="w-full gap-2 variant-outline group bg-secondary text-secondary-foreground hover:bg-chart-4 hover:text-white border-0">
                  <Link href={`/quizzes/${quiz.id}`}>
                    <PlayCircle className="h-4 w-4 group-hover:scale-110 transition-transform" /> Start Quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
