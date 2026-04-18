"use client";

export default function NeumorphicInput(props: any) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        margin: "10px 0",
        padding: "14px",
        borderRadius: "14px",
        border: "none",
        outline: "none",
        background: "#e6ebf2",
        boxShadow:
          "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff",
      }}
    />
  );
}
