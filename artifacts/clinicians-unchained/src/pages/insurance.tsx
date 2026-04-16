import { useState } from "react";
import {
  useListInsuranceCompanies,
  useListInsurancePlans,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  CreditCard,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { openRazorpay, formatPaise } from "@/lib/razorpay";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function InsurancePlans({ companyId }: { companyId: number }) {
  const { data: plans, isLoading } = useListInsurancePlans(companyId);
  const { patient } = useAuth();
  const { toast } = useToast();
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<number>>(new Set());

  const handleBuyPlan = async (plan: { id: number; planName: string; price: number }) => {
    if (!patient) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to purchase an insurance plan.",
      });
      return;
    }
    setBuyingId(plan.id);
    try {
      const orderRes = await fetch(`${BASE_URL}/api/payments/insurance/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, patientId: patient.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Failed to create order");

      openRazorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Clinicians Unchained",
        description: `${plan.planName} – Insurance Plan`,
        order_id: order.orderId,
        prefill: { name: patient.name, email: patient.email },
        theme: { color: "#2563eb" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${BASE_URL}/api/payments/insurance/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planId: plan.id,
                patientId: patient.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const result = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(result.error || "Verification failed");
            setPurchasedIds((prev) => new Set(prev).add(plan.id));
            toast({
              title: "Plan Purchased",
              description: `${plan.planName} has been assigned to your profile.`,
            });
          } catch (err: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: err.message });
          } finally {
            setBuyingId(null);
          }
        },
        modal: { ondismiss: () => setBuyingId(null) },
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      setBuyingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 pt-3 pb-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return <p className="text-sm text-muted-foreground px-4 py-4">No plans available.</p>;
  }

  const isCurrentPlan = (planId: number) => patient?.insurancePlanId === planId;
  const justPurchased = (planId: number) => purchasedIds.has(planId);

  return (
    <div className="px-4 pb-4 pt-2 space-y-3">
      {(plans as any[]).map((plan) => (
        <div
          key={plan.id}
          className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-slate-800">{plan.planName}</span>
              <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-xs font-semibold">
                {formatPaise(plan.price ?? 49900)}
              </Badge>
              {(isCurrentPlan(plan.id) || justPurchased(plan.id)) && (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active Plan
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {plan.coverageDetails}
            </p>
          </div>
          <div className="flex-shrink-0">
            {isCurrentPlan(plan.id) || justPurchased(plan.id) ? (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => handleBuyPlan({ id: plan.id, planName: plan.planName, price: plan.price ?? 49900 })}
                disabled={buyingId === plan.id || !patient}
              >
                {buyingId === plan.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CreditCard className="h-3.5 w-3.5" />
                )}
                Buy Plan
              </Button>
            )}
          </div>
        </div>
      ))}
      {!patient && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Log in to purchase a plan.
        </p>
      )}
    </div>
  );
}

function InsuranceCompanyCard({
  company,
}: {
  company: { id: number; name: string; supportedPlans: string[] };
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all border-slate-200">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{company.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {company.supportedPlans.length} plan
                    {company.supportedPlans.length !== 1 ? "s" : ""} available — click to view &amp; enroll
                  </CardDescription>
                </div>
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 border-slate-200 rounded-b-lg -mt-1 bg-white overflow-hidden">
          <InsurancePlans companyId={company.id} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Insurance() {
  const { data: companies, isLoading } = useListInsuranceCompanies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insurance Providers</h1>
        <p className="text-muted-foreground mt-1">
          Browse plans, view coverage details, and enroll directly via Razorpay.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !companies || companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Shield className="h-12 w-12 text-slate-300 mb-4" />
          <p>No insurance providers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(companies as any[]).map((company) => (
            <InsuranceCompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
