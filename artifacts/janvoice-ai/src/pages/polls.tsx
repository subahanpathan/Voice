import { useLocation, Link } from "wouter";
import { useListPolls } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Polls() {
  const [, setLocation] = useLocation();
  const { data: pollsData, isLoading } = useListPolls();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2">Civic Polls</h1>
          <p className="text-muted-foreground text-lg">Voice your opinion on pressing local and national issues.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-8 w-full rounded" />
                  <Skeleton className="h-8 w-full rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pollsData?.polls.map((poll, i) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setLocation(`/polls/${poll.id}`)}
              className="cursor-pointer h-full"
            >
              <Card className="glass-card h-full flex flex-col hover:border-primary/50 transition-colors group">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 line-clamp-3 flex-1 group-hover:text-primary transition-colors">
                    {poll.question}
                  </h3>
                  
                  <div className="space-y-2 mb-6 pointer-events-none">
                    {poll.options.slice(0, 3).map(opt => (
                      <div key={opt.id} className="bg-black/30 border border-white/5 rounded-md px-3 py-2 text-sm text-white/80">
                        {opt.text}
                      </div>
                    ))}
                    {poll.options.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">+{poll.options.length - 3} more options</div>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center text-primary font-medium">
                      <Users className="h-4 w-4 mr-1" /> {poll.totalVotes} votes
                    </span>
                    <span>{format(new Date(poll.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
