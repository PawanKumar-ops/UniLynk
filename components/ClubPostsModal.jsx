import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function PostsModal({ open, onOpenChange, clubName, posts }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-white border border-black/10 overflow-hidden rounded-2xl">
        <DialogHeader className="px-7 pt-7 pb-5 border-b border-black/10 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="tracking-tight text-black">{clubName}</DialogTitle>
              <DialogDescription className="text-black/50 mt-1">
                Latest posts from the community
              </DialogDescription>
            </div>
            <Badge variant="outline" className="border-black/15 text-black/70 bg-white">
              {posts.length} posts
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-7 py-5 space-y-5">
            {posts.map((post, idx) => (
              <article key={post.id} className="group">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 border border-black/10">
                    {post.avatar && <AvatarImage src={post.avatar} alt={post.author} />}
                    <AvatarFallback className="bg-black text-white">
                      {post.author.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-black truncate">{post.author}</span>
                        <span className="text-black/30">·</span>
                        <span className="text-black/50 truncate">{post.role}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="size-8 text-black/50 hover:text-black hover:bg-black/5">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-black/40 mt-0.5">
                      <span>{post.timeAgo}</span>
                      <span>·</span>
                      <span className="uppercase tracking-wider">{post.category}</span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-black tracking-tight">{post.title}</h3>
                      <p className="text-black/70 mt-1.5 leading-relaxed">{post.content}</p>
                    </div>

                    {post.image && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-black/10 bg-black/5">
                        <ImageWithFallback
                          src={post.image}
                          alt={post.title}
                          className="w-full h-56 object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-4 -ml-2">
                      <Button variant="ghost" size="sm" className="text-black/60 hover:text-black hover:bg-black/5 gap-2">
                        <Heart className="size-4" />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-black/60 hover:text-black hover:bg-black/5 gap-2">
                        <MessageCircle className="size-4" />
                        {post.comments}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-black/60 hover:text-black hover:bg-black/5 gap-2">
                        <Share2 className="size-4" />
                        Share
                      </Button>
                      <div className="ml-auto">
                        <Button variant="ghost" size="icon" className="size-8 text-black/60 hover:text-black hover:bg-black/5">
                          <Bookmark className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {idx < posts.length - 1 && <Separator className="mt-5 bg-black/10" />}
              </article>
            ))}
          </div>
        </ScrollArea>

        <div className="px-7 py-4 border-t border-black/10 bg-white flex items-center justify-between">
          <span className="text-black/50">Stay up to date with {clubName}</span>
          <Button className="bg-black text-white hover:bg-black/85 rounded-full px-5">
            View all
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
