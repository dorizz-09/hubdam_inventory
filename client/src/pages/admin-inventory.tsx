import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
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
import type { InventoryItem, Barrack } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";

type BarrackWithPic = Barrack & { pic: any };

export default function AdminInventoryPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    barackId: "",
    itemName: "",
    quantity: "0",
    status: "APBN",
  });

  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: barracks } = useQuery<BarrackWithPic[]>({
    queryKey: ["/api/barracks"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("adminToken");
      if (editItem) {
        return await apiRequest("PUT", `/api/inventory/${editItem.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        return await apiRequest("POST", "/api/inventory", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
      toast({
        title: editItem ? "Inventory updated" : "Inventory added",
        description: editItem ? "Changes saved successfully" : "New item added successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save inventory item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("adminToken");
      return await apiRequest("DELETE", `/api/inventory/${id}`, undefined, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
      toast({
        title: "Item deleted",
        description: "Inventory item removed successfully",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditItem(item);
      setFormData({
        barackId: item.barackId.toString(),
        itemName: item.itemName,
        quantity: item.quantity.toString(),
        status: item.status || "APBN",
      });
    } else {
      setEditItem(null);
      setFormData({ barackId: "", itemName: "", quantity: "0", status: "APBN" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    setFormData({ barackId: "", itemName: "", quantity: "0", status: "APBN" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      barackId: parseInt(formData.barackId),
      itemName: formData.itemName,
      quantity: parseInt(formData.quantity),
      status: formData.status,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Inventory</h1>
            <p className="text-muted-foreground">
              Add, update, or remove inventory items for all rooms
            </p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenDialog()} data-testid="button-add-inventory">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {inventory && inventory.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Nama Item</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => {
                      const barrack = barracks?.find(b => b.id === item.barackId);
                      return (
                        <TableRow key={item.id} data-testid={`row-inventory-item-${item.id}`}>
                          <TableCell className="font-medium">{barrack?.name || 'Unknown'}</TableCell>
                          <TableCell data-testid={`text-inventory-name-${item.id}`}>{item.itemName}</TableCell>
                          <TableCell data-testid={`text-inventory-quantity-${item.id}`}>{item.quantity}</TableCell>
                          <TableCell data-testid={`text-inventory-status-${item.id}`}>{item.status || 'APBN'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(item)}
                                data-testid={`button-edit-inventory-${item.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(item.id)}
                                data-testid={`button-delete-inventory-${item.id}`}
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
            <Package className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No inventory items</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start adding inventory items to track barrack supplies
            </p>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-inventory-form">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle>
              <DialogDescription>
                {editItem ? "Update inventory item details" : "Add a new inventory item to a barrack"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="barrackId">Room</Label>
                <Select
                  value={formData.barackId}
                  onValueChange={(value) => setFormData({ ...formData, barackId: value })}
                  required
                >
                  <SelectTrigger id="barrackId" data-testid="select-barrack">
                    <SelectValue placeholder="Select a room" />
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
                <Label htmlFor="itemName">Nama Item</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g., Rifle, Uniform, Helmet"
                  required
                  data-testid="input-item-name"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Jumlah</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  data-testid="input-quantity"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status" data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APBN">APBN</SelectItem>
                    <SelectItem value="Swadaya">Swadaya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="button-cancel-inventory"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-inventory">
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-delete-inventory-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-inventory">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-inventory"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
