import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientProfile } from "@workspace/api-client-react";

export default function Profile() {
  const { token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && token) {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      fetch(`${baseUrl}/api/patients/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">View your personal and medical information.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
          <CardDescription>Your registered information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : profile ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                  <p className="text-base font-medium mt-1">{profile.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="text-base font-medium mt-1">{profile.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Age</h3>
                  <p className="text-base font-medium mt-1">{profile.age}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Insurance Plan</h3>
                  <p className="text-base font-medium mt-1">
                    {profile.insurancePlan ? profile.insurancePlan.planName : "None"}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Medical History</h3>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm">
                  {profile.medicalHistory || "No medical history provided."}
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Could not load profile data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
