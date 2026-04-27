import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  FileText,
  Users,
  Clock,
  Award,
  Mail,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  Shield,
  Sparkles,
  Download,
  Upload,
  Eye,
  CreditCard,
  Globe,
  BookMarked,
  PenTool,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>("general");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const categories = [
    {
      id: "general",
      name: "General Questions",
      icon: HelpCircle,
      color: "from-blue-500 to-cyan-500",
      questions: [
        {
          q: "What is Paperuno?",
          a: "Paperuno is a scholarly publishing platform operated by Indus Academic Press. It serves as a digital hub for research papers, scholarly articles, and academic publications across multiple journals.",
        },
        {
          q: "Who can publish on Paperuno?",
          a: "Paperuno is open to researchers, faculty members, PhD scholars, and graduate students across all institutions. External collaborators and independent researchers are also eligible to publish.",
        },
        {
          q: "Is Paperuno open access?",
          a: "Yes, Paperuno supports open access publishing. Published papers are freely available to read, download, and share, promoting global dissemination of knowledge.",
        },
        {
          q: "How do I create an account?",
          a: "You can create an account by clicking the 'Sign In' button and selecting 'Register'. Use your institutional email address for verification.",
        },
      ],
    },
    {
      id: "submission",
      name: "Paper Submission",
      icon: Upload,
      color: "from-purple-500 to-pink-500",
      questions: [
        {
          q: "How do I submit a paper?",
          a: "Click the 'Submit Paper' button in the navigation bar. You'll need to create an account or sign in first. Follow the step-by-step submission process: upload your manuscript, add co-authors, provide abstract and keywords, and select the appropriate category.",
        },
        {
          q: "What are the formatting requirements?",
          a: "Manuscripts should follow the Paperuno Formatting Guidelines. Use the provided template (LaTeX or Word) which includes specific requirements for margins, font sizes (12pt), citation style (IEEE), and reference formatting. Maximum length is 25 pages including references.",
        },
        {
          q: "Can I submit papers co-authored with external researchers?",
          a: "Yes, papers with external co-authors are welcome. At least one author must be affiliated with Paperuno. All authors must provide their institutional affiliations and ORCID IDs if available.",
        },
        {
          q: "What is the peer review process?",
          a: "Submissions undergo a double-blind peer review process. Each paper is reviewed by at least two subject matter experts from our editorial board or external reviewers. The review typically takes 4-6 weeks.",
        },
      ],
    },
    {
      id: "review",
      name: "Review Process",
      icon: Eye,
      color: "from-orange-500 to-red-500",
      questions: [
        {
          q: "How long does the review process take?",
          a: "The complete review process typically takes 6-8 weeks from submission to decision. This includes initial screening (1 week), peer review (4-6 weeks), and editorial decision (1 week).",
        },
        {
          q: "What are the possible decisions after review?",
          a: "Papers can receive one of four decisions: Accept without revisions (rare), Minor revisions required, Major revisions required, or Reject. Authors receive detailed reviewer comments with all decisions except outright rejection.",
        },
        {
          q: "Can I suggest reviewers for my paper?",
          a: "Yes, authors may suggest up to three potential reviewers. However, the final selection of reviewers is at the editor's discretion to ensure no conflicts of interest.",
        },
        {
          q: "What happens after my paper is accepted?",
          a: "Accepted papers go through copyediting, typesetting, and proof review. The corresponding author receives proofs within 2 weeks. After final approval, the paper is published online with a DOI and made available in the next quarterly issue.",
        },
      ],
    },
    {
      id: "access",
      name: "Access & Downloads",
      icon: Download,
      color: "from-green-500 to-emerald-500",
      questions: [
        {
          q: "How do I download papers?",
          a: "All papers are freely available for download. Simply navigate to any paper's page and click the 'Download PDF' button. No registration is required for downloading published papers.",
        },
        {
          q: "Can I get print copies of papers?",
          a: "Paperuno is primarily a digital platform. However, authors can request high-quality PDFs suitable for printing. For official print copies, please contact the library.",
        },
        {
          q: "Are there mobile apps available?",
          a: "Currently, Paperuno is optimized for mobile browsers. Native iOS and Android apps are under development.",
        },
      ],
    },
    {
      id: "policies",
      name: "Policies & Guidelines",
      icon: Shield,
      color: "from-indigo-500 to-purple-500",
      questions: [
        {
          q: "What is the copyright policy?",
          a: "Authors retain copyright of their work. Papers are published under a Creative Commons Attribution License (CC BY 4.0), allowing others to share and adapt the work with proper attribution.",
        },
        {
          q: "What about plagiarism?",
          a: "All submissions undergo plagiarism screening using Turnitin. Papers with more than 15% similarity index (excluding references) are automatically rejected. Self-plagiarism is also strictly monitored.",
        },
        {
          q: "Can I submit previously published work?",
          a: "No, submissions must be original and not under consideration elsewhere. Extended versions of conference papers are acceptable if they contain at least 40% new content and proper disclosure is made.",
        },
        {
          q: "What is the policy on data availability?",
          a: "Authors are encouraged to deposit their research data in public repositories and provide DOIs or access information in the paper. This promotes reproducibility and transparency.",
        },
      ],
    },
    {
      id: "technical",
      name: "Technical Support",
      icon: MessageCircle,
      color: "from-pink-500 to-rose-500",
      questions: [
        {
          q: "I'm having trouble submitting my paper",
          a: "Contact our technical support team at support@paperuno.com. Include screenshots of any error messages and details about your browser. Most issues are resolved within 24 hours.",
        },
        {
          q: "What browsers are supported?",
          a: "Paperuno works best with the latest versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported. Enable JavaScript and cookies for full functionality.",
        },
        {
          q: "How do I update my profile information?",
          a: "Log in to your account, click on your profile picture, and select 'Profile Settings'. Here you can update your email, affiliation, research interests, and ORCID ID.",
        },
      ],
    },
  ];

  const toggleItem = (categoryId: string, questionIndex: number) => {
    const itemId = `${categoryId}-${questionIndex}`;
    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
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
              <HelpCircle className="h-4 w-4" />
              <span>Frequently Asked Questions</span>
            </div>

            <h1 className="mb-6 font-serif-roboto text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              How Can We{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Help You?
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
              Find answers to common questions about publishing, accessing
              papers, and using the Paperuno platform.
            </p>

            <div className="relative mx-auto max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/50 bg-background/50 py-4 pl-12 pr-4 text-foreground backdrop-blur-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </motion.div>

        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileText, label: "Submission Guide", count: "8 articles" },
            { icon: Clock, label: "Review Timeline", count: "4-6 weeks" },
            { icon: Award, label: "Author Benefits", count: "5 perks" },
            { icon: Mail, label: "Contact Support", count: "24/7 help" },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.count}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="sticky top-24 space-y-2">
              <h3 className="mb-4 font-semibold text-foreground">
                Browse by Topic
              </h3>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                    openCategory === category.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <category.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{category.name}</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                      openCategory === category.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-9"
          >
            <div className="space-y-8">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div
                      className={`rounded-lg bg-gradient-to-br ${category.color} p-2.5 text-white`}
                    >
                      <category.icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-semibold">{category.name}</h2>
                  </div>

                  <div className="space-y-4">
                    {category.questions.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={false}
                        className="overflow-hidden rounded-xl border border-border/50 bg-background/30"
                      >
                        <button
                          onClick={() => toggleItem(category.id, index)}
                          className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-accent/50"
                        >
                          <span className="font-medium text-foreground">
                            {item.q}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                              openItems.includes(`${category.id}-${index}`)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {openItems.includes(`${category.id}-${index}`) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-border/50 bg-accent/20"
                            >
                              <div className="p-5 text-muted-foreground">
                                {item.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="rounded-2xl border border-border/50 bg-background/50 p-12 text-center backdrop-blur-sm">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No results found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try searching with different keywords or browse by category
                    above.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-12 text-center"
        >
          <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

          <div className="relative">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>

            <h2 className="mb-4 font-serif-roboto text-3xl font-bold">
              Still Have Questions?
            </h2>

            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Can't find what you're looking for? Our support team is here to
              help you with any questions about publishing, accessing papers, or
              using the platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to={`/contact-us`}>
                <Button
                  size="lg"
                  className="gap-2 bg-primary text-white hover:bg-primary/90"
                >
                  <Mail className="h-5 w-5" />
                  Contact Support
                </Button>
              </Link>
              {/* <Button size="lg" variant="outline" className="gap-2">
                <BookOpen className="h-5 w-5" />
                Read Documentation
              </Button> */}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Response within 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Dedicated support team</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
