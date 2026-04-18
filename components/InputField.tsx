"use client";

import styles from "../styles.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function InputField(props: Props) {
  return <input className={styles.input} {...props} />;
}