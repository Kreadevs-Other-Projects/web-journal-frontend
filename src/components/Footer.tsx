import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { url } from "@/url"; // Make sure to import your URL config

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // 1. Add state to hold the dynamic footer data
  const [footerData, setFooterData] = useState({
    contact_email: "support@paperuno.com", // Default fallback
    contact_phone: "+1 (555) 123-4567", // Default fallback
    contact_address: "123 Academic Way,\nSuite 400, Boston, MA 02110", // Default fallback
  });

  // 2. Fetch the data from the backend when the footer loads
  useEffect(() => {
    fetch(`${url}/public/global-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setFooterData({
            contact_email:
              data.settings.contact_email || "support@paperuno.com",
            contact_phone: data.settings.contact_phone || "+1 (555) 123-4567",
            contact_address:
              data.settings.contact_address ||
              "123 Academic Way,\nSuite 400, Boston, MA 02110",
          });
        }
      })
      .catch((err) => console.error("Footer fetch error", err));
  }, []);

  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-card/50 to-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/20 flex items-center justify-center transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-serif font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Paperuno
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A premier scholarly publishing platform advancing open access
              research and academic excellence.
            </p>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground/70">
                Publications issued under
              </p>
              <p className="text-sm font-medium text-foreground/80">
                Indus Academic Press
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-5 text-base relative inline-block after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-primary/60 after:rounded-full">
              Platform
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { name: "Browse Papers", path: "/browse" },
                { name: "Submit Paper", path: "/login" },
                { name: "Reviewer Portal", path: "/login" },
                { name: "Editorial Board", path: "/editorial-board" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-5 text-base relative inline-block after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-primary/60 after:rounded-full">
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { name: "About Us", path: "/about" },
                { name: "FAQ", path: "/faq" },
                { name: "Author Guidelines", path: "/guidelines" },
                { name: "Peer Review Process", path: "/peer-review" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-5 text-base relative inline-block after:absolute after:bottom-[-8px] after:left-0 after:w-8 after:h-0.5 after:bg-primary/60 after:rounded-full">
              Contact
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 group">
                <Mail className="h-4 w-4 text-primary/70 mt-0.5 group-hover:text-primary transition-colors shrink-0" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {/* 3. Replaced static email */}
                  {footerData.contact_email}
                </span>
              </li>
              <li className="flex items-start gap-3 group">
                <Phone className="h-4 w-4 text-primary/70 mt-0.5 group-hover:text-primary transition-colors shrink-0" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {/* 3. Replaced static phone */}
                  {footerData.contact_phone}
                </span>
              </li>
              <li className="flex items-start gap-3 group">
                <MapPin className="h-4 w-4 text-primary/70 mt-0.5 group-hover:text-primary transition-colors shrink-0" />
                {/* 3. Replaced static address and added whitespace-pre-wrap to handle line breaks from the Textarea */}
                <span className="text-muted-foreground group-hover:text-foreground transition-colors whitespace-pre-wrap">
                  {footerData.contact_address}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground/70">
            © {currentYear} Indus Academic Press. All rights reserved.
          </p>

          <p className="text-[15px] text-muted-foreground/50">
            Developed and maintained with dedication by{" "}
            <span className="font-semibold text-muted-foreground hover:text-muted-foreground transition-colors">
              Kreadevs
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
            <Link
              to="/privacy"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
