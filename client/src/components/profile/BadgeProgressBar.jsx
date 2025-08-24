// src/components/profile/BadgeProgressBar.jsx
import React from "react";

const BadgeProgressBar = ({ current, goal, badgeName }) => {
  const progress = Math.min(100, (current / goal) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{badgeName}</span>
        <span>
          {current}/{goal}
        </span>
      </div>
      <progress
        className="progress progress-success w-full"
        value={progress}
        max="100"
      ></progress>
    </div>
  );
};

export default BadgeProgressBar;
