import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BrainCircuit, BookOpen, Target, Zap, ChevronRight, Star, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <BrainCircuit className="h-6 w-6" />
          <span>LearnGenie</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Button asChild className="rounded-full px-6">
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">The future of studying is here</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6"
            >
              Your AI Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Companion</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Stop studying harder, start studying smarter. LearnGenie uses advanced AI to create personalized study plans, generate quizzes, and act as your 24/7 tutor.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" asChild className="rounded-full px-8 py-6 text-lg h-auto shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <Link href="/dashboard">
                  Start Learning Free <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-16 flex items-center justify-center gap-8 text-muted-foreground text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <span>50k+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-accent fill-accent" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 hidden sm:flex">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <span>1M+ Questions Answered</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-secondary/50 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to ace it</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A unified workspace that replaces your fragmented study tools with an intelligent, cohesive experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: MessageSquare,
                  title: "AI Tutor 24/7",
                  desc: "Stuck on a concept? Chat with an AI tutor that explains things in simple terms and guides you to the answer without just giving it away."
                },
                {
                  icon: Target,
                  title: "Personalized Plans",
                  desc: "Input your goal and deadline, and we'll generate a realistic, structured daily study plan broken down by topics."
                },
                {
                  icon: Zap,
                  title: "Smart Quizzes",
                  desc: "Instantly generate practice quizzes on any topic to test your knowledge and identify your weak spots before the real exam."
                },
                {
                  icon: BookOpen,
                  title: "Spaced Repetition",
                  desc: "Our flashcard system uses proven cognitive science to ensure you review concepts exactly when you're about to forget them."
                },
                {
                  icon: TrendingUp,
                  title: "Progress Analytics",
                  desc: "Visualize your learning journey with beautiful charts that track your study time, quiz scores, and daily streaks."
                },
                {
                  icon: FileText,
                  title: "Intelligent Notes",
                  desc: "Take structured notes that are automatically tagged and linked to your study topics for easy retrieval."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-primary text-primary-foreground text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform how you learn?</h2>
            <p className="text-xl mb-10 text-primary-foreground/80">
              Join thousands of students who are achieving their academic goals with LearnGenie AI.
            </p>
            <Button size="lg" variant="secondary" asChild className="rounded-full px-8 py-6 text-lg h-auto shadow-lg hover:shadow-xl transition-all">
              <Link href="/dashboard">
                Create Your Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t py-12 px-6 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 font-bold text-xl text-primary mb-4">
          <BrainCircuit className="h-6 w-6" />
          <span>LearnGenie</span>
        </div>
        <p>© 2025 LearnGenie AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Temporary icon import fallback
import { MessageSquare, TrendingUp, FileText, User } from "lucide-react";
