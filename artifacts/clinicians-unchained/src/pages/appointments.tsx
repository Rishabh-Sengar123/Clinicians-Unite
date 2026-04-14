import { useState } from "react";
import { useListAppointments, useConfirmAppointment, useCreateAppointment, useListDoctors, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar as CalendarIcon, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Appointments() {
  const { data: appointments, isLoading } = useListAppointments();
  const confirmAppointment = useConfirmAppointment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const handleConfirm = (id: number) => {
    setConfirmingId(id);
    confirmAppointment.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Appointment confirmed", description: "Email notification sent." });
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        setConfirmingId(null);
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Confirmation Failed", description: err.message || "An error occurred." });
        setConfirmingId(null);
      }
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage doctor appointments.</p>
        </div>
        <BookAppointmentDialog />
      </div>

      <Card className="border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !appointments || appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 text-slate-300 mb-4" />
              <p>No appointments scheduled.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {format(new Date(appointment.scheduledAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{appointment.patientName || `Patient #${appointment.patientId}`}</TableCell>
                    <TableCell>{appointment.doctorName || `Doctor #${appointment.doctorId}`}</TableCell>
                    <TableCell><StatusBadge status={appointment.status} /></TableCell>
                    <TableCell className="text-right">
                      {appointment.status === 'pending' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleConfirm(appointment.id)}
                          disabled={confirmingId === appointment.id}
                        >
                          {confirmingId === appointment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          ) : (
                            <Check className="h-3 w-3 mr-2" />
                          )}
                          Confirm
                        </Button>
                      )}
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

function BookAppointmentDialog() {
  const [open, setOpen] = useState(false);
  const { data: doctors } = useListDoctors();
  const createAppointment = useCreateAppointment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { patient } = useAuth();
  
  const [doctorId, setDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [patientIdStr, setPatientIdStr] = useState(patient?.id ? String(patient.id) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !scheduledAt || !patientIdStr) return;
    
    createAppointment.mutate({
      data: {
        patientId: parseInt(patientIdStr, 10),
        doctorId: parseInt(doctorId, 10),
        scheduledAt: new Date(scheduledAt).toISOString()
      }
    }, {
      onSuccess: () => {
        toast({ title: "Appointment Created", description: "Successfully scheduled." });
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        setOpen(false);
        setDoctorId("");
        setScheduledAt("");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create appointment." });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><CalendarIcon className="mr-2 h-4 w-4" /> Book Appointment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new visit with a doctor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input 
                id="patientId" 
                type="number" 
                value={patientIdStr} 
                onChange={(e) => setPatientIdStr(e.target.value)} 
                required 
                disabled={!!patient}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doctor">Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId} required>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.map(doc => (
                    <SelectItem key={doc.id} value={String(doc.id)}>
                      {doc.name} - {doc.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="datetime">Date and Time</Label>
              <Input 
                id="datetime" 
                type="datetime-local" 
                value={scheduledAt} 
                onChange={(e) => setScheduledAt(e.target.value)} 
                required 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createAppointment.isPending}>
              {createAppointment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
