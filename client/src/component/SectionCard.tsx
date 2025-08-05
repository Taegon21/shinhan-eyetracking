interface SectionCardProps {
  sectionId: string;
  title: string;
  bgColor: string;
  borderColor: string;
  titleColor: string;
  height?: string;
  children: React.ReactNode;
}

export default function SectionCard({
  sectionId,
  title,
  bgColor,
  borderColor,
  titleColor,
  height = "30vh",
  children,
}: SectionCardProps) {
  return (
    <div
      data-section={sectionId}
      className={`${bgColor} border-l-4 ${borderColor} p-4 flex flex-col justify-center`}
      style={{ height }}
    >
      <h3 className={`text-lg font-semibold mb-3 ${titleColor}`}>{title}</h3>
      <div className="text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
