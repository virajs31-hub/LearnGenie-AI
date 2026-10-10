import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useListConversations, 
  useCreateConversation, 
  useGetConversation,
  useDeleteConversation,
  getListConversationsQueryKey,
  getGetConversationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Trash2, Send, Bot, User, Loader2, Paperclip, X, FileText, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const currentId = params.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: loadingConvos } = useListConversations();
  const createConvo = useCreateConversation();
  const deleteConvo = useDeleteConversation();

  const { data: currentConvo, isLoading: loadingCurrent } = useGetConversation(currentId as number, {
    query: { enabled: !!currentId, queryKey: getGetConversationQueryKey(currentId as number) }
  });

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [docContext, setDocContext] = useState("");
  const [docName, setDocName] = useState("");
  const [showDocPanel, setShowDocPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConvo?.messages, streamingContent]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { toast.error("File too large. Max 500KB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setDocContext(text.slice(0, 8000));
      setDocName(file.name);
      setShowDocPanel(true);
      toast.success(`"${file.name}" attached`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleNewChat = () => {
    createConvo.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (convo) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setLocation(`/chat/${convo.id}`);
        }
      }
    );
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConvo.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (currentId === id) setLocation("/chat");
          toast.success("Conversation deleted");
        }
      }
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    let targetId = currentId;

    if (!targetId) {
      try {
        const newConvo = await createConvo.mutateAsync({ data: { title: input.substring(0, 30) } });
        targetId = newConvo.id;
        setLocation(`/chat/${newConvo.id}`);
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      } catch (err) {
        toast.error("Failed to create conversation");
        return;
      }
    }

    const userMsg = docContext
      ? `[Document: ${docName || "Attached Document"}]\n\n${docContext}\n\n---\n\n${input}`
      : input;
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistically update cache to show user message
    if (targetId) {
      queryClient.setQueryData(getGetConversationQueryKey(targetId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...(old.messages || []), { id: Date.now(), role: "user", content: input, createdAt: new Date().toISOString() }]
        };
      });
    }

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/chat/conversations/${targetId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg })
      });
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.content) {
              setStreamingContent(prev => prev + data.content);
            }
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(targetId!) });
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] border rounded-xl overflow-hidden bg-card animate-in fade-in zoom-in-95 duration-300">
      <div className="w-64 border-r bg-muted/30 flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <Button onClick={handleNewChat} className="w-full justify-start gap-2" variant="outline">
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {loadingConvos ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : conversations?.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">No conversations yet</div>
          ) : (
            <div className="space-y-1">
              {conversations?.map(c => (
                <div 
                  key={c.id}
                  onClick={() => setLocation(`/chat/${c.id}`)}
                  className={`
                    flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors group
                    ${currentId === c.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}
                  `}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    onClick={(e) => handleDelete(c.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      
      <div className="flex-1 flex flex-col relative bg-background">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {!currentId && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">How can I help you learn today?</h2>
              <p className="text-muted-foreground mb-8">Ask me to explain a concept, quiz you, or help you understand a difficult topic.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {["Explain quantum physics simply", "Quiz me on world history", "How do I study for calculus?", "Help me practice Spanish"].map(prompt => (
                  <Button key={prompt} variant="outline" className="h-auto py-3 justify-start text-left whitespace-normal" onClick={() => { setInput(prompt); }}>
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {currentConvo?.messages?.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isStreaming && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="h-8 w-8 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl max-w-[80%] bg-muted rounded-tl-sm">
                    {streamingContent ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
                    ) : (
                      <div className="flex gap-1 items-center h-5">
                        <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 bg-background border-t">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Document context panel */}
            <AnimatePresence>
              {showDocPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border rounded-xl bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[200px]">{docName || "Document"}</span>
                        <Badge variant="secondary" className="text-xs">Attached</Badge>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => { setDocContext(""); setDocName(""); setShowDocPanel(false); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {docContext && (
                      <Textarea
                        value={docContext}
                        onChange={e => setDocContext(e.target.value)}
                        className="text-xs h-20 font-mono resize-none bg-background"
                        placeholder="Paste or edit document content here…"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">This document will be included as context for your next message.</p>
                  </div>
                </motion.div>
              )}
              {!showDocPanel && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowDocPanel(true)}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Ask about a document (.txt, paste content)
                </button>
              )}
            </AnimatePresence>

            {showDocPanel && !docContext && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" /> Upload .txt file
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setDocContext(" ")}
                >
                  <FileText className="h-3.5 w-3.5" /> Paste content
                </Button>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.csv" className="hidden" onChange={handleFileUpload} />
              </div>
            )}

            <form onSubmit={handleSend} className="relative flex items-end gap-2">
              <Input 
                placeholder={docContext ? "Ask a question about the document…" : "Message AI Tutor..."} 
                value={input}
                onChange={e => setInput(e.target.value)}
                className="pr-12 py-6 rounded-2xl bg-muted/50 border-muted-foreground/20 focus-visible:ring-primary/50"
                disabled={isStreaming}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 bottom-2 h-9 w-9 rounded-xl"
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
