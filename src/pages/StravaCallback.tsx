import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStrava } from '@/hooks/useStrava';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeCode } = useStrava();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const returnPath = localStorage.getItem('strava_return_path') || '/recommendations';

    if (error) {
      toast.error('Strava authorization denied');
      navigate(returnPath);
      return;
    }

    if (code) {
      setDone(true);
      exchangeCode(code)
        .then(() => {
          toast.success('Connected to Strava!');
          localStorage.removeItem('strava_return_path');
          navigate(returnPath);
        })
        .catch((e) => {
          toast.error('Failed to connect to Strava');
          navigate(returnPath);
        });
    } else {
      navigate('/');
    }
  }, [searchParams, exchangeCode, navigate, done]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Connecting to Strava...</p>
      </div>
    </div>
  );
};

export default StravaCallback;
