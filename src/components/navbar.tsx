import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Search,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Journals", path: "/browse" },
    { name: "Archive", path: "/archive" },
    { name: "About", path: "/about" },
    { name: "FAQ", path: "/faq" },
    { name: "Contact Us", path: "/contact-us" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
            <div className="relative flex h-full w-full items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif-roboto text-xl font-bold leading-tight text-foreground">
              GIKI<span className="text-primary"> Journal</span>
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              Academic Excellence
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex lg:items-center lg:gap-1">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to={item.path}
                className="group flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex h-10 w-10 rounded-full border border-border/50 bg-background/50 hover:bg-accent hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Button> */}

          <ThemeToggle />

          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="btn-physics h-9 px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/login?action=submit">
              <Button
                size="sm"
                className="btn-physics h-9 bg-gradient-to-r from-primary to-primary/80 px-4 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
              >
                Submit Paper
                <GraduationCap className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-full border border-border/50 bg-background/50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-4">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full justify-center border-border/50 bg-background/50 hover:bg-accent"
                >
                  Sign In
                </Button>
              </Link>
              <Link
                to="/login?action=submit"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button className="w-full justify-center bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
                  Submit Paper
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
