import { useState } from "react";
import { useListDoctors } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, UserRound } from "lucide-react";

export default function Doctors() {
  const [specialization, setSpecialization] = useState("");
  const { data: doctors, isLoading } = useListDoctors({ specialization: specialization || undefined });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctors Network</h1>
        <p className="text-muted-foreground mt-1">Find specialists and view their availability.</p>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter by specialization (e.g. Cardiology)..." 
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="bg-white"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !doctors || doctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-lg bg-card border-dashed">
          <UserRound className="h-12 w-12 mb-4 text-slate-300" />
          <p>No doctors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map(doctor => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{doctor.name}</CardTitle>
                <CardDescription className="font-medium text-primary">
                  {doctor.specialization}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Available Slots</p>
                  <div className="flex flex-wrap gap-2">
                    {doctor.availabilitySlots?.length > 0 ? (
                      doctor.availabilitySlots.map((slot, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                          {slot}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No slots available</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
