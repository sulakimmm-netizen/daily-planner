"use client";

import { useState } from "react";
import { deleteRoutine } from "@/lib/actions";
import { RoutineForm } from "./routine-form";
import { DAYS_KO, formatTimeBlock } from "@/lib/utils";
import type { DailyRoutine } from "@/lib/types";

function RoutineItem({ routine }: { routine: DailyRoutine }) {
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      {editing && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setEditing(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-lg">
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-4">
              <RoutineForm routine={routine} onClose={() => setEditing(false)} />
            </div>
          </div>
        </>
      )}
      <div className="flex items-center justify-between py-3 min-h-[44px]">
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${routine.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
            {routine.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {[...routine.days_of_week].sort((a, b) => ((a || 7) - (b || 7))).map((day) => (
              <span
                key={day}
                className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
              >
                {DAYS_KO[day]}
              </span>
            ))}
            {routine.time_block_hours != null && (
              <span className="text-xs text-gray-500">
                {formatTimeBlock(routine.time_block_hours)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-gray-400 hover:text-gray-900 px-2 py-1 transition-colors"
          >
            수정
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-sm text-gray-400 hover:text-red-500 px-2 py-1 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[80]"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-8">
            <div className="bg-white rounded-2xl w-full max-w-[280px] overflow-hidden shadow-lg">
              <div className="px-6 pt-6 pb-4 text-center">
                <p className="text-sm text-gray-900">삭제하시겠습니까?</p>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  취소하기
                </button>
                <button
                  onClick={async () => {
                    await deleteRoutine(routine.id);
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 py-3 text-sm text-red-500 font-medium hover:bg-red-50 transition-colors border-l border-gray-100"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function RoutineList({
  routines,
  inModal,
}: {
  routines: DailyRoutine[];
  inModal?: boolean;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      {routines.length === 0 ? (
        <div
          className="flex items-center justify-center"
          style={inModal ? { minHeight: "200px" } : { minHeight: "calc(100vh - 200px)" }}
        >
          <p className="text-sm text-gray-400">등록된 루틴이 없습니다</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {routines.map((routine) => (
            <RoutineItem key={routine.id} routine={routine} />
          ))}
        </div>
      )}

      {/* 하단 버튼 */}
      {!inModal && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setAdding(true)}
              className="w-full h-[48px] text-sm font-medium bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center"
            >
              루틴 추가하기
            </button>
          </div>
        </div>
      )}

      {/* 루틴 추가 모달 */}
      {adding && (
        <>
          <div
            className={`fixed inset-0 bg-black/30 ${inModal ? "z-[60]" : "z-40"}`}
            onClick={() => setAdding(false)}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 ${inModal ? "z-[70]" : "z-50"} bg-white rounded-t-2xl shadow-lg`}
          >
            <div className="max-w-2xl mx-auto px-4 pt-4 pb-4">
              <RoutineForm onClose={() => setAdding(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
