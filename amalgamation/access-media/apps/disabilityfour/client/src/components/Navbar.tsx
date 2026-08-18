import { Search, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { categories } from "@shared/schema";
import logoUrl from "@assets/Original on Transparent_1763187091025.png";

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Navbar({ onSearch, searchQuery = "" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(localSearchQuery);
  };

  return (
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground border-b border-primary-border">
      {/* Main navbar */}
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" data-testid="link-home" className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
            <div className="flex items-center hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2 cursor-pointer">
              <img 
                src={logoUrl} 
                alt="DisabilityFour+ - Australian Disability Community Broadcasting" 
                className="h-10 md:h-12 w-auto"
                data-testid="img-logo"
              />
            </div>
          </Link>

          {/* Desktop Search */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md"
            role="search"
            aria-label="Search content"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Search shows, documentaries, news..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-accent"
                data-testid="input-search"
                aria-label="Search for content"
              />
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/browse" data-testid="link-browse" className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
              <Button variant="ghost" className="text-primary-foreground hover-elevate">
                Browse
              </Button>
            </Link>
            <Button 
              variant="default"
              className="bg-accent text-accent-foreground hover-elevate border-accent-border font-semibold"
              data-testid="button-upgrade"
            >
              Upgrade to Premium
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop Category Menu */}
        <div className="hidden md:flex items-center gap-1 pb-3 border-t border-primary-foreground/10 pt-3">
          <Link href="/browse" data-testid="link-category-all" className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover-elevate">
              All Content
            </Button>
          </Link>
          {categories.map((category) => (
            <Link key={category} href={`/browse?category=${category}`} data-testid={`link-category-${category.toLowerCase()}`} className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover-elevate">
                {category}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-foreground/10 bg-primary">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} role="search" aria-label="Search content">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" aria-hidden="true" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-accent"
                  data-testid="input-search-mobile"
                  aria-label="Search for content"
                />
              </div>
            </form>

            {/* Mobile Categories */}
            <div className="space-y-1">
              <Link href="/browse" data-testid="link-category-all-mobile" className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
                <Button variant="ghost" className="w-full justify-start text-primary-foreground hover-elevate">
                  All Content
                </Button>
              </Link>
              {categories.map((category) => (
                <Link key={category} href={`/browse?category=${category}`} data-testid={`link-category-${category.toLowerCase()}-mobile`} className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
                  <Button variant="ghost" className="w-full justify-start text-primary-foreground hover-elevate">
                    {category}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Mobile Actions */}
            <div className="space-y-2 pt-2 border-t border-primary-foreground/10">
              <Link href="/browse" data-testid="link-browse-mobile" className="focus:outline-none focus:ring-3 focus:ring-accent focus:ring-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-md">
                <Button variant="ghost" className="w-full text-primary-foreground hover-elevate">
                  Browse All
                </Button>
              </Link>
              <Button 
                variant="default"
                className="w-full bg-accent text-accent-foreground hover-elevate border-accent-border font-semibold"
                data-testid="button-upgrade-mobile"
              >
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
