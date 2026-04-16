"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownSelectProps = {
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
};

export function DropdownSelect({ value, options, placeholder, onChange }: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelRect, setPanelRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePanelPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPanelRect({
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY + 8,
      width: Math.min(rect.width, 280),
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePanelPosition();
    const handleResize = () => updatePanelPosition();
    const handleScroll = () => updatePanelPosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);
  const label = selectedOption?.label ?? placeholder ?? "Select an option";

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="neumorphic-input flex w-full items-center justify-between px-4 py-3 text-sm text-left text-[#0f172a]"
      >
        <span className={`${value ? "text-[#0f172a]" : "text-[#64748b]"}`}>{label}</span>
        <span className="text-[#475569]">▾</span>
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
          className="overflow-hidden rounded-[24px] bg-[#e0e5ec] shadow-[6px_6px_12px_#b8bec9,-6px_-6px_12px_#ffffff]"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm text-[#111827] transition ${
                option.value === value ? "bg-[#dbe4ef]" : "hover:bg-[#dbeafe]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
