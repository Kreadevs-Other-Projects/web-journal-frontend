import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Send,
  User,
  FileText,
  HelpCircle,
  Globe,
  BookOpen,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Copy,
  CheckCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Library,
  Calendar,
  Users,
} from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/navbar";
import { url } from "@/url";

export default function ContactPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    department: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${url}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "", department: "" });
      } else {
        setSubmitError(data.message || "Failed to send message. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      label: "Visit Us",
      value: "GIK Institute, Topi, Swabi, KPK, Pakistan",
      detail: "Main Academic Block, Room 201",
      action: "Get Directions",
      link: "https://maps.google.com/?q=GIK+Institute+Topi",
    },
    {
      icon: Mail,
      label: "Email Us",
      value: "journal@giki.edu.pk",
      detail: "editorial@journal.giki.edu.pk",
      action: "Send Message",
      link: "mailto:journal@giki.edu.pk",
      copyable: true,
    },
    {
      icon: Phone,
      label: "Call Us",
      value: "+92-938-281-026",
      detail: "Mon-Fri, 9:00 AM - 5:00 PM",
      action: "Make Call",
      link: "tel:+92938281026",
      copyable: true,
    },
    {
      icon: Clock,
      label: "Office Hours",
      value: "Monday - Friday",
      detail: "9:00 AM - 5:00 PM PKT",
      action: "View Calendar",
      link: "#",
    },
  ];

  const departments = [
    { id: "cs", name: "Computer Science" },
    { id: "ee", name: "Electrical Engineering" },
    { id: "me", name: "Mechanical Engineering" },
    { id: "ce", name: "Chemical Engineering" },
    { id: "ms", name: "Materials Science" },
    { id: "math", name: "Mathematics" },
    { id: "phy", name: "Physics" },
    { id: "edit", name: "Editorial Office" },
  ];

  const team = [
    {
      name: "Dr. Sarah Ahmed",
      role: "Chief Editor",
      email: "s.ahmed@giki.edu.pk",
      extension: "Ext. 1201",
      avatar: "/api/placeholder/60/60",
    },
    {
      name: "Prof. Michael Khan",
      role: "Managing Editor",
      email: "m.khan@giki.edu.pk",
      extension: "Ext. 1202",
      avatar: "/api/placeholder/60/60",
    },
    {
      name: "Dr. Fatima Hassan",
      role: "Review Coordinator",
      email: "f.hassan@giki.edu.pk",
      extension: "Ext. 1203",
      avatar: "/api/placeholder/60/60",
    },
    {
      name: "Mr. Ali Raza",
      role: "Technical Support",
      email: "a.raza@giki.edu.pk",
      extension: "Ext. 1204",
      avatar: "/api/placeholder/60/60",
    },
  ];

  const faqHighlights = [
    {
      icon: FileText,
      question: "How to submit a paper?",
      answer: "Click 'Submit Paper' and follow the guidelines",
      link: "/faq#submission",
    },
    {
      icon: Clock,
      question: "Review timeline?",
      answer: "Typically 6-8 weeks from submission",
      link: "/faq#review",
    },
    {
      icon: GraduationCap,
      question: "Student submissions?",
      answer: "Undergraduate research welcome with supervisor",
      link: "/faq#general",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      <Navbar />
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container relative mx-auto px-4"
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <MessageCircle className="h-4 w-4" />
              <span>Get in Touch</span>
            </div>

            <h1 className="mb-6 font-serif-roboto text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Connect with{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                GIKI Journal
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
              Have questions about publishing, accessing papers, or
              collaborating with us? Our team is here to assist you with any
              inquiries.
            </p>
          </div>
        </motion.div>

        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </section>

      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>

                <h3 className="mb-1 font-semibold">{item.label}</h3>

                <div className="mb-2 text-sm text-foreground">{item.value}</div>

                <p className="mb-3 text-xs text-muted-foreground">
                  {item.detail}
                </p>

                {item.copyable && (
                  <button
                    onClick={() => handleCopy(item.value, item.label)}
                    className="mb-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {copied === item.label ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}

                <a
                  href={item.link}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                >
                  {item.action}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/50 bg-background/50 p-8 backdrop-blur-sm"
          >
            <h2 className="mb-6 font-serif-roboto text-2xl font-bold">
              Send Us a Message
            </h2>

            {submitSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-green-500/10 p-6 text-center border border-green-500/20"
              >
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-green-500 mb-2">
                  Message Sent!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Thank you for reaching out. Our team will respond within 24
                  hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Full Name <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full rounded-lg border border-border/50 bg-background py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Dr. John Smith"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full rounded-lg border border-border/50 bg-background py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="john@example.edu"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/50 bg-background py-2.5 px-4 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Subject <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full rounded-lg border border-border/50 bg-background py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Paper submission inquiry"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={5}
                    className="w-full rounded-lg border border-border/50 bg-background py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="I would like to inquire about..."
                  />
                </div>

                {submitError && (
                  <p className="text-sm text-red-500">{submitError}</p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="h-64 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="relative h-full w-full">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="mx-auto h-12 w-12 text-primary/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      GIK Institute, Topi, Swabi
                    </p>
                    <Button variant="link" className="mt-2 text-primary">
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
                <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Visit Our Campus
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                The GIKI Journal editorial office is located in the Main
                Academic Block. Visitors are welcome during office hours. Please
                schedule an appointment for meetings with editors.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Weekdays only</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>9 AM - 5 PM</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-semibold">Connect With Us</h3>
              <div className="flex gap-3">
                {[
                  {
                    icon: Twitter,
                    label: "Twitter",
                    href: "#",
                    color: "hover:bg-blue-500/10 hover:text-blue-500",
                  },
                  {
                    icon: Linkedin,
                    label: "LinkedIn",
                    href: "#",
                    color: "hover:bg-blue-700/10 hover:text-blue-700",
                  },
                  {
                    icon: Facebook,
                    label: "Facebook",
                    href: "#",
                    color: "hover:bg-blue-600/10 hover:text-blue-600",
                  },
                  {
                    icon: Youtube,
                    label: "YouTube",
                    href: "#",
                    color: "hover:bg-red-500/10 hover:text-red-500",
                  },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-all duration-200 hover:scale-110 ${social.color}`}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="font-serif-roboto text-3xl font-bold">
            Contact Editorial Team
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reach out directly to our editorial staff
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{member.name}</h3>
                  <p className="text-xs text-primary">{member.role}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <a
                    href={`mailto:${member.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {member.email}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{member.extension}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-4 font-serif-roboto text-3xl font-bold">
                Quick Answers to Common Questions
              </h2>
              <p className="mb-6 text-muted-foreground">
                Before reaching out, check our FAQ section for instant answers
                to frequently asked questions.
              </p>

              <div className="space-y-4">
                {faqHighlights.map((item, index) => (
                  <a
                    key={index}
                    href={item.link}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.question}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.answer}
                      </p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-background/50 p-8 backdrop-blur-sm"
            >
              <HelpCircle className="h-16 w-16 text-primary/30 mb-4" />
              <h3 className="mb-2 text-xl font-semibold">
                Still have questions?
              </h3>
              <p className="mb-6 text-center text-muted-foreground">
                Visit our comprehensive FAQ page for detailed answers to all
                your queries.
              </p>
              <Button asChild className="gap-2">
                <a href="/faq">
                  View All FAQs
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Office Hours & Response Time */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              label: "Response Time",
              value: "Within 24 hours",
              detail: "Monday to Friday",
            },
            {
              icon: Users,
              label: "Support Team",
              value: "4 dedicated staff",
              detail: "Ready to assist you",
            },
            {
              icon: Globe,
              label: "Global Reach",
              value: "45+ countries",
              detail: "Worldwide readership",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm"
            >
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-secondary/90 p-12 text-center text-white"
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

          <div className="relative">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-white/80" />
            <h2 className="mb-4 font-serif-roboto text-3xl font-bold">
              Stay Updated with GIKI Journal
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-white/90">
              Subscribe to our newsletter for the latest research, publication
              opportunities, and updates from GIKI's academic community.
            </p>

            <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-white placeholder:text-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Button
                variant="secondary"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                Subscribe
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-4 text-xs text-white/70">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
