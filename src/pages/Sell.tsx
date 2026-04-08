import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, CONDITIONS } from '@/types/listing';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import BrandInput from '@/components/BrandInput';
import { useAuth } from '@/hooks/useAuth';
import { useStrava } from '@/hooks/useStrava';

const Sell = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isConnected, connect, fetchStravaData } = useStrava();
  const [form, setForm] = useState({
    title: '', brand: '', model: '', category: '', size: '',
    condition: '', mileage: '', price: '', description: '', image_url: '',
  });
  const [stravaVerified, setStravaVerified] = useState<{ mileage: number; gearId: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to post a listing');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleStravaVerify = async () => {
    if (!isConnected) {
      connect('/sell');
      return;
    }

    setVerifying(true);
    try {
      const athlete = await fetchStravaData('athlete');
      const shoes = athlete?.shoes ?? [];

      // Try to match by brand+model
      const brandLower = form.brand.toLowerCase();
      const modelLower = form.model.toLowerCase();
      
      let matched = shoes.find((s: any) => {
        const name = s.name?.toLowerCase() ?? '';
        return name.includes(brandLower) && (modelLower ? name.includes(modelLower) : true);
      });

      if (!matched && shoes.length > 0) {
        // If no exact match, show the closest one
        matched = shoes.find((s: any) => s.name?.toLowerCase().includes(brandLower));
      }

      if (matched) {
        const mileageKm = matched.distance || 0;
        const mileageMi = Math.round(mileageKm / 1609.34);
        setStravaVerified({ mileage: mileageMi, gearId: matched.id });
        update('mileage', mileageMi.toString());
        toast.success(`Verified: ${matched.name} — ${mileageMi} miles`);
      } else {
        toast.info('No matching shoe found in your Strava gear. Make sure the brand/model matches.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to verify with Strava');
    } finally {
      setVerifying(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const insertData: any = {
        title: form.title.trim(),
        brand: form.brand.trim(),
        model: form.model.trim() || null,
        category: form.category,
        size: form.size.trim() || null,
        condition: form.condition,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        price: parseFloat(form.price),
        description: form.description.trim() || null,
        seller_email: user!.email!,
        image_url: form.image_url.trim() || null,
        user_id: user!.id,
      };

      if (stravaVerified) {
        insertData.strava_verified_mileage = stravaVerified.mileage;
        insertData.strava_gear_id = stravaVerified.gearId;
      }

      const { error } = await supabase.from('listings').insert(insertData);
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

  const canSubmit = form.title && form.brand && form.category && form.condition && form.price;

  if (loading || !user) return null;

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
                <BrandInput value={form.brand} onChange={(v) => update('brand', v)} placeholder="e.g. Nike" />
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
                <div className="flex gap-2">
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="e.g. 150"
                    value={form.mileage}
                    onChange={(e) => { update('mileage', e.target.value); setStravaVerified(null); }}
                    className="flex-1"
                  />
                  {form.category === 'shoes' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleStravaVerify}
                      disabled={verifying || !form.brand}
                      className="whitespace-nowrap text-xs gap-1"
                    >
                      {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                      Verify Strava
                    </Button>
                  )}
                </div>
                {stravaVerified && (
                  <Badge variant="outline" className="mt-1 text-[10px] border-primary/30 text-primary gap-1">
                    <CheckCircle className="h-2.5 w-2.5" /> Strava verified: {stravaVerified.mileage} mi
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price">Price ($) *</Label>
                <Input id="price" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => update('price', e.target.value)} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Photo</Label>
                <ImageUpload value={form.image_url} onChange={(url) => update('image_url', url)} />
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
