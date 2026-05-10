import { Heart, MessageCircle, Share2, Sparkles, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export type Post = {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  goodDeed?: string;
};

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-3xl bg-card border border-border p-5 shadow-soft hover:shadow-glow transition-shadow"
    >
      <header className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold shrink-0">
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{post.author}</p>
            <span className="text-xs text-muted-foreground">{post.handle}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{post.time}</span>
          </div>
          {post.goodDeed && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> {post.goodDeed}
            </div>
          )}
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      <p className="mt-3 text-[15px] leading-relaxed">{post.content}</p>

      {post.image && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-border aspect-[16/10] gradient-primary opacity-90 grid place-items-center">
          <span className="text-primary-foreground/80 text-sm">{post.image}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.tags.map((t) => (
          <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
            {t}
          </span>
        ))}
      </div>

      <footer className="mt-4 pt-3 border-t border-border flex items-center gap-1 text-muted-foreground">
        <Action
          icon={<Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />}
          label={String(likes)}
          active={liked}
          onClick={() => { setLiked(!liked); setLikes((n) => n + (liked ? -1 : 1)); }}
        />
        <Action icon={<MessageCircle className="h-4 w-4" />} label={String(post.comments)} />
        <Action icon={<Share2 className="h-4 w-4" />} label={String(post.shares)} />
      </footer>
    </motion.article>
  );
}

function Action({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary ${active ? "text-primary" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
