import { useState, useEffect, useRef } from "react";

/**
 * Debounce function that delays invoking a function until after a specified delay
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 */
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

export default function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [cancelCount, setCancelCount] = useState(0);
  const [delay, setDelay] = useState(500);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recreate the debounced function when delay changes
  const debouncedFetch = useRef(
    debounce((searchTerm: string) => {
      fetchResults(searchTerm);
    }, delay)
  ).current;

  const fetchResults = async (searchTerm: string) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setCancelCount((prev) => prev + 1);
      console.log("Previous request aborted");
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setRequestCount((prev) => prev + 1);
    setLastRequestTime(Date.now());
    setLoading(true);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock API response
      const mockData = {
        items: [
          { id: 1, name: `Result for: ${searchTerm} - Item 1` },
          { id: 2, name: `Result for: ${searchTerm} - Item 2` },
          { id: 3, name: `Result for: ${searchTerm} - Item 3` },
        ],
      };

      // Check if request was cancelled
      if (controller.signal.aborted) {
        throw new Error("AbortError");
      }

      setResults(mockData.items);
    } catch (error: any) {
      if (error.name === "AbortError" || error.message === "AbortError") {
        console.log("Request was cancelled");
      } else {
        console.error("Fetch error:", error);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() !== "") {
      debouncedFetch(value);
    } else {
      setResults([]);
    }
  };

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = parseInt(e.target.value);
    setDelay(newDelay);
  };

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const resetDemo = () => {
    setQuery("");
    setResults([]);
    setRequestCount(0);
    setCancelCount(0);
    setLastRequestTime(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Debounced Search</h2>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-blue-500 text-sm hover:text-blue-700"
        >
          {showExplanation ? "Hide" : "Show"} Explanation
        </button>
      </div>

      {showExplanation && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-2">What is Debouncing?</h3>
          <p className="text-gray-700 mb-3">
            Debouncing is a programming technique that limits how often a
            function can be called. It's like waiting until someone stops typing
            before processing what they typed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium mb-1 text-red-600">
                Without Debouncing:
              </h4>
              <p className="text-sm text-gray-600">
                Every keystroke triggers an API request immediately, causing:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Excessive network traffic</li>
                <li>Wasted server resources</li>
                <li>Potential race conditions</li>
                <li>Poor user experience</li>
              </ul>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium mb-1 text-green-600">
                With Debouncing:
              </h4>
              <p className="text-sm text-gray-600">
                API requests are delayed until typing pauses, resulting in:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Fewer network requests</li>
                <li>Better performance</li>
                <li>Smoother user experience</li>
                <li>Reduced server load</li>
              </ul>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <strong>How this demo works:</strong> Try typing quickly in the
              search field and observe how requests are delayed and previous
              ones are cancelled.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label
          htmlFor="delay-slider"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Debounce Delay:{" "}
          <span className="font-bold text-blue-600">{delay}ms</span>
        </label>
        <input
          id="delay-slider"
          type="range"
          min="100"
          max="2000"
          step="100"
          value={delay}
          onChange={handleDelayChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Fast (100ms)</span>
          <span>Slow (2000ms)</span>
        </div>
      </div>

      <div className="mb-6 relative">
        <label
          htmlFor="search-input"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Search Query:
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder="Type to search..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-blue-600">{requestCount}</div>
          <div className="text-xs text-gray-500">Requests Made</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-red-600">{cancelCount}</div>
          <div className="text-xs text-gray-500">Requests Cancelled</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-green-600">
            {requestCount - cancelCount}
          </div>
          <div className="text-xs text-gray-500">Completed Requests</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-purple-600">
            {lastRequestTime
              ? new Date(lastRequestTime).toLocaleTimeString()
              : "-"}
          </div>
          <div className="text-xs text-gray-500">Last Request Time</div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Search Results</h3>
        <button
          onClick={resetDemo}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Reset Demo
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Searching...</p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          {results.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {results.map((item, idx) => (
                <li
                  key={idx}
                  className="p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 text-blue-500 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">ID: {item.id}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query ? (
            <div className="p-6 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Enter a search term to see results
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-md font-semibold mb-2">Implementation Details:</h3>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {`function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          The debounce function creates a wrapper that delays calling the
          original function until the specified delay has passed since the last
          call to the debounced function.
        </p>
      </div>
    </div>
  );
}
