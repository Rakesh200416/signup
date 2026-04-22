"use client";

import { AlertCircle, Bell, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { Toaster, resolveValue, toast } from "react-hot-toast";

interface ToasterClientProps {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

export function ToasterClient({ position = "top-right" }: ToasterClientProps) {
  const getTone = (type: "success" | "error" | "loading" | "blank" | "custom") => {
    if (type === "success") {
      return {
        icon: <CheckCircle2 className="h-5 w-5" />,
        textColor: "#18634b",
      };
    }
    if (type === "error") {
      return {
        icon: <TriangleAlert className="h-5 w-5" />,
        textColor: "#a91e2c",
      };
    }
    if (type === "loading") {
      return {
        icon: <Bell className="h-5 w-5" />,
        textColor: "#2d4cc8",
      };
    }
    if (type === "custom") {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        textColor: "#0056b3",
      };
    }
    return {
      icon: <Info className="h-5 w-5" />,
      textColor: "#0056b3",
    };
  };

  return (
    <Toaster
      position={position}
      gutter={14}
      containerStyle={position === "top-center" ? { top: "50%", transform: "translateY(-50%)" } : undefined}
      toastOptions={{
        duration: 3800,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: "0",
        },
      }}
    >
      {(t) => {
        const tone = getTone(t.type);
        return (
          <div
            className="w-[min(92vw,680px)] rounded-[16px] border border-[#d1d9e6] bg-[#e6e8ee] px-4 py-3"
            style={{
              boxShadow: "6px 6px 12px #b8b9be, -6px -6px 12px #ffffff",
              color: tone.textColor,
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? "translateY(0px)" : "translateY(-8px)",
              transition: "all .2s ease",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 pt-0.5" style={{ color: tone.textColor }}>
                {tone.icon}
              </div>
              <div className="flex-1 text-[1.02rem] leading-relaxed font-medium" style={{ color: tone.textColor }}>
                {resolveValue(t.message, t)}
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 rounded-full p-1 transition hover:bg-[#dde2ea]"
                style={{ color: "#525480" }}
                aria-label="Dismiss alert"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      }}
    </Toaster>
  );
}
