import "./SportCard.css";
import { Link } from "react-router-dom";

export default function SportCard({ name, image, trending }) {
  return (
    <div className="sport-card">
      <img
        src={image}
        alt={name}
        className="sport-image"
        loading="lazy"
      />

      <div className="sport-info">
        <span className="sport-name">{name}</span>

        {trending && (
          <span className="sport-tag">
            Trending
          </span>
        )}
      </div>

      <div className="sport-footer">
        <Link
          to={`/discover?sport=${encodeURIComponent(name)}`}
          className="explore-link"
        >
          Explore Courts →
        </Link>
      </div>
    </div>
  );
}
