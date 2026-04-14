"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// === Auth Helper — returns both client & userId to avoid double createClient() ===

async function getAuthClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

// === Routine Actions ===

export async function createRoutine(formData: FormData) {
  const { supabase, userId } = await getAuthClient();
  const title = formData.get("title") as string;
  const daysStr = formData.get("days_of_week") as string;
  const days = daysStr ? JSON.parse(daysStr) as number[] : [];
  const timeBlockStr = formData.get("time_block_hours") as string;
  const timeBlockHours = timeBlockStr ? parseFloat(timeBlockStr) : null;

  if (!title?.trim()) return;

  await supabase.from("daily_routines").insert({
    user_id: userId,
    title: title.trim(),
    days_of_week: days,
    time_block_hours: timeBlockHours,
  });

  revalidatePath("/routines");
  revalidatePath("/");
}

export async function updateRoutine(id: string, formData: FormData) {
  const { supabase, userId } = await getAuthClient();
  const title = formData.get("title") as string;
  const daysStr = formData.get("days_of_week") as string;
  const days = daysStr ? JSON.parse(daysStr) as number[] : [];
  const timeBlockStr = formData.get("time_block_hours") as string;
  const timeBlockHours = timeBlockStr ? parseFloat(timeBlockStr) : null;

  const { error } = await supabase
    .from("daily_routines")
    .update({ title: title.trim(), days_of_week: days, time_block_hours: timeBlockHours })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("updateRoutine error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/routines");
  revalidatePath("/");
}

export async function deleteRoutine(id: string) {
  const { supabase, userId } = await getAuthClient();
  await supabase
    .from("daily_routines")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/routines");
  revalidatePath("/");
}

// === Task Actions ===

export async function createTask(formData: FormData) {
  const { supabase, userId } = await getAuthClient();
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const timeBlockStr = formData.get("time_block_hours") as string;
  const timeBlockHours = timeBlockStr ? parseFloat(timeBlockStr) : null;
  const startTime = (formData.get("start_time") as string) || null;
  const endTime = (formData.get("end_time") as string) || null;

  if (!title?.trim() || !date) return;

  await supabase.from("daily_tasks").insert({
    user_id: userId,
    title: title.trim(),
    date,
    time_block_hours: timeBlockHours,
    start_time: startTime,
    end_time: endTime,
  });

  revalidatePath("/");
}

export async function updateTask(id: string, formData: FormData) {
  const { supabase, userId } = await getAuthClient();
  const title = formData.get("title") as string;
  const timeBlockStr = formData.get("time_block_hours") as string;
  const timeBlockHours = timeBlockStr ? parseFloat(timeBlockStr) : null;
  const startTime = (formData.get("start_time") as string) || null;
  const endTime = (formData.get("end_time") as string) || null;

  await supabase
    .from("daily_tasks")
    .update({
      title: title.trim(),
      time_block_hours: timeBlockHours,
      start_time: startTime,
      end_time: endTime,
    })
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/");
}

export async function deleteTask(id: string) {
  const { supabase, userId } = await getAuthClient();
  await supabase
    .from("daily_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  revalidatePath("/");
}

export async function reorderTasks(orderedIds: string[]) {
  const { supabase, userId } = await getAuthClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("daily_tasks")
      .update({ order: index })
      .eq("id", id)
      .eq("user_id", userId)
  );
  await Promise.all(updates);

  revalidatePath("/");
}

// === Routine Skip (개별 날짜에서 루틴 건너뛰기) ===

export async function skipRoutineForDate(routineId: string, date: string) {
  const { supabase, userId } = await getAuthClient();

  await supabase.from("routine_completions").upsert(
    {
      routine_id: routineId,
      user_id: userId,
      date,
      is_completed: false,
      is_skipped: true,
    },
    { onConflict: "routine_id,date" }
  );

  revalidatePath("/");
}

// === Routine → Task conversion (개별 날짜에서 루틴 수정 시) ===

export async function editRoutineForDate(
  routineId: string,
  date: string,
  formData: FormData
) {
  const { supabase, userId } = await getAuthClient();

  // 1) 해당 날짜의 루틴을 skip 처리
  await supabase.from("routine_completions").upsert(
    {
      routine_id: routineId,
      user_id: userId,
      date,
      is_completed: false,
      is_skipped: true,
    },
    { onConflict: "routine_id,date" }
  );

  // 2) 수정된 내용을 일반 할일로 생성
  const title = formData.get("title") as string;
  const timeBlockStr = formData.get("time_block_hours") as string;
  const timeBlockHours = timeBlockStr ? parseFloat(timeBlockStr) : null;
  const startTime = (formData.get("start_time") as string) || null;
  const endTime = (formData.get("end_time") as string) || null;

  await supabase.from("daily_tasks").insert({
    user_id: userId,
    title: title.trim(),
    date,
    time_block_hours: timeBlockHours,
    start_time: startTime,
    end_time: endTime,
  });

  revalidatePath("/");
}

// === Completion Actions ===

export async function toggleRoutineCompletion(
  routineId: string,
  date: string,
  currentState: boolean
) {
  const { supabase, userId } = await getAuthClient();

  if (currentState) {
    await supabase
      .from("routine_completions")
      .delete()
      .eq("routine_id", routineId)
      .eq("date", date)
      .eq("user_id", userId);
  } else {
    await supabase.from("routine_completions").upsert(
      {
        routine_id: routineId,
        user_id: userId,
        date,
        is_completed: true,
      },
      { onConflict: "routine_id,date" }
    );
  }

  revalidatePath("/");
}

export async function toggleTaskCompletion(
  taskId: string,
  currentState: boolean
) {
  const { supabase, userId } = await getAuthClient();

  await supabase
    .from("daily_tasks")
    .update({ is_completed: !currentState })
    .eq("id", taskId)
    .eq("user_id", userId);

  revalidatePath("/");
}
