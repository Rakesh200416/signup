"use client";

import styles from "../styles.module.css";

type Props = {
  type: "error" | "success" | "warning";
  message: string;
};

export default function Alert({ type, message }: Props) {
  if (!message) return null;

  return (
    <p className={`${styles.alert} ${styles[type]}`}>
      {message}
    </p>
  );
}