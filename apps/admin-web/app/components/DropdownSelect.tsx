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
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
};

export function DropdownSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  className,
  buttonClassName,
}: DropdownSelectProps) {
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
      width: rect.width,
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

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  const selectedOption = options.find((option) => option.value === value);
  const label = selectedOption?.label ?? placeholder ?? "Select an option";

  return (
    <div className={`relative w-full ${className ?? ""}`.trim()}>
      {/* Trigger button — Themesberg form-control inset style */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen((open) => !open);
          }
        }}
        className={`form-control flex w-full items-center justify-between text-sm text-left ${buttonClassName ?? ""}`.trim()}
        style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.65 : 1 }}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <span style={{ color: value ? "#44476a" : "#93a5be" }}>{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="currentColor"
          viewBox="0 0 16 16"
          style={{
            transition: "transform .2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: "#44476a",
          }}
        >
          <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
        </svg>
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
          className="dropdown-menu show"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`dropdown-item w-full text-left ${option.value === value ? "active" : ""}`}
              style={option.value === value ? { boxShadow: "inset 2px 2px 5px #b8b9be, inset -3px -3px 7px #ffffff", color: "#31344b" } : {}}
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
