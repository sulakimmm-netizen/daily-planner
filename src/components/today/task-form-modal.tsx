"use client";

import { useRef, useState, useEffect } from "react";
import { createTask, updateTask, editRoutineForDate } from "@/lib/actions";
import { TimeSelect } from "@/components/ui/time-select";
import type { DailyTask } from "@/lib/types";

const TIME_OPTIONS = [
  { label: "없음", value: "" },
  { label: "30분", value: "0.5" },
  { label: "1시간", value: "1" },
  { label: "1.5시간", value: "1.5" },
  { label: "2시간", value: "2" },
  { label: "3시간", value: "3" },
  { label: "4시간", value: "4" },
  { label: "직접입력", value: "custom" },
];

type TimeMode = "block" | "range";

export function TaskFormModal({
  date,
  task,
  routineId,
  initialTitle,
  initialTimeBlockHours,
  onClose,
}: {
  date: string;
  task?: DailyTask;
  routineId?: string;
  initialTitle?: string;
  initialTimeBlockHours?: number | null;
  onClose: (saved?: boolean) => void;
}) {
  const isEdit = !!task;

  const effectiveTitle = task?.title ?? initialTitle ?? "";
  const effectiveTimeBlock = task?.time_block_hours ?? initialTimeBlockHours ?? null;

  const initialTimeMode: TimeMode =
    task?.start_time && task?.end_time ? "range" : "block";
  const isCustomInitial =
    effectiveTimeBlock != null &&
    !["0.5", "1", "1.5", "2", "3", "4"].includes(
      String(effectiveTimeBlock)
    );

  const [timeMode, setTimeMode] = useState<TimeMode>(initialTimeMode);
  const [selectedTime, setSelectedTime] = useState(
    isCustomInitial
      ? "custom"
      : effectiveTimeBlock != null
        ? String(effectiveTimeBlock)
        : ""
  );
  const [customTime, setCustomTime] = useState(
    isCustomInitial ? String(effectiveTimeBlock) : ""
  );
  const [startTime, setStartTime] = useState(task?.start_time ?? "");
  const [endTime, setEndTime] = useState(task?.end_time ?? "");
  const [title, setTitle] = useState(effectiveTitle);
  const [showToast, setShowToast] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  function resetForm() {
    setTitle("");
    setSelectedTime("");
    setCustomTime("");
    setStartTime("");
    setEndTime("");
    setTimeMode("block");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("date", date);

    if (timeMode === "block") {
      if (selectedTime === "custom" && customTime) {
        fd.set("time_block_hours", customTime);
      } else if (selectedTime && selectedTime !== "custom") {
        fd.set("time_block_hours", selectedTime);
      }
    }
    if (timeMode === "range" && startTime && endTime) {
      fd.set("start_time", startTime);
      fd.set("end_time", endTime);
    }

    if (isEdit && task) {
      await updateTask(task.id, fd);
      onClose(true);
    } else if (routineId) {
      await editRoutineForDate(routineId, date, fd);
      onClose(true);
    } else {
      await createTask(fd);
      setShowToast(true);
      setTimeout(() => onClose(), 1000);
    }
  }

  if (showToast) {
    return (
      <div className="fixed left-0 right-0 bottom-[96px] z-[100] flex justify-center pointer-events-none">
        <div className="bg-gray-900/80 text-white text-sm font-medium px-6 py-3 rounded-full">
          할 일이 추가됐어요
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => onClose()} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 모드 토글 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setTimeMode("block")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeMode === "block"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                소요 시간
              </button>
              <button
                type="button"
                onClick={() => setTimeMode("range")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeMode === "range"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                시간 지정
              </button>
            </div>

            {/* 시간 선택 영역 */}
            <div className="h-[132px] flex items-center">
              {timeMode === "block" ? (
                <div className="flex gap-1.5 flex-wrap justify-center w-full">
                  {TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedTime(opt.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTime === opt.value
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {selectedTime === "custom" && (
                    <div className="w-full flex justify-center mt-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          placeholder="0.0"
                          className="w-[60px] h-[36px] px-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                        <span className="text-sm text-gray-600">시간</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center w-full">
                  <TimeSelect
                    value={startTime}
                    onChange={setStartTime}
                    placeholder="시작"
                  />
                  <span className="text-gray-400 text-sm">~</span>
                  <TimeSelect
                    value={endTime}
                    onChange={setEndTime}
                    placeholder="종료"
                    scrollTo={startTime}
                  />
                </div>
              )}
            </div>

            {/* 제목 입력 */}
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              required
              className="w-full h-[48px] px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
            />

            {/* 하단 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onClose()}
                className="w-[112px] h-[48px] text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 h-[48px] text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {isEdit ? "수정하기" : "추가하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
