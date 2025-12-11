import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, User, Search } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Barrack, Pic } from "@shared/schema";
import { useState, useEffect } from "react";

const heroImage = "/generated_images/Military_base_hero_banner_8bafbf52.png";

type BarrackWithPic = Barrack & { pic: Pic | null };

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [navHidden, setNavHidden] = useState(false);
  
  const { data: barracks, isLoading } = useQuery<BarrackWithPic[]>({
    queryKey: ["/api/barracks"],
  });

  useEffect(() => {
    const handleScroll = () => {
      const navbarHeight = 64;
      const heroHeight = window.innerHeight - navbarHeight;
      const scrollThreshold = heroHeight - navbarHeight;
      setNavHidden(window.scrollY > scrollThreshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredBarracks = barracks?.filter((barrack) =>
    barrack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    barrack.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className={`sticky top-0 z-50 bg-primary text-primary-foreground transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            <h1 className="text-xl font-semibold">KOMLEKDAM INVENTORY INFORMATION</h1>
          </div>
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="bg-primary-foreground/20 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/30" data-testid="button-admin-login">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-[calc(100vh-64px)] overflow-hidden">
        <img
          src={heroImage}
          alt="Military Base"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              KOMLEKDAM INVENTORY INFORMATION SYSTEM
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Komlekdam XIV/Hasanuddin berkomitmen untuk menyajikan data inventaris satuan yang akurat, transparan, dan dapat diandalkan,sehingga dapat membantu meningkatkan efisiensi dan efektivitas pengelolaan inventaris satuan
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4" id="directory">
        <div className="sticky top-0 z-40 bg-background py-6 -mx-4 px-4">
          <div className="mb-4">
            <h2 className="text-3xl font-bold mb-2">Staff Room Directory</h2>
            <p className="text-muted-foreground">
              Lihat semua fasilitas staf
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-barracks"
            />
          </div>
        </div>

        <div className="pt-2 pb-8">

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full aspect-video rounded-t-lg" />
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBarracks && filteredBarracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBarracks.map((barrack) => (
              <Link key={barrack.id} href={`/barrack/${barrack.id}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden transition-all" data-testid={`card-barrack-${barrack.id}`}>
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {barrack.photoUrl ? (
                      <img
                        src={barrack.photoUrl}
                        alt={barrack.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-medium line-clamp-1" data-testid={`text-barrack-name-${barrack.id}`}>
                        {barrack.name}
                      </h3>
                      {barrack.verified && (
                        <Badge variant="default" className="bg-primary text-primary-foreground shrink-0" data-testid={`badge-verified-${barrack.id}`}>
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1" data-testid={`text-location-${barrack.id}`}>{barrack.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1" data-testid={`text-pic-${barrack.id}`}>
                          {barrack.pic ? `${barrack.pic.rank || ''} ${barrack.pic.name}`.trim() : 'No PIC assigned'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No barracks found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try adjusting your search criteria" : "No barracks have been added yet"}
            </p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
