import { Save, Upload, AlertTriangle, FileText } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { cn } from "../../../lib/utils";

interface ManagementSectionProps {
  title: string;
  setTitle: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  originalSlug: string;
  onFileClick: () => void;
  newFile: File | null;
  isSaving: boolean;
  handleSave: () => void;
}

export function ManagementSection({
  title,
  setTitle,
  slug,
  setSlug,
  originalSlug,
  onFileClick,
  newFile,
  isSaving,
  handleSave,
}: ManagementSectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-deckly-primary flex items-center gap-2">
            <FileText size={12} strokeWidth={3} />
            Asset Management
          </h3>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
          }}
          disabled={isSaving}
          className="rounded-xl px-6 font-bold uppercase tracking-widest text-[10px] bg-deckly-primary text-slate-950 hover:bg-deckly-primary/90 border-none shadow-none z-10"
        >
          {isSaving ? (
            <div className="w-3 h-3 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin mr-2" />
          ) : (
            <Save size={14} className="mr-2" />
          )}
          {isSaving ? "Syncing..." : "Sync Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label htmlFor="title" className="text-slate-900 font-bold ml-1">
            Asset Title
          </Label>
          <Input
            id="title"
            placeholder="Series A Pitch Deck"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl focus-visible:ring-deckly-primary/20"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="slug" className="text-slate-900 font-bold ml-1">
            Access Slug
          </Label>
          <Input
            id="slug"
            placeholder="series-a"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="bg-slate-50 border-slate-200 text-slate-900 h-11 rounded-xl focus-visible:ring-deckly-primary/20"
          />
          {slug !== originalSlug && (
            <div className="flex items-center gap-2 px-1 text-red-600">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-black uppercase tracking-tight">
                Warning: Breaking Change! Old links will stop working.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label className="text-slate-900 font-bold ml-1">
          Replacement Source
        </Label>
        <div
          onClick={onFileClick}
          className={cn(
            "flex items-center justify-between p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 cursor-pointer hover:border-deckly-primary/30 hover:bg-deckly-primary/5 transition-all group",
            newFile ? "border-deckly-primary/50 bg-deckly-primary/5" : "",
          )}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-deckly-primary transition-colors">
              <Upload size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                {newFile ? "New file ready" : "Replace existing PDF document"}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {newFile ? newFile.name : "Optimized for web & analytics"}
              </span>
            </div>
          </div>
          {!newFile && (
            <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-deckly-primary">
              Update
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
