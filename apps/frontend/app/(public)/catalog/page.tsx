'use client';

import { useState, useMemo } from 'react';
import { Shield, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/catalog/listing-grid';
import { FiltersSidebar } from '@/components/catalog/filters-sidebar';
import { SearchBar } from '@/components/catalog/search-bar';
import { CategoryTabs } from '@/components/catalog/category-tabs';
import { useCatalogList } from '@/lib/hooks/useCatalog';
import { CatalogFilters } from '@/types/catalog';
import { Loader2 } from 'lucide-react';

export default function CatalogPage() {
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useCatalogList(filters);

  const allListings = useMemo(
    () => data?.pages.flatMap((page) => page.listings || []) ?? [],
    [data]
  );

  const handleFiltersChange = (newFilters: CatalogFilters) => {
    setFilters(newFilters);
  };

  const handleCategoryChange = (category: string | undefined) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Browse Verified Accounts</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Discover established freelance accounts verified by our team.
              Every listing is escrow-protected and admin-reviewed.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>Admin Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>Escrow Protected</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>Encrypted Credentials</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FiltersSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Search and Filters Bar */}
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <SearchBar
                    value={filters.search || ''}
                    onChange={handleSearchChange}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              <CategoryTabs
                activeCategory={filters.category}
                onCategoryChange={handleCategoryChange}
              />
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-destructive">
                  Failed to load listings. Please try again.
                </p>
              </div>
            ) : (
              <ListingGrid
                listings={allListings}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-card border-l shadow-xl overflow-y-auto">
            <div className="p-4">
              <FiltersSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
