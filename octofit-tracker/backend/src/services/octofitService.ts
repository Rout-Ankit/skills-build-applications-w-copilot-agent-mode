import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type JsonObject = Record<string, unknown>;

function asObject(input: unknown): JsonObject {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
    ? input as JsonObject
    : {};
}

function clientError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function validObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const { userId, teamId, type, minutes } = asObject(input);
  if (!validObjectId(userId) || !validObjectId(teamId)) {
    throw clientError('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw clientError('Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw clientError('Activity minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) {
    throw clientError('The specified user or team does not exist', 404);
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const { name, mascot, members = [] } = asObject(input);
  if (typeof name !== 'string' || !name.trim()) {
    throw clientError('Team name is required');
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw clientError('Team mascot is required');
  }
  if (!Array.isArray(members) || !members.every(validObjectId)) {
    throw clientError('Team members must be valid user IDs');
  }

  if (members.length > 0) {
    const foundMembers = await User.countDocuments({ _id: { $in: members } });
    if (foundMembers !== members.length) {
      throw clientError('One or more team members do not exist', 404);
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw clientError('User not found', 404);
  }

  const [workouts, recentActivity] = await Promise.all([
    Workout.find().lean(),
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const activityType = recentActivity?.type.trim().toLowerCase();
  const activityFocus = activityType === 'run' || activityType === 'running'
    ? 'endurance'
    : activityType === 'cycle' || activityType === 'cycling'
      ? 'cardio'
      : activityType;
  const goalMatches = workouts.filter((workout) => workout.focus.trim().toLowerCase() === goal);
  const activityMatches = workouts.filter((workout) => {
    const focus = workout.focus.trim().toLowerCase();
    return focus === activityType || focus === activityFocus;
  });
  const orderedWorkouts = goalMatches.length > 0
    ? [...goalMatches, ...workouts.filter((workout) => !goalMatches.includes(workout))]
    : activityMatches.length > 0
      ? [...activityMatches, ...workouts.filter((workout) => !activityMatches.includes(workout))]
      : workouts;

  return orderedWorkouts.map((workout) => ({
    ...workout,
    reason: workout.focus.trim().toLowerCase() === goal
      ? `Recommended because it supports your ${user.fitnessGoal} fitness goal.`
      : activityType && (workout.focus.trim().toLowerCase() === activityType || workout.focus.trim().toLowerCase() === activityFocus)
        ? `Recommended based on your recent ${recentActivity?.type} activity.`
        : `Recommended to help you explore ${workout.focus}.`,
  }));
}

export { User };
