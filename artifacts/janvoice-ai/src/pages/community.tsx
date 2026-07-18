import { useState } from "react";
import { useLocation } from "wouter";
import { useListComments, useCreateComment, useUpvoteComment } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ThumbsUp, Send, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  
  // Parse URL search params for campaignId filter
  const searchParams = new URLSearchParams(window.location.search);
  const campaignId = searchParams.get('campaignId') ? parseInt(searchParams.get('campaignId') as string) : undefined;

  const { data: commentsData, isLoading } = useListComments(
    campaignId ? { campaignId } : undefined, 
    { query: { queryKey: ["comments", campaignId] } }
  );

  const createMutation = useCreateComment();
  const upvoteMutation = useUpvoteComment();

  const handlePost = () => {
    if (!content.trim()) return;
    
    createMutation.mutate({ 
      data: { content, campaignId } 
    }, {
      onSuccess: () => {
        setContent("");
        toast({ title: "Comment posted" });
        queryClient.invalidateQueries({ queryKey: ["comments", campaignId] });
      },
      onError: () => toast({ title: "Failed to post", variant: "destructive" })
    });
  };

  const handleUpvote = (id: number) => {
    upvoteMutation.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", campaignId] })
    });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const renderComment = (comment: any, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-4 pl-4 border-l-2 border-white/10' : 'mb-6'}`}>
      <Card className="glass-card bg-black/20 border-white/5 hover:border-white/10 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 border-white/10">
              <AvatarImage src={comment.authorAvatarUrl} />
              <AvatarFallback className="bg-primary/20 text-primary">{getInitials(comment.authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white mr-2">{comment.authorName}</span>
                  <span className="text-xs text-white/40">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                </div>
                {comment.campaignId && !campaignId && (
                  <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">Campaign #{comment.campaignId}</span>
                )}
              </div>
              <p className="text-white/80 leading-relaxed text-sm md:text-base">
                {comment.content}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <button 
                  onClick={() => handleUpvote(comment.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${comment.isUpvoted ? 'text-primary' : 'text-white/50 hover:text-white'}`}
                >
                  <ThumbsUp className={`h-4 w-4 ${comment.isUpvoted ? 'fill-current' : ''}`} /> 
                  {comment.upvoteCount}
                </button>
                {!isReply && (
                  <button className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition-colors">
                    <MessageSquare className="h-4 w-4" /> Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recursively render replies */}
      {comment.replies?.map((reply: any) => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2">Community Hub</h1>
          <p className="text-muted-foreground text-lg">
            {campaignId ? `Discussing Campaign #${campaignId}` : 'Open discussions across the nation.'}
          </p>
        </div>
      </div>

      <Card className="glass-card border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 border-white/10 hidden sm:block">
              <AvatarFallback className="bg-white/10 text-white">{user ? getInitials(user.name) : 'ME'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea 
                placeholder="Share your thoughts with the community..." 
                className="min-h-[100px] bg-black/40 border-white/10 resize-none text-base p-4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handlePost} 
                  disabled={!content.trim() || createMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90 px-6 rounded-full"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-20 text-white/40">Loading discussions...</div>
        ) : commentsData?.comments.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <MessageSquare className="h-12 w-12 mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Be the first to speak</h3>
            <p className="text-white/50">Start the conversation above.</p>
          </div>
        ) : (
          commentsData?.comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}
