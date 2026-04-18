export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#e6ebf2", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
