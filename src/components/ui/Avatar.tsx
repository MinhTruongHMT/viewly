export function Avatar({
  name,
  color = "#657f61",
  small = false,
}: {
  name: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${small ? "avatar-small" : ""}`}
      style={{ background: color }}
      aria-hidden="true"
    >
      {name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
