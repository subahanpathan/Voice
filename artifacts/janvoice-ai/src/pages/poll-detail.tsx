import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetPoll, useVotePoll } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BarChart2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function PollDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/polls/:id");
  const id = parseInt(params?.id || "0");
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const { data: poll, isLoading } = useGetPoll(id, {
    query: { enabled: !!id, queryKey: ["poll", id] }
  });

  const voteMutation = useVotePoll();

  const handleVote = () => {
    if (!selectedOption) return;
    
    voteMutation.mutate({ id, data: { optionId: selectedOption } }, {
      onSuccess: () => {
        toast({ title: "Vote Cast", description: "Your opinion has been recorded." });
        queryClient.invalidateQueries({ queryKey: ["poll", id] });
      },
      onError: (err: any) => {
        toast({ title: "Error voting", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Loading poll...</div>;
  if (!poll) return <div>Poll not found</div>;

  const hasVoted = poll.userVotedOptionId != null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <Link href="/polls" className="inline-flex items-center text-muted-foreground hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Polls
      </Link>

      <Card className="glass-card overflow-hidden">
        <div className="bg-primary/20 p-8 flex items-start gap-4 border-b border-primary/20">
          <div className="bg-primary text-white p-3 rounded-2xl shadow-lg">
            <BarChart2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
              {poll.question}
            </h1>
            <div className="flex items-center gap-4 text-sm text-primary font-medium">
              <span>{poll.totalVotes.toLocaleString()} votes cast</span>
              {poll.endsAt && <span>Ends {format(new Date(poll.endsAt), 'MMM d, yyyy')}</span>}
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="space-y-4">
            {poll.options.map((opt, i) => {
              const isSelected = selectedOption === opt.id;
              const isUserVote = poll.userVotedOptionId === opt.id;
              
              return (
                <motion.div 
                  key={opt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <button
                    onClick={() => !hasVoted && setSelectedOption(opt.id)}
                    disabled={hasVoted || voteMutation.isPending}
                    className={`w-full text-left relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                      hasVoted
                        ? isUserVote 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 bg-black/20"
                        : isSelected
                          ? "border-primary bg-primary/20 scale-[1.02]"
                          : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5"
                    }`}
                  >
                    {/* Background fill for results */}
                    {hasVoted && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${opt.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute left-0 top-0 bottom-0 ${isUserVote ? 'bg-primary/20' : 'bg-white/5'} z-0`}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {!hasVoted && (
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-white/30'}`}>
                            {isSelected && <div className="h-2.5 w-2.5 bg-primary rounded-full" />}
                          </div>
                        )}
                        {hasVoted && isUserVote && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        <span className={`font-medium ${hasVoted && isUserVote ? 'text-white' : 'text-white/80'}`}>
                          {opt.text}
                        </span>
                      </div>
                      
                      {hasVoted && (
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-lg">{opt.percentage}%</span>
                          <span className="text-xs text-muted-foreground">{opt.voteCount} votes</span>
                        </div>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>

          {!hasVoted && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-6 border-t border-white/10"
            >
              <Button 
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
                disabled={!selectedOption || voteMutation.isPending}
                onClick={handleVote}
              >
                {voteMutation.isPending ? "Submitting..." : "Submit Vote"}
              </Button>
            </motion.div>
          )}

          {hasVoted && (
            <div className="mt-8 text-center text-primary font-medium bg-primary/10 py-3 rounded-xl border border-primary/20">
              Thank you for voting!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
