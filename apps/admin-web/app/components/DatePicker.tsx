"use client";

import { createPortal } from "react-dom";
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
  const [panelRect, setPanelRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const updatePanelPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelRect({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8,
        width: Math.min(rect.width, 280),
      });
    };

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleScroll = () => updatePanelPosition();
    const handleResize = () => updatePanelPosition();

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    if (isOpen) {
      updatePanelPosition();
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

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
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="neumorphic-input flex w-full items-center justify-between px-4 py-3 text-sm text-left text-[#0f172a]"
      >
        <span className={`${value ? "text-[#0f172a]" : "text-[#64748b]"}`}>
          {formatLabel(value) || placeholder}
        </span>
        <span className="text-[#475569]">📅</span>
      </button>

      {mounted && isOpen && panelRect && createPortal(
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            left: panelRect.left,
            top: panelRect.top,
            width: panelRect.width,
            zIndex: 9999,
          }}
          className="overflow-hidden rounded-[28px] bg-[#e0e5ec] shadow-[6px_6px_12px_#b8bec9,-6px_-6px_12px_#ffffff] neomorphic-dropdown-panel"
        >
          <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#0f172a]">
            <button
              type="button"
              onClick={handlePrev}
              className="neumorphic-button rounded-full px-3 py-2 text-base"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setViewMode((mode) => (mode === "day" ? "year" : "year"))}
              className="neumorphic-button rounded-full px-4 py-2 text-sm"
            >
              {headerLabel}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="neumorphic-button rounded-full px-3 py-2 text-base"
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
              <div className="grid grid-cols-7 gap-2 px-4 pb-4 text-sm">
                {days.map(({ date, inMonth }) => {
                  const iso = formatIso(date);
                  const isSelected = selectedDate ? iso === formatIso(selectedDate) : false;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => handleSelectDate(date)}
                      className={`rounded-[18px] px-2 py-2 text-sm transition ${inMonth ? "bg-[#e0e5ec] text-[#0f172a]" : "text-[#94a3b8]"} ${isSelected ? "bg-[#2563eb] text-white shadow-[inset_4px_4px_8px_#1d4ed8]" : "hover:bg-[#dbeafe]"}`}
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
                  className="neumorphic-dropdown-option rounded-[18px] px-3 py-3 text-left text-sm text-[#0f172a] hover:bg-[#dbeafe]"
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
                  className="neumorphic-dropdown-option rounded-[18px] px-3 py-3 text-left text-sm text-[#0f172a] hover:bg-[#dbeafe]"
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
