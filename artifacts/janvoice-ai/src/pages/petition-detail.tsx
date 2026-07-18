import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetPetition, useSignPetition } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { FileSignature, Users, ArrowLeft, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const signSchema = z.object({
  displayName: z.string().min(2, "Name is required"),
  comment: z.string().optional(),
});

export default function PetitionDetail() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, params] = useRoute("/petitions/:id");
  const id = parseInt(params?.id || "0");
  const queryClient = useQueryClient();

  const { data: petition, isLoading } = useGetPetition(id, {
    query: { enabled: !!id, queryKey: ["petition", id] }
  });

  const signMutation = useSignPetition();

  const form = useForm<z.infer<typeof signSchema>>({
    resolver: zodResolver(signSchema),
    defaultValues: {
      displayName: user?.name || "",
      comment: "",
    },
  });

  const onSubmit = (values: z.infer<typeof signSchema>) => {
    signMutation.mutate({ id, data: values }, {
      onSuccess: () => {
        toast({ title: "Petition Signed", description: "Thank you for making your voice heard!" });
        // In a real app, we'd invalidate or optimistically update
        queryClient.invalidateQueries({ queryKey: ["petition", id] });
      },
      onError: (err: any) => {
        toast({ title: "Error signing", description: err.message || "Something went wrong", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="text-center p-20 text-muted-foreground">Loading...</div>;
  }

  if (!petition) return <div>Not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link href="/petitions" className="inline-flex items-center text-muted-foreground hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Petitions
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
              {petition.title}
            </h1>
            <div className="flex items-center text-sm text-muted-foreground bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/10">
              Started by <strong className="text-white ml-1 mr-2">{petition.creatorName}</strong> on {format(new Date(petition.createdAt), 'MMM d, yyyy')}
            </div>
          </div>

          <div className="prose prose-invert max-w-none bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">{petition.description}</p>
          </div>

          {petition.campaignId && (
            <Link href={`/campaigns/${petition.campaignId}`}>
              <Card className="glass-card hover:bg-white/10 cursor-pointer border-[#FF9933]/30 bg-[#FF9933]/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#FF9933] font-bold uppercase tracking-wider mb-1">Part of a larger movement</div>
                    <div className="text-white font-medium">View parent campaign</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#FF9933]" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        <div className="space-y-6">
          <Card className="glass-card sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                {petition.signatureCount.toLocaleString()}
              </CardTitle>
              <CardDescription>Signatures collected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Progress value={petition.progressPercent || 0} className="h-3" />
                {petition.targetSignatures && (
                  <div className="text-right text-sm text-muted-foreground">
                    Goal: {petition.targetSignatures.toLocaleString()}
                  </div>
                )}
              </div>

              {petition.isSigned ? (
                <div className="bg-[#138808]/20 border border-[#138808]/50 rounded-xl p-4 text-center text-[#138808]">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-bold text-lg">You've signed this!</div>
                  <div className="text-sm mt-1 text-[#138808]/80">Your voice has been recorded.</div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t border-white/10 pt-4">
                    <h3 className="font-bold text-lg text-white">Sign this petition</h3>
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input className="bg-black/40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for signing (Optional)</FormLabel>
                          <FormControl>
                            <Textarea className="bg-black/40 resize-none h-20" placeholder="I'm signing because..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-white"
                      disabled={signMutation.isPending}
                    >
                      {signMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign Petition"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
