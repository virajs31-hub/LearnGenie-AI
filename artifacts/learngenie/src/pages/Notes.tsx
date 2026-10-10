import { useState } from "react";
import { useListNotes, useCreateNote, useUpdateNote, useDeleteNote, getListNotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Trash2, Tag, Save, Edit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Notes() {
  const queryClient = useQueryClient();
  const { data: notes, isLoading } = useListNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    content: ""
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: "", topic: "", content: "" });
    setOpen(true);
  };

  const handleOpenEdit = (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(note.id);
    setFormData({
      title: note.title,
      topic: note.topic || "",
      content: note.content
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateNote.mutate({
        id: editingId,
        data: formData
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          setOpen(false);
          toast.success("Note updated!");
        },
        onError: () => toast.error("Failed to update note")
      });
    } else {
      createNote.mutate({
        data: formData
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          setOpen(false);
          toast.success("Note saved!");
        },
        onError: () => toast.error("Failed to save note")
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Notes</h1>
          <p className="text-muted-foreground mt-1">Organize your thoughts and key concepts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2"><Plus className="h-4 w-4" /> New Note</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Note" : "Create Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} placeholder="e.g. Mitochondria functions" />
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input value={formData.topic} onChange={e => setFormData(p => ({...p, topic: e.target.value}))} placeholder="e.g. Biology" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea 
                  required 
                  value={formData.content} 
                  onChange={e => setFormData(p => ({...p, content: e.target.value}))} 
                  placeholder="Start typing your notes here..." 
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <Button type="submit" className="w-full mt-4 gap-2" disabled={createNote.isPending || updateNote.isPending}>
                <Save className="h-4 w-4" /> {editingId ? "Update Note" : "Save Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
        ) : notes?.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-xl bg-muted/20">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">Jot down important concepts you learn.</p>
            <Button onClick={handleOpenCreate} variant="outline">Create Note</Button>
          </div>
        ) : (
          notes?.map(note => (
            <Card key={note.id} className="relative overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
              <div className="absolute top-4 right-4 flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleOpenEdit(note, e)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteNote.mutate({ id: note.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() }) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="pb-3 flex-none">
                {note.topic && (
                  <CardDescription className="flex items-center gap-1 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                    <Tag className="h-3 w-3" /> {note.topic}
                  </CardDescription>
                )}
                <CardTitle className="text-xl leading-tight pr-16">{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-4 text-xs text-muted-foreground/60 font-mono">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
