import { motion } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetDashboardStats, 
  useGetRecentActivity, 
  useGetFeaturedCampaigns 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { 
  Megaphone, 
  FileSignature, 
  BarChart2, 
  Trophy, 
  ArrowRight,
  Clock,
  Bookmark,
  Bot,
  Users
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedCampaigns();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's your civic impact overview.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm w-fit">
          <Avatar className="h-8 w-8 border-primary/50">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback>{user ? getInitials(user.name) : 'C'}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <span className="text-white/60">Role:</span>{" "}
            <span className="font-medium text-primary capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover:border-[#FF9933]/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Impact Score</p>
              <Trophy className="h-4 w-4 text-[#FF9933]" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <div className="text-3xl font-bold text-white">{stats?.impactScore || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:border-[#138808]/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Campaigns Joined</p>
              <Megaphone className="h-4 w-4 text-[#138808]" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <div className="text-3xl font-bold text-white">{stats?.campaignsJoined || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-[#000080]/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Petitions Signed</p>
              <FileSignature className="h-4 w-4 text-[#6666FF]" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <div className="text-3xl font-bold text-white">{stats?.petitionsSigned || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-white/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Polls Voted</p>
              <BarChart2 className="h-4 w-4 text-white/80" />
            </div>
            {statsLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
              <div className="text-3xl font-bold text-white">{stats?.pollsVoted || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-semibold">Recommended for You</h2>
            <Link href="/campaigns">
              <Button variant="link" className="text-primary pr-0">View all</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {featuredLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-6 flex gap-4">
                    <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : featured?.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
                <p className="text-muted-foreground">No campaigns found right now.</p>
              </div>
            ) : (
              featured?.slice(0, 3).map((campaign, i) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card overflow-hidden hover:border-primary/50 transition-all group">
                    <div className="flex flex-col sm:flex-row">
                      {campaign.imageUrl && (
                        <div className="sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                          <img 
                            src={campaign.imageUrl} 
                            alt={campaign.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <CardContent className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                              {campaign.category.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {campaign.supporterCount.toLocaleString()}
                            </span>
                          </div>
                          <Link href={`/campaigns/${campaign.id}`}>
                            <h3 className="text-xl font-bold text-white hover:text-primary transition-colors line-clamp-1 mb-2">
                              {campaign.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {campaign.description}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <Bookmark className="h-4 w-4 mr-2" /> Save
                          </Button>
                          <Link href={`/campaigns/${campaign.id}`}>
                            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                              Act Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              ) : (
                <div className="space-y-6">
                  {activity?.slice(0, 5).map((item, i) => (
                    <motion.div 
                      key={item.id} 
                      className="flex gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/90">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg">AI Letter Generator</h3>
              <p className="text-sm text-white/70">
                Need to contact a local official? Let our AI draft the perfect formal letter for you in seconds.
              </p>
              <Link href="/ai-tools" className="block w-full">
                <Button className="w-full bg-white text-black hover:bg-white/90 mt-2">
                  Try AI Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
