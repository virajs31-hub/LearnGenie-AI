import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MainLayout } from "@/components/MainLayout";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Planner from "@/pages/Planner";
import Quizzes from "@/pages/Quizzes";
import QuizDetail from "@/pages/QuizDetail";
import Flashcards from "@/pages/Flashcards";
import FlashcardDetail from "@/pages/FlashcardDetail";
import Progress from "@/pages/Progress";
import Notes from "@/pages/Notes";
import Profile from "@/pages/Profile";
import Insights from "@/pages/Insights";
import Calendar from "@/pages/Calendar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      <Route path="/dashboard">
        <MainLayout><Dashboard /></MainLayout>
      </Route>
      
      <Route path="/chat">
        <MainLayout><Chat /></MainLayout>
      </Route>
      <Route path="/chat/:id">
        <MainLayout><Chat /></MainLayout>
      </Route>
      
      <Route path="/planner">
        <MainLayout><Planner /></MainLayout>
      </Route>
      
      <Route path="/quizzes">
        <MainLayout><Quizzes /></MainLayout>
      </Route>
      <Route path="/quizzes/:id">
        <MainLayout><QuizDetail /></MainLayout>
      </Route>
      
      <Route path="/flashcards">
        <MainLayout><Flashcards /></MainLayout>
      </Route>
      <Route path="/flashcards/:id">
        <MainLayout><FlashcardDetail /></MainLayout>
      </Route>
      
      <Route path="/progress">
        <MainLayout><Progress /></MainLayout>
      </Route>
      
      <Route path="/notes">
        <MainLayout><Notes /></MainLayout>
      </Route>

      <Route path="/insights">
        <MainLayout><Insights /></MainLayout>
      </Route>

      <Route path="/calendar">
        <MainLayout><Calendar /></MainLayout>
      </Route>

      <Route path="/profile">
        <MainLayout><Profile /></MainLayout>
      </Route>

      <Route>
        <MainLayout><NotFound /></MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="learngenie-theme">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
