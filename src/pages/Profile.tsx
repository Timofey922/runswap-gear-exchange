import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { RUNNER_TYPES } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Save, ExternalLink, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStartConversation } from '@/hooks/useChat';

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwn = !userId || userId === user?.id;
  const { data: profile, isLoading } = useProfile(isOwn ? user?.id : userId);
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const startConvo = useStartConversation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    runner_type: '',
    strava_url: '',
    instagram_url: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        runner_type: profile.runner_type || '',
        strava_url: profile.strava_url || '',
        instagram_url: profile.instagram_url || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(form as any);
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  const handleMessage = async () => {
    if (!userId || !user) return;
    try {
      const convo = await startConvo.mutateAsync({ sellerId: userId });
      navigate(`/messages/${convo.id}`);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20 text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  const initials = profile.display_name?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8 space-y-6">
        {/* Avatar & Name */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            {isOwn && (
              <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-90">
                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Display name"
                className="text-xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground">{profile.display_name || 'Anonymous'}</h1>
            )}
            {profile.runner_type && !editing && (
              <Badge variant="secondary" className="mt-1">{profile.runner_type}</Badge>
            )}
          </div>
          {isOwn ? (
            editing ? (
              <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-1.5">
                <Save className="h-4 w-4" /> Save
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
            )
          ) : user && userId !== user.id && (
            <Button onClick={handleMessage} disabled={startConvo.isPending} className="gap-1.5">
              <MessageCircle className="h-4 w-4" /> Message
            </Button>
          )}
        </div>

        {/* Runner Type */}
        {editing && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Runner Type</label>
            <Select value={form.runner_type} onValueChange={(v) => setForm({ ...form, runner_type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your runner type" />
              </SelectTrigger>
              <SelectContent>
                {RUNNER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Bio</label>
          {editing ? (
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell people about your running journey..."
              rows={3}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{profile.bio || 'No bio yet.'}</p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Social Links</label>
          {editing ? (
            <div className="space-y-2">
              <Input
                value={form.strava_url}
                onChange={(e) => setForm({ ...form, strava_url: e.target.value })}
                placeholder="Strava profile URL"
              />
              <Input
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                placeholder="Instagram profile URL"
              />
            </div>
          ) : (
            <div className="flex gap-3">
              {profile.strava_url && (
                <a href={profile.strava_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Strava
                  </Button>
                </a>
              )}
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Instagram
                  </Button>
                </a>
              )}
              {!profile.strava_url && !profile.instagram_url && (
                <p className="text-sm text-muted-foreground">No social links added.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
