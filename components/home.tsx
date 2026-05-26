"use client";

import {
  ArrowRight,
  Award,
  Building,
  CheckCircle,
  LucideIcon,
  Lock,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import Footer from "@/components/footer";
import { HomeSearch } from "@/components/home/HomeSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const howItWorks = [
  {
    step: 1,
    title: "Create Profile",
    description: "Sign up and share your needs and NDIS plan details.",
    icon: Users,
  },
  {
    step: 2,
    title: "Find Services",
    description:
      "Browse verified providers, transport, and employment options.",
    icon: MapPin,
  },
  {
    step: 3,
    title: "Book & Connect",
    description: "Book services directly with integrated NDIS billing.",
    icon: CheckCircle,
  },
  {
    step: 4,
    title: "Manage Everything",
    description: "Track bookings and budgets in one place.",
    icon: Wallet,
  },
];

const trustBadges: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "NDIS Registered" },
  { icon: Lock, label: "Australian Data Sovereignty" },
  { icon: Award, label: "WCAG 2.1 AA Compliant" },
];

export default function Home() {
  // const { user, login } = useAuth();
  const user = null;

  return (
    <div className="min-h-screen bg-background" data-testid="page-home">
      <HomeSearch />

      {/* Services Carousel */}
      <section className="py-16 bg-white" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              className="text-2xl md:text-3xl font-heading font-bold mb-2"
              data-testid="text-modules-title"
            >
              Our Services
            </h2>
            <p className="text-muted-foreground">
              Integrated modules for independent living.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">{/* <ServicesCarousel /> */}</div>
        </div>
      </section>

      {/* How It Works - Compact */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2
            className="text-2xl md:text-3xl font-heading font-bold text-center mb-10"
            data-testid="text-how-it-works"
          >
            How It Works
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {howItWorks.map((step) => (
              <div
                key={step.step}
                className="text-center"
                data-testid={`step-${step.step}`}
              >
                <div className="relative inline-flex mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges - Slim */}
      <section className="py-8 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {trustBadges.map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-slate-300 text-sm"
                data-testid={`trust-badge-${i}`}
              >
                <badge.icon className="h-4 w-4" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Simplified */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="text-2xl md:text-3xl font-heading font-bold mb-4"
              data-testid="text-cta-title"
            >
              Ready to Get Started?
            </h2>
            <p className="text-white/80 mb-6">
              Join MapAble to connect with services and manage your NDIS
              journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button
                    variant="default"
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 px-6 h-12 rounded-lg"
                    data-testid="button-cta-dashboard"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="default"
                  size="lg"
                  // onClick={login}
                  className="bg-white text-primary hover:bg-white/90 px-6 h-12 rounded-lg"
                  data-testid="button-cta-signup"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Provider CTA - Compact */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <Badge
                  variant="outline"
                  className="mb-3 px-2 py-0.5 text-xs border-secondary/20 bg-secondary/5 text-secondary"
                >
                  For Providers
                </Badge>
                <h2
                  className="text-xl md:text-2xl font-heading font-bold mb-3"
                  data-testid="text-provider-cta"
                >
                  Grow Your NDIS Business
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Join as a verified provider. Get matched with participants and
                  streamline your billing.
                </p>
                <ul className="space-y-2 mb-5 text-sm">
                  {[
                    "NDIS billing integration",
                    "Smart participant matching",
                    "Verified provider badge",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/provider-centre">
                  <Button
                    variant="default"
                    size="lg"
                    className="bg-secondary hover:bg-secondary/90 text-white rounded-lg h-10 px-4 text-sm"
                    data-testid="button-provider-signup"
                  >
                    <Building className="mr-2 h-4 w-4" />
                    Register as Provider
                  </Button>
                </Link>
              </div>
              <div className="w-40 h-40 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                <Building className="h-16 w-16 text-secondary/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
