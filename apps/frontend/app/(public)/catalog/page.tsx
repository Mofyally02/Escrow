'use client';

import { useState, useMemo, useCallback } from 'react';
import { Shield, Filter, X, ShoppingBag, Store, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/catalog/listing-grid';
import { FiltersSidebar } from '@/components/catalog/filters-sidebar';
import { SearchBar } from '@/components/catalog/search-bar';
import { CategoryTabs } from '@/components/catalog/category-tabs';
import { ModeSwitcher } from '@/components/common/mode-switcher';
import { useCatalogList } from '@/lib/hooks/useCatalog';
import { useUserMode } from '@/hooks/useUserMode';
import { useAuth } from '@/hooks/useAuth';
import { CatalogFilters } from '@/types/catalog';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CatalogPage() {
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { mode, changeMode, canBuy, canSell, hasBothModes } = useUserMode();
  const { isAuthenticated } = useAuth();

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

  const handleFiltersChange = useCallback((newFilters: CatalogFilters) => {
    setFilters(newFilters);
  }, []);

  const handleCategoryChange = useCallback((category: string | undefined) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({
      ...prev,
      search: search || undefined,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">
                {mode === 'buyer' ? 'Browse Verified Accounts' : 'Your Selling Hub'}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {mode === 'buyer'
                ? 'Discover established freelance accounts verified by our team. Every listing is escrow-protected and admin-reviewed.'
                : 'Manage your listings and reach buyers looking for verified accounts. List your accounts and start selling today.'}
            </p>
            
            {/* Mode Switcher - Only show if user can do both */}
            {isAuthenticated && hasBothModes && (
              <div className="flex justify-center pt-4">
                <ModeSwitcher
                  currentMode="both"
                  onModeChange={changeMode}
                  className="max-w-xs"
                />
              </div>
            )}

            {/* Quick Actions */}
            {isAuthenticated && (
              <div className="flex items-center justify-center gap-4 pt-6 flex-wrap">
                {mode === 'buyer' && canBuy && (
                  <Button size="lg" asChild>
                    <Link href="/buyer/purchases">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      My Purchases
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
                {mode === 'seller' && canSell && (
                  <>
                    <Button size="lg" asChild>
                      <Link href="/seller/dashboard">
                        <Store className="h-4 w-4 mr-2" />
                        My Listings
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/seller/submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Submit New Listing
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}

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
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <SearchBar
                    value={filters.search || ''}
                    onChange={handleSearchChange}
                  />
                </div>
                {isAuthenticated && hasBothModes && (
                  <ModeSwitcher
                    currentMode="both"
                    onModeChange={changeMode}
                    className="hidden sm:flex"
                  />
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <CategoryTabs
                  activeCategory={filters.category}
                  onCategoryChange={handleCategoryChange}
                />
                {isAuthenticated && (
                  <div className="flex gap-2">
                    {mode === 'buyer' && canBuy && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/buyer/purchases">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          My Purchases
                        </Link>
                      </Button>
                    )}
                    {mode === 'seller' && canSell && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/seller/dashboard">
                            <Store className="h-4 w-4 mr-2" />
                            My Listings
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href="/seller/submit">
                            <Plus className="h-4 w-4 mr-2" />
                            Submit Listing
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
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
