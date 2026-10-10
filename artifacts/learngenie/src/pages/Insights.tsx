import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  BrainCircuit, Zap, Target, AlertTriangle, FileText, Map,
  RefreshCw, Loader2, Sparkles, ChevronRight, Circle
} from "lucide-react";
import { motion } from "framer-motion";

interface MindMapData {
  center: string;
  branches: Array<{ label: string; color: string; children: string[] }>;
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold mt-4 mb-1 text-foreground">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold mt-3 text-foreground">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ") || line.startsWith("• ")) return (
          <div key={i} className="flex items-start gap-2 text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </div>
        );
        if (line.match(/^\d+\./)) return (
          <div key={i} className="flex items-start gap-2 text-muted-foreground">
            <span className="shrink-0 font-semibold text-primary">{line.match(/^\d+/)![0]}.</span>
            <span>{line.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </div>
        );
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-muted-foreground">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
      })}
    </div>
  );
}

function MindMapSVG({ data }: { data: MindMapData }) {
  const cx = 380, cy = 280;
  const branchRadius = 180;
  const branches = data.branches;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 760 560" className="w-full max-w-2xl mx-auto" style={{ minWidth: 400 }}>
        {branches.map((branch, bi) => {
          const angle = (bi / branches.length) * 2 * Math.PI - Math.PI / 2;
          const bx = cx + branchRadius * Math.cos(angle);
          const by = cy + branchRadius * Math.sin(angle);

          return (
            <g key={bi}>
              <line x1={cx} y1={cy} x2={bx} y2={by} stroke={branch.color} strokeWidth="2" opacity="0.6" />
              {branch.children.map((child, ci) => {
                const childAngle = angle + ((ci - (branch.children.length - 1) / 2) * 0.35);
                const childR = branchRadius + 80;
                const chx = cx + childR * Math.cos(childAngle);
                const chy = cy + childR * Math.sin(childAngle);
                return (
                  <g key={ci}>
                    <line x1={bx} y1={by} x2={chx} y2={chy} stroke={branch.color} strokeWidth="1.2" opacity="0.4" strokeDasharray="4 2" />
                    <circle cx={chx} cy={chy} r="4" fill={branch.color} opacity="0.6" />
                    <text
                      x={chx} y={chy - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fill="currentColor"
                      className="fill-muted-foreground"
                      style={{ fontSize: '9px' }}
                    >
                      {child.length > 18 ? child.slice(0, 18) + "…" : child}
                    </text>
                  </g>
                );
              })}
              <ellipse cx={bx} cy={by} rx={42} ry={16} fill={branch.color} opacity="0.15" />
              <ellipse cx={bx} cy={by} rx={42} ry={16} fill="none" stroke={branch.color} strokeWidth="1.5" opacity="0.6" />
              <text x={bx} y={by + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={branch.color} style={{ fontSize: '10px' }}>
                {branch.label.length > 14 ? branch.label.slice(0, 14) + "…" : branch.label}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={52} fill="hsl(var(--primary))" opacity="0.15" />
        <circle cx={cx} cy={cy} r={52} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="hsl(var(--primary))" style={{ fontSize: '12px' }}>
          {data.center.length > 14 ? data.center.slice(0, 14) + "…" : data.center}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="hsl(var(--primary))" opacity="0.7" style={{ fontSize: '9px' }}>
          {branches.length} branches
        </text>
      </svg>
    </div>
  );
}

function AIAnalysisPanel({
  title,
  description,
  icon: Icon,
  mode,
  extraFields,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  mode: string;
  extraFields?: React.ReactNode;
}) {
  const [result, setResult] = useState("");
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const run = async () => {
    setLoading(true);
    setResult("");
    setMindMapData(null);

    try {
      const body: Record<string, unknown> = { mode };
      if (mode === "mind-map") body.topic = topic;

      const res = await fetch(`${import.meta.env.BASE_URL}api/insights/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.type === "chunk") setResult(prev => prev + data.content);
            if (data.type === "result") setResult(data.content);
            if (data.type === "mind-map") setMindMapData(data.data);
            if (data.type === "error") toast.error(data.content);
          } catch {}
        }
      }
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "mind-map" && (
          <div className="space-y-2">
            <Label className="text-sm">Topic to map</Label>
            <Input
              placeholder="e.g. Photosynthesis, World War II, Calculus…"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
        )}
        {extraFields}

        <Button
          onClick={run}
          disabled={loading || (mode === "mind-map" && !topic.trim())}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Analyzing…" : "Run Analysis"}
        </Button>

        {(result || mindMapData) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-muted/30 p-4">
            {mindMapData ? (
              <div className="space-y-4">
                <MindMapSVG data={mindMapData} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mindMapData.branches.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="text-muted-foreground font-medium truncate">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                <MarkdownRenderer text={result} />
              </ScrollArea>
            )}
          </motion.div>
        )}

        {loading && !result && !mindMapData && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Insights() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          AI Insights
        </h1>
        <p className="text-muted-foreground mt-1">Deep AI-powered analysis of your learning data.</p>
      </div>

      <Tabs defaultValue="gaps">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="gaps" className="gap-1.5 text-xs sm:text-sm"><AlertTriangle className="h-3.5 w-3.5" />Gaps</TabsTrigger>
          <TabsTrigger value="readiness" className="gap-1.5 text-xs sm:text-sm"><Target className="h-3.5 w-3.5" />Readiness</TabsTrigger>
          <TabsTrigger value="mistakes" className="gap-1.5 text-xs sm:text-sm"><BrainCircuit className="h-3.5 w-3.5" />Mistakes</TabsTrigger>
          <TabsTrigger value="adaptive" className="gap-1.5 text-xs sm:text-sm"><RefreshCw className="h-3.5 w-3.5" />Adaptive</TabsTrigger>
          <TabsTrigger value="mindmap" className="gap-1.5 text-xs sm:text-sm"><Map className="h-3.5 w-3.5" />Mind Map</TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5 text-xs sm:text-sm"><FileText className="h-3.5 w-3.5" />Report</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="gaps">
            <AIAnalysisPanel
              mode="knowledge-gaps"
              title="Knowledge Gap Detector"
              description="Analyzes all your quiz results to pinpoint weak topics that need more attention."
              icon={AlertTriangle}
            />
          </TabsContent>

          <TabsContent value="readiness">
            <AIAnalysisPanel
              mode="exam-readiness"
              title="Exam Readiness Score"
              description="Calculates a readiness percentage based on your overall performance and study habits."
              icon={Target}
            />
          </TabsContent>

          <TabsContent value="mistakes">
            <AIAnalysisPanel
              mode="mistake-analysis"
              title="Mistake Analyzer"
              description="Reviews quizzes where you scored below 80% and recommends targeted revision topics."
              icon={BrainCircuit}
            />
          </TabsContent>

          <TabsContent value="adaptive">
            <AIAnalysisPanel
              mode="adaptive-plan"
              title="Adaptive Study Planner"
              description="Recommends adjustments to your study schedule based on completed tasks and quiz performance."
              icon={RefreshCw}
            />
          </TabsContent>

          <TabsContent value="mindmap">
            <AIAnalysisPanel
              mode="mind-map"
              title="Mind Map Generator"
              description="Generates an interactive visual concept map for any study topic."
              icon={Map}
            />
          </TabsContent>

          <TabsContent value="report">
            <AIAnalysisPanel
              mode="weekly-report"
              title="Weekly AI Learning Report"
              description="A concise personalized summary of your study week with strengths, gaps, and next steps."
              icon={FileText}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
