import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile, useGetDashboardStats, useGetMyBookmarks, useGetMyCampaigns } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Megaphone, Bookmark, Loader2, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(160).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: stats } = useGetDashboardStats();
  const { data: bookmarks } = useGetMyBookmarks();
  const { data: campaigns } = useGetMyCampaigns();

  const updateMutation = useUpdateProfile();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      state: user?.state || "",
      city: user?.city || "",
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Profile updated" });
        queryClient.invalidateQueries({ queryKey: ["auth_me_custom"] });
      },
      onError: (err: any) => {
        toast({ title: "Update failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="relative h-48 rounded-2xl bg-gradient-to-r from-[#FF9933]/20 via-white/5 to-[#138808]/20 overflow-hidden flex items-end p-6 border border-white/10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        
        <div className="relative z-10 flex items-end gap-6 translate-y-12">
          <Avatar className="h-32 w-32 border-4 border-[#050A1A] bg-[#050A1A] shadow-xl">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="mb-14">
            <h1 className="text-3xl font-serif font-bold text-white">{user.name}</h1>
            <p className="text-white/60 capitalize flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              {user.role}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Citizen Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-white/50 mb-1">Joined</div>
                <div className="text-white">{format(new Date(user.createdAt), 'MMMM yyyy')}</div>
              </div>
              <div>
                <div className="text-sm text-white/50 mb-1">Impact Score</div>
                <div className="text-2xl font-bold text-[#FF9933]">{stats?.impactScore || 0}</div>
              </div>
              <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 gap-6">
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-medium">
                <Settings className="h-4 w-4 mr-2" /> Settings
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-medium">
                <Megaphone className="h-4 w-4 mr-2" /> My Campaigns
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-medium">
                <Bookmark className="h-4 w-4 mr-2" /> Saved
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="pt-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>Update your public information.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input className="bg-black/40 border-white/10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea className="bg-black/40 border-white/10 resize-none" placeholder="What civic issues matter to you?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input className="bg-black/40 border-white/10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input className="bg-black/40 border-white/10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" disabled={updateMutation.isPending} className="bg-primary text-white mt-4">
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="pt-6">
              <div className="space-y-4">
                {campaigns?.length === 0 ? (
                  <div className="text-center py-12 text-white/50 bg-white/5 rounded-xl border border-white/5">
                    You haven't joined any campaigns yet.
                  </div>
                ) : (
                  campaigns?.map(c => (
                    <Card key={c.id} className="glass-card hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setLocation(`/campaigns/${c.id}`)}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white mb-1">{c.title}</h4>
                          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">{c.status}</span>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="bookmarks" className="pt-6">
               <div className="space-y-4">
                {bookmarks?.length === 0 ? (
                  <div className="text-center py-12 text-white/50 bg-white/5 rounded-xl border border-white/5">
                    No saved campaigns.
                  </div>
                ) : (
                  bookmarks?.map(c => (
                    <Card key={c.id} className="glass-card hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setLocation(`/campaigns/${c.id}`)}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white mb-1">{c.title}</h4>
                          <p className="text-sm text-white/50 line-clamp-1">{c.description}</p>
                        </div>
                        <Bookmark className="h-5 w-5 fill-primary text-primary" />
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
