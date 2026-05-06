import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeft, Save, Globe, Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { url } from "@/url";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";

const GlobalSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = localStorage.getItem("token"); // Ya useAuth() se token lein

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    contact_email: "",
    contact_phone: "",
    contact_address: "",
  });

  // Backend se existing settings fetch karna
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${url}/public/global-settings`);
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Updated settings ko save karna
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${url}/publisher/global-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Global footer settings saved!",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <div className="container mx-auto py-10 px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="glass-card border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Globe className="h-6 w-6" />
              <CardTitle className="text-2xl">Global Footer Settings</CardTitle>
            </div>
            <CardDescription>
              Update the contact information that appears on the footer of all
              pages.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {loading ? (
              <div className="text-center py-10">Loading settings...</div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" /> Support
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact_email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" /> Phone
                    Number
                  </Label>
                  <Input
                    type="text"
                    value={settings.contact_phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact_phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Office
                    Address
                  </Label>
                  <Textarea
                    className="min-h-[100px]"
                    value={settings.contact_address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact_address: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-end border-t border-border pt-6">
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save Settings"}
              {!saving && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GlobalSettingsPage;
