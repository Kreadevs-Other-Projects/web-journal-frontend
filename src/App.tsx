import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AboutPage from "./pages/aboutUs";
import FAQPage from "./pages/faq";
import ContactPage from "./pages/contactUs";
import BrowsePage from "./pages/BrowseJournal";
import JournalDetail from "./components/PaperDetail";
import ResearchPaperDetail from "./pages/ResearchPaper";
import ArticleRedirect from "./pages/ArticleRedirect";
import ArticlePage from "./pages/ArticlePage";
import Archive from "./pages/Archive";
import ApplyReviewer from "./pages/ApplyReviewer";

import AuthorDashboard from "./pages/author/AuthorDashboard";
import SubmitPaper from "./pages/author/SubmitPaper";
import PaperVersions from "./pages/author/PaperVersions";
import TrackPaper from "./pages/author/TrackPaper";

import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import CompletedReview from "./pages/reviewer/completedReview";
import ReviewDetail from "./pages/reviewer/ReviewDetail";

import SubEditorDashboard from "./pages/subEditor/SubEditorDashboard";
import RevisionPaper from "./pages/subEditor/RevisionPaper";
import AEAssignReviewerPage from "./pages/subEditor/AEAssignReviewerPage";

import ChiefEditorDashboard from "./pages/chiefEditor/ChiefEditorDashboard";
import ReviewedPapers from "./pages/chiefEditor/ReviewedPapers";
import CEJournals from "./pages/chiefEditor/CEJournals";
import CEJournalDetail from "./pages/chiefEditor/CEJournalDetail";
import CEPapers from "./pages/chiefEditor/CEPapers";
import CETeam from "./pages/chiefEditor/CETeam";
import CEApplications from "./pages/chiefEditor/CEApplications";
import CEStats from "./pages/chiefEditor/CEStats";
import AssignAssociateEditorPage from "./pages/chiefEditor/AssignAssociateEditorPage";
import AssignReviewerPage from "./pages/chiefEditor/AssignReviewerPage";
import StaffDetailPage from "./pages/chiefEditor/StaffDetailPage";
import CEPaperViewPage from "./pages/chiefEditor/CEPaperViewPage";

import PublisherDashboard from "./pages/publisher/publisherDashboard";
import CreateJournal from "./pages/publisher/CreateJournal";
import PublishPapers from "./pages/publisher/PublishPapers";
import PublisherPayments from "./pages/publisher/Payments";
import PublisherCategories from "./pages/publisher/Categories";
import PublisherJournalCategories from "./pages/publisher/JournalCategories";
import HomepageContent from "./pages/publisher/HomepageContent";
import EditJournalPage from "./pages/publisher/EditJournalPage";
import PublisherJournalsPage from "./pages/publisher/PublisherJournalsPage";
import PublisherJournalDetailPage from "./pages/publisher/PublisherJournalDetailPage";
import PublisherIssueDetailPage from "./pages/publisher/PublisherIssueDetailPage";

import PublisherManagerDashborad from "./pages/publisherManager/PublisherManagerDashborad";

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import Journals from "./pages/owner/Journals";

import AdminDashboard from "./pages/admin/AdminDashboard";

import ProfilePage from "./pages/ProfilePage";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import AcceptInvitation from "./pages/AcceptInvitation";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import PaperApprovalPage from "./pages/PaperApprovalPage";

import ProtectedRoute from "./components/ProtectedRoutes";
import PublicRoute from "./components/PublicRoutes";
import InitialAuthCheck from "./components/InitialCheckout";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <InitialAuthCheck>
                <Routes>
                  <Route element={<PublicRoute />}>
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/contact-us" element={<ContactPage />} />
                      <Route path="/browse" element={<BrowsePage />} />
                      <Route path="/journal/:id" element={<JournalDetail />} />
                      <Route
                        path="/researchPapers/:paperId"
                        element={<ResearchPaperDetail />}
                      />
                      <Route
                        path="/articles/:paperId"
                        element={<ArticleRedirect />}
                      />
                      <Route path="/:acronym/:slug" element={<ArticlePage />} />
                      <Route path="/archive" element={<Archive />} />
                      <Route
                        path="/apply-reviewer"
                        element={<ApplyReviewer />}
                      />
                    </Route>
                  </Route>

                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                  </Route>

                  <Route
                    path="/paper-approval/:token"
                    element={<PaperApprovalPage />}
                  />
                  <Route
                    path="/accept-invitation"
                    element={<AcceptInvitation />}
                  />

                  <Route
                    path="/complete-profile"
                    element={<CompleteProfilePage />}
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          "author",
                          "chief_editor",
                          "sub_editor",
                          "reviewer",
                          "publisher",
                          "journal_manager",
                          "owner",
                        ]}
                      />
                    }
                  >
                    <Route path="/author" element={<AuthorDashboard />} />
                    <Route path="/author/submit" element={<SubmitPaper />} />
                    <Route path="/author/version" element={<PaperVersions />} />
                    <Route
                      path="/author/track/:paperId"
                      element={<TrackPaper />}
                    />
                  </Route>

                  {/* REVIEWER */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["reviewer", "chief_editor"]}
                      />
                    }
                  >
                    <Route path="/reviewer" element={<ReviewerDashboard />} />
                    <Route
                      path="/reviewer/completed"
                      element={<CompletedReview />}
                    />
                    <Route
                      path="/reviewer/completed/:paperId"
                      element={<ReviewDetail />}
                    />
                  </Route>

                  {/* SUB EDITOR */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["sub_editor", "chief_editor"]}
                      />
                    }
                  >
                    <Route
                      path="/sub-editor"
                      element={<SubEditorDashboard />}
                    />
                    <Route
                      path="/sub-editor/revision"
                      element={<RevisionPaper />}
                    />
                    <Route
                      path="/sub-editor/papers/:paperId/assign-reviewer"
                      element={<AEAssignReviewerPage />}
                    />
                  </Route>

                  {/* CHIEF EDITOR */}
                  <Route
                    element={<ProtectedRoute allowedRoles={["chief_editor"]} />}
                  >
                    <Route
                      path="/chief-editor"
                      element={<ChiefEditorDashboard />}
                    />
                    <Route
                      path="/chief-editor/accepted"
                      element={<ReviewedPapers />}
                    />
                    <Route
                      path="/chief-editor/journals"
                      element={<CEJournals />}
                    />
                    <Route
                      path="/chief-editor/journals/:journalId"
                      element={<CEJournalDetail />}
                    />
                    <Route path="/chief-editor/papers" element={<CEPapers />} />
                    <Route
                      path="/chief-editor/papers/:paperId/view"
                      element={<CEPaperViewPage />}
                    />
                    <Route path="/chief-editor/team" element={<CETeam />} />
                    <Route
                      path="/chief-editor/applications"
                      element={<CEApplications />}
                    />
                    <Route path="/chief-editor/stats" element={<CEStats />} />
                    <Route
                      path="/chief-editor/papers/:paperId/assign-ae"
                      element={<AssignAssociateEditorPage />}
                    />
                  </Route>

                  {/* SHARED */}
                  <Route
                    element={
                      <ProtectedRoute
                        allowedRoles={["chief_editor", "sub_editor"]}
                      />
                    }
                  >
                    <Route
                      path="/chief-editor/papers/:paperId/assign-reviewer"
                      element={<AssignReviewerPage />}
                    />
                    <Route
                      path="/chief-editor/staff/:userId"
                      element={<StaffDetailPage />}
                    />
                  </Route>

                  {/* PUBLISHER */}
                  <Route
                    element={<ProtectedRoute allowedRoles={["publisher"]} />}
                  >
                    <Route path="/publisher" element={<PublisherDashboard />} />
                    <Route
                      path="/publisher/create-journal"
                      element={<CreateJournal />}
                    />
                    <Route
                      path="/publisher/payments"
                      element={<PublisherPayments />}
                    />
                    <Route
                      path="/publisher/categories"
                      element={<PublisherCategories />}
                    />
                    <Route
                      path="/publisher/journal-categories"
                      element={<PublisherJournalCategories />}
                    />
                    <Route
                      path="/publisher/homepage-content"
                      element={<HomepageContent />}
                    />
                    <Route
                      path="/publisher/journals"
                      element={<PublisherJournalsPage />}
                    />
                    <Route
                      path="/publisher/journals/:journalId"
                      element={<PublisherJournalDetailPage />}
                    />
                    <Route
                      path="/publisher/journals/:journalId/edit"
                      element={<EditJournalPage />}
                    />
                    <Route
                      path="/publisher/journals/:journalId/issues/:issueId"
                      element={<PublisherIssueDetailPage />}
                    />
                    <Route
                      path="/publisher/publish-paper"
                      element={<PublishPapers />}
                    />
                  </Route>

                  {/* MANAGER */}
                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["journal_manager"]} />
                    }
                  >
                    <Route
                      path="/publisher-manager"
                      element={<PublisherManagerDashborad />}
                    />
                  </Route>

                  {/* OWNER */}
                  <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
                    <Route path="/owner" element={<OwnerDashboard />} />
                    <Route path="/journals" element={<Journals />} />
                  </Route>

                  {/* ADMIN */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />

                  {/* PROFILE */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </InitialAuthCheck>
            </AnimatePresence>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
