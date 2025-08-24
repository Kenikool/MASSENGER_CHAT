// src/components/profile/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../lib/axios";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axiosInstance.get("/gamification/leaderboard");
        setLeaderboard(res.data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Leaderboard</h3>
      <ul className="list-none p-0 space-y-2">
        {leaderboard.map((user, index) => (
          <li
            key={user._id}
            className="flex items-center gap-4 p-2 bg-base-200 rounded-lg"
          >
            <span className="font-bold text-lg">{index + 1}.</span>
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={`${user.fullName} profile`}
                />
              </div>
            </div>
            <span className="flex-1">{user.fullName}</span>
            <span className="text-sm text-zinc-400">
              {user.messageCount} messages
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
