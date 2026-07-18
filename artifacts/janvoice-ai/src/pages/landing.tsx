import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetPlatformStats, useGetFeaturedCampaigns } from "@workspace/api-client-react";
import { Megaphone, FileSignature, BarChart2, MessageSquare, Bot, ArrowRight, ShieldCheck, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function LandingPage() {
  const { data: stats } = useGetPlatformStats();
  const { data: campaigns } = useGetFeaturedCampaigns();

  return (
    <div className="min-h-[100dvh] w-full bg-[#050A1A] text-white overflow-x-hidden">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF9933]/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#138808]/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-[#000080]/20 blur-[120px]" />
        {/* Grain overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="font-serif text-3xl font-bold tricolor-text">
            JanVoice
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-[#FF9933] transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-[#FF9933] text-white hover:bg-[#FF9933]/90 border-0 rounded-full px-6">
                Join the Movement
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#138808]"></span>
            <span className="text-sm font-medium text-white/80">Empowering 1.4 Billion Voices</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight leading-[1.1] mb-8 max-w-5xl"
          >
            The digital voice of the <br />
            <span className="tricolor-text">Indian Citizen.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl"
          >
            More than a platform. A movement. Join campaigns, sign petitions, and use AI to draft letters to your representatives. Democracy doesn't sleep between elections.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-white/90">
                Start Impacting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/campaigns" className="w-full sm:w-auto">
              <Button size="lg" variant="glass" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full">
                Explore Campaigns
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-white/10 bg-white/5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="py-4 md:py-0">
                <div className="text-4xl font-bold text-[#FF9933] mb-2">{stats?.totalCitizens?.toLocaleString() || "10,000+"}</div>
                <div className="text-sm text-white/60 font-medium uppercase tracking-wider">Active Citizens</div>
              </div>
              <div className="py-4 md:py-0">
                <div className="text-4xl font-bold text-white mb-2">{stats?.activeCampaigns?.toLocaleString() || "500+"}</div>
                <div className="text-sm text-white/60 font-medium uppercase tracking-wider">Live Campaigns</div>
              </div>
              <div className="py-4 md:py-0">
                <div className="text-4xl font-bold text-[#138808] mb-2">{stats?.totalPetitionSigns?.toLocaleString() || "2.5M+"}</div>
                <div className="text-sm text-white/60 font-medium uppercase tracking-wider">Signatures</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Tools for the Modern Citizen</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">Everything you need to organize, amplify, and enact change in your community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card hover:bg-white/10 transition-colors border-white/10">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-[#FF9933]/20 flex items-center justify-center mb-4">
                  <Megaphone className="h-6 w-6 text-[#FF9933]" />
                </div>
                <CardTitle className="text-xl">Campaigns</CardTitle>
                <CardDescription className="text-white/60 text-base">Organize around issues that matter. Rally supporters and track your impact in real-time.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card hover:bg-white/10 transition-colors border-white/10">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-[#138808]/20 flex items-center justify-center mb-4">
                  <FileSignature className="h-6 w-6 text-[#138808]" />
                </div>
                <CardTitle className="text-xl">Petitions</CardTitle>
                <CardDescription className="text-white/60 text-base">Create and sign petitions that go straight to the desks of decision-makers.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card hover:bg-white/10 transition-colors border-white/10">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-[#000080]/20 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-[#6666FF]" />
                </div>
                <CardTitle className="text-xl">AI Drafts</CardTitle>
                <CardDescription className="text-white/60 text-base">Describe your concern. Our AI drafts perfectly formatted letters to your local officials.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Featured Campaigns */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Trending Movements</h2>
              <p className="text-white/60 text-lg">Join campaigns that are making waves right now.</p>
            </div>
            <Link href="/campaigns" className="hidden md:flex items-center text-primary hover:text-primary/80 font-medium">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns?.slice(0, 3).map((campaign, i) => (
              <motion.div 
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card h-full flex flex-col hover:border-primary/50 transition-colors overflow-hidden group">
                  {campaign.imageUrl && (
                    <div className="h-48 w-full overflow-hidden">
                      <img 
                        src={campaign.imageUrl} 
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="border-[#FF9933]/30 text-[#FF9933] bg-[#FF9933]/10">
                        {campaign.category.replace('_', ' ')}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                        {campaign.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl line-clamp-2">{campaign.title}</CardTitle>
                    <CardDescription className="text-white/60 line-clamp-2 mt-2">
                      {campaign.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80 font-medium">{campaign.supporterCount.toLocaleString()} supporters</span>
                          {campaign.targetSignatures && (
                            <span className="text-white/50">Goal: {campaign.targetSignatures.toLocaleString()}</span>
                          )}
                        </div>
                        <Progress value={campaign.progressPercent || 0} className="h-2" />
                      </div>
                      <Link href={`/campaigns/${campaign.id}`} className="block">
                        <Button className="w-full rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/5">
                          Join Campaign
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 md:hidden flex justify-center">
            <Link href="/campaigns">
              <Button variant="outline" className="rounded-full">
                View all campaigns
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-20 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="font-serif text-2xl font-bold tricolor-text">
                JanVoice
              </div>
              <span className="text-white/40 text-sm">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
