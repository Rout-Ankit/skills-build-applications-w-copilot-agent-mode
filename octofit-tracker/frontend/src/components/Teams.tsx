import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = { _id?: string; name: string; mascot: string; members: unknown[] };
const loadTeams = async () => (await getJson<{ teams: TeamItem[] }>('/api/teams')).teams;

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      loadItems={loadTeams}
      getKey={(team, index) => team._id ?? `${team.name}-${index}`}
      renderItem={(team) => <>{team.name} · Mascot: {team.mascot} · {team.members.length} members</>}
    />
  );
}
