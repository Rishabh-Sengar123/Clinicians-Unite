import { useState } from "react";
import { useListPrescriptions, useProcessPrescription } from "@workspace/api-client-react";
import { getListPrescriptionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ArrowRight, Bot, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Prescriptions() {
  const { data: prescriptions, isLoading } = useListPrescriptions();
  const processPrescription = useProcessPrescription();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleProcess = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    setProcessingId(id);
    processPrescription.mutate({ id }, {
      onSuccess: (data) => {
        toast({
          title: "Resolution Complete",
          description: `AI resolved the prescription as: ${data.prescription.status}`,
        });
        queryClient.invalidateQueries({ queryKey: getListPrescriptionsQueryKey() });
        setProcessingId(null);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Processing Failed",
          description: "There was an error processing the prescription.",
        });
        setProcessingId(null);
      }
    });
  };

  const filteredPrescriptions = prescriptions?.filter(p => 
    p.drug.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescription Registry</h1>
          <p className="text-muted-foreground mt-1">Review and resolve rejected prescriptions.</p>
        </div>
        <Link href="/submit">
          <Button>Submit New Rejection</Button>
        </Link>
      </div>

      <Card className="border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by drug name or reason..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full bg-white"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 hidden md:flex">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p>No prescriptions found matching your search.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Reason / AI Decision</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id} className="group hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-500">#{prescription.id}</TableCell>
                    <TableCell className="font-semibold">{prescription.drug}</TableCell>
                    <TableCell><StatusBadge status={prescription.status} /></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px] truncate">
                      {prescription.aiDecision || prescription.reason}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(prescription.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {prescription.status === 'rejected' && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 hidden sm:flex bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                            onClick={(e) => handleProcess(e, prescription.id)}
                            disabled={processingId === prescription.id}
                          >
                            {processingId === prescription.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : (
                              <Bot className="h-3 w-3 mr-2" />
                            )}
                            Process
                          </Button>
                        )}
                        <Link href={`/prescriptions/${prescription.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
