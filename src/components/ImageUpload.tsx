import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUpload = ({ value, onChange }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('listing-images')
        .upload(path, file, { contentType: file.type });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(path);

      onChange(urlData.publicUrl);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }, [upload]);

  const remove = () => onChange('');

  if (value) {
    return (
      <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video">
        <img src={value} alt="Listing" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={remove}
          className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors aspect-video ${
        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <>
          <div className="rounded-full bg-muted p-3">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP · Max 5MB</p>
          </div>
        </>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileSelect}
        disabled={uploading}
      />
    </label>
  );
};

export default ImageUpload;
