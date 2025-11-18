import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Building2, Plus, Edit, Trash2, ShieldCheck, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminHeader from "@/components/admin-header";
import type { Barrack, Pic } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

type BarrackWithPic = Barrack & { pic: Pic | null };

export default function AdminBarracksPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: barracks, isLoading } = useQuery<BarrackWithPic[]>({
    queryKey: ["/api/barracks"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("adminToken");
      return await apiRequest("DELETE", `/api/barracks/${id}`, undefined, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
      toast({
        title: "Barrack deleted",
        description: "The barrack has been removed successfully",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete barrack",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Barracks</h1>
            <p className="text-muted-foreground">
              View, edit, and delete barrack records
            </p>
          </div>
          <Link href="/admin/barracks/new">
            <Button className="gap-2" data-testid="button-add-barrack">
              <Plus className="w-4 h-4" />
              Add Barrack
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="w-full aspect-video rounded-t-lg" />
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : barracks && barracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barracks.map((barrack) => (
              <Card key={barrack.id} data-testid={`card-admin-barrack-${barrack.id}`}>
                <div className="aspect-video w-full overflow-hidden bg-muted rounded-t-lg">
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
                    <h3 className="text-lg font-medium line-clamp-1">{barrack.name}</h3>
                    {barrack.verified ? (
                      <Badge variant="default" className="bg-primary text-primary-foreground shrink-0">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        <Shield className="w-3 h-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                    {barrack.location}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/admin/barracks/${barrack.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`button-edit-${barrack.id}`}>
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(barrack.id)}
                      className="gap-2"
                      data-testid={`button-delete-${barrack.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No barracks found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get started by adding your first barrack
            </p>
            <Link href="/admin/barracks/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Barrack
              </Button>
            </Link>
          </div>
        )}
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Barrack</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this barrack? This will also delete all associated inventory items and member records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
