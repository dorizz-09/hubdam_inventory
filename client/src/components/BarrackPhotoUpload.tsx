import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarrackPhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (photoUrl: string) => void;
}

export function BarrackPhotoUpload({ currentPhotoUrl, onPhotoUploaded }: BarrackPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10485760) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const uploadResponse = await fetch("/api/barracks/photo-upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload photo");
      }

      const { photoUrl } = await uploadResponse.json();
      
      onPhotoUploaded(photoUrl);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Photo uploaded",
        description: "Barrack photo has been uploaded successfully",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="photo-upload"
          data-testid="input-photo-file"
        />
        <label htmlFor="photo-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            asChild
            data-testid="button-upload-photo"
          >
            <span className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {currentPhotoUrl && (
        <div className="relative w-full aspect-video rounded-md overflow-hidden border">
          <img
            src={currentPhotoUrl}
            alt="Barrack preview"
            className="w-full h-full object-cover"
            data-testid="img-photo-preview"
          />
        </div>
      )}
    </div>
  );
}
