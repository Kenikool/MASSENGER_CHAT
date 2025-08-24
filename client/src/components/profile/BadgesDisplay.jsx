import { Award } from "lucide-react";

const BadgesDisplay = ({ userStats, badgeIcons }) => (
  <div className="mt-6">
    <h2 className="text-lg font-medium mb-4">Badges</h2>
    <div className="flex flex-wrap gap-2 justify-center">
      {userStats?.badges.length > 0 ? (
        userStats.badges.map((badge, index) => (
          <div
            key={index}
            className="badge badge-lg badge-outline gap-2 px-3 py-3 rounded-full"
          >
            {badgeIcons[badge] || <Award size={16} />}
            <span className="ml-1">{badge}</span>
          </div>
        ))
      ) : (
        <p className="text-center text-sm text-zinc-400">
          No badges earned yet.
        </p>
      )}
    </div>
  </div>
);

export default BadgesDisplay;
