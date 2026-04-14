import { useParams } from "wouter";
import { 
  useGetPrescription, 
  useGetLogsForPrescription, 
  useProcessPrescription,
  getGetPrescriptionQueryKey,
  getGetLogsForPrescriptionQueryKey,
  getListPrescriptionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  Loader2, 
  Bot, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  PhoneCall
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const prescriptionId = parseInt(id || "0", 10);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: prescription, isLoading: isLoadingPrescription } = useGetPrescription(prescriptionId, {
    query: { enabled: !!prescriptionId, queryKey: getGetPrescriptionQueryKey(prescriptionId) }
  });

  const { data: logs, isLoading: isLoadingLogs } = useGetLogsForPrescription(prescriptionId, {
    query: { enabled: !!prescriptionId, queryKey: getGetLogsForPrescriptionQueryKey(prescriptionId) }
  });

  const processMutation = useProcessPrescription();

  const handleProcess = () => {
    if (!prescriptionId) return;
    
    processMutation.mutate({ id: prescriptionId }, {
      onSuccess: (data) => {
        toast({
          title: "Workflow Complete",
          description: `Result: ${data.prescription.status}`,
        });
        queryClient.invalidateQueries({ queryKey: getGetPrescriptionQueryKey(prescriptionId) });
        queryClient.invalidateQueries({ queryKey: getGetLogsForPrescriptionQueryKey(prescriptionId) });
        queryClient.invalidateQueries({ queryKey: getListPrescriptionsQueryKey() });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Processing Error",
          description: "The AI agent encountered an error.",
        });
      }
    });
  };

  if (isLoadingPrescription) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-muted-foreground">
        <AlertCircle className="h-12 w-12 text-slate-300" />
        <p>Prescription not found.</p>
      </div>
    );
  }

  const isProcessing = processMutation.isPending || prescription.status === 'processing';
  const isResolved = prescription.status === 'approved' || prescription.status === 'available';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{prescription.drug}</h1>
            <StatusBadge status={prescription.status} className="text-base px-3 py-0.5" />
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ID: #{prescription.id} &bull; Created {format(new Date(prescription.createdAt), 'PPp')}
          </p>
        </div>
        
        {prescription.status === 'rejected' && (
          <Button 
            size="lg" 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="w-full md:w-auto shadow-md"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Bot className="h-5 w-5 mr-2" />
            )}
            {isProcessing ? "Agent Working..." : "Initiate AI Resolution"}
          </Button>
        )}
      </div>

      {prescription.aiDecision && isResolved && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="font-bold text-emerald-900">Resolution Successful</AlertTitle>
          <AlertDescription className="mt-2">
            <span className="block font-medium mb-1">AI Agent Decision:</span>
            {prescription.aiDecision}
          </AlertDescription>
        </Alert>
      )}

      {processMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Workflow Failed</AlertTitle>
          <AlertDescription>
            The agent encountered an error while processing this prescription. Please check logs or try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Initial Rejection</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm leading-relaxed">
              <p className="text-slate-700">{prescription.reason}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs font-medium uppercase tracking-wider mb-1">Final Status</span>
                <span className="font-medium">{prescription.finalStatus || 'Pending'}</span>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground block text-xs font-medium uppercase tracking-wider mb-1">Action Taken</span>
                <span className="font-medium">{prescription.actionTaken || 'None'}</span>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground block text-xs font-medium uppercase tracking-wider mb-1">Last Updated</span>
                <span className="font-medium">{format(new Date(prescription.updatedAt), 'PPp')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Workflow Timeline
              </CardTitle>
              <CardDescription>
                Detailed step-by-step log of the AI agent's actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingLogs ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !logs || logs.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-slate-100 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                  <p>Workflow has not been initiated yet.</p>
                  <p className="text-sm mt-1">Click "Initiate AI Resolution" to start the process.</p>
                </div>
              ) : (
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <StepIcon step={log.step} />
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-slate-900 text-sm capitalize">{log.step.replace('_', ' ')}</h3>
                          <time className="text-xs font-medium text-slate-500">{format(new Date(log.createdAt), 'HH:mm:ss')}</time>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug">{log.message}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isProcessing && (
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary/10 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4">
                        <p className="text-sm font-medium text-primary animate-pulse">Agent is thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ step }: { step: string }) {
  if (step.includes('call') || step.includes('pharmacy')) return <PhoneCall className="h-4 w-4" />;
  if (step.includes('decision') || step.includes('ai')) return <Bot className="h-4 w-4" />;
  if (step.includes('final') || step.includes('result')) return <CheckCircle2 className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}
