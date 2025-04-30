import React, { useState, useEffect, useRef } from "react";

/**
 * Type definition for a memoized function that includes cache management methods
 */
interface MemoizedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  clearCache: () => void;
  getCacheSize: () => number;
  getCacheEntries: () => Array<{ key: string; value: ReturnType<T> }>;
}

/**
 * Memoize function that caches results of expensive function calls
 * @param fn - The expensive function to memoize
 * @returns A memoized version of the function that caches results
 */
function memoize<T extends (...args: any[]) => any>(
  fn: T
): MemoizedFunction<T> {
  const cache = new Map<string, ReturnType<T>>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    // Create a cache key from the arguments
    const key = JSON.stringify(args);

    // If we have a cached result, return it
    if (cache.has(key)) {
      console.log(`Cache hit for key: ${key}`);
      return cache.get(key) as ReturnType<T>;
    }

    // Otherwise, calculate the result and cache it
    console.log(`Cache miss for key: ${key}, calculating...`);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as MemoizedFunction<T>;

  // Add methods to the function
  memoized.clearCache = () => {
    cache.clear();
    console.log("Cache cleared");
  };

  memoized.getCacheSize = () => {
    return cache.size;
  };

  memoized.getCacheEntries = () => {
    return Array.from(cache.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  };

  return memoized;
}

// Example expensive function: Calculate Fibonacci number (exponential time complexity)
function calculateFibonacci(n: number): number {
  if (n <= 1) return n;
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

// Example expensive function: Find all prime numbers up to n
function findPrimesUpTo(n: number): number[] {
  console.log(`Computing primes up to ${n}...`);

  // Simulate expensive computation
  const startTime = performance.now();

  const isPrime = Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= n; j += i) {
        isPrime[j] = false;
      }
    }
  }

  // Artificial delay to simulate expensive operation
  while (performance.now() - startTime < 500) {
    // Busy wait to simulate complex computation
  }

  const primes: number[] = [];
  for (let i = 2; i <= n; i++) {
    if (isPrime[i]) primes.push(i);
  }

  return primes;
}

export default function MemoizeDemo() {
  const [number, setNumber] = useState<number>(20);
  const [operation, setOperation] = useState<"fibonacci" | "primes">(
    "fibonacci"
  );
  const [result, setResult] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [cacheHits, setCacheHits] = useState<number>(0);
  const [cacheMisses, setCacheMisses] = useState<number>(0);
  const [cacheEntries, setCacheEntries] = useState<
    { key: string; value: any }[]
  >([]);
  const [isMemoized, setIsMemoized] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Refs to store the original and memoized functions
  const memoizedFibRef = useRef(memoize(calculateFibonacci));
  const memoizedPrimesRef = useRef(memoize(findPrimesUpTo));

  // Track console.log calls to count cache hits/misses
  useEffect(() => {
    const originalConsoleLog = console.log;

    console.log = function (...args) {
      const message = args[0];
      if (typeof message === "string") {
        if (message.includes("Cache hit")) {
          setCacheHits((prev) => prev + 1);
        } else if (message.includes("Cache miss")) {
          setCacheMisses((prev) => prev + 1);
        }
      }
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  const calculateResult = () => {
    setIsCalculating(true);

    // Use setTimeout to allow the UI to update before starting calculation
    setTimeout(() => {
      const startTime = performance.now();

      try {
        let calculatedResult;

        if (operation === "fibonacci") {
          calculatedResult = isMemoized
            ? memoizedFibRef.current(number)
            : calculateFibonacci(number);
        } else {
          calculatedResult = isMemoized
            ? memoizedPrimesRef.current(number)
            : findPrimesUpTo(number);
        }

        setResult(calculatedResult);

        // Update cache entries if memoized
        if (isMemoized) {
          if (operation === "fibonacci") {
            setCacheEntries(memoizedFibRef.current.getCacheEntries());
          } else {
            setCacheEntries(memoizedPrimesRef.current.getCacheEntries());
          }
        }
      } catch (error) {
        console.error("Calculation error:", error);
        setResult("Error: Computation too large");
      }

      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setIsCalculating(false);
    }, 0);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setNumber(isNaN(value) ? 0 : value);
  };

  const clearCache = () => {
    if (operation === "fibonacci") {
      memoizedFibRef.current.clearCache();
    } else {
      memoizedPrimesRef.current.clearCache();
    }
    setCacheEntries([]);
  };

  const resetStats = () => {
    setCacheHits(0);
    setCacheMisses(0);
    setExecutionTime(0);
    setResult(null);
  };

  const handleOperationChange = (newOperation: "fibonacci" | "primes") => {
    setOperation(newOperation);
    setResult(null);

    // Update cache entries for the selected operation
    if (newOperation === "fibonacci") {
      setCacheEntries(memoizedFibRef.current.getCacheEntries());
    } else {
      setCacheEntries(memoizedPrimesRef.current.getCacheEntries());
    }
  };

  const formatResult = (value: any): string => {
    if (Array.isArray(value)) {
      if (value.length > 10) {
        return `[${value.slice(0, 10).join(", ")}, ... and ${
          value.length - 10
        } more]`;
      }
      return `[${value.join(", ")}]`;
    }
    return String(value);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Function Memoization Demo</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">What is Memoization?</h3>
        <p className="text-gray-700 mb-3">
          Memoization is an optimization technique that stores the results of
          expensive function calls and returns the cached result when the same
          inputs occur again. It's particularly useful for:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium mb-1 text-red-600">
              Without Memoization:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              <li>Redundant calculations</li>
              <li>Wasted CPU resources</li>
              <li>Longer execution times</li>
              <li>Poor performance for recursive functions</li>
            </ul>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium mb-1 text-green-600">
              With Memoization:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              <li>Cached results for repeated calls</li>
              <li>Significantly faster execution</li>
              <li>Reduced CPU usage</li>
              <li>Optimized recursive algorithms</li>
            </ul>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>How this demo works:</strong> Try calculating Fibonacci
            numbers or prime numbers with and without memoization and observe
            the difference in execution time.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="fibonacci"
              checked={operation === "fibonacci"}
              onChange={() => handleOperationChange("fibonacci")}
              className="h-4 w-4"
            />
            <label htmlFor="fibonacci" className="text-gray-700">
              Fibonacci Sequence
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="primes"
              checked={operation === "primes"}
              onChange={() => handleOperationChange("primes")}
              className="h-4 w-4"
            />
            <label htmlFor="primes" className="text-gray-700">
              Prime Numbers
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="memoized"
              checked={isMemoized}
              onChange={() => setIsMemoized(true)}
              className="h-4 w-4"
            />
            <label htmlFor="memoized" className="text-gray-700">
              Use Memoization
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="not-memoized"
              checked={!isMemoized}
              onChange={() => setIsMemoized(false)}
              className="h-4 w-4"
            />
            <label htmlFor="not-memoized" className="text-gray-700">
              No Memoization
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="number-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {operation === "fibonacci"
              ? "Fibonacci Number:"
              : "Find Primes Up To:"}
          </label>
          <div className="flex">
            <input
              id="number-input"
              type="number"
              min="1"
              max={operation === "fibonacci" ? 45 : 100000}
              value={number}
              onChange={handleNumberChange}
              className="w-full p-2 border border-gray-300 rounded-l-md"
            />
            <button
              onClick={calculateResult}
              disabled={isCalculating}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isCalculating ? "Calculating..." : "Calculate"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {operation === "fibonacci"
              ? "Recommended range: 1-40. Values > 40 may be very slow without memoization."
              : "Recommended range: 1-100,000."}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-green-600">{cacheHits}</div>
          <div className="text-xs text-gray-500">Cache Hits</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-red-600">{cacheMisses}</div>
          <div className="text-xs text-gray-500">Cache Misses</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-blue-600">
            {isMemoized ? cacheEntries.length : "-"}
          </div>
          <div className="text-xs text-gray-500">Cache Entries</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-purple-600">
            {executionTime > 0 ? `${executionTime.toFixed(2)}ms` : "-"}
          </div>
          <div className="text-xs text-gray-500">Execution Time</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Result</h3>
          <div className="space-x-2">
            <button
              onClick={clearCache}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              disabled={!isMemoized}
            >
              Clear Cache
            </button>
            <button
              onClick={resetStats}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Reset Stats
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 min-h-[100px] relative">
          {isCalculating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80">
              <div className="flex flex-col items-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className="mt-2 text-gray-500">Calculating...</p>
              </div>
            </div>
          ) : null}

          {result !== null ? (
            <div>
              <h4 className="font-medium mb-2">
                {operation === "fibonacci"
                  ? `Fibonacci(${number}) =`
                  : `Found ${
                      Array.isArray(result) ? result.length : 0
                    } prime numbers up to ${number}:`}
              </h4>
              <div className="bg-gray-100 p-2 rounded text-sm overflow-x-auto break-all">
                {formatResult(result)}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 flex items-center justify-center h-full">
              Click "Calculate" to see the result
            </div>
          )}
        </div>
      </div>

      {isMemoized && cacheEntries.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Cache Contents</h3>
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden max-h-40 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Input
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cacheEntries.map((entry, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {entry.key}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 truncate max-w-[150px]">
                      {formatResult(entry.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-md font-semibold mb-2">Implementation Details:</h3>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {`function memoize<T extends (...args: any[]) => any>(fn: T): MemoizedFunction<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    // Create a cache key from the arguments
    const key = JSON.stringify(args);
    
    // If we have a cached result, return it
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    // Otherwise, calculate the result and cache it
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as MemoizedFunction<T>;
  
  // Add methods to the function
  memoized.clearCache = () => {
    cache.clear();
    console.log("Cache cleared");
  };
  
  memoized.getCacheSize = () => {
    return cache.size;
  };
  
  memoized.getCacheEntries = () => {
    return Array.from(cache.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  };
  
  return memoized;
}`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          The memoize function creates a wrapper around the original function
          that caches results based on input arguments. For repeated calls with
          the same arguments, it returns the cached result instead of
          recalculating.
        </p>
      </div>
    </div>
  );
}
