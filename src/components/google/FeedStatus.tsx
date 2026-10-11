import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";

export function FeedStatus({
  error,
  retry,
}: {
  error: string;
  retry?: () => void;
}) {
  return (
    <div className="feed-status" role="alert">
      <AlertCircle size={20} />
      <div>
        <p>{error}</p>
        <div className="connection-actions">
          {retry && (
            <button className="text-button" onClick={retry}>
              <RefreshCw size={14} />
              Thử lại
            </button>
          )}
          <Link to="/settings" className="text-button">
            Cấu hình Google / YouTube
          </Link>
        </div>
      </div>
    </div>
  );
}
