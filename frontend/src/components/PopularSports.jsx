import SportCard from "./SportCard";
import "./PopularSports.css";

export default function PopularSports() {
const sportsList = [
  {
    name: "Football",
    image:
      "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1000",
    trending: true,
  },
  {
    name: "Basketball",
    image:
      "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1000&q=80",
    trending: true,
  },
  {
  name: "Tennis",
  image: "https://www.qntsport.com/img/cms/blog/blog-zoom-sur-la-journee-mondiale-du-tennis.jpg",
  trending: true,
}
,

  {
    name: "Padel",
    image:
      "https://images.pexels.com/photos/6044291/pexels-photo-6044291.jpeg?auto=compress&cs=tinysrgb&w=1000",
    trending: true,
  },
  {
    name: "Volleyball",
    image:
      "https://images.pexels.com/photos/6203538/pexels-photo-6203538.jpeg?auto=compress&cs=tinysrgb&w=1000",
    trending: false,
  },
  {
    name: "Badminton",
    image:
      "https://images.pexels.com/photos/5739113/pexels-photo-5739113.jpeg?auto=compress&cs=tinysrgb&w=1000",
    trending: false,
  },
  {
    name: "Gym & Fitness",
    image:
      "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?auto=format&fit=crop&w=1000&q=80",
    trending: false,
  },
  {
    name: "Swimming",
    image:
      "https://images.pexels.com/photos/1263349/pexels-photo-1263349.jpeg?auto=compress&cs=tinysrgb&w=1000",
    trending: false,
  },
];

  return (
    <div className="popular-section">
      <h2 className="section-title">Popular Sports</h2>
      <p className="section-sub">
        Choose your favorite sport and explore courts
      </p>

      <div className="sports-grid">
        {sportsList.map((sport, index) => (
          <SportCard
            key={index}
            name={sport.name}
            image={sport.image}
            trending={sport.trending}
          />
        ))}
      </div>
    </div>
  );
}
