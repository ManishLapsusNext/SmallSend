import { Trash2 } from "lucide-react";
import { Button } from "../../ui/button";

interface DangerZoneSectionProps {
  onDelete: () => void;
}

export function DangerZoneSection({ onDelete }: DangerZoneSectionProps) {
  return (
    <section className="pt-12 border-t border-slate-100">
      <div className="p-8 rounded-[32px] bg-red-50 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white text-red-500 flex items-center justify-center shadow-none border border-red-100 shrink-0">
            <Trash2 size={24} />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
              Danger Zone
            </p>
            <p className="text-sm text-slate-900 font-bold">
              Permanently Delete Asset
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
              This action is irreversible and removes all data.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] bg-red-500 hover:bg-red-600 text-white border-none shadow-none"
        >
          Delete Asset
        </Button>
      </div>
    </section>
  );
}
