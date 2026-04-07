export const RUNNER_TYPES = [
  'Beginner',
  'Casual Runner',
  'Recreational Runner',
  'Competitive Runner',
  'Marathon Runner',
  'Ultra Runner',
  'Trail Runner',
  'Sprinter',
  'Track & Field',
  'Cross Country',
  'Triathlete',
] as const;

export type RunnerType = typeof RUNNER_TYPES[number];

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  runner_type: string;
  strava_url: string;
  instagram_url: string;
  created_at: string;
  updated_at: string;
}
