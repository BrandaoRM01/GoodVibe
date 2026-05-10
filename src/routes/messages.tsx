import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Search, Send, Smile, Paperclip, Phone, Video, MoreVertical } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Mensagens — GoodVib&" }] }),
  component: MessagesPage,
});

const conversations = [
  { id: "1", name: "Marina Costa", last: "Adorei sua boa ação de hoje!", time: "agora", online: true, unread: 2, avatar: "M" },
  { id: "2", name: "Lucas Andrade", last: "Vamos no voluntariado sábado?", time: "12m", online: true, unread: 0, avatar: "L" },
  { id: "3", name: "Sofia Oliveira", last: "💛💛💛", time: "1h", online: false, unread: 0, avatar: "S" },
  { id: "4", name: "Rafael Mendes", last: "Te mando os detalhes da horta", time: "3h", online: false, unread: 1, avatar: "R" },
  { id: "5", name: "Ana Beatriz", last: "Você é incrível, sério.", time: "ontem", online: true, unread: 0, avatar: "A" },
];

const initialMsgs = [
  { id: 1, from: "them", text: "Oi! Vi sua publicação sobre o abrigo, fiquei muito tocada 🥹" },
  { id: 2, from: "me", text: "Aaah obrigada! Foi uma manhã muito especial mesmo." },
  { id: 3, from: "them", text: "Adorei sua boa ação de hoje! Posso ir junto na próxima?" },
  { id: 4, from: "me", text: "Claroo, vai ser ótimo! Marca a gente lá ✨" },
];

function MessagesPage() {
  const [active, setActive] = useState(conversations[0]);
  const [msgs, setMsgs] = useState(initialMsgs);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "me", text }]);
    setText("");
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex h-screen">
        {/* Conversations list */}
        <div className="w-80 shrink-0 border-r border-border flex flex-col bg-sidebar/40">
          <div className="p-5 border-b border-border">
            <h1 className="text-xl font-bold tracking-tight mb-3">Mensagens</h1>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Buscar conversa..." className="w-full bg-card border border-border rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${active.id === c.id ? "bg-primary/10" : "hover:bg-accent"}`}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">
                    {c.avatar}
                  </div>
                  {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <header className="flex items-center gap-3 p-4 border-b border-border glass">
            <div className="relative">
              <div className="h-11 w-11 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold">
                {active.avatar}
              </div>
              {active.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{active.name}</p>
              <p className="text-xs text-muted-foreground">{active.online ? "Online agora" : "Visto há pouco"}</p>
            </div>
            {[Phone, Video, MoreVertical].map((I, i) => (
              <button key={i} className="h-10 w-10 rounded-full hover:bg-accent grid place-items-center transition-colors">
                <I className="h-4 w-4" />
              </button>
            ))}
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-3">
            {msgs.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] px-4 py-2.5 rounded-3xl text-sm ${
                  m.from === "me"
                    ? "gradient-primary text-primary-foreground rounded-br-md shadow-soft"
                    : "bg-card border border-border rounded-bl-md"
                }`}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 bg-card border border-border rounded-full pl-4 pr-2 py-2 focus-within:ring-2 focus-within:ring-primary/40 transition">
              <button className="text-muted-foreground hover:text-primary"><Paperclip className="h-4 w-4" /></button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Escreva uma mensagem gentil..."
                className="flex-1 bg-transparent outline-none text-sm py-1.5"
              />
              <button className="text-muted-foreground hover:text-primary"><Smile className="h-4 w-4" /></button>
              <button onClick={send} className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-primary-foreground hover:scale-105 transition-transform">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
