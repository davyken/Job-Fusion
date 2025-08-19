import Header from "@/components/header";
import { Outlet } from "react-router-dom";
import ChatBot from "@/components/ChatBot";

const AppLayout = () => {
  return (
    <div>
      <div className="grid-background"></div>
      <main className="min-h-screen container">
        <Header />
        <Outlet />
      </main>
      <ChatBot />
      <div className="p-10 text-center bg-white-800 mt-10">
        Made with 💗 by Davyken      </div>
    </div>
  );
};

export default AppLayout;
