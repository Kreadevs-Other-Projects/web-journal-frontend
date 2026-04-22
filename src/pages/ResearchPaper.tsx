import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SignatureModal } from "@/components/SignatureModal";
import { PageTransition } from "@/components/AnimationWrappers";
import {
  ArrowLeft,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Eye,
  Download,
  Send,
  Star,
  ChevronDown,
  User,
  Building,
  Hash,
  Globe,
  ExternalLink,
  Tag,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { url } from "@/url";
import { useAuth } from "@/context/AuthContext";

interface PublicPaper {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  author_names: string[];
  author_username: string;
  journal_title: string;
  issn: string;
  volume: number;
  issue: number;
  year: number;
  issue_label: string;
  doi: string | null;
  publication_date: string;
  published_at: string;
  file_url: string;
  html_content?: string;
  status: string;
}

// This would come from your backend API
const mockPaperData = {
  id: "REV-001",
  title:
    "Machine Learning Applications in Climate Modeling: A Comprehensive Survey",
  abstract:
    "This paper provides a comprehensive review of machine learning techniques applied to climate modeling, including neural networks, ensemble methods, and deep learning approaches. The study analyzes over 200 papers from the last decade, identifying key trends, challenges, and future directions in climate informatics.",
  authors: ["Dr. Jane Smith", "Prof. John Doe", "Dr. Maria Garcia"],
  affiliations: ["University of Oxford", "MIT", "Stanford University"],
  category: "Artificial Intelligence",
  subCategory: "Climate Informatics",
  keywords: [
    "Machine Learning",
    "Climate Modeling",
    "Deep Learning",
    "Neural Networks",
    "Environmental Science",
  ],
  submittedDate: "2024-01-15",
  dueDate: "2024-02-15",
  status: "under_review" as const,
  version: "v2.0",
  priority: "high" as const,
  pdfUrl: "https://arxiv.org/pdf/2301.00001.pdf",
  reviewersCount: 2,
  currentReviewerProgress: 65,
  daysLeft: 12,
  wordCount: 8500,
  referenceCount: 142,
  figuresCount: 15,
  tablesCount: 8,
  supplementaryMaterials: ["Dataset.csv", "Code.zip", "Appendix.pdf"],
  conflictsOfInterest: "None declared",
  funding: "NSF Grant #123456",
  license: "CC BY 4.0",
  suggestedReviewers: [
    "Dr. Alex Johnson",
    "Prof. Sarah Lee",
    "Dr. Michael Brown",
  ],
  previousVersions: ["v1.0", "v1.1", "v1.2"],
  editorComments:
    "This is an important contribution to the field. Please pay special attention to the methodology section.",
};

const reviewCriteria = [
  {
    id: "originality",
    label: "Originality",
    description: "Novel contribution to the field",
  },
  {
    id: "methodology",
    label: "Methodology",
    description: "Sound research methods and experimental design",
  },
  {
    id: "clarity",
    label: "Clarity",
    description: "Well-written, organized, and easy to follow",
  },
  {
    id: "significance",
    label: "Significance",
    description: "Impact and importance to the field",
  },
  {
    id: "references",
    label: "References",
    description: "Appropriate and comprehensive citations",
  },
  {
    id: "technical",
    label: "Technical Quality",
    description: "Technical accuracy and rigor",
  },
];

const similarPapers = [
  {
    id: "SIM-001",
    title: "Deep Learning for Climate Prediction",
    authors: "Chen et al.",
    year: 2023,
    citations: 45,
    relevance: "High",
  },
  {
    id: "SIM-002",
    title: "AI Applications in Environmental Science",
    authors: "Johnson & Smith",
    year: 2022,
    citations: 89,
    relevance: "Medium",
  },
];

export default function ResearchPaperDetail() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paper, setPaper] = useState(mockPaperData);
  const [isLoading, setIsLoading] = useState(false);
  const [publicPaper, setPublicPaper] = useState<PublicPaper | null>(null);

  // Review form state
  const [decision, setDecision] = useState<string>("");
  const [comments, setComments] = useState("");
  const [confidentialComments, setConfidentialComments] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [activeTab, setActiveTab] = useState("review");
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);

  // Fetch real public paper data for metadata display
  useEffect(() => {
    if (!paperId) return;
    setIsLoading(true);
    const fetchPaper = async () => {
      try {
        const r = await fetch(`${url}/browse/paper/${paperId}`);
        const d = await r.json();
        if (d.success && d.paper) {
          setPublicPaper(d.paper);
          if (d.paper.html_content) setHtmlContent(d.paper.html_content);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaper();
  }, [paperId]);

  // Option B: on-demand HTML fetch for .docx without cached html_content
  useEffect(() => {
    if (!publicPaper || htmlContent !== null) return;
    if (!publicPaper.file_url || !publicPaper.file_url.endsWith(".docx"))
      return;
    setHtmlLoading(true);
    const fetchHtml = async () => {
      try {
        const r = await fetch(`${url}/browse/paper/${paperId}/html`);
        const d = await r.json();
        if (d.success && d.html) setHtmlContent(d.html);
      } catch (_) {
      } finally {
        setHtmlLoading(false);
      }
    };
    fetchHtml();
  }, [publicPaper, paperId, htmlContent]);

  const handleSubmitReview = () => {
    if (decision === "accept" || decision === "reject") {
      setSignatureModalOpen(true);
    } else {
      // For revision decisions

      // In real app: API call to submit review
      // Then navigate back or show success message
      navigate("/reviewer/papers");
    }
  };

  const handleSignatureConfirm = (signature: string, password: string) => {
    setSignatureModalOpen(false);
    navigate("/reviewer/papers");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="reviewer" userName={user?.username}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading paper details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="reviewer" userName={user?.username}>
      <PageTransition>
        <div className="space-y-6">
          {/* Public Article Metadata Panel */}
          {publicPaper && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg text-foreground leading-snug">
                      {publicPaper.title}
                    </h2>
                    {publicPaper.author_names?.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {publicPaper.author_names.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Journal:</span>
                    <span>{publicPaper.journal_title}</span>
                  </div>
                  {publicPaper.issn && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">ISSN:</span>
                      <span className="font-mono">{publicPaper.issn}</span>
                    </div>
                  )}
                  {(publicPaper.volume || publicPaper.issue) && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Issue:</span>
                      <span>
                        {publicPaper.issue_label ||
                          `Vol ${publicPaper.volume}, Issue ${publicPaper.issue} (${publicPaper.year})`}
                      </span>
                    </div>
                  )}
                  {(publicPaper.publication_date ||
                    publicPaper.published_at) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Published:</span>
                      <span>
                        {new Date(
                          publicPaper.publication_date ||
                            publicPaper.published_at,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">License:</span>
                    <span>CC BY 4.0</span>
                  </div>
                </div>

                {publicPaper.doi && (
                  <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-border/50">
                    <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">DOI:</span>
                    <a
                      href={`https://doi.org/${publicPaper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono"
                    >
                      https://doi.org/{publicPaper.doi}
                    </a>
                  </div>
                )}

                {publicPaper.abstract && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Abstract
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                      {publicPaper.abstract}
                    </p>
                  </div>
                )}

                {publicPaper.keywords?.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {publicPaper.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}

                {publicPaper.file_url && (
                  <div className="mt-3">
                    <a
                      href={`${url}${publicPaper.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Manuscript
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Header with navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/reviewer/papers")}
                className="gap-2 bg-muted/50 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Papers
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Paper Review
                </h1>
                <p className="text-sm text-muted-foreground">
                  ID: {paperId} • {paper.category}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(paper.priority)}>
                {paper.priority} priority
              </Badge>
              <StatusBadge status={paper.status} />
            </div>
          </div>

          {/* Paper title and metadata */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                {paper.title}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Authors
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {paper.authors.map((author, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-foreground">{author}</span>
                        {paper.affiliations[idx] && (
                          <span className="text-xs">
                            ({paper.affiliations[idx]})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      Submitted:{" "}
                      {new Date(paper.submittedDate).toLocaleDateString()}
                    </div>
                    <div>
                      Due: {new Date(paper.dueDate).toLocaleDateString()}
                    </div>
                    <div className="text-foreground font-medium">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {paper.daysLeft} days remaining
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Details
                  </Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Version: {paper.version}</div>
                    <div>Words: {paper.wordCount.toLocaleString()}</div>
                    <div>References: {paper.referenceCount}</div>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {paper.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main content with tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="bg-muted/50">
              <TabsTrigger value="review">
                <Edit3 className="h-4 w-4 mr-2" />
                Review Form
              </TabsTrigger>
              <TabsTrigger value="paper">
                <FileText className="h-4 w-4 mr-2" />
                Paper Content
              </TabsTrigger>
              {/* <TabsTrigger value="details">
                <Eye className="h-4 w-4 mr-2" />
                Details & Metadata
              </TabsTrigger> */}
              {/* <TabsTrigger value="similar">
                <Globe className="h-4 w-4 mr-2" />
                Similar Papers
              </TabsTrigger> */}
            </TabsList>

            {/* Review Form Tab */}
            <TabsContent value="review" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left column - Paper info and abstract */}
                <div className="xl:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Abstract
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {paper.abstract}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Rating Criteria */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Evaluation Criteria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {reviewCriteria.map((criterion) => (
                        <div key={criterion.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {criterion.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {criterion.description}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                  key={star}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    setRatings({
                                      ...ratings,
                                      [criterion.id]: star,
                                    })
                                  }
                                  className="p-1"
                                >
                                  <Star
                                    className={cn(
                                      "h-5 w-5 transition-colors",
                                      star <= (ratings[criterion.id] || 0)
                                        ? "fill-accent text-accent"
                                        : "text-muted-foreground/30",
                                    )}
                                  />
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          <Progress
                            value={(ratings[criterion.id] || 0) * 20}
                            className="h-1"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Comments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5" />
                        Review Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="comments">Comments for Authors</Label>
                        <Textarea
                          id="comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Provide constructive feedback for the authors..."
                          className="min-h-[200px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confidential">
                          Confidential Comments for Editors
                          <span className="text-muted-foreground ml-1 text-sm">
                            (Only visible to editors)
                          </span>
                        </Label>
                        <Textarea
                          id="confidential"
                          value={confidentialComments}
                          onChange={(e) =>
                            setConfidentialComments(e.target.value)
                          }
                          placeholder="Any confidential concerns or recommendations..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right column - Decision and submit */}
                <div className="space-y-6">
                  {/* Decision Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Your Decision
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={decision}
                        onValueChange={setDecision}
                        className="space-y-3"
                      >
                        {[
                          {
                            value: "accept",
                            label: "Accept",
                            description: "Paper is ready for publication",
                            color: "border-success bg-success/10",
                          },
                          {
                            value: "minor_revision",
                            label: "Minor Revision",
                            description: "Small changes needed",
                            color: "border-info bg-info/10",
                          },
                          {
                            value: "major_revision",
                            label: "Major Revision",
                            description: "Significant changes required",
                            color: "border-warning bg-warning/10",
                          },
                          {
                            value: "reject",
                            label: "Reject",
                            description: "Paper does not meet standards",
                            color: "border-destructive bg-destructive/10",
                          },
                        ].map((option) => (
                          <motion.div
                            key={option.value}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              decision === option.value
                                ? option.color
                                : "border-border hover:border-primary/50",
                            )}
                            onClick={() => setDecision(option.value)}
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={option.value}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={option.value}
                                className="cursor-pointer font-medium"
                              >
                                {option.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Progress Card */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Review Progress
                          </span>
                          <span className="text-sm font-bold text-primary">
                            {Object.keys(ratings).length > 0
                              ? "In Progress"
                              : "Not Started"}
                          </span>
                        </div>
                        <Progress
                          value={
                            (Object.keys(ratings).length /
                              reviewCriteria.length) *
                            100
                          }
                          className="h-2"
                        />
                        <div className="text-xs text-muted-foreground">
                          {Object.keys(ratings).length} of{" "}
                          {reviewCriteria.length} criteria rated
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitReview}
                    disabled={!decision || !comments}
                    className="w-full btn-physics py-6 text-lg"
                    size="lg"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Submit Review
                    {(decision === "accept" || decision === "reject") &&
                      " (Requires Signature)"}
                  </Button>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Paper
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Request Extension
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Paper Content Tab */}
            <TabsContent value="paper">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Paper Document
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfZoom(Math.max(50, pdfZoom - 10))}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground w-12 text-center">
                        {pdfZoom}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfZoom(Math.min(200, pdfZoom + 10))}
                      >
                        <ChevronDown className="h-4 w-4 rotate-180" />
                      </Button>
                      {publicPaper?.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `${url}${publicPaper.file_url}`,
                              "_blank",
                            )
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {(() => {
                    const fileExt = publicPaper?.file_url
                      ?.split(".")
                      .pop()
                      ?.toLowerCase();
                    if (fileExt === "pdf") {
                      return (
                        <div className="h-[600px]">
                          <iframe
                            src={`${url}${publicPaper!.file_url}`}
                            className="w-full h-full border-0 rounded"
                            title="Paper PDF"
                          />
                        </div>
                      );
                    }
                    if (fileExt === "tex" || fileExt === "latex") {
                      return (
                        <div className="text-center space-y-3 py-8">
                          <p className="text-muted-foreground text-sm">
                            LaTeX files cannot be previewed. Please download to
                            view.
                          </p>
                          <Button
                            size="sm"
                            onClick={() =>
                              window.open(
                                `${url}${publicPaper!.file_url}`,
                                "_blank",
                              )
                            }
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Manuscript
                          </Button>
                        </div>
                      );
                    }
                    if (htmlLoading) {
                      return (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Loading document…
                        </div>
                      );
                    }
                    if (htmlContent) {
                      return (
                        <div
                          className="paper-content"
                          style={{ fontSize: `${pdfZoom}%` }}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(htmlContent),
                          }}
                        />
                      );
                    }
                    return (
                      <div className="text-center space-y-3 py-8">
                        <p className="text-muted-foreground text-sm">
                          Full text is not available for web viewing.
                        </p>
                        {publicPaper?.file_url && (
                          <Button
                            size="sm"
                            onClick={() =>
                              window.open(
                                `${url}${publicPaper.file_url}`,
                                "_blank",
                              )
                            }
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Manuscript
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Funding Information</Label>
                      <p className="text-sm text-muted-foreground">
                        {paper.funding}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Conflicts of Interest</Label>
                      <p className="text-sm text-muted-foreground">
                        {paper.conflictsOfInterest}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>License</Label>
                      <p className="text-sm text-muted-foreground">
                        {paper.license}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Supplementary Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {paper.supplementaryMaterials.map((material, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm">{material}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Editor's Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">
                        {paper.editorComments}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Similar Papers Tab */}
            <TabsContent value="similar">
              <Card>
                <CardHeader>
                  <CardTitle>Related Papers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {similarPapers.map((similarPaper) => (
                      <div
                        key={similarPaper.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground mb-1">
                              {similarPaper.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {similarPaper.authors} • {similarPaper.year}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {similarPaper.citations} citations
                              </Badge>
                              <Badge
                                variant={
                                  similarPaper.relevance === "High"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {similarPaper.relevance} relevance
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>

      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
        paperTitle={paper.title}
        decision={decision === "accept" ? "accept" : "reject"}
      />
    </DashboardLayout>
  );
}
