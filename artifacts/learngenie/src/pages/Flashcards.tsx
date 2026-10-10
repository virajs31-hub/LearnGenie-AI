import { useState } from "react";
import { useListFlashcardSets, useCreateFlashcardSet, getListFlashcardSetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, BrainCircuit, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

export default function Flashcards() {
  const queryClient = useQueryClient();
  const { data: sets, isLoading } = useListFlashcardSets();
  const createSet = useCreateFlashcardSet();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    cardCount: "10"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSet.mutate({
      data: {
        ...formData,
        cardCount: parseInt(formData.cardCount) || 10
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFlashcardSetsQueryKey() });
        setOpen(false);
        setFormData({ title: "", topic: "", cardCount: "10" });
        toast.success("Flashcard set generated!");
      },
      onError: () => toast.error("Failed to generate set")
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-muted-foreground mt-1">Spaced repetition for long-term memory.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Generate Set</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Flashcard Set</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Set Title</Label>
                <Input required value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} placeholder="e.g. Biology 101 Vocab" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Topic Source</Label>
                  <Input required value={formData.topic} onChange={e => setFormData(p => ({...p, topic: e.target.value}))} placeholder="e.g. Cell Division" />
                </div>
                <div className="space-y-2">
                  <Label>Card Count</Label>
                  <Select value={formData.cardCount} onValueChange={v => setFormData(p => ({...p, cardCount: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Cards</SelectItem>
                      <SelectItem value="10">10 Cards</SelectItem>
                      <SelectItem value="20">20 Cards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createSet.isPending}>
                {createSet.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Cards"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : sets?.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-xl bg-muted/20">
            <BrainCircuit className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No flashcards yet</h3>
            <p className="text-muted-foreground mb-4">Generate your first deck using AI.</p>
            <Button onClick={() => setOpen(true)} variant="outline">Generate Set</Button>
          </div>
        ) : (
          sets?.map(set => {
            const progress = set.totalCards > 0 ? (set.learnedCards / set.totalCards) * 100 : 0;
            return (
              <Link key={set.id} href={`/flashcards/${set.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all h-full flex flex-col hover:border-chart-3">
                  <CardHeader className="pb-3 flex-1">
                    <CardTitle className="text-xl line-clamp-1">{set.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{set.topic}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                      <Layers className="h-4 w-4" /> {set.totalCards} Cards
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={progress === 100 ? "text-primary" : ""}>Mastery</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
