import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { ContentCard } from "@/components/ContentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, type Content, type Category } from "@shared/schema";

export default function Browse() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  
  const initialCategory = searchParams.get("category") as Category | null;
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    initialCategory || "all"
  );
  const [sortBy, setSortBy] = useState<"title" | "year" | "trending">("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const { data: allContent, isLoading } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });

  const filteredContent = useMemo(() => {
    if (!allContent) return [];

    let filtered = [...allContent];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query (use debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "year") {
      filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    return filtered;
  }, [allContent, selectedCategory, sortBy, debouncedSearchQuery]);

  const handleCategoryChange = (category: Category | "all") => {
    setSelectedCategory(category);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLocation(`/browse?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSearch={handleSearch} searchQuery={searchQuery} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 md:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
            Browse Content
          </h1>
          <p className="text-muted-foreground">
            Explore our library of disability-led stories and content
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
            <Button
              variant={selectedCategory === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => handleCategoryChange("all")}
              className={selectedCategory === "all" ? "bg-primary" : ""}
              data-testid="button-category-all"
            >
              All Content
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className={selectedCategory === category ? "bg-primary" : ""}
                data-testid={`button-category-${category.toLowerCase()}`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-sm font-medium">
              Sort by:
            </label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger id="sort-select" className="w-40" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6" data-testid="text-results-count">
            {filteredContent.length} {filteredContent.length === 1 ? "result" : "results"}
            {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
          </p>
        )}

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredContent.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredContent.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4" data-testid="text-no-results">
              No content found
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearchQuery 
                ? "Try adjusting your search or filters" 
                : "Check back soon for new content"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
