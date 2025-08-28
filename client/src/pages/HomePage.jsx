import React from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import EnhancedChatContainer from "../components/EnhancedChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import FeatureTestPanel from "../components/FeatureTestPanel";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className=" bg-base-100 rounded-lg shadow-lg w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <EnhancedChatContainer />}
          </div>
        </div>
      </div>
      
      {/* Feature Test Panel */}
      <FeatureTestPanel />
    </div>
  );
};

export default HomePage;
