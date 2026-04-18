"use client";

export default function NeumorphicButton(props: any) {
  return (
    <button
      {...props}
      style={{
        width: "100%",
        padding: "14px",
        marginTop: "10px",
        borderRadius: "14px",
        border: "none",
        cursor: "pointer",
        background: "#e6ebf2",
        boxShadow: "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff",
        transition: "0.2s",
        fontWeight: 600,
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "inset 6px 6px 12px #c5ccd6, inset -6px -6px 12px #ffffff";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "8px 8px 16px #c5ccd6, -8px -8px 16px #ffffff";
      }}
    />
  );
}
