import { useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetCampaign, 
  useListPetitions,
  useListPolls,
  useListComments,
  useSummarizeCampaign,
  useJoinCampaign
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Megaphone, 
  Users, 
  MapPin, 
  Calendar, 
  Bot, 
  FileSignature, 
  BarChart2, 
  MessageSquare,
  Sparkles,
  ArrowLeft
} from "lucide-react";

export default function CampaignDetail() {
  const { toast } = useToast();
  const [, params] = useRoute("/campaigns/:id");
  const id = parseInt(params?.id || "0");
  
  const [activeTab, setActiveTab] = useState("overview");
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const { data: campaign, isLoading } = useGetCampaign(id, {
    query: { enabled: !!id, queryKey: ["campaign", id] }
  });

  const { data: petitions } = useListPetitions({ campaignId: id }, {
    query: { enabled: !!id && activeTab === "petitions" }
  });

  const { data: polls } = useListPolls({ campaignId: id }, {
    query: { enabled: !!id && activeTab === "polls" }
  });

  const { data: comments } = useListComments({ campaignId: id }, {
    query: { enabled: !!id && activeTab === "discussion" }
  });

  const joinMutation = useJoinCampaign();
  const summaryMutation = useSummarizeCampaign();

  const handleJoin = () => {
    joinMutation.mutate({ id }, {
      onSuccess: () => toast({ title: "Joined Campaign!" }),
      onError: () => toast({ title: "Could not join", variant: "destructive" })
    });
  };

  const handleSummarize = () => {
    setShowSummary(true);
    if (!summaryData) {
      summaryMutation.mutate({ data: { campaignId: id } }, {
        onSuccess: (data) => setSummaryData(data),
        onError: () => {
          toast({ title: "Failed to generate summary", variant: "destructive" });
          setShowSummary(false);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-[300px] bg-white/5 rounded-2xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 bg-white/5 rounded w-3/4" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-2/3" />
          </div>
          <div className="h-[400px] bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="space-y-6 pb-20">
      <Link href="/campaigns" className="inline-flex items-center text-muted-foreground hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Campaigns
      </Link>

      {/* Hero Banner */}
      <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden group">
        {campaign.imageUrl ? (
          <img 
            src={campaign.imageUrl} 
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-secondary/40 to-accent/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050A1A] via-[#050A1A]/80 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-primary text-white hover:bg-primary border-none">
              {campaign.category.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-white border-white/20 backdrop-blur-md">
              {campaign.status}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4 max-w-4xl">
            {campaign.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {campaign.location || "Nationwide"}</span>
            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> Started {format(new Date(campaign.createdAt), 'MMM d, yyyy')}</span>
            <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> {campaign.creatorName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-14 w-full bg-white/5 border-white/10 rounded-xl p-1 justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="h-12 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black px-6">Overview</TabsTrigger>
              <TabsTrigger value="petitions" className="h-12 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black px-6">
                Petitions <Badge className="ml-2 bg-black/10 text-current">{petitions?.total || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="polls" className="h-12 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black px-6">
                Polls <Badge className="ml-2 bg-black/10 text-current">{polls?.total || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="discussion" className="h-12 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black px-6">
                Discussion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-8">
              <div className="prose prose-invert max-w-none prose-p:text-white/80 prose-headings:font-serif">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
              </div>

              {campaign.tags && campaign.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {campaign.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="bg-white/5 text-white/70 border-white/10">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="petitions" className="mt-6 space-y-4">
              {petitions?.petitions.map(petition => (
                <Card key={petition.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold">{petition.title}</h3>
                      <Badge variant="outline" className="bg-accent/20 text-accent border-none"><FileSignature className="w-3 h-3 mr-1"/> Petition</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{petition.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-primary font-medium">{petition.signatureCount.toLocaleString()} signed</span>
                        {petition.targetSignatures && <span className="text-muted-foreground">Goal: {petition.targetSignatures.toLocaleString()}</span>}
                      </div>
                      <Progress value={petition.progressPercent || 0} className="h-2" />
                    </div>
                    <Link href={`/petitions/${petition.id}`}>
                      <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">View & Sign</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
              {petitions?.petitions.length === 0 && (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <FileSignature className="w-12 h-12 mx-auto text-white/20 mb-3" />
                  <p className="text-muted-foreground">No petitions linked to this campaign yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="polls" className="mt-6 space-y-4">
              {polls?.polls.map(poll => (
                <Card key={poll.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold">{poll.question}</h3>
                      <Badge variant="outline" className="bg-primary/20 text-primary border-none"><BarChart2 className="w-3 h-3 mr-1"/> Poll</Badge>
                    </div>
                    <div className="space-y-3 mb-4">
                      {poll.options.slice(0,2).map(opt => (
                        <div key={opt.id} className="relative h-10 rounded-md bg-black/40 overflow-hidden flex items-center px-4">
                          <div className="absolute left-0 top-0 bottom-0 bg-white/10" style={{ width: `${opt.percentage}%` }} />
                          <span className="relative z-10 text-sm">{opt.text}</span>
                          <span className="relative z-10 ml-auto text-sm font-medium">{opt.percentage}%</span>
                        </div>
                      ))}
                      {poll.options.length > 2 && <p className="text-xs text-muted-foreground text-center">+{poll.options.length - 2} more options</p>}
                    </div>
                    <Link href={`/polls/${poll.id}`}>
                      <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">Vote Now</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
              {polls?.polls.length === 0 && (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <BarChart2 className="w-12 h-12 mx-auto text-white/20 mb-3" />
                  <p className="text-muted-foreground">No polls active for this campaign.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="discussion" className="mt-6">
               <Card className="glass-card border-none bg-white/5">
                 <CardContent className="p-6 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-3" />
                    <h3 className="text-lg font-medium mb-1">Campaign Discussion</h3>
                    <p className="text-muted-foreground mb-4">Join the community in the dedicated discussion hub.</p>
                    <Link href={`/community?campaignId=${id}`}>
                      <Button className="bg-white text-black hover:bg-white/90">Go to Community Hub</Button>
                    </Link>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card border-primary/20 bg-gradient-to-b from-primary/10 to-transparent sticky top-6">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-white">{campaign.supporterCount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">People have joined</div>
              </div>
              
              {campaign.targetSignatures && (
                <div className="space-y-2">
                  <Progress value={campaign.progressPercent || 0} className="h-3 bg-black/40" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{campaign.signatureCount?.toLocaleString() || 0} signatures</span>
                    <span>Goal: {campaign.targetSignatures.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-14 text-lg font-medium rounded-xl shadow-lg shadow-primary/20"
                onClick={handleJoin}
                disabled={campaign.isJoined || joinMutation.isPending}
              >
                {campaign.isJoined ? "You're In!" : "Join the Movement"}
              </Button>

              <hr className="border-white/10" />
              
              <Button 
                variant="glass" 
                className="w-full flex items-center justify-between text-left h-auto py-3 bg-gradient-to-r from-accent/20 to-transparent border-accent/20 group"
                onClick={handleSummarize}
              >
                <div>
                  <div className="flex items-center text-accent font-medium mb-1">
                    <Bot className="h-4 w-4 mr-2" /> AI Summary
                  </div>
                  <div className="text-xs text-white/60">Get a quick breakdown</div>
                </div>
                <Sparkles className="h-5 w-5 text-accent opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Summary Slide-out / Dialog */}
      <AnimatePresence>
        {showSummary && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowSummary(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0A1020] border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent">
                    <Bot className="h-6 w-6" />
                    <h2 className="text-xl font-bold">AI Analysis</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowSummary(false)}>✕</Button>
                </div>

                {!summaryData ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4 text-white/50">
                    <Bot className="h-12 w-12 animate-pulse text-accent" />
                    <p>Analyzing campaign data...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
                      <h3 className="font-semibold text-white mb-2">The Gist</h3>
                      <p className="text-white/80 leading-relaxed text-sm">{summaryData.summary}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" /> Key Takeaways
                      </h3>
                      <ul className="space-y-3">
                        {summaryData.keyPoints.map((point: string, i: number) => (
                          <li key={i} className="flex gap-3 text-sm text-white/80 bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-primary font-bold">{i+1}.</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
