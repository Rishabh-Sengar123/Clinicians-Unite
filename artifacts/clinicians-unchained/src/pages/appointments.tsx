import { useState } from "react";
import {
  useListAppointments,
  useCreateAppointment,
  useListDoctors,
  useListInsuranceCompanies,
  useListInsurancePlans,
  getListAppointmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar as CalendarIcon,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { openRazorpay, formatPaise } from "@/lib/razorpay";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const FEES = [
  { label: "₹300 – General Consultation", value: 30000 },
  { label: "₹500 – Specialist Consultation", value: 50000 },
  { label: "₹750 – Detailed Review", value: 75000 },
  { label: "₹1000 – Premium Consultation", value: 100000 },
];

function statusBadge(status: string) {
  if (status === "confirmed")
    return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmed</Badge>;
  if (status === "cancelled")
    return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
}

function paymentBadge(status: string) {
  if (status === "paid")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
      <Clock className="h-3 w-3" /> Unpaid
    </span>
  );
}

export default function Appointments() {
  const { data: appointments, isLoading } = useListAppointments();
  const { patient } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [payingId, setPayingId] = useState<number | null>(null);

  const handlePayNow = async (appt: {
    id: number;
    consultationFee: number;
    patientName?: string | null;
  }) => {
    setPayingId(appt.id);
    try {
      const orderRes = await fetch(`${BASE_URL}/api/payments/appointment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appt.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Failed to create order");

      openRazorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Clinicians Unchained",
        description: "Consultation Fee",
        order_id: order.orderId,
        prefill: { name: patient?.name ?? "", email: patient?.email ?? "" },
        theme: { color: "#2563eb" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${BASE_URL}/api/payments/appointment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId: appt.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const result = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(result.error || "Payment verification failed");
            toast({
              title: "Payment Successful",
              description: "Appointment confirmed. A confirmation email has been sent.",
            });
            queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          } catch (err: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: err.message });
          } finally {
            setPayingId(null);
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Payment Error", description: err.message });
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Book and manage doctor appointments. Payment confirms your slot.
          </p>
        </div>
        <BookAppointmentDialog onBooked={() => queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() })} />
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
              <p className="font-medium">No appointments scheduled yet.</p>
              <p className="text-sm mt-1">Click "Book Appointment" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(appointments as any[]).map((appt) => (
                  <TableRow key={appt.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {format(new Date(appt.scheduledAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>{appt.patientName || `Patient #${appt.patientId}`}</TableCell>
                    <TableCell>{appt.doctorName || `Doctor #${appt.doctorId}`}</TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {formatPaise(appt.consultationFee ?? 30000)}
                    </TableCell>
                    <TableCell>{paymentBadge(appt.paymentStatus ?? "unpaid")}</TableCell>
                    <TableCell>{statusBadge(appt.status)}</TableCell>
                    <TableCell className="text-right">
                      {appt.paymentStatus !== "paid" && (
                        <Button
                          size="sm"
                          onClick={() => handlePayNow(appt)}
                          disabled={payingId === appt.id}
                          className="gap-1"
                        >
                          {payingId === appt.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CreditCard className="h-3 w-3" />
                          )}
                          Pay Now
                        </Button>
                      )}
                      {appt.paymentStatus === "paid" && (
                        <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Confirmed
                        </span>
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

function BookAppointmentDialog({ onBooked }: { onBooked: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: doctors } = useListDoctors();
  const { data: companies } = useListInsuranceCompanies();
  const createAppointment = useCreateAppointment();
  const { toast } = useToast();
  const { patient } = useAuth();

  const [doctorId, setDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [patientIdStr, setPatientIdStr] = useState(patient?.id ? String(patient.id) : "");
  const [selectedFee, setSelectedFee] = useState(String(FEES[0].value));
  const [hasInsurance, setHasInsurance] = useState<"yes" | "no" | "">("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const { data: plans } = useListInsurancePlans(
    selectedCompanyId ? parseInt(selectedCompanyId) : 0,
    { query: { enabled: !!selectedCompanyId } }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !scheduledAt || !patientIdStr) return;

    const insurancePlanId =
      hasInsurance === "yes" && selectedPlanId ? parseInt(selectedPlanId) : undefined;

    createAppointment.mutate(
      {
        data: {
          patientId: parseInt(patientIdStr, 10),
          doctorId: parseInt(doctorId, 10),
          scheduledAt: new Date(scheduledAt).toISOString(),
          insurancePlanId,
        },
      },
      {
        onSuccess: (appt: any) => {
          const fee = parseInt(selectedFee);
          // Immediately open Razorpay for the new appointment
          fetch(`${BASE_URL}/api/payments/appointment/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointmentId: appt.id }),
          })
            .then((r) => r.json())
            .then((order) => {
              if (order.error) throw new Error(order.error);
              setOpen(false);
              openRazorpay({
                key: order.keyId,
                amount: fee,
                currency: "INR",
                name: "Clinicians Unchained",
                description: "Consultation Fee",
                order_id: order.orderId,
                prefill: { name: patient?.name ?? "", email: patient?.email ?? "" },
                theme: { color: "#2563eb" },
                handler: async (response) => {
                  const verifyRes = await fetch(`${BASE_URL}/api/payments/appointment/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      appointmentId: appt.id,
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                    }),
                  });
                  const result = await verifyRes.json();
                  if (!verifyRes.ok) {
                    toast({ variant: "destructive", title: "Verification Failed", description: result.error });
                    return;
                  }
                  toast({
                    title: "Payment Successful",
                    description: "Appointment confirmed. Confirmation email sent.",
                  });
                  onBooked();
                },
                modal: { ondismiss: () => {
                  toast({ title: "Appointment Booked", description: "Pay later using the Pay Now button." });
                  onBooked();
                }},
              });
            })
            .catch(() => {
              toast({ title: "Appointment Booked", description: "Pay via Pay Now to confirm your slot." });
              onBooked();
            });

          setDoctorId("");
          setScheduledAt("");
          setHasInsurance("");
          setSelectedPlanId("");
          setSelectedCompanyId("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create appointment." });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarIcon className="h-4 w-4" /> Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule a visit. Payment will be collected to confirm your slot.
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
                placeholder="Enter patient ID"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="doctor">Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId} required>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors?.map((doc) => (
                    <SelectItem key={doc.id} value={String(doc.id)}>
                      {doc.name} – {doc.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fee">Consultation Fee</Label>
              <Select value={selectedFee} onValueChange={setSelectedFee}>
                <SelectTrigger id="fee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEES.map((f) => (
                    <SelectItem key={f.value} value={String(f.value)}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Do you have insurance?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={hasInsurance === "yes" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHasInsurance("yes")}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={hasInsurance === "no" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setHasInsurance("no"); setSelectedPlanId(""); setSelectedCompanyId(""); }}
                >
                  No
                </Button>
              </div>
            </div>

            {hasInsurance === "yes" && (
              <>
                <div className="grid gap-2">
                  <Label>Insurance Company</Label>
                  <Select value={selectedCompanyId} onValueChange={(v) => { setSelectedCompanyId(v); setSelectedPlanId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCompanyId && (
                  <div className="grid gap-2">
                    <Label>Insurance Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans?.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.planName} – {formatPaise(p.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

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

            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
              <span className="font-semibold">Fee:</span>{" "}
              {formatPaise(parseInt(selectedFee))} — payable via Razorpay after booking.
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAppointment.isPending} className="gap-2">
              {createAppointment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Book & Pay
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
