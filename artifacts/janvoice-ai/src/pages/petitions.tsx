import { useState } from "react";
import { useLocation } from "wouter";
import { useListPetitions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { FileSignature, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Petitions() {
  const [, setLocation] = useLocation();
  const { data: petitionsData, isLoading } = useListPetitions();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2">Petitions</h1>
          <p className="text-muted-foreground text-lg">Add your signature to demands for change.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="pt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : petitionsData?.petitions.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
          <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-white mb-2">No petitions right now</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {petitionsData?.petitions.map((petition, i) => (
            <motion.div
              key={petition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.1, 0.5) }}
            >
              <Card 
                className="glass-card h-full flex flex-col hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setLocation(`/petitions/${petition.id}`)}
              >
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary/20 p-3 rounded-xl">
                      <FileSignature className="h-6 w-6 text-primary" />
                    </div>
                    {petition.isSigned && (
                      <Badge variant="secondary" className="bg-primary text-white border-none">Signed</Badge>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {petition.title}
                  </h3>
                  
                  <p className="text-muted-foreground line-clamp-2 mb-6">
                    {petition.description}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center font-medium text-white">
                          <Users className="h-4 w-4 mr-1 text-primary" />
                          {petition.signatureCount.toLocaleString()} Signatures
                        </span>
                        {petition.targetSignatures && (
                          <span className="text-muted-foreground">
                            Goal: {petition.targetSignatures.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Progress value={petition.progressPercent || 0} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By {petition.creatorName}</span>
                      <span>{format(new Date(petition.createdAt), 'MMM d, yyyy')}</span>
                    </div>
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
