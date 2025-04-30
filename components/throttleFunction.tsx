import { useState, useRef, useEffect } from "react";

function throttle<T extends (...args: any[]) => void>(func: T, limit: number) {
  let inThrottle = false;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export default function ThrottleDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [throttledClicks, setThrottledClicks] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [throttledPosition, setThrottledPosition] = useState({ x: 0, y: 0 });

  // Handle for normal button click
  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  // Handle for throttled button click
  const handleThrottledClick = () => {
    setThrottledClicks((prev) => prev + 1);
  };

  // Create throttled version of the click handler
  const throttledClickHandler = useRef(
    throttle(handleThrottledClick, 1000)
  ).current;

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Handle throttled mouse movement
  const handleThrottledMouseMove = (x: number, y: number) => {
    setThrottledPosition({ x, y });
  };

  // Create throttled version of the mouse move handler
  const throttledMouseMoveHandler = useRef(
    throttle((x: number, y: number) => handleThrottledMouseMove(x, y), 500)
  ).current;

  // Setup mouse move event listener
  useEffect(() => {
    const mouseMoveHandler = (e: MouseEvent) => {
      handleMouseMove(e as unknown as React.MouseEvent);
      throttledMouseMoveHandler(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [throttledMouseMoveHandler]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-medium mb-2">Throttle Function Demo</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong>Throttling:</strong> Limits function execution to once every
            specified time period
          </li>
          <li>
            <strong>Performance:</strong> Reduces function calls on frequent
            user interactions
          </li>
          <li>
            <strong>Use Cases:</strong> Button clicks, mouse movement, search
            inputs, etc.
          </li>
        </ul>
      </div>

      {/* Button click demo */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <h3 className="text-md font-medium mb-3">
          Button Click Throttling (1000ms)
        </h3>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleClick}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Regular Button
          </button>
          <button
            onClick={() => {
              handleClick(); // Count the raw click
              throttledClickHandler(); // Also trigger the throttled handler
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Throttled Button
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Total Clicks:</span>
            <p className="text-2xl font-bold">{clickCount}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Throttled Actions:</span>
            <p className="text-2xl font-bold">{throttledClicks}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Click the throttled button rapidly and notice how the throttled
          actions count increases only once per second.
        </p>
      </div>

      {/* Mouse movement demo */}
      <div className="p-4 bg-white shadow rounded-lg">
        <h3 className="text-md font-medium mb-3">
          Mouse Movement Throttling (500ms)
        </h3>
        <div
          className="p-4 border rounded-lg bg-gray-50 min-h-[100px] mb-3"
          onMouseMove={handleMouseMove}
        >
          <div className="text-center">Move your mouse in this area</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Real-time Position:</span>
            <p className="font-mono">
              x: {mousePosition.x}, y: {mousePosition.y}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Throttled Position:</span>
            <p className="font-mono">
              x: {throttledPosition.x}, y: {throttledPosition.y}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
