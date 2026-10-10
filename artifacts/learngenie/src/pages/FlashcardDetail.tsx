import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useGetFlashcardSet, useUpdateFlashcardStatus, getGetFlashcardSetQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCw, CheckCircle2, Bookmark, BookmarkCheck, ArrowRight, ArrowLeft as ArrowLeftIcon, Shuffle, RefreshCw, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function FlashcardDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: set, isLoading } = useGetFlashcardSet(parseInt(id!), {
    query: { enabled: !!id, queryKey: getGetFlashcardSetQueryKey(parseInt(id!)) }
  });
  
  const updateStatus = useUpdateFlashcardStatus();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[] | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [filter, setFilter] = useState<"all" | "review" | "learned">("all");

  const allCards = set?.cards ?? [];

  const filteredCards = useMemo(() => {
    const base = shuffledOrder
      ? shuffledOrder.map(i => allCards[i]).filter(Boolean)
      : [...allCards];
    if (filter === "learned") return base.filter(c => c.isLearned);
    if (filter === "review") return base.filter(c => !c.isLearned);
    return base;
  }, [allCards, shuffledOrder, filter]);

  if (isLoading || !set) {
    return <div className="p-8 max-w-2xl mx-auto"><Skeleton className="h-[400px] w-full" /></div>;
  }

  const cards = filteredCards;
  const safeIndex = Math.min(currentIndex, Math.max(0, cards.length - 1));
  const currentCard = cards[safeIndex];
  
  if (!currentCard) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <RotateCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-bold mb-2">No cards match this filter.</h2>
        <p className="text-muted-foreground mb-6">Try switching to "All Cards" mode.</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => setFilter("all")}>Show All Cards</Button>
          <Button variant="outline" onClick={() => setLocation("/flashcards")}>Back to Sets</Button>
        </div>
      </div>
    );
  }

  const totalLearned = allCards.filter(c => c.isLearned).length;
  const progress = allCards.length > 0 ? (totalLearned / allCards.length) * 100 : 0;

  const goNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => (prev + 1) % cards.length), 80);
  };

  const goPrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length), 80);
  };

  const handleShuffle = () => {
    const indices = Array.from({ length: allCards.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledOrder(indices);
    setCurrentIndex(0);
    setIsFlipped(false);
    toast.success("Cards shuffled!");
  };

  const handleResetOrder = () => {
    setShuffledOrder(null);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleToggleLearned = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !currentCard.isLearned;
    updateStatus.mutate(
      { id: currentCard.id, data: { isLearned: newVal } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFlashcardSetQueryKey(set.id) });
          if (newVal) {
            toast.success("Marked as learned! ✓");
            goNext();
          } else {
            toast("Marked for review");
          }
        }
      }
    );
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate(
      { id: currentCard.id, data: { isBookmarked: !currentCard.isBookmarked } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFlashcardSetQueryKey(set.id) }) }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => setLocation("/flashcards")} className="gap-2 shrink-0">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant={shuffledOrder ? "secondary" : "outline"} size="sm" className="gap-1.5" onClick={shuffledOrder ? handleResetOrder : handleShuffle}>
            <Shuffle className="h-3.5 w-3.5" />
            {shuffledOrder ? "Ordered" : "Shuffle"}
          </Button>
          <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
            {(["all", "review", "learned"] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentIndex(0); setIsFlipped(false); }}
                className={`px-3 py-1.5 transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
              >
                {f === "all" ? "All" : f === "review" ? "Review" : "Learned"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Title & progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold truncate">{set.title}</h1>
          <span className="text-sm font-semibold text-muted-foreground shrink-0 ml-2">
            {safeIndex + 1} <span className="text-muted-foreground/50">/</span> {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">{totalLearned}/{allCards.length} learned</span>
        </div>
      </div>

      {/* Card */}
      <div className="relative h-[360px] sm:h-[400px] w-full" style={{ perspective: "1200px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${safeIndex}-${isFlipped ? 'b' : 'f'}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 40, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => setIsFlipped(f => !f)}
          >
            <div className={`
              w-full h-full rounded-2xl border-2 shadow-md flex flex-col p-6 sm:p-10 select-none
              transition-colors duration-200
              ${currentCard.isLearned
                ? 'bg-primary/5 border-primary/40'
                : isFlipped
                  ? 'bg-card border-chart-3/40'
                  : 'bg-card border-border'}
            `}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant={isFlipped ? "default" : "secondary"} className="text-xs">
                    {isFlipped ? "Answer" : "Question"}
                  </Badge>
                  {currentCard.isLearned && (
                    <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Learned</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={handleToggleBookmark}
                >
                  {currentCard.isBookmarked
                    ? <BookmarkCheck className="h-5 w-5 text-accent fill-accent" />
                    : <Bookmark className="h-5 w-5 text-muted-foreground hover:text-accent" />}
                </Button>
              </div>
              
              <div className="flex-1 flex items-center justify-center text-center overflow-auto">
                <p className="text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground/50 text-xs">
                <RotateCw className="h-3.5 w-3.5" />
                <span>Click to {isFlipped ? "show question" : "reveal answer"}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation & actions */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Button variant="outline" size="lg" onClick={goPrev} className="gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant={currentCard.isLearned ? "outline" : "secondary"}
            size="sm"
            className="flex-1 gap-1.5 text-xs sm:text-sm"
            onClick={handleToggleLearned}
            disabled={updateStatus.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{currentCard.isLearned ? "Review Again" : "Review"}</span>
          </Button>
          <Button
            variant={currentCard.isLearned ? "default" : "secondary"}
            size="sm"
            className="flex-1 gap-1.5 text-xs sm:text-sm"
            onClick={handleToggleLearned}
            disabled={updateStatus.isPending}
          >
            <CheckCircle2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${currentCard.isLearned ? '' : 'opacity-50'}`} />
            <span className="hidden sm:inline">{currentCard.isLearned ? "Learned ✓" : "Mark Learned"}</span>
          </Button>
        </div>

        <Button variant="outline" size="lg" onClick={goNext} className="gap-2">
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="text-center p-3 rounded-xl bg-muted/40 border">
          <div className="text-lg font-bold text-primary">{allCards.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/40 border">
          <div className="text-lg font-bold text-chart-3">{totalLearned}</div>
          <div className="text-xs text-muted-foreground">Learned</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/40 border">
          <div className="text-lg font-bold text-chart-4">{allCards.length - totalLearned}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>
    </div>
  );
}
