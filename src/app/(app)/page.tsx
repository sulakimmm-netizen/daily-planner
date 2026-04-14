import { createClient } from "@/lib/supabase/server";
import { getRoutinesForDay, getTasksForDate, getCompletionsForDate, getAllRoutines } from "@/lib/queries";
import { TaskList } from "@/components/today/task-list";
import { AddTaskForm } from "@/components/today/add-task-form";
import { SwipeNavigator } from "@/components/swipe-navigator";
import { getToday, getDayOfWeek } from "@/lib/utils";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { date: dateParam } = await searchParams;
  const date = dateParam ?? getToday();
  const dayOfWeek = getDayOfWeek(date);

  const [routines, tasks, completions, allRoutines] = await Promise.all([
    getRoutinesForDay(user.id, dayOfWeek, date),
    getTasksForDate(user.id, date),
    getCompletionsForDate(user.id, date),
    getAllRoutines(user.id),
  ]);

  return (
    <SwipeNavigator>
      <TaskList tasks={tasks} routines={routines} completions={completions} date={date} />
      <AddTaskForm date={date} allRoutines={allRoutines} />
    </SwipeNavigator>
  );
}
