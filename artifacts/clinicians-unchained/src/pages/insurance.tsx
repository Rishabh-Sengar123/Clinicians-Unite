import { useState } from "react";
import { useListInsuranceCompanies, useListInsurancePlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ShieldCheck } from "lucide-react";

export default function Insurance() {
  const { data: companies, isLoading } = useListInsuranceCompanies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insurance Providers</h1>
        <p className="text-muted-foreground mt-1">Browse supported insurance companies and plans.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : !companies || companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-lg bg-card border-dashed">
          <ShieldCheck className="h-12 w-12 mb-4 text-slate-300" />
          <p>No insurance companies found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company }: { company: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: plans, isLoading } = useListInsurancePlans(company.id, { query: { enabled: isOpen } });

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
          <div>
            <CardTitle className="text-xl">{company.name}</CardTitle>
            <CardDescription className="mt-1">
              Supports {company.supportedPlans.length} plan types
            </CardDescription>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-semibold mb-3">Available Plans</h4>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !plans || plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No specific plans loaded.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map(plan => (
                    <div key={plan.id} className="p-3 bg-slate-50 rounded-md border">
                      <p className="font-medium text-sm text-primary">{plan.planName}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.coverageDetails}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
