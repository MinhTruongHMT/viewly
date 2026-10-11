import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Compass size={34} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button primary" to="/">
        Discover videos
      </Link>
    </div>
  );
}
