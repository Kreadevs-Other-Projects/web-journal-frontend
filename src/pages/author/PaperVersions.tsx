import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { url } from "@/url";
import { useToast } from "@/hooks/use-toast";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimationWrappers";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Clock,
  GitBranch,
  ChevronRight,
  Plus,
  Filter,
  Search,
  FileUp,
  CheckCircle,
  AlertCircle,
  History,
  Calendar,
  Hash,
  FileType,
  X,
  Loader2,
} from "lucide-react";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

interface Paper {
  id: string;
  title: string;
  status: string;
  category?: string;
  created_at?: string;
}

interface PaperVersion {
  id: string;
  version_label: string;
  file_url: string;
  created_at: string;
  file_size?: number;
  file_type?: string;
}

export default function PaperVersions() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<PaperVersion[]>([]);
  const [paperId, setPaperId] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [viewPdf, setViewPdf] = useState<PaperVersion | null>(null);

  const [versionLabel, setVersionLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${url}/papers/getPapersByAuthor`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch papers");

      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load papers",
      });
    }
  };

  const fetchVersions = async () => {
    if (!paperId) {
      setVersions([]);
      setFilteredVersions([]);
      return;
    }

    try {
      const res = await fetch(
        `${url}/paper-versions/getPaperVersions/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch versions");

      const data = await res.json();

      setVersions(data.versions || []);
      setFilteredVersions(data.versions || []);

      const paper = papers.find((p) => p.id === paperId);
      setSelectedPaper(paper || null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not load paper versions",
      });
      setVersions([]);
      setFilteredVersions([]);
    }
  };

  useEffect(() => {
    if (token) fetchPapers();
  }, [token]);

  useEffect(() => {
    fetchVersions();
  }, [paperId]);

  useEffect(() => {
    let filtered = versions;
    if (searchQuery) {
      filtered = filtered.filter(
        (v) =>
          v.version_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.created_at.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredVersions(filtered);
  }, [searchQuery, versions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [".pdf", ".doc", ".docx"];
    const fileExt = selectedFile.name
      .toLowerCase()
      .slice(selectedFile.name.lastIndexOf("."));

    if (!validTypes.includes(fileExt)) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a PDF, DOC, or DOCX file",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Maximum file size is 10MB",
      });
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type === "application/pdf") {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadVersion = async () => {
    if (!paperId || !versionLabel || !file) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Paper, version label, and file are required",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("version_label", versionLabel);
      formData.append("file", file);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch(
        `${url}/paper-versions/uploadPaperVersion/${paperId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();

      if (!data.success) {
        if (data.errors && data.errors.length) {
          data.errors.forEach((err: any) => {
            toast({
              title: `Error in ${err.field.replace("body.", "")}`,
              description: err.message,
              variant: "destructive",
            });
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Something went wrong",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Upload Successful",
        description: "Paper version uploaded successfully",
      });

      setOpen(false);
      setVersionLabel("");
      setFile(null);
      setPreviewUrl(null);
      fetchVersions();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Could not upload version",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500";
      case "under_review":
        return "bg-amber-500";
      case "accepted":
        return "bg-emerald-500";
      case "rejected":
        return "bg-rose-500";
      case "published":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getFileTypeLabel = (type: string | undefined) => {
    switch (type) {
      case "application/pdf":
        return "PDF";
      case "application/msword":
        return "DOC";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "DOCX";
      default:
        return type?.toUpperCase() || "N/A";
    }
  };

  return (
    <DashboardLayout role={user?.role} userName={user?.username}>
      <PageTransition>
        <div className="space-y-8 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-serif-outfit text-3xl font-bold text-foreground">
                Paper Versions
              </h1>
              <p className="text-muted-foreground">
                Manage and track different versions of your research papers
              </p>
            </div>

            {user?.role === "author" && (
              <Button
                onClick={() => setOpen(true)}
                className="btn-physics bg-gradient-primary hover:opacity-90 gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload New Version
              </Button>
            )}
          </div>

          <Card className="border-border/40 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Select Paper
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a paper to view and manage its versions
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Select Paper</Label>
                    <Select value={paperId} onValueChange={setPaperId}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a paper" />
                      </SelectTrigger>
                      <SelectContent>
                        {papers.map((paper) => (
                          <SelectItem key={paper.id} value={paper.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate">{paper.title}</span>
                              <Badge
                                variant="outline"
                                className={`ml-2 ${getStatusColor(paper.status)}/20 ${getStatusColor(paper.status).replace("bg-", "text-")}`}
                              >
                                {paper.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPaper && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-sm font-medium">
                        Selected Paper
                      </Label>
                      <div className="glass-card p-4">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {selectedPaper.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {selectedPaper.category || "Uncategorized"}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {selectedPaper.created_at
                                  ? new Date(
                                      selectedPaper.created_at,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                          <GitBranch className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="glass-card p-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search versions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full md:w-64"
                  />
                </div>

                <Badge variant="outline" className="gap-1.5">
                  <GitBranch className="w-3 h-3" />
                  {versions.length} version{versions.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="w-4 h-4" />
                  Version History
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-outfit text-xl font-semibold text-foreground">
                Paper Versions
                <span className="text-sm text-muted-foreground ml-2">
                  ({filteredVersions.length} found)
                </span>
              </h2>
            </div>

            {!paperId ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card border-dashed border-border/50"
              >
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a Paper
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                    Choose a paper from the dropdown above to view and manage
                    its versions
                  </p>
                </div>
              </motion.div>
            ) : filteredVersions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card border-dashed border-border/50"
              >
                <div className="flex flex-col items-center justify-center py-16">
                  <GitBranch className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Versions Found
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                    This paper doesn't have any versions yet. Upload the first
                    version to get started.
                  </p>
                  <Button onClick={() => setOpen(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload First Version
                  </Button>
                </div>
              </motion.div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredVersions.map((version, index) => (
                  <StaggerItem key={version.id}>
                    <motion.div whileHover={{ y: -4 }} className="group">
                      <Card className="hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className="gap-1.5 bg-gradient-primary">
                                  <Hash className="w-3 h-3" />
                                  {version.version_label}
                                </Badge>
                                {index === 0 && (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 text-emerald-500"
                                  >
                                    Latest
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                Version {version.version_label}
                              </CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Upload Date
                              </p>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {new Date(
                                    version.created_at,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                File Size
                              </p>
                              <div className="flex items-center gap-1.5">
                                <FileType className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {formatFileSize(version.file_size)}
                                </span>
                              </div>
                              {version.file_type && (
                                <Badge variant="secondary">
                                  {getFileTypeLabel(version.file_type)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              Uploaded{" "}
                              {new Date(version.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-4 border-t">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => setViewPdf(version)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                              </Button>
                              <a
                                href={`${url}${version.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </a>
                            </div>
                            {version.file_type && (
                              <Badge variant="secondary">
                                {version.file_type.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </PageTransition>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-background to-background/95 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif-outfit flex items-center gap-2 text-2xl">
              <Upload className="w-6 h-6" />
              Upload New Version
            </DialogTitle>
            <DialogDescription>
              Upload a new version of your research paper
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-1">
            {!paperId ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Please select a paper first before uploading versions
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label htmlFor="versionLabel" className="text-sm font-medium">
                    Version Label *
                  </Label>
                  <Input
                    id="versionLabel"
                    placeholder="e.g., v1.2, Final Draft, Revised Manuscript"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use descriptive labels like "v1.0", "Revised Version",
                    "Final Submission"
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Upload File *</Label>
                  <div
                    className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {file ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              setPreviewUrl(null);
                            }}
                            className="h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {isUploading && (
                          <div className="space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-foreground font-medium mb-1">
                          Click to upload file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, or DOCX (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {previewUrl && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">PDF Preview</Label>
                    <div className="border rounded-lg overflow-hidden h-64">
                      <Worker workerUrl="/pdf.worker.min.js">
                        <Viewer
                          fileUrl={previewUrl}
                          plugins={[defaultLayoutPluginInstance]}
                        />
                      </Worker>
                    </div>
                  </div>
                )}

                <div className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload Guidelines</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Max file size: 10MB</li>
                        <li>• Supported formats: PDF, DOC, DOCX</li>
                        <li>
                          • Version labels should be descriptive and follow a
                          consistent format
                        </li>
                        <li>
                          • Ensure your paper meets all submission requirements
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={uploadVersion}
              disabled={!paperId || !versionLabel || !file || isUploading}
              className="gap-2 bg-gradient-primary"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewPdf && (
        <Dialog open={!!viewPdf} onOpenChange={() => setViewPdf(null)}>
          <DialogContent className="w-[95vw] max-w-6xl h-[95vh] bg-gradient-to-b from-background to-background/95">
            <DialogHeader>
              <DialogTitle className="font-serif-outfit flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Preview: {viewPdf.version_label}
              </DialogTitle>
              <DialogDescription>
                Paper Version -{" "}
                {new Date(viewPdf.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="h-[calc(95vh-180px)] border rounded-lg overflow-hidden bg-white">
              <Worker workerUrl="/pdf.worker.min.js">
                <Viewer
                  fileUrl={`${url}${viewPdf.file_url}`}
                  plugins={[defaultLayoutPluginInstance]}
                  theme="dark"
                />
              </Worker>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                File size: {formatFileSize(viewPdf.file_size)}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${url}${viewPdf.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <Button variant="outline" onClick={() => setViewPdf(null)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
