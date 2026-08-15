import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCurtirPostagem, useDescurtirPostagem } from "@/lib/use-postagens";

export type Post = {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  avatarFotoUrl?: string;
  time: string;
  content: string;
  image?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
};

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likes, setLikes] = useState(post.likes);
  const navigate = useNavigate();

  const curtirPostagem = useCurtirPostagem();
  const descurtirPostagem = useDescurtirPostagem();
  const enviando = curtirPostagem.isPending || descurtirPostagem.isPending;

  function handleToggleLike() {
    const novoEstado = !liked;

    setLiked(novoEstado);
    setLikes((n) => n + (novoEstado ? 1 : -1));

    const id = Number(post.id);
    const mutation = novoEstado ? curtirPostagem : descurtirPostagem;

    mutation.mutate(id, {
      onError: () => {
        setLiked(!novoEstado);
        setLikes((n) => n + (novoEstado ? -1 : 1));
      },
    });
  }

  function filtrarPorTag(nome: string) {
    navigate({ to: "/feed", search: { tag: nome } });
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-3xl bg-card border border-border p-5 shadow-soft hover:shadow-glow transition-shadow"
    >
      <header className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0 overflow-hidden">
          {post.avatarFotoUrl ? (
            <img src={post.avatarFotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            post.avatar
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{post.author}</p>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{post.time}</span>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      {post.image && (
        <div className="mt-3 rounded-2xl overflow-hidden border border-border aspect-[16/10]">
          <img src={post.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <p className="mt-3 text-[15px] leading-relaxed">{post.content}</p>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => {
            const nomeLimpo = t.replace(/^#+/, "");
            return (
              <button
                key={t}
                type="button"
                onClick={() => filtrarPorTag(nomeLimpo)}
                className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
              >
                #{nomeLimpo}
              </button>
            );
          })}
        </div>
      )}

      <footer className="mt-4 pt-3 border-t border-border flex items-center gap-1 text-muted-foreground">
        <Action
          icon={<Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />}
          label={String(likes)}
          active={liked}
          disabled={enviando}
          onClick={handleToggleLike}
        />
        <Action icon={<MessageCircle className="h-4 w-4" />} label={String(post.comments)} />
        <Action icon={<Share2 className="h-4 w-4" />} label={String(post.shares)} />
      </footer>
    </motion.article>
  );
}

function Action({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed ${active ? "text-primary" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}