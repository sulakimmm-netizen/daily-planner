"use client";

import { toggleRoutineCompletion, toggleTaskCompletion } from "@/lib/actions";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import { TimeBlockBadge } from "@/components/ui/time-block-badge";
import { DAYS_KO, formatDateShort } from "@/lib/utils";
import type { DailyRoutine, DailyTask, RoutineCompletion } from "@/lib/types";

function MiniCheckbox({
  checked: initialChecked,
  onToggle,
  label,
  timeBlock,
}: {
  checked: boolean;
  onToggle: (current: boolean) => Promise<void>;
  label: string;
  timeBlock?: number | null;
}) {
  const { checked, toggle } = useOptimisticToggle(initialChecked, onToggle);

  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer min-h-[32px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        className="w-4 h-4 rounded-full border-2 border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer shrink-0"
      />
      <span
        className={`text-sm ${
          checked ? "line-through text-gray-400" : "text-gray-700"
        }`}
      >
        {label}
      </span>
      {timeBlock && (
        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
          {timeBlock}h
        </span>
      )}
    </label>
  );
}

export function DayColumn({
  dateStr,
  dayOfWeek,
  isToday,
  routines,
  tasks,
  completions,
}: {
  dateStr: string;
  dayOfWeek: number;
  isToday: boolean;
  routines: DailyRoutine[];
  tasks: DailyTask[];
  completions: RoutineCompletion[];
}) {
  const completionMap = new Map(
    completions.map((c) => [c.routine_id, c.is_completed])
  );

  const dayRoutines = routines.filter((r) => {
    if (!r.days_of_week.includes(dayOfWeek)) return false;
    // Only show routines created on or before this date (KST)
    const createdDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
    }).format(new Date(r.created_at));
    return createdDate <= dateStr;
  });

  return (
    <div
      className={`p-3 rounded-lg ${
        isToday ? "bg-gray-50 ring-1 ring-gray-200" : "border border-gray-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-sm font-semibold ${isToday ? "text-gray-900" : "text-gray-700"}`}>
          {formatDateShort(dateStr)}
        </span>
        <span className={`text-xs font-medium ${isToday ? "text-gray-900" : "text-gray-500"}`}>
          {DAYS_KO[dayOfWeek]}
        </span>
        {isToday && <span className="text-xs text-pink-500 font-medium">오늘</span>}
      </div>

      {dayRoutines.length > 0 && (
        <div className="mb-2">
          {dayRoutines.map((routine) => (
            <MiniCheckbox
              key={routine.id}
              checked={completionMap.get(routine.id) ?? false}
              onToggle={async (current) => {
                await toggleRoutineCompletion(routine.id, dateStr, current);
              }}
              label={routine.title}
            />
          ))}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="border-t border-gray-100 pt-1">
          {tasks.map((task) => (
            <MiniCheckbox
              key={task.id}
              checked={task.is_completed}
              onToggle={async (current) => {
                await toggleTaskCompletion(task.id, current);
              }}
              label={task.title}
              timeBlock={task.time_block_hours}
            />
          ))}
        </div>
      )}

      {dayRoutines.length === 0 && tasks.length === 0 && (
        <p className="text-[10px] text-gray-300 text-center py-2">—</p>
      )}
    </div>
  );
}
