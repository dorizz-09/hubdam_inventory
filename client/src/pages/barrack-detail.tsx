import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Building2, MapPin, User, Shield, ShieldCheck, Package, Users, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { BarrackDetail } from "@shared/schema";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function BarrackDetailPage() {
  const [, params] = useRoute("/barrack/:id");
  const barackId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { data: barrack, isLoading } = useQuery<BarrackDetail>({
    queryKey: ["/api/barracks", barackId],
    enabled: barackId !== null,
  });

  const verifyMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return await apiRequest("POST", `/api/barracks/${barackId}/verify`, credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barracks", barackId] });
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
      setVerifyDialogOpen(false);
      setUsername("");
      setPassword("");
      toast({
        title: "Verification successful",
        description: "Barrack information has been verified by the PIC",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid credentials or unauthorized",
        variant: "destructive",
      });
    },
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ username, password });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <div className="h-64 md:h-80 bg-muted" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!barrack) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Barrack not found</h2>
          <p className="text-muted-foreground mb-6">The requested barrack could not be found</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </header>

      <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
        {barrack.photoUrl ? (
          <>
            <img
              src={barrack.photoUrl}
              alt={barrack.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-24 h-24 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2" data-testid="text-barrack-name">{barrack.name}</h1>
            <div className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              <span data-testid="text-barrack-location">{barrack.location}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                {barrack.inventory.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {barrack.inventory.map((item) => (
                          <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                            <TableCell className="font-medium" data-testid={`text-item-name-${item.id}`}>
                              {item.itemName}
                            </TableCell>
                            <TableCell className="text-right" data-testid={`text-item-quantity-${item.id}`}>
                              {item.quantity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>No inventory items recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Barrack Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {barrack.members.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {barrack.members.map((member) => (
                          <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                            <TableCell className="font-medium" data-testid={`text-member-name-${member.id}`}>
                              {member.name}
                            </TableCell>
                            <TableCell data-testid={`text-member-rank-${member.id}`}>
                              {member.rank || '-'}
                            </TableCell>
                            <TableCell data-testid={`text-member-role-${member.id}`}>
                              {member.role || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>No members assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Barrack Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Person in Charge</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium" data-testid="text-pic-name">
                      {barrack.pic ? `${barrack.pic.rank || ''} ${barrack.pic.name}`.trim() : 'No PIC assigned'}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Verification Status</Label>
                  <div className="mt-1">
                    {barrack.verified ? (
                      <Badge variant="default" className="bg-primary text-primary-foreground gap-1.5" data-testid="badge-verified">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1.5" data-testid="badge-not-verified">
                        <Shield className="w-3.5 h-3.5" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    className="w-full gap-2"
                    onClick={() => setVerifyDialogOpen(true)}
                    disabled={!barrack.pic}
                    data-testid="button-verify-information"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify Information
                  </Button>
                  {!barrack.pic && (
                    <p className="text-xs text-muted-foreground mt-2">
                      No PIC assigned - verification not available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent data-testid="dialog-verify">
          <form onSubmit={handleVerify}>
            <DialogHeader>
              <DialogTitle>Verify Barrack Information</DialogTitle>
              <DialogDescription>
                Enter PIC credentials to verify that all displayed information is correct and up to date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="username">PIC Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="off"
                  data-testid="input-verify-username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                  data-testid="input-verify-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVerifyDialogOpen(false)}
                data-testid="button-cancel-verify"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifyMutation.isPending}
                data-testid="button-submit-verify"
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
