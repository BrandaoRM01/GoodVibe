import { Image, Smile, Sparkles, Send } from "lucide-react";
import { useState } from "react";

export function Composer() {
  const [text, setText] = useState("");
  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-soft">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0">
          V
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Compartilhe uma boa vibração hoje..."
            rows={2}
            className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground text-[15px]"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ToolBtn icon={<Image className="h-4 w-4" />} />
              <ToolBtn icon={<Smile className="h-4 w-4" />} />
              <ToolBtn icon={<Sparkles className="h-4 w-4" />} label="Boa ação" />
            </div>
            <button className="inline-flex items-center gap-2 gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full shadow-soft hover:shadow-glow hover:scale-[1.02] transition-all disabled:opacity-50">
              Publicar <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon, label }: { icon: React.ReactNode; label?: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
