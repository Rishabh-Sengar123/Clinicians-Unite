import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitPrescription } from "@workspace/api-client-react";
import { getListPrescriptionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Pill } from "lucide-react";

const formSchema = z.object({
  drug: z.string().min(2, "Drug name must be at least 2 characters."),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)."),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubmitPrescription() {
  const submitMutation = useSubmitPrescription();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drug: "",
      reason: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    submitMutation.mutate({ data }, {
      onSuccess: (result) => {
        toast({
          title: "Prescription Submitted",
          description: "The rejected prescription has been logged.",
        });
        queryClient.invalidateQueries({ queryKey: getListPrescriptionsQueryKey() });
        setLocation(`/prescriptions/${result.id}`);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "There was an error submitting the prescription. Please try again.",
        });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submit Rejection</h1>
        <p className="text-muted-foreground mt-1">Log a rejected prescription for AI resolution workflow.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Prescription Details
          </CardTitle>
          <CardDescription>
            Enter the details of the prescription that requires intervention.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="drug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Drug Name & Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Amoxicillin 500mg" className="bg-slate-50 focus-visible:bg-white" {...field} />
                    </FormControl>
                    <FormDescription>
                      The specific medication that was rejected.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide details about why this prescription was rejected..." 
                        className="min-h-[120px] bg-slate-50 focus-visible:bg-white" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Include any pharmacy notes, PA requirements, or formulary issues.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-4 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/prescriptions")}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-2" />
                )}
                Submit to Workflow
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
