import { createClient } from "@/lib/supabase/server";
import type { DailyRoutine, DailyTask, RoutineCompletion } from "@/lib/types";

// === Routine Queries ===

export async function getRoutines(userId: string): Promise<DailyRoutine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_routines")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("order", { ascending: true });
  return (data as DailyRoutine[]) ?? [];
}

export async function getAllRoutines(userId: string): Promise<DailyRoutine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_routines")
    .select("*")
    .eq("user_id", userId)
    .order("order", { ascending: true });
  return (data as DailyRoutine[]) ?? [];
}

export async function getRoutinesForDay(
  userId: string,
  dayOfWeek: number,
  date: string
): Promise<DailyRoutine[]> {
  const supabase = await createClient();
  // date is YYYY-MM-DD in KST; include routines created on or before that date (end of day KST)
  const endOfDayKST = `${date}T23:59:59.999+09:00`;
  const { data } = await supabase
    .from("daily_routines")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .contains("days_of_week", [dayOfWeek])
    .lte("created_at", endOfDayKST)
    .order("order", { ascending: true });
  return (data as DailyRoutine[]) ?? [];
}

// === Task Queries ===

export async function getTasksForDate(
  userId: string,
  date: string
): Promise<DailyTask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("is_completed", { ascending: true })
    .order("order", { ascending: true });
  return (data as DailyTask[]) ?? [];
}

export async function getTasksForWeek(
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<DailyTask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true })
    .order("order", { ascending: true });
  return (data as DailyTask[]) ?? [];
}

// === Completion Queries ===

export async function getCompletionsForDate(
  userId: string,
  date: string
): Promise<RoutineCompletion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routine_completions")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date);
  return (data as RoutineCompletion[]) ?? [];
}

export async function getCompletionsForWeek(
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<RoutineCompletion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routine_completions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd);
  return (data as RoutineCompletion[]) ?? [];
}
