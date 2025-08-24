import { MessageSquare, FileText, Globe } from "lucide-react";

const UserStats = ({ userStats, statsLoading }) => (
  <div className="mt-6">
    <h2 className="text-lg font-medium mb-4">Statistics</h2>
    {statsLoading ? (
      <div className="text-center">
        <span className="loading loading-spinner"></span>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
        <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
          <MessageSquare size={24} className="text-primary" />
          <span className="text-xl font-bold mt-2">
            {userStats?.messagesSent}
          </span>
          <span className="text-xs text-zinc-400">Messages Sent</span>
        </div>
        <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
          <FileText size={24} className="text-secondary" />
          <span className="text-xl font-bold mt-2">
            {userStats?.filesShared}
          </span>
          <span className="text-xs text-zinc-400">Files Shared</span>
        </div>
        <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
          <Globe size={24} className="text-accent" />
          <span className="text-xl font-bold mt-2">
            {userStats?.accountAgeDays}
          </span>
          <span className="text-xs text-zinc-400">Days as Member</span>
        </div>
      </div>
    )}
  </div>
);

export default UserStats;
