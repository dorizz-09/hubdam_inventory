import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { Member, Barrack } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

type BarrackWithPic = Barrack & { pic: any };

export default function AdminMembersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    barackId: "",
    name: "",
    rank: "",
    role: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: barracks } = useQuery<BarrackWithPic[]>({
    queryKey: ["/api/barracks"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("adminToken");
      if (editMember) {
        return await apiRequest("PUT", `/api/members/${editMember.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        return await apiRequest("POST", "/api/members", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
      toast({
        title: editMember ? "Member updated" : "Member added",
        description: editMember ? "Changes saved successfully" : "New member added successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save member",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("adminToken");
      return await apiRequest("DELETE", `/api/members/${id}`, undefined, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
      toast({
        title: "Member removed",
        description: "Member removed successfully",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (member?: Member) => {
    if (member) {
      setEditMember(member);
      setFormData({
        barackId: member.barackId.toString(),
        name: member.name,
        rank: member.rank || "",
        role: member.role || "",
      });
    } else {
      setEditMember(null);
      setFormData({ barackId: "", name: "", rank: "", role: "" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMember(null);
    setFormData({ barackId: "", name: "", rank: "", role: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      barackId: parseInt(formData.barackId),
      name: formData.name,
      rank: formData.rank || null,
      role: formData.role || null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Members</h1>
            <p className="text-muted-foreground">
              Assign or remove personnel from barracks
            </p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenDialog()} data-testid="button-add-member">
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        {members && members.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barrack</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const barrack = barracks?.find(b => b.id === member.barackId);
                      return (
                        <TableRow key={member.id} data-testid={`row-member-item-${member.id}`}>
                          <TableCell className="font-medium">{barrack?.name || 'Unknown'}</TableCell>
                          <TableCell data-testid={`text-member-item-name-${member.id}`}>{member.name}</TableCell>
                          <TableCell data-testid={`text-member-item-rank-${member.id}`}>{member.rank || '-'}</TableCell>
                          <TableCell data-testid={`text-member-item-role-${member.id}`}>{member.role || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(member)}
                                data-testid={`button-edit-member-${member.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(member.id)}
                                data-testid={`button-delete-member-${member.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No members assigned</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start assigning personnel to barracks
            </p>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-member-form">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editMember ? "Edit Member" : "Add Member"}</DialogTitle>
              <DialogDescription>
                {editMember ? "Update member details" : "Assign a new member to a barrack"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="barrackId">Barrack</Label>
                <Select
                  value={formData.barackId}
                  onValueChange={(value) => setFormData({ ...formData, barackId: value })}
                  required
                >
                  <SelectTrigger id="barrackId" data-testid="select-member-barrack">
                    <SelectValue placeholder="Select a barrack" />
                  </SelectTrigger>
                  <SelectContent>
                    {barracks?.map((barrack) => (
                      <SelectItem key={barrack.id} value={barrack.id.toString()}>
                        {barrack.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                  data-testid="input-member-name"
                />
              </div>
              <div>
                <Label htmlFor="rank">Rank (Optional)</Label>
                <Input
                  id="rank"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  placeholder="e.g., Sergeant, Private"
                  data-testid="input-member-rank"
                />
              </div>
              <div>
                <Label htmlFor="role">Role (Optional)</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Squad Leader, Medic"
                  data-testid="input-member-role"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="button-cancel-member"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-member">
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-delete-member-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the barrack? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-member">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-member"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
