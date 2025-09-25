import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import PropertyCard from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { useFavorites } from "@/hooks/use-properties";
import { useTranslation } from "@/lib/i18n";
import { ArrowLeft, Heart, Home as HomeIcon } from "lucide-react";
import type { Property } from "@/types";

export default function FavoritesPage() {
  const [userId] = useState("demo-user-id"); // In real app, get from auth context
  const { data: favorites, isLoading, error } = useFavorites(userId);
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleMapClick = (property: Property) => {
    // Navigate to home page with property ID to show on map
    setLocation(`/?showProperty=${property.id}`);
  };

  // Generate favorites page structured data
  const getFavoritesStructuredData = () => {
    const totalFavorites = favorites?.length || 0;
    
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": t('favorites.structuredDataName'),
      "description": `View your ${totalFavorites} ${t('favorites.structuredDataDescription')}`,
      "numberOfItems": totalFavorites,
      "isPartOf": {
        "@type": "WebSite",
        "name": "MapEstate",
        "url": window.location.origin
      }
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('favorites.loadingFavorites')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{t('favorites.errorLoading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        title={`${t('favorites.title')} | MapEstate - AI-Powered Real Estate Finder`}
        description={`${t('favorites.description')} View and manage your saved properties with MapEstate's AI-powered real estate platform in Kurdistan, Iraq.`}
        keywords="favorite properties, saved listings, property bookmarks, real estate favorites, Kurdistan Iraq properties, MapEstate favorites, saved property search"
        canonicalUrl={undefined}
        ogImage={`${window.location.origin}/attached_assets/generated_images/MapEstate_real_estate_social_media_image_5fd65911.png`}
        structuredData={getFavoritesStructuredData()}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Favorites', url: '/favorites' }
        ]}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2" data-testid="back-to-home">
                <ArrowLeft className="h-4 w-4" />
                {t('property.backToHome')}
              </Button>
            </Link>
            <div>
            </div>
          </div>
        </div>

        {/* Favorites List */}
        {!favorites || favorites.length === 0 ? (
          <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10">
            <CardContent className="py-16 text-center">
              <div className="text-center" style={{ textAlign: 'center' }}>
                <Heart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2" style={{ textAlign: 'center' }}>{t('favorites.noFavoritesYet')}</h3>
                <p className="text-muted-foreground mb-6" style={{ textAlign: 'center' }}>
                  {t('favorites.noFavoritesDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {favorites.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  userId={userId} 
                  showMapButton={true}
                  onMapClick={handleMapClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}