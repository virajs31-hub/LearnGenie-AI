import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetQuiz, useSubmitQuizResult, getGetQuizQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy, Timer } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function QuizDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: quiz, isLoading } = useGetQuiz(parseInt(id!), {
    query: { enabled: !!id, queryKey: getGetQuizQueryKey(parseInt(id!)) }
  });
  
  const submitResult = useSubmitQuizResult();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (!timerActive || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeTaken(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, isSubmitted]);

  if (isLoading || !quiz) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full max-w-2xl mx-auto" /></div>;
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSelectAnswer = (val: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast.error("Please select an answer");
      return;
    }
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    setTimerActive(false);
    const answersList = Object.entries(answers).map(([qId, ans]) => ({
      questionId: parseInt(qId),
      answer: ans
    }));

    submitResult.mutate({
      id: quiz.id,
      data: {
        answers: answersList,
        timeTakenSeconds: timeTaken
      }
    }, {
      onSuccess: (result) => {
        setIsSubmitted(true);
        if (result.score >= 80) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quiz.id) });
      },
      onError: () => toast.error("Failed to submit quiz")
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isSubmitted && submitResult.data) {
    const result = submitResult.data;
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <Button variant="ghost" onClick={() => setLocation("/quizzes")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Button>
        <Card className="text-center overflow-hidden">
          <div className={`h-2 ${result.score >= 80 ? 'bg-primary' : result.score >= 60 ? 'bg-accent' : 'bg-destructive'}`} />
          <CardHeader className="pb-2">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Trophy className={`h-8 w-8 ${result.score >= 80 ? 'text-primary' : result.score >= 60 ? 'text-accent' : 'text-destructive'}`} />
            </div>
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
            <CardDescription className="text-lg">Here is how you did on {quiz.topic}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-bold font-mono py-4">
              {result.score}%
            </div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-muted-foreground">Score</p>
                <p className="font-bold text-lg">{result.correctAnswers} / {result.totalQuestions}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-bold text-lg">{formatTime(timeTaken)}</p>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-left mt-6">
              <h4 className="font-semibold mb-2">Feedback</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.feedback}</p>
            </div>
          </CardContent>
          <CardFooter className="justify-center gap-4 border-t pt-6 pb-6">
            <Button variant="outline" onClick={() => setLocation("/quizzes")}>Finish</Button>
            <Button onClick={() => window.location.reload()}>Retake Quiz</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/quizzes")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Exit Quiz
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium bg-muted px-3 py-1.5 rounded-md">
          <Timer className="h-4 w-4" /> {formatTime(timeTaken)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="min-h-[400px] flex flex-col shadow-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl leading-snug font-serif">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <RadioGroup 
            value={answers[currentQuestion.id] || ""} 
            onValueChange={handleSelectAnswer}
            className="space-y-3 mt-4"
          >
            {currentQuestion.options?.map((opt, i) => (
              <Label 
                key={i} 
                className={`
                  flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:bg-muted/50
                  ${answers[currentQuestion.id] === opt ? 'border-primary bg-primary/5 shadow-sm' : ''}
                `}
              >
                <RadioGroupItem value={opt} id={`q${currentQuestion.id}-o${i}`} className="mt-0.5" />
                <span className="text-base font-normal leading-relaxed">{opt}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="border-t pt-6 bg-muted/10">
          <Button 
            className="w-full sm:w-auto ml-auto gap-2" 
            size="lg"
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || submitResult.isPending}
          >
            {isLastQuestion ? "Submit Quiz" : "Next Question"} <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
