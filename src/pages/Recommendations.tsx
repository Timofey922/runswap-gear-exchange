import { useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useStrava } from '@/hooks/useStrava';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  category: string;
  price: number;
  condition: string;
  image_url?: string | null;
  reason: string;
}

const Recommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, connect, fetchStravaData, disconnect } = useStrava();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const handleGetRecommendations = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isConnected) {
      connect('/recommendations');
      return;
    }

    setLoading(true);
    try {
      // Fetch recent activities
      const activities = await fetchStravaData('athlete/activities', { per_page: '30' });
      
      // Fetch athlete gear
      const athlete = await fetchStravaData('athlete');
      const gearIds = athlete?.shoes?.map((s: any) => s.id) ?? [];
      const gearDetails = await Promise.all(
        gearIds.slice(0, 5).map((id: string) => fetchStravaData(`gear/${id}`).catch(() => null))
      );

      // Call AI recommendations
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          activities: activities?.map((a: any) => ({
            type: a.type,
            distance: a.distance,
            moving_time: a.moving_time,
            average_speed: a.average_speed,
            total_elevation_gain: a.total_elevation_gain,
            sport_type: a.sport_type,
            gear_id: a.gear_id,
          })),
          athlete_gear: gearDetails.filter(Boolean),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRecommendations(data.recommendations ?? []);
      setFetched(true);
      if (!data.recommendations?.length) {
        toast.info('No matching listings found for your running profile');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> AI Gear Recommendations
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your Strava account and get personalized gear recommendations based on your running profile.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 text-center space-y-4">
            {isConnected ? (
              <>
                <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" /> Connected to Strava
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleGetRecommendations} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {loading ? 'Analyzing your runs...' : 'Get Recommendations'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={disconnect}>
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="py-4">
                  <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Strava to analyze your running patterns and find the perfect gear.
                  </p>
                  <Button onClick={() => connect('/recommendations')} className="gap-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="h-4 w-4 invert" />
                    Connect Strava
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {fetched && recommendations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
            {recommendations.map((rec) => (
              <Card key={rec.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/?highlight=${rec.id}`)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {rec.image_url ? (
                      <img src={rec.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">🏃</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-foreground truncate">{rec.title}</h3>
                      <span className="text-sm font-bold text-primary">${rec.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.brand}{rec.model ? ` · ${rec.model}` : ''}</p>
                    <p className="text-xs text-primary mt-1 italic">💡 {rec.reason}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {fetched && recommendations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No matching listings found. Check back when new gear is posted!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Recommendations;
