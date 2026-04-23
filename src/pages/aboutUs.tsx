import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Award,
  Users,
  Globe,
  Clock,
  TrendingUp,
  CheckCircle,
  Mail,
  MapPin,
  Phone,
  Quote,
  ExternalLink,
  GraduationCap,
  Library,
  Microscope,
} from "lucide-react";

export default function AboutPage() {
  const stats = [
    { icon: BookOpen, label: "Published Papers", value: "1,200+" },
    { icon: Users, label: "Active Researchers", value: "5,000+" },
    { icon: Globe, label: "Countries Reached", value: "45+" },
    { icon: Award, label: "Citations", value: "15,000+" },
  ];

  const features = [
    {
      icon: Microscope,
      title: "Peer-Reviewed Excellence",
      description:
        "Every paper undergoes rigorous review by GIKI's distinguished faculty and international experts.",
    },
    {
      icon: Library,
      title: "Digital Repository",
      description:
        "Access thousands of research papers, theses, and academic publications from GIKI's archives.",
    },
    {
      icon: GraduationCap,
      title: "Student Research",
      description:
        "Showcasing undergraduate and graduate research projects that push boundaries.",
    },
  ];

  const team = [
    {
      name: "Dr. Sarah Ahmed",
      role: "Chief Editor",
      department: "Computer Science",
      image: "/api/placeholder/200/200",
      quote: "Democratizing access to quality research.",
    },
    {
      name: "Prof. Michael Khan",
      role: "Managing Editor",
      department: "Engineering",
      image: "/api/placeholder/200/200",
      quote: "Bridging theory with practice.",
    },
    {
      name: "Dr. Fatima Hassan",
      role: "Review Coordinator",
      department: "Sciences",
      image: "/api/placeholder/200/200",
      quote: "Nurturing the next generation of researchers.",
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

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
              <GraduationCap className="h-4 w-4" />
              <span>GIKI Academic Journal Platform</span>
            </div>

            <h1 className="mb-6 font-serif-roboto text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Advancing Knowledge at{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                GIK Institute
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
              A digital hub for groundbreaking research, scholarly articles, and
              academic excellence from the Ghulam Ishaq Khan Institute of
              Engineering Sciences and Technology.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 bg-primary text-white hover:bg-primary/90"
              >
                <BookOpen className="h-5 w-5" />
                Browse Latest Research
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Mail className="h-5 w-5" />
                Contact Editorial Board
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </section>

      <motion.section
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="container mx-auto px-4 py-16"
      >
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <stat.icon className="mx-auto mb-4 h-8 w-8 text-primary" />
              <div className="relative">
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-8"
          >
            <h2 className="mb-4 font-serif-roboto text-3xl font-bold">
              Our Mission
            </h2>
            <p className="mb-6 text-muted-foreground">
              To provide a world-class platform for GIKI researchers, faculty,
              and students to share their scholarly work, fostering innovation
              and academic excellence in engineering, sciences, and technology.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="h-4 w-4" />
              <span>Supporting open access to research</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-secondary/5 to-transparent p-8"
          >
            <h2 className="mb-4 font-serif-roboto text-3xl font-bold">
              Our Vision
            </h2>
            <p className="mb-6 text-muted-foreground">
              To become Pakistan's premier digital repository for engineering
              and scientific research, connecting GIKI's academic community with
              the global research ecosystem.
            </p>
            <div className="flex items-center gap-2 text-sm text-secondary">
              <TrendingUp className="h-4 w-4" />
              <span>Connecting locally, impacting globally</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-serif-roboto text-3xl font-bold"
        >
          Why Publish with <span className="text-primary">GIKI Journal</span>
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="font-serif-roboto text-3xl font-bold">
            Meet Our Editorial Team
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dedicated faculty members ensuring the highest quality of published
            research
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative mb-4 flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.department}
                  </p>
                </div>
              </div>

              <div className="relative mt-4 border-t border-border/50 pt-4">
                <Quote className="absolute top-4 right-0 h-8 w-8 text-primary/10" />
                <p className="text-sm italic text-muted-foreground">
                  "{member.quote}"
                </p>
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
              <h2 className="mb-6 font-serif-roboto text-3xl font-bold">
                Visit Our Campus
              </h2>
              <p className="mb-8 text-muted-foreground">
                Located in the scenic Topi, Swabi, GIK Institute stands as a
                beacon of academic excellence in Pakistan. Our journal office is
                open for collaboration and inquiries.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    Ghulam Ishaq Khan Institute of Engineering Sciences and
                    Technology,
                    <br />
                    Topi, Swabi, Khyber Pakhtunkhwa, Pakistan
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <a
                    href="mailto:journal@giki.edu.pk"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    journal@giki.edu.pk
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">+92-938-281-026</span>
                </div>
              </div>

              <Button className="mt-8 gap-2 bg-primary text-white hover:bg-primary/90">
                <ExternalLink className="h-4 w-4" />
                Visit GIKI Website
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-64 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 lg:h-auto"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-primary/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Interactive Map Coming Soon
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-secondary/90 p-12 text-center text-white"
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

          <div className="relative">
            <h2 className="mb-4 font-serif-roboto text-3xl font-bold md:text-4xl">
              Ready to Share Your Research?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-white/90">
              Join GIKI's academic community in advancing knowledge and
              innovation. Submit your paper today and reach researchers
              worldwide.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                <BookOpen className="h-5 w-5" />
                Submit Your Paper
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Learn More About GIKI
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
