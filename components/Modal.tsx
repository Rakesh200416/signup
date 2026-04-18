"use client";

import { useEffect } from "react";
import styles from "../styles.module.css";

type Props = {
  title: string;
  content: string;
  onClose: () => void;
};

export default function Modal({ title, content, onClose }: Props) {

  // ✅ Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose} // ✅ click outside closes
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // ✅ prevent inside click close
      >
        {/* HEADER */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <span className={styles.closeBtn} onClick={onClose}>
            ✕
          </span>
        </div>

        {/* CONTENT */}
        <div className={styles.modalContent}>
          {content.split("\n").map((line, i) => {
            const trimmed = line.trim();

            if (!trimmed) {
              return <div key={i} style={{ height: "6px" }} />;
            }

            // 🔹 Heading detection
            const isHeading =
              /^\d+/.test(trimmed) ||
              trimmed === trimmed.toUpperCase();

            // 🔹 Bullet detection
            const isBullet =
              !isHeading &&
              !trimmed.includes(":") &&
              trimmed.length > 0;

            return (
              <p
                key={i}
                className={isHeading ? styles.heading : styles.paragraph}
              >
                {isBullet && <span className={styles.bullet}>•</span>}
                {trimmed}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}