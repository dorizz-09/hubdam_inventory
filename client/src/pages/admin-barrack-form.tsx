import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Building2, Save, ArrowLeft, Plus, Trash2, Package, Users, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Barrack, InventoryItem, Member, BarrackDetail } from "@shared/schema";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBarrackSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BarrackPhotoUpload } from "@/components/BarrackPhotoUpload";
import modernBarrack from "@assets/generated_images/Modern_military_barrack_building_fcae3325.png";
import traditionalBarrack from "@assets/generated_images/Traditional_barracks_building_66b8645e.png";
import contemporaryBarrack from "@assets/generated_images/Contemporary_barracks_complex_2e44b7c9.png";
import trainingBarrack from "@assets/generated_images/Training_barracks_facility_bb321117.png";

const PHOTO_OPTIONS = [
  { value: modernBarrack, label: "Modern Barrack" },
  { value: traditionalBarrack, label: "Traditional Barrack" },
  { value: contemporaryBarrack, label: "Contemporary Barrack" },
  { value: trainingBarrack, label: "Training Barrack" },
];

type InventoryItemForm = {
  id?: number;
  itemName: string;
  quantity: number | string; // Allow string for input handling
  status: string;
};

type MemberForm = {
  id?: number;
  name: string;
  rank: string;
  role: string;
};

export default function AdminBarrackFormPage() {
  const [, params] = useRoute("/admin/barracks/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = !!params?.id;
  const barackId = params?.id ? parseInt(params.id) : null;

  const [inventory, setInventory] = useState<InventoryItemForm[]>([]);
  const [members, setMembers] = useState<MemberForm[]>([]);
  
  const [newInventoryItem, setNewInventoryItem] = useState({ itemName: "", quantity: "1", status: "APBN" });
  const [newMember, setNewMember] = useState({ name: "", rank: "", role: "" });
  const [showPicPassword, setShowPicPassword] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: barrack } = useQuery<BarrackDetail>({
    queryKey: ["/api/barracks", barackId],
    enabled: isEdit && barackId !== null,
  });

  const form = useForm({
    resolver: zodResolver(insertBarrackSchema),
    defaultValues: {
      name: "",
      location: "",
      photoUrl: modernBarrack,
      picName: "",
      picPassword: "",
    },
  });

  useEffect(() => {
    if (barrack) {
      form.reset({
        name: barrack.name,
        location: barrack.location,
        photoUrl: barrack.photoUrl || modernBarrack,
        picName: barrack.pic?.name || "",
        picPassword: "", // Don't prefill password for security
      });
      
      // Load existing inventory and members
      setInventory(barrack.inventory.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        status: item.status || "APBN",
      })));
      
      setMembers(barrack.members.map(member => ({
        id: member.id,
        name: member.name,
        rank: member.rank || "",
        role: member.role || "",
      })));
    }
  }, [barrack, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("adminToken");
      
      // First, create or update the barrack
      let savedBarrack;
      if (isEdit && barackId) {
        savedBarrack = await apiRequest("PUT", `/api/barracks/${barackId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        savedBarrack = await apiRequest("POST", "/api/barracks", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      const barrackIdToUse = savedBarrack.id;
      
      // Handle inventory updates
      if (isEdit && barackId) {
        // Delete removed inventory items
        const existingIds = barrack?.inventory.map(i => i.id) || [];
        const currentIds = inventory.filter(i => i.id).map(i => i.id);
        const deletedIds = existingIds.filter(id => !currentIds.includes(id));
        
        for (const id of deletedIds) {
          await apiRequest("DELETE", `/api/inventory/${id}`, undefined, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        
        // Update existing and create new inventory items
        for (const item of inventory) {
          const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
          if (item.id) {
            await apiRequest("PUT", `/api/inventory/${item.id}`, {
              barackId: barrackIdToUse,
              itemName: item.itemName,
              quantity: quantity,
              status: item.status || "APBN",
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } else {
            await apiRequest("POST", "/api/inventory", {
              barackId: barrackIdToUse,
              itemName: item.itemName,
              quantity: quantity,
              status: item.status || "APBN",
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      } else {
        // For new barracks, just create all inventory items
        for (const item of inventory) {
          const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
          await apiRequest("POST", "/api/inventory", {
            barackId: barrackIdToUse,
            itemName: item.itemName,
            quantity: quantity,
            status: item.status || "APBN",
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
      
      // Handle member updates
      if (isEdit && barackId) {
        // Delete removed members
        const existingMemberIds = barrack?.members.map(m => m.id) || [];
        const currentMemberIds = members.filter(m => m.id).map(m => m.id);
        const deletedMemberIds = existingMemberIds.filter(id => !currentMemberIds.includes(id));
        
        for (const id of deletedMemberIds) {
          await apiRequest("DELETE", `/api/members/${id}`, undefined, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        
        // Update existing and create new members
        for (const member of members) {
          if (member.id) {
            await apiRequest("PUT", `/api/members/${member.id}`, {
              barackId: barrackIdToUse,
              name: member.name,
              rank: member.rank || null,
              role: member.role || null,
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } else {
            await apiRequest("POST", "/api/members", {
              barackId: barrackIdToUse,
              name: member.name,
              rank: member.rank || null,
              role: member.role || null,
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      } else {
        // For new barracks, just create all members
        for (const member of members) {
          await apiRequest("POST", "/api/members", {
            barackId: barrackIdToUse,
            name: member.name,
            rank: member.rank || null,
            role: member.role || null,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
      
      return savedBarrack;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: isEdit ? "Barrack updated" : "Barrack created",
        description: isEdit ? "Changes saved successfully" : "New barrack added successfully",
      });
      setLocation("/admin/barracks");
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save barrack",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Use uploaded photo URL if available, otherwise use form value
    const finalPhotoUrl = uploadedPhotoUrl || data.photoUrl;
    data.photoUrl = finalPhotoUrl;
    
    // Validate inventory items
    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i];
      if (!item.itemName || item.itemName.trim() === "") {
        toast({
          title: "Validation error",
          description: `Inventory item #${i + 1} must have a name`,
          variant: "destructive",
        });
        return;
      }
      // Parse quantity to number for validation - ensure it's a pure integer string
      const quantityStr = String(item.quantity).trim();
      if (!/^\d+$/.test(quantityStr)) {
        toast({
          title: "Validation error",
          description: `Inventory item "${item.itemName}" quantity must be a positive integer`,
          variant: "destructive",
        });
        return;
      }
      const quantity = parseInt(quantityStr);
      if (quantity < 1) {
        toast({
          title: "Validation error",
          description: `Inventory item "${item.itemName}" must have quantity of at least 1`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validate members
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.name || member.name.trim() === "") {
        toast({
          title: "Validation error",
          description: `Member #${i + 1} must have a name`,
          variant: "destructive",
        });
        return;
      }
    }
    
    saveMutation.mutate(data);
  };

  const addInventoryItem = () => {
    if (!newInventoryItem.itemName || newInventoryItem.itemName.trim() === "") {
      toast({
        title: "Validation error",
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }
    
    const quantityStr = String(newInventoryItem.quantity).trim();
    if (!/^\d+$/.test(quantityStr)) {
      toast({
        title: "Validation error",
        description: "Quantity must be a positive integer",
        variant: "destructive",
      });
      return;
    }
    const quantity = parseInt(quantityStr);
    if (quantity < 1) {
      toast({
        title: "Validation error",
        description: "Quantity must be at least 1",
        variant: "destructive",
      });
      return;
    }
    
    setInventory([...inventory, { ...newInventoryItem }]);
    setNewInventoryItem({ itemName: "", quantity: "1", status: "APBN" });
  };

  const removeInventoryItem = (index: number) => {
    setInventory(inventory.filter((_, i) => i !== index));
  };

  const updateInventoryItem = (index: number, field: keyof InventoryItemForm, value: any) => {
    const updated = [...inventory];
    // Keep raw value (string or number) to allow empty input
    updated[index] = { ...updated[index], [field]: value };
    setInventory(updated);
  };

  const addMember = () => {
    if (!newMember.name) {
      toast({
        title: "Validation error",
        description: "Member name is required",
        variant: "destructive",
      });
      return;
    }
    
    setMembers([...members, { ...newMember }]);
    setNewMember({ name: "", rank: "", role: "" });
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof MemberForm, value: any) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/barracks")}
            className="gap-2 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rooms
          </Button>
          <h1 className="text-3xl font-bold mb-2">
            {isEdit ? "Edit Room" : "Add New Room"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update room information, inventory, and staffs" : "Create a new room with inventory and staffs"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Room Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Ruangan</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Alpha Company Barracks" data-testid="input-barrack-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Building 204, Fort Campbell" data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <div className="space-y-3">
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-photo">
                              <SelectValue placeholder="Select a predefined photo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PHOTO_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 border-t"></div>
                          <span className="text-sm text-muted-foreground">or</span>
                          <div className="flex-1 border-t"></div>
                        </div>
                        <BarrackPhotoUpload
                          currentPhotoUrl={uploadedPhotoUrl || field.value}
                          onPhotoUploaded={(url) => {
                            setUploadedPhotoUrl(url);
                            form.setValue("photoUrl", url, { shouldDirty: true, shouldValidate: true });
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="picName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Penanggung Jawab</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., John Smith (optional)" data-testid="input-pic-name" />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Nama ini akan digunakan sebagai username untuk verifikasi
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="picPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              type={showPicPassword ? "text" : "password"}
                              placeholder="Enter password for verification (optional)" 
                              data-testid="input-pic-password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPicPassword(!showPicPassword)}
                              data-testid="button-toggle-pic-password-visibility"
                            >
                              {showPicPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Biarkan kosong saat mengedit untuk mempertahankan kata sandi yang ada
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventaris
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inventory.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Item</TableHead>
                          <TableHead className="w-32">Jumlah</TableHead>
                          <TableHead className="w-32">Status</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={item.itemName}
                                onChange={(e) => updateInventoryItem(index, "itemName", e.target.value)}
                                data-testid={`input-inventory-name-${index}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => updateInventoryItem(index, "quantity", e.target.value)}
                                data-testid={`input-inventory-quantity-${index}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.status}
                                onValueChange={(value) => updateInventoryItem(index, "status", value)}
                              >
                                <SelectTrigger data-testid={`select-inventory-status-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="APBN">APBN</SelectItem>
                                  <SelectItem value="Swadaya">Swadaya</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInventoryItem(index)}
                                data-testid={`button-remove-inventory-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Item name"
                    value={newInventoryItem.itemName}
                    onChange={(e) => setNewInventoryItem({ ...newInventoryItem, itemName: e.target.value })}
                    data-testid="input-new-inventory-name"
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Quantity"
                    value={newInventoryItem.quantity}
                    onChange={(e) => setNewInventoryItem({ ...newInventoryItem, quantity: e.target.value })}
                    className="w-32"
                    data-testid="input-new-inventory-quantity"
                  />
                  <Select
                    value={newInventoryItem.status}
                    onValueChange={(value) => setNewInventoryItem({ ...newInventoryItem, status: value })}
                  >
                    <SelectTrigger className="w-32" data-testid="select-new-inventory-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APBN">APBN</SelectItem>
                      <SelectItem value="Swadaya">Swadaya</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={addInventoryItem}
                    className="gap-2 shrink-0"
                    data-testid="button-add-inventory"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Anggota Staf
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {members.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead className="w-40">Pangkat</TableHead>
                          <TableHead className="w-40">Jabatan</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={member.name}
                                onChange={(e) => updateMember(index, "name", e.target.value)}
                                data-testid={`input-member-name-${index}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={member.rank}
                                onChange={(e) => updateMember(index, "rank", e.target.value)}
                                placeholder="Optional"
                                data-testid={`input-member-rank-${index}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={member.role}
                                onChange={(e) => updateMember(index, "role", e.target.value)}
                                placeholder="Optional"
                                data-testid={`input-member-role-${index}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMember(index)}
                                data-testid={`button-remove-member-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Nama"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    data-testid="input-new-member-name"
                  />
                  <Input
                    placeholder="Pangkat (optional)"
                    value={newMember.rank}
                    onChange={(e) => setNewMember({ ...newMember, rank: e.target.value })}
                    className="w-40"
                    data-testid="input-new-member-rank"
                  />
                  <Input
                    placeholder="Jabatan (optional)"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-40"
                    data-testid="input-new-member-role"
                  />
                  <Button
                    type="button"
                    onClick={addMember}
                    className="gap-2 shrink-0"
                    data-testid="button-add-member"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/barracks")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="gap-2"
                data-testid="button-save"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? "Saving..." : "Save Barrack"}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}
