import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Building2, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminHeader from "@/components/admin-header";
import type { Barrack, Pic } from "@shared/schema";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBarrackSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

export default function AdminBarrackFormPage() {
  const [, params] = useRoute("/admin/barracks/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = !!params?.id;
  const barackId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: barrack } = useQuery<Barrack>({
    queryKey: ["/api/barracks", barackId],
    enabled: isEdit && barackId !== null,
  });

  const { data: pics } = useQuery<Pic[]>({
    queryKey: ["/api/pics"],
  });

  const form = useForm({
    resolver: zodResolver(insertBarrackSchema),
    defaultValues: {
      name: "",
      location: "",
      photoUrl: modernBarrack,
      picId: undefined as number | undefined,
    },
  });

  useEffect(() => {
    if (barrack) {
      form.reset({
        name: barrack.name,
        location: barrack.location,
        photoUrl: barrack.photoUrl || modernBarrack,
        picId: barrack.picId || undefined,
      });
    }
  }, [barrack, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("adminToken");
      if (isEdit && barackId) {
        return await apiRequest("PUT", `/api/barracks/${barackId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        return await apiRequest("POST", "/api/barracks", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barracks"] });
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
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/barracks")}
            className="gap-2 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Barracks
          </Button>
          <h1 className="text-3xl font-bold mb-2">
            {isEdit ? "Edit Barrack" : "Add New Barrack"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update barrack information" : "Create a new barrack entry"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Barrack Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barrack Name</FormLabel>
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
                      <FormLabel>Location</FormLabel>
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
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-photo">
                            <SelectValue placeholder="Select a photo" />
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
                      {field.value && (
                        <div className="mt-3 border rounded-lg overflow-hidden">
                          <img
                            src={field.value}
                            alt="Preview"
                            className="w-full aspect-video object-cover"
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="picId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person in Charge (PIC)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-pic">
                            <SelectValue placeholder="Select a PIC (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No PIC</SelectItem>
                          {pics?.map((pic) => (
                            <SelectItem key={pic.id} value={pic.id.toString()}>
                              {pic.rank ? `${pic.rank} ${pic.name}` : pic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
