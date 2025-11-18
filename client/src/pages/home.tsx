import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, User, Search } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Barrack, Pic } from "@shared/schema";
import { useState } from "react";

type BarrackWithPic = Barrack & { pic: Pic | null };

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: barracks, isLoading } = useQuery<BarrackWithPic[]>({
    queryKey: ["/api/barracks"],
  });

  const filteredBarracks = barracks?.filter((barrack) =>
    barrack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    barrack.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Military Barracks Management</h1>
          </div>
          <Link href="/admin/login">
            <Button variant="outline" size="sm" data-testid="button-admin-login">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Barracks Directory</h2>
          <p className="text-muted-foreground">
            View all military barracks facilities and their current status
          </p>
        </div>

        <div className="mb-6">
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
      </main>
    </div>
  );
}
