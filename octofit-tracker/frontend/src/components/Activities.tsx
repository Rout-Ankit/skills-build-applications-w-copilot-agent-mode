import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = { _id?: string; type: string; minutes: number; points: number };
const loadActivities = async () => (await getJson<{ activities: ActivityItem[] }>('/api/activities')).activities;

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      emptyMessage="No activities yet."
      loadItems={loadActivities}
      getKey={(activity, index) => activity._id ?? `${activity.type}-${index}`}
      renderItem={(activity) => <>{activity.type} · {activity.minutes} minutes · {activity.points} points</>}
    />
  );
}
