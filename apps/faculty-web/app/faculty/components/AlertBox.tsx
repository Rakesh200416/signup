export default function AlertBox({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "12px",
        background: "#e6ebf2",
        boxShadow:
          "inset 5px 5px 10px #c5ccd6, inset -5px -5px 10px #ffffff",
        marginBottom: 10,
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}
