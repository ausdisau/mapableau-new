import { Link } from "wouter";
import logoUrl from "@assets/Original on Transparent_1763187091025.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const stats = [
    { label: "Cooperative Members", value: "1,200+" },
    { label: "Hours of Content", value: "500+" },
    { label: "Original Productions", value: "45+" },
  ];

  const categories = [
    { name: "Documentary", path: "/browse?category=documentary" },
    { name: "Drama", path: "/browse?category=drama" },
    { name: "Sports", path: "/browse?category=sports" },
    { name: "News & Current Affairs", path: "/browse?category=news" },
  ];

  const about = [
    { name: "About DisabilityFour+", path: "/about" },
    { name: "Accessibility", path: "/accessibility" },
    { name: "Join Cooperative", path: "/join" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-8 mb-12 pb-12 border-b border-primary-foreground/20">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center"
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-primary-foreground/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Logo & Mission Statement */}
          <div className="md:col-span-2">
            <img 
              src={logoUrl} 
              alt="DisabilityFour+ - Australian Disability Community Broadcasting" 
              className="h-16 md:h-20 w-auto mb-6"
              data-testid="img-footer-logo"
            />
            <h3 className="text-xl font-display font-semibold mb-4">Our Mission</h3>
            <p className="text-primary-foreground/80 leading-relaxed mb-4">
              DisabilityFour+ is Australia's first disability-led streaming cooperative, 
              creating and distributing authentic content by and for the disability community. 
              We're building a platform where disabled voices lead, stories matter, and 
              accessibility is built-in, not added on.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Browse Content</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.path}>
                  <Link 
                    href={category.path}
                    className="text-primary-foreground/80 hover:text-accent transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
                    data-testid={`link-footer-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              {about.map((link) => (
                <li key={link.path}>
                  <Link 
                    href={link.path}
                    className="text-primary-foreground/80 hover:text-accent transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
                    data-testid={`link-footer-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {currentYear} DisabilityFour+ Cooperative. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link 
              href="/privacy"
              className="text-sm text-primary-foreground/60 hover:text-accent transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
              data-testid="link-privacy"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms"
              className="text-sm text-primary-foreground/60 hover:text-accent transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
              data-testid="link-terms"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
