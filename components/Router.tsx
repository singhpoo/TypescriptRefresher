import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { Button } from "./ui/button";

// Router types
type RouteParams = Record<string, string>;
type QueryParams = Record<string, string>;

interface Route {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
}

interface RouterState {
  currentPath: string;
  params: RouteParams;
  query: QueryParams;
}

interface RouterContextType {
  navigate: (path: string) => void;
  currentPath: string;
  params: RouteParams;
  query: QueryParams;
}

interface RouterProps {
  routes: Route[];
  notFoundComponent?: React.ComponentType;
}

// Create router context
const RouterContext = createContext<RouterContextType>({
  navigate: () => {},
  currentPath: "",
  params: {},
  query: {},
});

// Hook to use router
export const useRouter = () => useContext(RouterContext);

// Utility functions
function parsePath(path: string): [string, QueryParams] {
  const [pathPart, queryPart] = path.split("?");
  const query: QueryParams = {};

  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
  }

  return [pathPart, query];
}

function matchRoute(route: Route, path: string): RouteParams | null {
  // Convert route path to regex pattern
  const pattern = route.path
    .replace(/:\w+/g, "([^/]+)") // Replace :param with capture group
    .replace(/\//g, "\\/"); // Escape forward slashes

  // Add exact match condition if required
  const regexPattern = route.exact ? `^${pattern}$` : `^${pattern}`;

  const regex = new RegExp(regexPattern);
  const match = path.match(regex);

  if (!match) return null;

  // Extract parameter names from route path
  const paramNames = route.path.match(/:\w+/g) || [];
  const params: RouteParams = {};

  // Map parameter values to names
  paramNames.forEach((param, index) => {
    const paramName = param.slice(1); // Remove the colon
    params[paramName] = match[index + 1]; // index+1 because first match is the full string
  });

  return params;
}

// Router component
export function Router({ routes, notFoundComponent }: RouterProps) {
  const [state, setState] = useState<RouterState>(() => {
    const [pathPart, query] = parsePath(window.location.hash.slice(1) || "/");
    return {
      currentPath: pathPart,
      params: {},
      query,
    };
  });

  // Navigate function
  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  // Handle route changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "/";
      const [pathPart, query] = parsePath(hash);

      // Find matching route
      let matchedRoute: Route | undefined;
      let matchedParams: RouteParams = {};

      for (const route of routes) {
        const params = matchRoute(route, pathPart);
        if (params) {
          matchedRoute = route;
          matchedParams = params;
          break;
        }
      }

      setState({
        currentPath: pathPart,
        params: matchedParams,
        query,
      });
    };

    // Set initial route
    handleHashChange();

    // Listen for changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [routes]);

  // Find current route component
  const CurrentComponent =
    routes.find((route) => {
      const params = matchRoute(route, state.currentPath);
      return params !== null;
    })?.component ||
    notFoundComponent ||
    (() => <div>Page not found</div>);

  return (
    <RouterContext.Provider value={{ ...state, navigate }}>
      <CurrentComponent {...state.params} />
    </RouterContext.Provider>
  );
}

// Link component
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  activeClassName?: string;
}

export function Link({
  to,
  children,
  activeClassName = "",
  className = "",
  ...props
}: LinkProps) {
  const { currentPath } = useRouter();
  const [pathPart] = parsePath(to);
  const isActive = currentPath === pathPart;

  return (
    <a
      href={`#${to}`}
      className={`${className} ${isActive ? activeClassName : ""}`}
      {...props}
    >
      {children}
    </a>
  );
}

// NavLink component - extends Link with active state styling
export function NavLink(props: LinkProps) {
  return (
    <Link
      {...props}
      activeClassName={props.activeClassName || "text-blue-600 font-bold"}
    />
  );
}

// Demo components for router example
const Home = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Home Page</h2>
    <p>Welcome to our SPA Router demo!</p>
  </div>
);

const About = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">About Page</h2>
    <p>This is a simple SPA router implementation.</p>
  </div>
);

const UserProfile = ({ userId }: { userId: string }) => {
  const { query } = useRouter();
  const tab = query.tab || "profile";

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <p>User ID: {userId}</p>
      <p>Active Tab: {tab}</p>

      <div className="mt-4 flex space-x-2">
        <NavLink
          to={`/users/${userId}?tab=profile`}
          className="px-4 py-2 border rounded"
        >
          Profile
        </NavLink>
        <NavLink
          to={`/users/${userId}?tab=settings`}
          className="px-4 py-2 border rounded"
        >
          Settings
        </NavLink>
        <NavLink
          to={`/users/${userId}?tab=activity`}
          className="px-4 py-2 border rounded"
        >
          Activity
        </NavLink>
      </div>

      <div className="mt-6 p-4 border rounded">
        {tab === "profile" && (
          <div>
            <h3 className="text-xl font-semibold">User Profile Content</h3>
            <p>Name: John Doe</p>
            <p>Email: john@example.com</p>
          </div>
        )}
        {tab === "settings" && (
          <div>
            <h3 className="text-xl font-semibold">User Settings</h3>
            <p>Configure your account settings here</p>
          </div>
        )}
        {tab === "activity" && (
          <div>
            <h3 className="text-xl font-semibold">Recent Activity</h3>
            <p>Here's what you've been up to</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NotFound = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">404 - Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
  </div>
);

// Router Demo Component
export default function RouterDemo() {
  const routes: Route[] = [
    { path: "/", component: Home, exact: true },
    { path: "/about", component: About, exact: true },
    { path: "/users/:userId", component: UserProfile },
  ];

  // Programmatic navigation example
  const NavigationControls = () => {
    const { navigate } = useRouter();

    return (
      <div className="mb-6 flex space-x-2">
        <Button onClick={() => navigate("/")}>Go to Home</Button>
        <Button onClick={() => navigate("/about")}>Go to About</Button>
        <Button onClick={() => navigate("/users/123")}>View User 123</Button>
        <Button onClick={() => navigate("/users/456?tab=settings")}>
          User 456 Settings
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-6">SPA Router Demo</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">What is a SPA Router?</h3>
        <p className="text-gray-700 mb-2">
          A Single Page Application router manages navigation without full page
          reloads. It parses the URL, matches routes, and renders the
          appropriate components.
        </p>
        <p className="text-gray-700">
          This implementation uses hash-based routing (#/path) and supports:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Dynamic route parameters (e.g., /users/:id)</li>
          <li>Query parameters (?param=value)</li>
          <li>Programmatic navigation</li>
          <li>Active route detection</li>
        </ul>
      </div>

      <div className="mb-6 border-b">
        <nav className="flex space-x-4 pb-4">
          <NavLink to="/" className="px-4 py-2 border rounded">
            Home
          </NavLink>
          <NavLink to="/about" className="px-4 py-2 border rounded">
            About
          </NavLink>
          <NavLink to="/users/123" className="px-4 py-2 border rounded">
            User Profile
          </NavLink>
          <NavLink to="/nonexistent" className="px-4 py-2 border rounded">
            404 Page
          </NavLink>
        </nav>
      </div>

      <Router routes={routes} notFoundComponent={NotFound} />

      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Programmatic Navigation</h3>
        <NavigationControls />
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">How the Router Works</h3>
        <p className="text-gray-700 mb-3">
          The router follows a similar pattern to the{" "}
          <code className="bg-gray-200 px-1 rounded">deepClone</code> and
          <code className="bg-gray-200 px-1 rounded">
            convertDataFormat
          </code>{" "}
          functions:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Uses recursive pattern matching for route paths</li>
          <li>
            Transforms input data (URL) into a structured format (params, query)
          </li>
          <li>Creates a consistent interface through React Context</li>
          <li>Handles edge cases like non-existent routes</li>
        </ul>
      </div>
    </div>
  );
}
