interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{title}</h2>
      {action}
    </div>
  );
}
