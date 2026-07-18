import { useState } from "react";
import { useLocation } from "wouter";
import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, Megaphone, FileSignature, BarChart2, MessageSquare, Info } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications, isLoading } = useListNotifications({
    query: { queryKey: ["notifications", "all"] } // we filter client-side for simplicity here
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markReadMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "All caught up!" });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    });
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'campaign_update': return <Megaphone className="h-5 w-5 text-[#FF9933]" />;
      case 'petition_milestone': return <FileSignature className="h-5 w-5 text-[#138808]" />;
      case 'poll_created': return <BarChart2 className="h-5 w-5 text-accent" />;
      case 'comment_reply': return <MessageSquare className="h-5 w-5 text-blue-400" />;
      default: return <Info className="h-5 w-5 text-white/50" />;
    }
  };

  const handleClick = (notif: any) => {
    if (!notif.isRead) markReadMutation.mutate({ id: notif.id });
    if (notif.campaignId) setLocation(`/campaigns/${notif.campaignId}`);
  };

  const displayNotifs = notifications?.filter(n => filter === "all" || !n.isRead) || [];
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-sm font-sans px-2.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </h1>
        
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending}>
            <Check className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-2 p-1 bg-black/40 rounded-lg w-max border border-white/5">
        <button 
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="text-center py-10 text-white/40">Loading notifications...</div>
          ) : displayNotifs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/5 rounded-xl border border-white/10"
            >
              <Bell className="h-12 w-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/60">You're all caught up!</p>
            </motion.div>
          ) : (
            displayNotifs.map((notif, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={notif.id}
              >
                <Card 
                  className={`glass-card cursor-pointer transition-all hover:bg-white/10 ${!notif.isRead ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-black/20'}`}
                  onClick={() => handleClick(notif)}
                >
                  <CardContent className="p-4 flex gap-4">
                    <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-white/10' : 'bg-black/40'}`}>
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-semibold ${!notif.isRead ? 'text-white' : 'text-white/80'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-white/40 whitespace-nowrap ml-4">
                          {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 line-clamp-2 ${!notif.isRead ? 'text-white/80' : 'text-white/50'}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="flex items-center ml-2">
                        <button 
                          className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-primary transition-colors"
                          onClick={(e) => handleMarkRead(notif.id, e)}
                          title="Mark as read"
                        >
                          <div className="h-2.5 w-2.5 bg-primary rounded-full" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
