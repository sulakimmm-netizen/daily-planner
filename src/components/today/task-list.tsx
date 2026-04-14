"use client";

import { useState, useRef, useCallback } from "react";
import {
  toggleTaskCompletion,
  toggleRoutineCompletion,
  deleteTask,
  skipRoutineForDate,
  reorderTasks,
} from "@/lib/actions";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import { TimeBlockBadge } from "@/components/ui/time-block-badge";
import { Toast } from "@/components/ui/toast";
import { TaskFormModal } from "./task-form-modal";
import type { DailyTask, DailyRoutine, RoutineCompletion } from "@/lib/types";

function TaskItem({
  task,
  onDragStart,
  isDragging,
  onEdit,
  onDelete,
}: {
  task: DailyTask;
  onDragStart: () => void;
  isDragging: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const { checked, toggle } = useOptimisticToggle(
    task.is_completed,
    async (current) => {
      await toggleTaskCompletion(task.id, current);
    }
  );

  function handleDelete() {
    deleteTask(task.id);
    onDelete();
  }

  function handleTouchStart(e: React.TouchEvent) {
    e.stopPropagation();
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isLongPress.current = false;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onDragStart();
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    // Cancel long press if moved
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (isLongPress.current) {
      // Drag mode - let parent handle via bubbling
      return;
    }

    // Swipe detection (only left swipe)
    if (Math.abs(dx) > Math.abs(dy) && dx < -10) {
      e.stopPropagation();
      setSwiping(true);
      setSwipeX(Math.max(dx, -160));
    }
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }

    if (swiping) {
      if (swipeX < -60) {
        setSwipeX(-140);
      } else {
        setSwipeX(0);
      }
      setSwiping(false);
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-200 ${
        isDragging ? "opacity-50 scale-[1.03] shadow-lg z-10" : ""
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 스와이프 뒤 버튼 (수정 + 삭제) */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={() => {
            setSwipeX(0);
            onEdit();
          }}
          className="h-full w-[70px] bg-gray-500 text-white text-sm font-medium"
        >
          수정
        </button>
        <button
          onClick={handleDelete}
          className="h-full w-[70px] bg-red-500 text-white text-sm font-medium"
        >
          삭제
        </button>
      </div>

      {/* 카드 내용 */}
      <div
        className="relative flex items-start px-4 py-4 min-h-[44px] bg-gray-100 rounded-lg transition-transform"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease-out",
        }}
        onClick={() => {
          if (swipeX !== 0) {
            setSwipeX(0);
          }
        }}
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className={checked ? "opacity-15" : ""}>
            {task.start_time && task.end_time ? (
              <span className="inline-flex items-center justify-center px-2 h-[24px] rounded-md text-xs font-medium bg-gray-900 text-white shrink-0 whitespace-nowrap">
                {task.start_time} ~ {task.end_time}
              </span>
            ) : (
              <TimeBlockBadge hours={task.time_block_hours} />
            )}
          </div>
          <span
            className={`text-sm transition-colors ${
              checked ? "text-black opacity-20" : "text-black"
            }`}
          >
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0 mt-px">
          {checked && (
            <span className="text-sm font-bold text-gray-900">완료</span>
          )}
          <input
            type="checkbox"
            checked={checked}
            onChange={toggle}
            className="w-6 h-6 rounded-full border-2 border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer shrink-0"
          />
        </div>
      </div>
    </div>
  );
}

function RoutineItem({
  routine,
  date,
  isCompleted,
  onEdit,
  onDelete,
}: {
  routine: DailyRoutine;
  date: string;
  isCompleted: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const { checked, toggle } = useOptimisticToggle(isCompleted, async (current) => {
    await toggleRoutineCompletion(routine.id, date, current);
  });

  function handleDelete() {
    skipRoutineForDate(routine.id, date);
    onDelete();
  }

  function handleTouchStart(e: React.TouchEvent) {
    e.stopPropagation();
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    if (Math.abs(dx) > Math.abs(dy) && dx < -10) {
      e.stopPropagation();
      setSwiping(true);
      setSwipeX(Math.max(dx, -160));
    }
  }

  function handleTouchEnd() {
    if (swiping) {
      if (swipeX < -60) {
        setSwipeX(-140);
      } else {
        setSwipeX(0);
      }
      setSwiping(false);
    }
  }

  return (
    <div
      data-swipeable
      className="relative overflow-hidden rounded-lg"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 스와이프 뒤 버튼 (수정 + 삭제) */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={() => {
            setSwipeX(0);
            onEdit();
          }}
          className="h-full w-[70px] bg-gray-500 text-white text-sm font-medium"
        >
          수정
        </button>
        <button
          onClick={handleDelete}
          className="h-full w-[70px] bg-red-500 text-white text-sm font-medium"
        >
          삭제
        </button>
      </div>

      {/* 카드 내용 */}
      <div
        className={`relative flex ${routine.time_block_hours != null ? "items-start" : "items-center"} px-4 py-4 min-h-[44px] bg-gray-100 rounded-lg transition-transform`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease-out",
        }}
        onClick={() => {
          if (swipeX !== 0) {
            setSwipeX(0);
          }
        }}
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {routine.time_block_hours != null && (
            <div className={checked ? "opacity-15" : ""}>
              <TimeBlockBadge hours={routine.time_block_hours} />
            </div>
          )}
          <span
            className={`text-sm transition-colors ${
              checked ? "text-black opacity-20" : "text-black"
            }`}
          >
            {routine.title}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          {checked && (
            <span className="text-sm font-bold text-gray-900">완료</span>
          )}
          <input
            type="checkbox"
            checked={checked}
            onChange={toggle}
            className="w-6 h-6 rounded-full border-2 border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer shrink-0"
          />
        </div>
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  routines = [],
  completions = [],
  date = "",
}: {
  tasks: DailyTask[];
  routines?: DailyRoutine[];
  completions?: RoutineCompletion[];
  date?: string;
}) {
  const [items, setItems] = useState(tasks);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editingRoutineForDate, setEditingRoutineForDate] = useState<DailyRoutine | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToastMessage(msg), []);

  // Sync with server data
  const prevTasksRef = useRef(tasks);
  if (prevTasksRef.current !== tasks) {
    prevTasksRef.current = tasks;
    setItems(tasks);
  }

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  function handleListTouchMove(e: React.TouchEvent) {
    if (dragIndex === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const wrapper = el?.closest("[data-task-index]");
    if (wrapper) {
      const overIndex = Number(wrapper.getAttribute("data-task-index"));
      if (overIndex !== dragIndex && !isNaN(overIndex)) {
        setItems((prev) => {
          const next = [...prev];
          const [moved] = next.splice(dragIndex, 1);
          next.splice(overIndex, 0, moved);
          return next;
        });
        setDragIndex(overIndex);
      }
    }
  }

  function handleListTouchEnd() {
    if (dragIndex !== null) {
      const orderedIds = items.map((t) => t.id);
      setDragIndex(null);
      reorderTasks(orderedIds);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">할 일</h2>
      </div>
      {routines.length === 0 && items.length === 0 ? (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 350px)" }}
        >
          <p className="text-sm text-gray-400">할 일이 없습니다</p>
        </div>
      ) : (() => {
        const completionMap = new Map(
          completions.map((c) => [c.routine_id, c])
        );

        const uncompleted: React.ReactNode[] = [];
        const completed: React.ReactNode[] = [];

        routines.forEach((routine) => {
          const completion = completionMap.get(routine.id);
          if (completion?.is_skipped) return;
          const isCompleted = completion?.is_completed ?? false;
          const node = (
            <RoutineItem
              key={`routine-${routine.id}`}
              routine={routine}
              date={date}
              isCompleted={isCompleted}
              onEdit={() => setEditingRoutineForDate(routine)}
              onDelete={() => showToast("할 일이 삭제됐어요")}
            />
          );
          if (isCompleted) completed.push(node);
          else uncompleted.push(node);
        });

        items.forEach((task, index) => {
          const node = (
            <div key={task.id} data-task-index={index}>
              <TaskItem
                task={task}
                onDragStart={() => handleDragStart(index)}
                isDragging={dragIndex === index}
                onEdit={() => setEditingTask(task)}
                onDelete={() => showToast("할 일이 삭제됐어요")}
              />
            </div>
          );
          if (task.is_completed) completed.push(node);
          else uncompleted.push(node);
        });

        return (
          <div
            className="flex flex-col gap-2"
            style={{ touchAction: dragIndex !== null ? "none" : "auto" }}
            onTouchMove={handleListTouchMove}
            onTouchEnd={handleListTouchEnd}
          >
            {uncompleted}
            {completed}
          </div>
        );
      })()}

      {/* 할일 수정 모달 */}
      {editingTask && (
        <TaskFormModal
          date={date}
          task={editingTask}
          onClose={(saved) => {
            setEditingTask(null);
            if (saved) showToast("할 일이 수정됐어요");
          }}
        />
      )}

      {/* 루틴 개별 날짜 수정 모달 (루틴 skip + 할일로 변환) */}
      {editingRoutineForDate && (
        <TaskFormModal
          date={date}
          routineId={editingRoutineForDate.id}
          initialTitle={editingRoutineForDate.title}
          initialTimeBlockHours={editingRoutineForDate.time_block_hours}
          onClose={(saved) => {
            setEditingRoutineForDate(null);
            if (saved) showToast("할 일이 수정됐어요");
          }}
        />
      )}

      {/* 토스트 */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </section>
  );
}
