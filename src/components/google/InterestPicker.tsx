import { categories } from "../../types";
import { useAppStore } from "../../store/useAppStore";

export function InterestPicker() {
  const interests = useAppStore((state) => state.interests);
  const toggleInterest = useAppStore((state) => state.toggleInterest);
  return (
    <div className="interest-picker">
      <h3>Bạn muốn khám phá điều gì?</h3>
      <p>
        Chọn sở thích để Viewly ưu tiên nội dung phù hợp. Bạn có thể đổi lựa
        chọn bất cứ lúc nào.
      </p>
      <div
        className="interest-options"
        role="group"
        aria-label="Sở thích của bạn"
      >
        {categories
          .filter((category) => category !== "All")
          .map((category) => (
            <button
              key={category}
              className={`category-chip ${interests.includes(category) ? "active" : ""}`}
              aria-pressed={interests.includes(category)}
              onClick={() => toggleInterest(category)}
            >
              {category}
            </button>
          ))}
      </div>
    </div>
  );
}
