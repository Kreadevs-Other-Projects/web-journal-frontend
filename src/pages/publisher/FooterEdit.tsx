import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function PublisherDashboard() {
  const { user } = useAuth();

  // --- PASTE THIS NEW STATE AND FUNCTION ---
  const [contactForm, setContactForm] = useState({
    contact_email: "",
    contact_phone: "",
    contact_address: "",
  });
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (selectedJournal) {
      setContactForm({
        contact_email: selectedJournal.contact_email || "",
        contact_phone: selectedJournal.contact_phone || "",
        contact_address: selectedJournal.contact_address || "",
      });
    }
  }, [selectedJournal]);

  const updateContactInfo = async () => {
    if (!selectedJournal) return;
    try {
      setSavingContact(true);
      const res = await fetch(
        `${url}/publisher/journals/${selectedJournal.id}/contact`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactForm),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Success",
        description: "Footer contact information updated.",
      });
      fetchJournals();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setSavingContact(false);
    }
  };
  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      {/* PASTE THE FOOTER CONTACT SETTINGS CARD HERE */}
      {/* ========================================== */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Footer Contact Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Support Email</Label>
            <Input
              placeholder="support@example.com"
              value={contactForm.contact_email}
              onChange={(e) =>
                setContactForm({
                  ...contactForm,
                  contact_email: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input
              placeholder="+1 (555) 123-4567"
              value={contactForm.contact_phone}
              onChange={(e) =>
                setContactForm({
                  ...contactForm,
                  contact_phone: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Office Address</Label>
            <Textarea
              placeholder="123 Academic Way, Suite 400..."
              className="min-h-[80px]"
              value={contactForm.contact_address}
              onChange={(e) =>
                setContactForm({
                  ...contactForm,
                  contact_address: e.target.value,
                })
              }
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={updateContactInfo}
              disabled={savingContact}
              size="sm"
            >
              {savingContact ? "Saving..." : "Save Contact Info"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* ========================================== */}
    </DashboardLayout>
  );
}
