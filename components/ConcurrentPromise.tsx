import React, { useState, useRef, useEffect } from "react";

/**
 * Executes promises with a concurrency limit
 * @param tasks - Array of functions that return promises
 * @param concurrency - Maximum number of promises to execute simultaneously
 * @returns Promise that resolves with an array of all results in the same order as input tasks
 */
function promiseAllWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }

    // Create a clone of the tasks array
    const taskQueue = [...tasks];
    const results: T[] = new Array(tasks.length);
    const runningTasks = new Set<number>();
    let completedCount = 0;
    let nextIndex = 0;
    let hasRejected = false;

    // Function to start a new task
    const runTask = (index: number) => {
      // Mark this task as running
      runningTasks.add(index);

      // Get the task function from our queue
      const task = taskQueue[index];

      // Execute the task and handle the result
      task()
        .then((result) => {
          if (hasRejected) return;

          // Store the result at the corresponding position in the results array
          results[index] = result;

          // Track completed tasks
          completedCount++;
          runningTasks.delete(index);

          // If all tasks completed, resolve the main promise
          if (completedCount === tasks.length) {
            resolve(results);
            return;
          }

          // Otherwise, start the next task if there are any left
          if (nextIndex < tasks.length) {
            runTask(nextIndex++);
          }
        })
        .catch((error) => {
          if (hasRejected) return;

          // Mark as rejected and reject the main promise
          hasRejected = true;
          reject(error);
        });
    };

    // Start initial batch of tasks up to the concurrency limit
    const initialBatchSize = Math.min(concurrency, tasks.length);
    for (let i = 0; i < initialBatchSize; i++) {
      runTask(nextIndex++);
    }
  });
}

// Utility to create a delayed promise for testing
function createDelayedPromise<T>(
  value: T,
  delay: number,
  shouldFail = false
): () => Promise<T> {
  return () =>
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error(`Promise for ${value} failed`));
        } else {
          resolve(value);
        }
      }, delay);
    });
}

export default function ConcurrentPromiseDemo() {
  const [concurrencyLimit, setConcurrencyLimit] = useState<number>(3);
  const [taskCount, setTaskCount] = useState<number>(10);
  const [taskDelay, setTaskDelay] = useState<number>(1000);
  const [failingTaskIndex, setFailingTaskIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [taskProgress, setTaskProgress] = useState<
    {
      id: number;
      status: "pending" | "running" | "completed" | "failed";
      startTime?: number;
      endTime?: number;
    }[]
  >([]);

  // Track task execution information
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const executionTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Monitor and update currently running tasks
  useEffect(() => {
    if (isRunning && taskProgress.some((task) => task.status === "running")) {
      const interval = setInterval(() => {
        if (executionTimerRef.current !== null) {
          const elapsed = Date.now() - startTimeRef.current;
          setExecutionTime(elapsed);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isRunning, taskProgress]);

  // Prepare the tasks
  const prepareTasks = () => {
    // Reset states
    setIsRunning(true);
    setResults([]);
    setExecutionLog([]);
    setExecutionTime(0);

    // Create task progress tracking
    const initialTaskProgress = Array.from({ length: taskCount }, (_, i) => ({
      id: i,
      status: "pending" as const,
    }));
    setTaskProgress(initialTaskProgress);

    // Create the task array
    const tasks = Array.from({ length: taskCount }, (_, i) => {
      // Determine if this task should fail
      const shouldFail = i === failingTaskIndex;

      // Create a wrapper around the task to track its execution
      return () => {
        // Update task status to running
        setTaskProgress((prev) =>
          prev.map((task) =>
            task.id === i
              ? { ...task, status: "running", startTime: Date.now() }
              : task
          )
        );

        addToLog(`Task ${i} started`);

        // Create and return the actual promise
        return createDelayedPromise(`Task ${i}`, taskDelay, shouldFail)()
          .then((result) => {
            // Update task status to completed
            setTaskProgress((prev) =>
              prev.map((task) =>
                task.id === i
                  ? { ...task, status: "completed", endTime: Date.now() }
                  : task
              )
            );
            addToLog(`Task ${i} completed`);
            return result;
          })
          .catch((error) => {
            // Update task status to failed
            setTaskProgress((prev) =>
              prev.map((task) =>
                task.id === i
                  ? { ...task, status: "failed", endTime: Date.now() }
                  : task
              )
            );
            addToLog(`Task ${i} failed: ${error.message}`);
            throw error;
          });
      };
    });

    return tasks;
  };

  const runDemo = async () => {
    const tasks = prepareTasks();

    // Start the timer
    startTimeRef.current = Date.now();
    executionTimerRef.current = startTimeRef.current;

    try {
      addToLog(`Starting execution with concurrency limit ${concurrencyLimit}`);

      // Execute the tasks with concurrency limit
      const results = await promiseAllWithConcurrency(tasks, concurrencyLimit);

      // Update the results
      setResults(results);
      addToLog("All tasks completed successfully");
    } catch (error) {
      addToLog(
        `Execution failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      // Stop the timer
      executionTimerRef.current = null;
      setIsRunning(false);
    }
  };

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLog((prev) => [...prev, `${timestamp}: ${message}`]);
  };

  const handleConcurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setConcurrencyLimit(value);
  };

  const handleTaskCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTaskCount(value);
  };

  const handleTaskDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTaskDelay(value);
  };

  const handleFailingTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setFailingTaskIndex(value);
  };

  // Calculate theoretical execution time
  const calculateTheoreticalTime = (): string => {
    if (concurrencyLimit <= 0 || taskCount <= 0) return "N/A";

    // Number of batches needed to process all tasks
    const batches = Math.ceil(taskCount / concurrencyLimit);
    const totalTime = batches * taskDelay;

    return `~${totalTime}ms`;
  };

  // Format time from ms to a readable format
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const remainingMs = ms % 1000;
    return `${seconds}.${remainingMs}s`;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Concurrent Promise.all Demo</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">
          What is Promise Concurrency Control?
        </h3>
        <p className="text-gray-700 mb-3">
          Promise.all executes all promises simultaneously, which can lead to
          resource exhaustion with large numbers of tasks. A concurrency-limited
          version allows controlling how many promises run in parallel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium mb-1 text-red-600">
              Standard Promise.all:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              <li>Executes all promises at once</li>
              <li>Can overwhelm system resources</li>
              <li>Potential for rate limiting issues</li>
              <li>May cause performance degradation</li>
            </ul>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium mb-1 text-green-600">
              With Concurrency Control:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
              <li>Controls parallel execution</li>
              <li>Manages resource utilization</li>
              <li>Better performance for large task sets</li>
              <li>Avoids rate limiting with APIs</li>
            </ul>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>How this demo works:</strong> Adjust the concurrency limit,
            task count, and delay to see how concurrent execution affects
            overall performance.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="concurrency-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Concurrency Limit:{" "}
            <span className="font-bold text-blue-600">{concurrencyLimit}</span>
          </label>
          <input
            id="concurrency-input"
            type="range"
            min="1"
            max="10"
            value={concurrencyLimit}
            onChange={handleConcurrencyChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isRunning}
          />
        </div>

        <div>
          <label
            htmlFor="task-count-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Number of Tasks:{" "}
            <span className="font-bold text-blue-600">{taskCount}</span>
          </label>
          <input
            id="task-count-input"
            type="range"
            min="1"
            max="20"
            value={taskCount}
            onChange={handleTaskCountChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isRunning}
          />
        </div>

        <div>
          <label
            htmlFor="task-delay-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Task Delay (ms):{" "}
            <span className="font-bold text-blue-600">{taskDelay}</span>
          </label>
          <input
            id="task-delay-input"
            type="range"
            min="100"
            max="3000"
            step="100"
            value={taskDelay}
            onChange={handleTaskDelayChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isRunning}
          />
        </div>

        <div>
          <label
            htmlFor="failing-task-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Failing Task (Optional):
          </label>
          <select
            id="failing-task-select"
            value={failingTaskIndex}
            onChange={handleFailingTaskChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isRunning}
          >
            <option value="-1">None (All Succeed)</option>
            {Array.from({ length: taskCount }, (_, i) => (
              <option key={i} value={i}>
                Task {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Execution</h3>
          <button
            onClick={runDemo}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isRunning ? "Running..." : "Execute Tasks"}
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xl font-bold text-blue-600">{taskCount}</div>
            <div className="text-xs text-gray-500">Total Tasks</div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xl font-bold text-purple-600">
              {concurrencyLimit}
            </div>
            <div className="text-xs text-gray-500">Concurrent Tasks</div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xl font-bold text-green-600">
              {calculateTheoreticalTime()}
            </div>
            <div className="text-xs text-gray-500">Theoretical Time</div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xl font-bold text-orange-600">
              {executionTime > 0 ? formatTime(executionTime) : "-"}
            </div>
            <div className="text-xs text-gray-500">Actual Time</div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Task Status:</h4>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
            <div className="flex flex-wrap gap-2">
              {taskProgress.map((task) => (
                <div
                  key={task.id}
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-md text-white text-sm font-medium
                    ${task.status === "pending" ? "bg-gray-400" : ""}
                    ${
                      task.status === "running"
                        ? "bg-blue-500 animate-pulse"
                        : ""
                    }
                    ${task.status === "completed" ? "bg-green-500" : ""}
                    ${task.status === "failed" ? "bg-red-500" : ""}
                  `}
                  title={`Task ${task.id}: ${task.status}`}
                >
                  {task.id}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Execution Log</h3>
          <div className="bg-gray-800 text-green-400 p-3 rounded-md h-64 overflow-y-auto font-mono text-xs">
            {executionLog.length > 0 ? (
              executionLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No execution logs yet.</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 h-64 overflow-y-auto">
            {results.length > 0 ? (
              <ul className="space-y-1">
                {results.map((result, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{index}:</span> {result}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                {isRunning
                  ? "Executing tasks..."
                  : "Run the demo to see results"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-md font-semibold mb-2">Implementation Details:</h3>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {`function promiseAllWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const taskQueue = [...tasks];
    const results: T[] = new Array(tasks.length);
    const runningTasks = new Set<number>();
    let completedCount = 0;
    let nextIndex = 0;
    
    // Function to start a new task
    const runTask = (index: number) => {
      runningTasks.add(index);
      
      taskQueue[index]()
        .then((result) => {
          results[index] = result;
          completedCount++;
          runningTasks.delete(index);
          
          if (completedCount === tasks.length) {
            resolve(results);
            return;
          }
          
          if (nextIndex < tasks.length) {
            runTask(nextIndex++);
          }
        })
        .catch(reject);
    };

    // Start initial batch of tasks
    const initialBatchSize = Math.min(concurrency, tasks.length);
    for (let i = 0; i < initialBatchSize; i++) {
      runTask(nextIndex++);
    }
  });
}`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          This implementation controls concurrency by maintaining a fixed number
          of active promises. When one promise completes, another is started
          from the queue, maintaining the concurrency limit while preserving
          result order.
        </p>
      </div>
    </div>
  );
}
