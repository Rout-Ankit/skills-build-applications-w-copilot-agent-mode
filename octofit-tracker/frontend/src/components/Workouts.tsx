import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
const userEmail = 'mona@example.com';
const loadSuggestions = async () => (
  await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
).suggestions;

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions yet."
      loadItems={loadSuggestions}
      getKey={(workout, index) => `${workout.title}-${index}`}
      renderItem={(workout) => (
        <>
          <strong>{workout.title}</strong> · {workout.focus} · {workout.minutes} minutes · {workout.difficulty}
          <p className="mb-0">{workout.reason}</p>
        </>
      )}
    />
  );
}
