"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (value: number) => String(value).padStart(2, "0");

const formatIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatLabel = (value?: string) => {
  if (!value) return "Select date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Select date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getCalendarDays = (year: number, month: number) => {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ date: Date; inMonth: boolean }> = [];
  const prevMonthLastDate = new Date(year, month, 0).getDate();

  for (let i = startDay - 1; i >= 0; i -= 1) {
    days.push({ date: new Date(year, month - 1, prevMonthLastDate - i), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ date: new Date(year, month, day), inMonth: true });
  }

  const nextDays = 42 - days.length;
  for (let i = 1; i <= nextDays; i += 1) {
    days.push({ date: new Date(year, month + 1, i), inMonth: false });
  }

  return days;
};

const getYearGrid = (startYear: number) => Array.from({ length: 12 }, (_, index) => startYear + index);

export function DatePicker({ value, onChange, placeholder, className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleDate, setVisibleDate] = useState<Date>(() => {
    const target = value ? new Date(value) : new Date();
    return Number.isNaN(target.getTime()) ? new Date() : new Date(target.getFullYear(), target.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState<"day" | "month" | "year">("day");
  const [yearGridStart, setYearGridStart] = useState<number>(() => {
    const target = value ? new Date(value) : new Date();
    const year = Number.isNaN(target.getTime()) ? new Date().getFullYear() : target.getFullYear();
    return Math.floor(year / 12) * 12;
  });
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value) {
      const target = new Date(value);
      if (!Number.isNaN(target.getTime())) {
        setVisibleDate(new Date(target.getFullYear(), target.getMonth(), 1));
      }
    }
  }, [value]);

  useEffect(() => {
    if (viewMode === "day") {
      setYearGridStart(Math.floor(visibleDate.getFullYear() / 12) * 12);
    }
  }, [visibleDate, viewMode]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const days = useMemo(
    () => getCalendarDays(visibleDate.getFullYear(), visibleDate.getMonth()),
    [visibleDate],
  );

  const handleSelectDate = (date: Date) => {
    onChange(formatIso(date));
    setIsOpen(false);
    setViewMode("day");
  };

  const handleSelectYear = (year: number) => {
    setVisibleDate(new Date(year, visibleDate.getMonth(), 1));
    setViewMode("month");
  };

  const handleSelectMonth = (monthIndex: number) => {
    setVisibleDate(new Date(visibleDate.getFullYear(), monthIndex, 1));
    setViewMode("day");
  };

  const headerLabel = viewMode === "day"
    ? visibleDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : viewMode === "month"
      ? String(visibleDate.getFullYear())
      : `${yearGridStart} - ${yearGridStart + 11}`;

  const handlePrev = () => {
    if (viewMode === "day") {
      setVisibleDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (viewMode === "month") {
      setVisibleDate((prev) => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    } else {
      setYearGridStart((prev) => prev - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      setVisibleDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (viewMode === "month") {
      setVisibleDate((prev) => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    } else {
      setYearGridStart((prev) => prev + 12);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="neumorphic-input flex w-full items-center justify-between px-4 py-3 text-sm text-left text-[#0f172a] dark:text-[#f8fafc]"
      >
        <span className={`${value ? "text-[#0f172a] dark:text-[#f8fafc]" : "text-[#64748b] dark:text-[#94a3b8]"}`}>
          {formatLabel(value) || placeholder}
        </span>
        <span className="text-[#475569] dark:text-[#cbd5e1]">📅</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-[320px] overflow-hidden rounded-[1.75rem] border border-white/80 bg-[#eef6ff] shadow-[24px_24px_60px_rgba(166,184,220,0.28),-24px_-24px_60px_rgba(255,255,255,0.95)] dark:border-white/10 dark:bg-[#17202c] dark:shadow-[24px_24px_60px_rgba(0,0,0,0.35),-24px_-24px_60px_rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-full p-2 hover:bg-[#dbeafe] dark:hover:bg-[#1f2937]"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setViewMode((mode) => (mode === "day" ? "year" : "year"))}
              className="rounded-full px-3 py-2 hover:bg-[#dbeafe] dark:hover:bg-[#1f2937]"
            >
              {headerLabel}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full p-2 hover:bg-[#dbeafe] dark:hover:bg-[#1f2937]"
            >
              ›
            </button>
          </div>

          {viewMode === "day" && (
            <>
              <div className="grid grid-cols-7 gap-1 px-4 pb-4 text-center text-xs font-semibold uppercase text-[#475569] dark:text-[#94a3b8]">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 px-4 pb-4 text-sm">
                {days.map(({ date, inMonth }) => {
                  const iso = formatIso(date);
                  const isSelected = selectedDate ? iso === formatIso(selectedDate) : false;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => handleSelectDate(date)}
                      className={`rounded-2xl px-2 py-2 transition ${inMonth ? "" : "text-[#94a3b8] dark:text-[#475569]"} ${isSelected ? "bg-[#2563eb] text-white" : "hover:bg-[#dbeafe] dark:hover:bg-[#1f2937]"}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === "month" && (
            <div className="grid grid-cols-3 gap-2 px-4 pb-4 text-sm">
              {MONTH_NAMES.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleSelectMonth(index)}
                  className="rounded-2xl px-3 py-3 text-left text-sm text-[#0f172a] dark:text-[#f8fafc] hover:bg-[#dbeafe] dark:hover:bg-[#1f2937]"
                >
                  {month}
                </button>
              ))}
            </div>
          )}

          {viewMode === "year" && (
            <div className="grid grid-cols-3 gap-2 px-4 pb-4 text-sm">
              {getYearGrid(yearGridStart).map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleSelectYear(year)}
                  className="rounded-2xl px-3 py-3 text-left text-sm text-[#0f172a] dark:text-[#f8fafc] hover:bg-[#dbeafe] dark:hover:bg-[#1f2937]"
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
