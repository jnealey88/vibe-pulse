import { Link, useLocation } from "wouter";
import { User } from "@/types/metric";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { path: "/insights", icon: "insights", label: "All Insights" },
    { path: "/metrics", icon: "query_stats", label: "Metrics" },
    { path: "/settings", icon: "settings", label: "Settings" },
  ];

  const mobileClasses = isOpen
    ? "fixed inset-y-0 left-0 z-50 w-64 transform translate-x-0 transition-transform duration-200 ease-in-out"
    : "fixed inset-y-0 left-0 z-50 w-64 transform -translate-x-full transition-transform duration-200 ease-in-out";

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`${mobileClasses} lg:hidden bg-sidebar text-sidebar-foreground shadow-md`}>
        <div className="px-6 py-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons text-primary">speed</span>
              <h1 className="text-xl font-semibold font-google-sans text-white">Airo Pulse</h1>
            </div>
            <button onClick={onClose} className="text-sidebar-foreground hover:text-white">
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        <nav className="py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={onClose}
                  className={`flex items-center px-6 py-3 ${
                    location === item.path
                      ? "text-white bg-sidebar-accent border-l-4 border-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  }`}
                >
                  <span className="material-icons mr-3">{item.icon}</span>
                  <span className="font-google-sans">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-sidebar-border bg-sidebar-accent">
            <div className="flex items-center gap-3">
              <img
                src={user.profileImage}
                alt="User profile"
                className="w-8 h-8 rounded-full border-2 border-primary"
              />
              <div>
                <p className="text-sm font-medium font-google-sans text-white">{user.name}</p>
                <p className="text-xs text-sidebar-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar-foreground shadow-md hidden lg:block h-screen fixed">
        <div className="px-6 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="material-icons text-primary">speed</span>
            <h1 className="text-xl font-semibold font-google-sans text-white">Airo Pulse</h1>
          </div>
        </div>

        <nav className="py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center px-6 py-3 ${
                    location === item.path
                      ? "text-white bg-sidebar-accent border-l-4 border-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  }`}
                >
                  <span className="material-icons mr-3">{item.icon}</span>
                  <span className="font-google-sans">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-sidebar-border bg-sidebar-accent">
            <div className="flex items-center gap-3">
              <img
                src={user.profileImage}
                alt="User profile"
                className="w-8 h-8 rounded-full border-2 border-primary"
              />
              <div>
                <p className="text-sm font-medium font-google-sans text-white">{user.name}</p>
                <p className="text-xs text-sidebar-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
