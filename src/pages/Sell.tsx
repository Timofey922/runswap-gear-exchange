import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, CONDITIONS } from '@/types/listing';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

const Sell = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', brand: '', model: '', category: '', size: '',
    condition: '', mileage: '', price: '', description: '',
    seller_email: '', image_url: '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('listings').insert({
        title: form.title.trim(),
        brand: form.brand.trim(),
        model: form.model.trim() || null,
        category: form.category,
        size: form.size.trim() || null,
        condition: form.condition,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        price: parseFloat(form.price),
        description: form.description.trim() || null,
        seller_email: form.seller_email.trim(),
        image_url: form.image_url.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Listing posted successfully!');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to post listing. Please try again.');
    },
  });

  const canSubmit = form.title && form.brand && form.category && form.condition && form.price && form.seller_email;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 text-muted-foreground" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Post Your Gear</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" placeholder="e.g. Nike Vaporfly 3" value={form.title} onChange={(e) => update('title', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brand">Brand *</Label>
                <Input id="brand" placeholder="e.g. Nike" value={form.brand} onChange={(e) => update('brand', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="e.g. Vaporfly 3" value={form.model} onChange={(e) => update('model', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category || undefined} onValueChange={(v) => update('category', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Condition *</Label>
                <Select value={form.condition || undefined} onValueChange={(v) => update('condition', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="size">Size</Label>
                <Input id="size" placeholder="e.g. US 10" value={form.size} onChange={(e) => update('size', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mileage">Mileage (miles)</Label>
                <Input id="mileage" type="number" placeholder="e.g. 150" value={form.mileage} onChange={(e) => update('mileage', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price">Price ($) *</Label>
                <Input id="price" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => update('price', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Your Email *</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={form.seller_email} onChange={(e) => update('seller_email', e.target.value)} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" placeholder="https://..." value={form.image_url} onChange={(e) => update('image_url', e.target.value)} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} placeholder="Describe condition, fit, why you're selling..." value={form.description} onChange={(e) => update('description', e.target.value)} />
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!canSubmit || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Post Listing
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Sell;
