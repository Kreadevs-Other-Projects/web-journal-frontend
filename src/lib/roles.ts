import {
  Home,
  FileText,
  Users,
  BookOpen,
  UserCheck,
  BarChart3,
  CreditCard,
  Tag,
  TrendingUp,
  Layers,
  Archive,
  ScrollText,
} from "lucide-react";

export type UserRole =
  | "author"
  | "reviewer"
  | "chief_editor"
  | "publisher"
  | "journal_manager"
  | "owner"
  | "sub_editor";

export const roleConfig: Record<
  UserRole,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    navigation: { label: string; path: string; icon: React.ElementType }[];
    description: string;
    route: string;
  }
> = {
  owner: {
    icon: FileText,
    label: "Owner",
    color: "text-destructive",
    description: "Owner of the system",
    route: "/owner",
    navigation: [
      { label: "Dashboard", path: "/owner", icon: Home },
      { label: "Journals", path: "/journals", icon: Home },
      // { label: "System Settings", path: "/owner/settings", icon: Settings },
    ],
  },

  publisher: {
    icon: Home,
    label: "Publisher",
    color: "text-destructive",
    description: "Manage all papers and users",
    route: "/publisher",
    navigation: [
      { label: "Dashboard", path: "/publisher", icon: Home },
      { label: "Journals", path: "/publisher/journals", icon: Home },
      {
        label: "Publish Paper",
        path: "/publisher/publish-paper",
        icon: FileText,
      },
      { label: "Payments", path: "/publisher/payments", icon: CreditCard },
      { label: "Paper Categories", path: "/publisher/categories", icon: Tag },
      {
        label: "Journal Categories",
        path: "/publisher/journal-categories",
        icon: Tag,
      },
      {
        label: "Homepage Content",
        path: "/publisher/homepage-content",
        icon: Home,
      },
    ],
  },

  journal_manager: {
    icon: BarChart3,
    label: "Journal Manager",
    color: "text-warning",
    description: "Manage publisher operations and reports",
    route: "/publisher-manager",
    navigation: [
      { label: "Dashboard", path: "/publisher-manager", icon: Home },
      {
        label: "All Issues",
        path: "/publisher-manager?tab=issues",
        icon: Layers,
      },
      {
        label: "Archive",
        path: "/publisher-manager?tab=issues&filter=closed",
        icon: Archive,
      },
      {
        label: "Papers",
        path: "/publisher-manager?tab=papers",
        icon: FileText,
      },
      {
        label: "Editorial Board",
        path: "/publisher-manager?tab=editorial",
        icon: Users,
      },
      {
        label: "Publication Ethics",
        path: "/publisher-manager?tab=ethics",
        icon: ScrollText,
      },
    ],
  },

  chief_editor: {
    icon: Users,
    label: "Chief Editor",
    color: "text-accent",
    description: "Manage submissions and editors",
    route: "/chief-editor",
    navigation: [
      { label: "Dashboard", path: "/chief-editor", icon: Home },
      { label: "My Journals", path: "/chief-editor/journals", icon: BookOpen },
      { label: "Papers", path: "/chief-editor/papers", icon: FileText },
      { label: "Team", path: "/chief-editor/team", icon: Users },
      {
        label: "Reviewed Papers",
        path: "/chief-editor/accepted",
        icon: UserCheck,
      },
      {
        label: "Applications",
        path: "/chief-editor/applications",
        icon: UserCheck,
      },
      { label: "Stats", path: "/chief-editor/stats", icon: TrendingUp },
    ],
  },

  author: {
    icon: BookOpen,
    label: "Author",
    color: "text-success",
    description: "Submit and manage your papers",
    route: "/author",
    navigation: [
      // { label: "Dashboard", path: "/author", icon: Home },
      // { label: "My Submissions", path: "/author/submissions", icon: FileText },
      { label: "Submit Paper", path: "/author", icon: BookOpen },
      { label: "Paper Version", path: "/author/version", icon: BookOpen },
    ],
  },

  sub_editor: {
    icon: Users,
    label: "Associate Editor",
    color: "text-destructive",
    description: "Manage paper editions",
    route: "/sub-editor",
    navigation: [
      { label: "Dashboard", path: "/sub-editor", icon: Home },
      { label: "Revision Papers", path: "/sub-editor/revision", icon: Users },
    ],
  },

  reviewer: {
    icon: UserCheck,
    label: "Reviewer",
    color: "text-info",
    description: "Review assigned papers",
    route: "/reviewer",
    navigation: [
      { label: "Dashboard", path: "/reviewer", icon: Home },
      {
        label: "Completed Reviews",
        path: "/reviewer/completed",
        icon: UserCheck,
      },
    ],
  },
};
