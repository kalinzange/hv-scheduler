import React, { memo } from "react";
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import type { Employee, OverrideType, Language, Translations } from "../types";

interface CalendarDay {
  date: number;
  fullDate: string;
  weekDay: string;
  isWeekend: boolean;
  isPtHoliday: boolean;
  shifts: Record<number, OverrideType>;
  missing: Record<string, Language[]>;
  lowStaff: Record<string, boolean>;
  counts: Record<string, number>;
  pendingReqs: Record<number, boolean>;
  pendingReqShifts?: Record<number, OverrideType | undefined>;
}

interface CalendarGridProps {
  calendarData: CalendarDay[];
  filteredTeam: Employee[];
  selectedDates: string[];
  focusedDate: string | null;
  focusedEmployeeId: number | null;
  legends: Record<string, string>;
  colors: Record<string, string>;
  canWrite: boolean;
  isManager: boolean;
  currentUserRole: string;
  loggedInUserId: number;
  t: Translations;
  ALL_LANGUAGES: Language[];
  hoursConfig: Record<string, number>;
  onCellClick: (
    e: React.MouseEvent,
    empId: number,
    dateStr: string,
    empName: string,
  ) => void;
  onEmployeeFocus: (empId: number | null) => void;
  onBulkAction: (empId: string) => void;
  pendingSelections?: Record<string, OverrideType | undefined>;
  getShiftStyle: (shift: OverrideType | string) => Record<string, string>;
  checkRestViolation: (prev: string, curr: string) => boolean;
  checkShiftOverflow: (shifts: any[], index: number) => any;
}

const CalendarGrid = memo(
  ({
    calendarData,
    filteredTeam,
    selectedDates,
    focusedDate,
    focusedEmployeeId,
    legends,
    colors,
    canWrite,
    isManager,
    currentUserRole,
    loggedInUserId,
    t,
    ALL_LANGUAGES,
    hoursConfig,
    onCellClick,
    onEmployeeFocus,
    onBulkAction,
    getShiftStyle,
    checkRestViolation,
    checkShiftOverflow,
  }: CalendarGridProps) => {
    // Pre-compute weeks with shifts to avoid recalculation
    const weeksWithShifts = new Set<number>();
    calendarData.forEach((day, idx) => {
      const weekStart = idx - (idx % 7);
      if (
        filteredTeam.some((emp) => {
          const shift = day.shifts[emp.id];
          return ["M", "T", "N"].includes(shift);
        })
      ) {
        weeksWithShifts.add(weekStart);
      }
    });

    return (
      <table className="w-full h-full border-collapse text-base sm:text-sm print:text-[8px]">
        <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm print:static">
          <tr>
            <th className="p-1 md:p-1.5 text-left border-b border-r min-w-[140px] md:min-w-[200px] bg-gray-100 sticky left-0 z-20 shadow-sm print:static print:bg-white print:border-black">
              <div className="flex items-center gap-1 md:gap-2">
                {t.colaborador}
              </div>
            </th>
            {calendarData.map((day, dIdx) => {
              const isSelected = selectedDates.includes(day.fullDate);
              const isFocused = focusedDate === day.fullDate;
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(
                today.getMonth() + 1,
              ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              const isToday = day.fullDate === todayStr;
              const weekStart = dIdx - (dIdx % 7);
              const isWeekWithShift = weeksWithShifts.has(weekStart);

              return (
                <th
                  key={day.fullDate}
                  className={`p-1 md:p-1.5 border-b min-w-[40px] md:min-w-[48px] text-center relative cursor-pointer transition-all ${
                    !isWeekWithShift ? "no-shift-week" : ""
                  } ${
                    isToday
                      ? "bg-green-200 ring-2 md:ring-4 ring-green-500 ring-inset font-bold z-10 print:bg-green-200"
                      : isSelected
                        ? "bg-blue-200 border-l-2 md:border-l-4 border-r-2 md:border-r-4 border-t-2 md:border-t-4 border-blue-500 z-10"
                        : isFocused
                          ? "bg-yellow-100 border-l-2 md:border-l-4 border-r-2 md:border-r-4 border-t-2 md:border-t-4 border-yellow-500 z-10"
                          : day.isWeekend
                            ? "bg-indigo-50 print:bg-gray-100 border-r"
                            : "border-r"
                  } ${
                    day.isPtHoliday && !isFocused && !isSelected && !isToday
                      ? "bg-red-50 print:bg-gray-200"
                      : ""
                  } print:border-black hover:bg-gray-200`}
                >
                  <div className="text-xs md:text-xs font-bold text-gray-700 print:text-black">
                    {day.date}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500 uppercase print:text-black">
                    {day.weekDay}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredTeam.map((emp) => {
            let prevShift: string | null = null;
            const isDimmed =
              currentUserRole === "editor" && loggedInUserId !== emp.id;
            const isFocusedRow = focusedEmployeeId === emp.id;
            const empShifts = calendarData.map((day) => day.shifts[emp.id]);

            return (
              <tr
                key={emp.id}
                className={`transition-colors print:break-inside-avoid ${
                  isDimmed ? "opacity-50 grayscale" : "hover:bg-gray-50"
                }`}
              >
                <td
                  onClick={() => onEmployeeFocus(isFocusedRow ? null : emp.id)}
                  className={`p-1 md:p-1.5 border-b bg-white sticky left-0 z-10 shadow-sm print:static print:border-black print:shadow-none group cursor-pointer ${
                    isFocusedRow
                      ? "border-l-2 md:border-l-4 border-t-2 md:border-t-4 border-b-2 md:border-b-4 border-yellow-500 bg-yellow-50"
                      : "border-r"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-xs md:text-xs text-gray-800 print:text-black">
                      {emp.name}
                    </div>
                    {isManager && (
                      <button
                        onClick={() => onBulkAction(String(emp.id))}
                        className="opacity-0 group-hover:opacity-100 p-0.5 md:p-1 hover:bg-gray-100 rounded text-gray-500 print:hidden transition-opacity"
                      >
                        <MoreHorizontal size={12} className="md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 flex flex-wrap gap-1 print:hidden">
                    {emp.role}{" "}
                    <span className="text-indigo-600 font-mono">
                      [{emp.languages.join(" ")}]
                    </span>
                  </div>
                </td>
                {calendarData.map((day, dIdx) => {
                  const shift = day.shifts[emp.id];
                  const weekStart = dIdx - (dIdx % 7);
                  const isWeekWithShift = weeksWithShifts.has(weekStart);
                  const isFocused = focusedDate === day.fullDate;
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(
                    today.getMonth() + 1,
                  ).padStart(2, "0")}-${String(today.getDate()).padStart(
                    2,
                    "0",
                  )}`;
                  const isToday = day.fullDate === todayStr;
                  const isLastCell = dIdx === calendarData.length - 1;
                  const isRestViolation =
                    dIdx > 0 &&
                    checkRestViolation(prevShift as string, shift as string);
                  const shiftOverflowInfo = checkShiftOverflow(empShifts, dIdx);
                  const isPending = day.pendingReqs[emp.id];
                  const pendingRequestedShift = day.pendingReqShifts?.[emp.id];
                  const previewShift =
                    pendingRequestedShift === undefined
                      ? "F"
                      : pendingRequestedShift;
                  const cellKey = `${emp.id}_${day.fullDate}`;
                  const hasPendingSelection =
                    Object.prototype.hasOwnProperty.call(
                      pendingSelections || {},
                      cellKey,
                    );
                  const pendingSelectionValue = pendingSelections?.[cellKey];
                  const showManagerPreview = isManager && isPending;
                  const showEditorRequestPreview =
                    currentUserRole === "editor" &&
                    emp.id === loggedInUserId &&
                    isPending;
                  const displayShift =
                    showManagerPreview || showEditorRequestPreview
                      ? previewShift
                      : hasPendingSelection && pendingSelectionValue !== undefined
                      ? pendingSelectionValue
                      : shift;
                  const pendingIconClass =
                    displayShift === "N" ? "text-white" : "text-gray-700";
                  const showEditorPendingIcon =
                    currentUserRole === "editor" &&
                    emp.id === loggedInUserId &&
                    hasPendingSelection;
                  prevShift = shift as string;

                  const isBothFocused = isFocusedRow && isFocused;
                  const isSelected = selectedDates.includes(day.fullDate);

                  return (
                    <td
                      key={day.fullDate}
                      onClick={(e) =>
                        onCellClick(e, emp.id, day.fullDate, emp.name)
                      }
                      className={`
                        border-b p-1 md:p-1.5 text-center transition print:cursor-default relative
                        ${!isWeekWithShift ? "no-shift-week" : ""}
                        ${
                          isToday
                            ? "bg-green-100 border-l-4 border-r-4 border-green-500"
                            : isSelected
                              ? "bg-blue-100 border-l-4 border-r-4 border-blue-500"
                              : isBothFocused
                                ? "bg-yellow-100 border-l-4 border-r-4 border-t-4 border-b-4 border-yellow-500"
                                : isFocusedRow
                                  ? `bg-yellow-50 border-t-4 border-b-4 border-yellow-500 ${
                                      isLastCell ? "border-r-4" : ""
                                    }`
                                  : isFocused
                                    ? "bg-yellow-50 border-l-4 border-r-4 border-yellow-500"
                                    : "border-r"
                        }
                        cursor-pointer hover:opacity-80
                      `}
                    >
                      <div
                        onClick={(e) => {
                          onCellClick(e, emp.id, day.fullDate, emp.name);
                        }}
                        className={`
                          w-full h-7 md:h-8 rounded flex items-center justify-center text-xs md:text-xs font-bold shadow-sm print:shadow-none print:rounded-none border
                          ${
                            shiftOverflowInfo.hasShiftOverflow
                              ? "ring-2 ring-red-500 z-10"
                              : isRestViolation
                                ? "ring-2 ring-orange-500 z-10"
                                : ""
                          }
                          ${
                            isPending
                              ? "opacity-70 ring-2 ring-yellow-400 border-yellow-500 border-dashed"
                              : ""
                          }
                        `}
                        style={getShiftStyle(displayShift)}
                      >
                        {(isPending || showEditorPendingIcon) && (
                          <div className="absolute top-0 right-0 z-10 p-0.5">
                            <Clock size={12} className={pendingIconClass} />
                          </div>
                        )}
                        {displayShift === "F" ? "" : displayShift}
                        {shiftOverflowInfo.hasShiftOverflow && !isPending && (
                          <AlertCircle
                            size={10}
                            className="absolute top-0 right-0 text-red-600 bg-white rounded-full"
                          />
                        )}
                        {isRestViolation &&
                          !isPending &&
                          !shiftOverflowInfo.hasShiftOverflow && (
                            <AlertCircle
                              size={10}
                              className="absolute top-0 right-0 text-orange-600 bg-white rounded-full"
                            />
                          )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  },
);

CalendarGrid.displayName = "CalendarGrid";

export default CalendarGrid;
