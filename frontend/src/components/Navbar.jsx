import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Bot } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="fixed w-full top-0 z-40 bg-base-100/80 backdrop-blur-md border-b border-base-300/50">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-semibold">Chatterpillar</h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {authUser && (
              <Link
                to="/helper"
                className="btn btn-sm gap-2 btn-outline btn-primary"
                title="Helper Assistant"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Helper</span>
              </Link>
            )}

            <Link
              to={"/settings"}
              className="btn btn-sm btn-ghost gap-2"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link 
                  to={"/profile"} 
                  className="btn btn-sm btn-ghost gap-2"
                  title="Profile"
                >
                  <User className="size-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button 
                  className="btn btn-sm btn-ghost gap-2 hover:text-error" 
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;