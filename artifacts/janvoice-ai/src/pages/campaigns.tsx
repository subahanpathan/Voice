import { useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  useListCampaigns, 
  useJoinCampaign,
  useBookmarkCampaign 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Users, 
  Bookmark, 
  ArrowRight,
  MapPin,
  Megaphone
} from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "education", label: "Education" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "healthcare", label: "Healthcare" },
  { value: "environment", label: "Environment" },
  { value: "public_services", label: "Public Services" },
  { value: "women_safety", label: "Women Safety" },
  { value: "youth", label: "Youth" },
];

export default function Campaigns() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("active");

  // Basic debounce for search
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  });

  const { data: campaignsData, isLoading } = useListCampaigns({
    category: category === "all" ? undefined : category,
    status: status,
    search: debouncedSearch || undefined,
  }, {
    query: {
      queryKey: ["campaigns", category, status, debouncedSearch]
    }
  });

  const joinMutation = useJoinCampaign();
  const bookmarkMutation = useBookmarkCampaign();

  const handleJoin = (id: number, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    joinMutation.mutate({ id }, {
      onSuccess: () => toast({ title: "Successfully joined campaign!" }),
      onError: () => toast({ title: "Could not join campaign", variant: "destructive" })
    });
  };

  const handleBookmark = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    bookmarkMutation.mutate({ id }, {
      onSuccess: () => toast({ title: "Campaign bookmarked" }),
      onError: () => toast({ title: "Could not bookmark", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2">Campaigns</h1>
          <p className="text-muted-foreground text-lg">Discover and join civic movements happening across the nation.</p>
        </div>
        <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white rounded-full">
          Start a Campaign
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search campaigns..." 
            className="pl-10 h-12 bg-white/5 border-white/10 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Tabs value={category} onValueChange={setCategory} className="w-full">
            <TabsList className="h-12 w-max bg-white/5 border-white/10 rounded-full px-1">
              {CATEGORIES.map(cat => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="rounded-full px-4 data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Status:</span>
        <div className="flex gap-2">
          {["active", "completed", "pending"].map(s => (
            <Badge 
              key={s}
              variant={status === s ? "default" : "outline"}
              className={`cursor-pointer capitalize ${
                status === s 
                  ? "bg-primary text-primary-foreground border-transparent" 
                  : "border-white/20 text-white/60 hover:text-white"
              }`}
              onClick={() => setStatus(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="glass-card">
              <Skeleton className="h-48 w-full rounded-t-xl rounded-b-none" />
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="pt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaignsData?.campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-white mb-2">No campaigns found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaignsData?.campaigns.map((campaign, i) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.1, 0.5) }}
              className="h-full"
            >
              <Link href={`/campaigns/${campaign.id}`} className="block h-full cursor-pointer">
                <Card className="glass-card h-full flex flex-col hover:border-[#138808]/50 transition-all duration-300 group">
                  {campaign.imageUrl ? (
                    <div className="h-48 w-full overflow-hidden">
                      <img 
                        src={campaign.imageUrl} 
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-black/60 to-black/20 flex items-center justify-center border-b border-white/5">
                      <Megaphone className="h-12 w-12 text-white/20" />
                    </div>
                  )}
                  
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="border-[#138808]/30 text-[#138808] bg-[#138808]/10 capitalize">
                        {campaign.category.replace('_', ' ')}
                      </Badge>
                      <button 
                        onClick={(e) => handleBookmark(campaign.id, e)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <Bookmark className={`h-5 w-5 ${campaign.isBookmarked ? "fill-white text-white" : ""}`} />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white group-hover:text-[#138808] transition-colors line-clamp-2 mb-2">
                      {campaign.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {campaign.description}
                    </p>

                    {campaign.location && (
                      <div className="flex items-center text-xs text-white/50 mb-4 mt-auto">
                        <MapPin className="h-3 w-3 mr-1" />
                        {campaign.location}
                      </div>
                    )}
                    
                    <div className="mt-auto space-y-4 pt-4 border-t border-white/10">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center text-white/80 font-medium">
                            <Users className="h-4 w-4 mr-1 text-[#FF9933]" />
                            {campaign.supporterCount.toLocaleString()} supporters
                          </span>
                        </div>
                        {campaign.targetSignatures && (
                          <Progress value={campaign.progressPercent || 0} className="h-1.5" />
                        )}
                      </div>
                      
                      <Button 
                        className={`w-full rounded-lg ${
                          campaign.isJoined 
                            ? "bg-white/10 text-white hover:bg-white/20" 
                            : "bg-[#138808] text-white hover:bg-[#138808]/90"
                        }`}
                        onClick={(e) => handleJoin(campaign.id, e)}
                        disabled={campaign.isJoined || joinMutation.isPending}
                      >
                        {campaign.isJoined ? "Joined" : "Join Campaign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
