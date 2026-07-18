import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGenerateEmail, 
  useGenerateLetter,
  EmailGenerateInputRecipientType,
  EmailGenerateInputLanguage,
  LetterGenerateInputRecipientType,
  LetterGenerateInputLanguage
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Copy, Download, Loader2, CheckCircle2, FileText, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.object({
  recipientType: z.nativeEnum(EmailGenerateInputRecipientType),
  language: z.nativeEnum(EmailGenerateInputLanguage).default(EmailGenerateInputLanguage.english),
  concern: z.string().min(20, "Please provide more details (at least 20 characters)"),
});

const letterSchema = z.object({
  recipientType: z.nativeEnum(LetterGenerateInputRecipientType),
  language: z.nativeEnum(LetterGenerateInputLanguage).default(LetterGenerateInputLanguage.english),
  senderName: z.string().min(2, "Name is required"),
  senderAddress: z.string().optional(),
  concern: z.string().min(20, "Please provide more details (at least 20 characters)"),
});

export default function AITools() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("email");
  const [generatedEmail, setGeneratedEmail] = useState<any>(null);
  const [generatedLetter, setGeneratedLetter] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const emailMutation = useGenerateEmail();
  const letterMutation = useGenerateLetter();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipientType: EmailGenerateInputRecipientType.municipality,
      language: EmailGenerateInputLanguage.english,
      concern: "",
    },
  });

  const letterForm = useForm<z.infer<typeof letterSchema>>({
    resolver: zodResolver(letterSchema),
    defaultValues: {
      recipientType: LetterGenerateInputRecipientType.district_collector,
      language: LetterGenerateInputLanguage.english,
      senderName: "",
      senderAddress: "",
      concern: "",
    },
  });

  const onEmailSubmit = (values: z.infer<typeof emailSchema>) => {
    emailMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setGeneratedEmail(data);
        toast({ title: "Email Generated Successfully" });
      },
      onError: () => {
        toast({ title: "Generation Failed", description: "Please try again later.", variant: "destructive" });
      }
    });
  };

  const onLetterSubmit = (values: z.infer<typeof letterSchema>) => {
    letterMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setGeneratedLetter(data);
        toast({ title: "Letter Generated Successfully" });
      },
      onError: () => {
        toast({ title: "Generation Failed", description: "Please try again later.", variant: "destructive" });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const downloadText = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">AI Civic Tools</h1>
          <p className="text-muted-foreground mt-1">Draft perfectly formatted emails and letters to officials in seconds.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-8 h-12">
          <TabsTrigger value="email" className="h-10 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Mail className="w-4 h-4 mr-2" /> Email Drafter
          </TabsTrigger>
          <TabsTrigger value="letter" className="h-10 data-[state=active]:bg-primary data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" /> Formal Letter
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form Area */}
          <div>
            <TabsContent value="email" className="mt-0">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl">Generate Email</CardTitle>
                  <CardDescription>Tell us your concern, and AI will do the rest.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={emailForm.control}
                          name="recipientType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recipient Official</FormLabel>
                              <FormControl>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-sm"
                                  {...field}
                                >
                                  {Object.entries(EmailGenerateInputRecipientType).map(([k, v]) => (
                                    <option key={v} value={v} className="bg-[#050A1A]">{k.replace('_', ' ').toUpperCase()}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={emailForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <FormControl>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-sm"
                                  {...field}
                                >
                                  {Object.entries(EmailGenerateInputLanguage).map(([k, v]) => (
                                    <option key={v} value={v} className="bg-[#050A1A]">{v.toUpperCase()}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={emailForm.control}
                        name="concern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Describe your concern</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="E.g., The streetlights on MG Road have been broken for 2 weeks causing safety issues at night..." 
                                className="min-h-[150px] bg-black/40 border-white/10"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg"
                        disabled={emailMutation.isPending}
                      >
                        {emailMutation.isPending ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Draft...</>
                        ) : (
                          <><Bot className="mr-2 h-5 w-5" /> Generate Email</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="letter" className="mt-0">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-xl">Generate Formal Letter</CardTitle>
                  <CardDescription>Creates a printable, perfectly formatted formal letter.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...letterForm}>
                    <form onSubmit={letterForm.handleSubmit(onLetterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={letterForm.control}
                          name="recipientType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recipient Official</FormLabel>
                              <FormControl>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-sm"
                                  {...field}
                                >
                                  {Object.entries(LetterGenerateInputRecipientType).map(([k, v]) => (
                                    <option key={v} value={v} className="bg-[#050A1A]">{k.replace('_', ' ').toUpperCase()}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={letterForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <FormControl>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-sm"
                                  {...field}
                                >
                                  {Object.entries(LetterGenerateInputLanguage).map(([k, v]) => (
                                    <option key={v} value={v} className="bg-[#050A1A]">{v.toUpperCase()}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={letterForm.control}
                          name="senderName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name</FormLabel>
                              <FormControl>
                                <Input className="bg-black/40 border-white/10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={letterForm.control}
                          name="senderAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Area/City</FormLabel>
                              <FormControl>
                                <Input className="bg-black/40 border-white/10" placeholder="Optional" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={letterForm.control}
                        name="concern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Describe your concern</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Details about the issue..." 
                                className="min-h-[120px] bg-black/40 border-white/10"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg"
                        disabled={letterMutation.isPending}
                      >
                        {letterMutation.isPending ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Draft...</>
                        ) : (
                          <><Bot className="mr-2 h-5 w-5" /> Generate Letter</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Result Area */}
          <div>
            <AnimatePresence mode="wait">
              {(activeTab === "email" ? generatedEmail : generatedLetter) ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full"
                >
                  <Card className="glass-card border-[#138808]/30 h-full flex flex-col bg-[#138808]/5">
                    <CardHeader className="border-b border-white/10 pb-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-[#138808]">Generated Draft</CardTitle>
                        <CardDescription>Ready to review and send</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="glass" 
                          size="icon" 
                          onClick={() => copyToClipboard(
                            activeTab === "email" 
                              ? `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`
                              : generatedLetter.content
                          )}
                        >
                          {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="glass" 
                          size="icon"
                          onClick={() => downloadText(
                            activeTab === "email" 
                              ? `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`
                              : generatedLetter.content,
                            `${activeTab}-draft.txt`
                          )}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1">
                      {activeTab === "email" && generatedEmail && (
                        <div className="space-y-4">
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <span className="text-white/50 text-sm">To:</span> <span className="font-medium text-white">{generatedEmail.recipientTitle}</span>
                          </div>
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <span className="text-white/50 text-sm">Subject:</span> <span className="font-bold text-white">{generatedEmail.subject}</span>
                          </div>
                          <div className="bg-black/40 rounded-lg p-4 border border-white/10 min-h-[300px] whitespace-pre-wrap font-serif text-white/90">
                            {generatedEmail.body}
                          </div>
                        </div>
                      )}

                      {activeTab === "letter" && generatedLetter && (
                        <div className="space-y-4 h-full flex flex-col">
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <span className="text-white/50 text-sm">Recipient Title:</span> <span className="font-medium text-white">{generatedLetter.recipientTitle}</span>
                          </div>
                          <div className="bg-black/40 rounded-lg p-6 border border-white/10 flex-1 whitespace-pre-wrap font-serif text-white/90 leading-relaxed shadow-inner">
                            {generatedLetter.content}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center min-h-[400px]"
                >
                  <div className="text-center space-y-4 text-white/40">
                    <div className="mx-auto w-16 h-16 rounded-full border border-white/10 border-dashed flex items-center justify-center">
                      <Bot className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">Waiting for input...</p>
                    <p className="text-sm max-w-[250px] mx-auto">Fill out the form to generate a customized draft.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
