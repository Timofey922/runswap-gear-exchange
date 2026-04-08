import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, CONDITIONS } from '@/types/listing';
import type { Listing } from '@/types/listing';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, PackageOpen, CheckCircle, Ban } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Listing | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast.success('Listing deleted');
    },
    onError: () => toast.error('Failed to delete listing'),
  });

  const soldMutation = useMutation({
    mutationFn: async ({ id, sold }: { id: string; sold: boolean }) => {
      const { error } = await supabase.from('listings').update({ sold } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success(vars.sold ? 'Marked as sold' : 'Marked as available');
    },
    onError: () => toast.error('Failed to update listing'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from('listings')
        .update({
          title: form.title,
          brand: form.brand,
          model: form.model || null,
          category: form.category,
          size: form.size || null,
          condition: form.condition,
          mileage: form.mileage ? parseInt(form.mileage) : null,
          price: parseFloat(form.price),
          description: form.description || null,
          image_url: form.image_url || null,
        })
        .eq('id', editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setEditing(null);
      toast.success('Listing updated!');
    },
    onError: () => toast.error('Failed to update listing'),
  });

  const openEdit = (listing: Listing) => {
    setForm({
      title: listing.title,
      brand: listing.brand,
      model: listing.model ?? '',
      category: listing.category,
      size: listing.size ?? '',
      condition: listing.condition,
      mileage: listing.mileage?.toString() ?? '',
      price: listing.price.toString(),
      description: listing.description ?? '',
      image_url: listing.image_url ?? '',
    });
    setEditing(listing);
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Listings</h1>
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/sell')}>
            <Plus className="h-4 w-4" /> New Listing
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !listings?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <PackageOpen className="h-12 w-12" />
            <p className="text-lg font-medium">No listings yet</p>
            <Button variant="outline" onClick={() => navigate('/sell')}>Post your first listing</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Card key={listing.id} className={listing.sold ? 'opacity-60' : ''}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">{listing.category === 'shoes' ? '👟' : listing.category === 'apparel' ? '👕' : listing.category === 'watches' ? '⌚' : '🎒'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{listing.title}</h3>
                    <p className="text-xs text-muted-foreground">{listing.brand} · ${listing.price.toFixed(0)}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] capitalize">{listing.condition}</Badge>
                      {listing.sold && <Badge className="text-[10px] bg-muted-foreground text-background">SOLD</Badge>}
                      {listing.strava_verified_mileage != null && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={listing.sold ? 'Mark as available' : 'Mark as sold'}
                      onClick={() => soldMutation.mutate({ id: listing.id, sold: !listing.sold })}
                      disabled={soldMutation.isPending}
                    >
                      {listing.sold ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-primary" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(listing)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(listing.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title ?? ''} onChange={(e) => update('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Input value={form.brand ?? ''} onChange={(e) => update('brand', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input value={form.model ?? ''} onChange={(e) => update('model', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => update('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => update('condition', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Size</Label>
                <Input value={form.size ?? ''} onChange={(e) => update('size', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Mileage</Label>
                <Input type="number" value={form.mileage ?? ''} onChange={(e) => update('mileage', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" value={form.price ?? ''} onChange={(e) => update('price', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <ImageUpload value={form.image_url ?? ''} onChange={(url) => update('image_url', url)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} />
            </div>
            <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyListings;
