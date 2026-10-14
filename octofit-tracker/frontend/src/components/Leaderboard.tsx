import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
const loadLeaderboard = async () => (await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')).leaderboard;

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      emptyMessage="No leaderboard rankings yet."
      loadItems={loadLeaderboard}
      getKey={(entry) => entry.teamName}
      renderItem={(entry) => <>#{entry.rank} · {entry.teamName} · {entry.totalPoints} points</>}
    />
  );
}
