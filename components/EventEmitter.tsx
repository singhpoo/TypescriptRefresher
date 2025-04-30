import React, { useState, useEffect } from "react";

/**
 * Type definitions for the event emitter
 */
type EventCallback = (...args: any[]) => void;
type EventMap = Record<string, EventCallback[]>;

/**
 * Basic Event Emitter class implementing the publisher-subscriber pattern
 */
class EventEmitter {
  private events: EventMap = {};

  /**
   * Subscribe to an event
   * @param event - The event name to subscribe to
   * @param callback - The callback function to execute when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Return an unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    };
  }

  /**
   * Subscribe to an event and unsubscribe after it fires once
   * @param event - The event name to subscribe to
   * @param callback - The callback function to execute when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  once(event: string, callback: EventCallback): () => void {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });

    return unsubscribe;
  }

  /**
   * Emit an event with the given arguments
   * @param event - The event name to emit
   * @param args - The arguments to pass to the event callbacks
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) {
      return;
    }

    this.events[event].forEach((callback) => {
      callback(...args);
    });
  }

  /**
   * Remove all listeners for an event or all events
   * @param event - Optional event name to remove listeners for
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Get all event names
   * @returns Array of event names
   */
  eventNames(): string[] {
    return Object.keys(this.events);
  }

  /**
   * Get listener count for an event
   * @param event - The event name
   * @returns Number of listeners
   */
  listenerCount(event: string): number {
    return this.events[event]?.length || 0;
  }
}

export default function EventEmitterDemo() {
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("Hello World");
  const [eventName, setEventName] = useState<string>("message");

  // Create a new instance of EventEmitter
  const [emitter] = useState<EventEmitter>(() => new EventEmitter());

  // Add a log helper function
  const addLog = (log: string) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      `${new Date().toLocaleTimeString()}: ${log}`,
    ]);
  };

  useEffect(() => {
    // Clean up all listeners when component unmounts
    return () => emitter.removeAllListeners();
  }, [emitter]);

  const handleSubscribe = () => {
    const unsubscribe = emitter.on(eventName, (msg: string) => {
      addLog(`Received event '${eventName}' with message: ${msg}`);
    });

    addLog(`Subscribed to event '${eventName}'`);

    // Auto-unsubscribe after 30 seconds to prevent memory leaks in the demo
    setTimeout(() => {
      unsubscribe();
      addLog(`Auto-unsubscribed from event '${eventName}' after 30 seconds`);
    }, 30000);
  };

  const handleSubscribeOnce = () => {
    emitter.once(eventName, (msg: string) => {
      addLog(`Received event '${eventName}' ONCE with message: ${msg}`);
    });

    addLog(`Subscribed ONCE to event '${eventName}'`);
  };

  const handleEmit = () => {
    emitter.emit(eventName, message);
    addLog(`Emitted event '${eventName}' with message: ${message}`);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleRemoveAllListeners = () => {
    emitter.removeAllListeners(eventName);
    addLog(`Removed all listeners for event '${eventName}'`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Event Emitter Demo</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Name:
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message:
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={handleSubscribe}
        >
          Subscribe
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          onClick={handleSubscribeOnce}
        >
          Subscribe Once
        </button>

        <button
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          onClick={handleEmit}
        >
          Emit Event
        </button>

        <button
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={handleRemoveAllListeners}
        >
          Remove Listeners
        </button>

        <button
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          onClick={handleClearLogs}
        >
          Clear Logs
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Event Stats:</h3>
        <div className="p-3 bg-gray-100 rounded-md mb-4">
          <p>Available Events: {emitter.eventNames().join(", ") || "None"}</p>
          <p>
            Listeners for '{eventName}': {emitter.listenerCount(eventName)}
          </p>
        </div>

        <h3 className="text-lg font-semibold mb-2">Activity Log:</h3>
        <div className="p-3 bg-gray-100 rounded-md max-h-60 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div
                key={index}
                className="py-1 border-b border-gray-200 last:border-0"
              >
                {log}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No activity yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <h3 className="text-lg font-semibold mb-2">
          Understanding Event Emitters
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-md font-semibold mb-1">
              What is the Event Emitter Pattern?
            </h4>
            <p className="text-sm text-gray-700">
              The Event Emitter pattern (also known as Publisher-Subscriber or
              PubSub) is a behavioral design pattern that enables communication
              between objects in a decoupled way. It promotes loose coupling
              between components, allowing them to interact without having
              direct dependencies on each other.
            </p>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-1">Core Concepts:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
              <li>
                <strong>Publisher (Emitter):</strong> The component that
                generates events and notifications
              </li>
              <li>
                <strong>Subscriber (Listener):</strong> Components that register
                interest in specific events
              </li>
              <li>
                <strong>Event:</strong> An object that encapsulates the
                information about something that happened
              </li>
              <li>
                <strong>Channel/Topic:</strong> A named category used to filter
                and direct events to interested subscribers
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-1">
              Real-world Analogies:
            </h4>
            <p className="text-sm text-gray-700">
              Think of the event emitter pattern like a newspaper subscription
              service:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>The newspaper publisher creates content (events)</li>
              <li>
                Subscribers sign up to receive specific sections (sports,
                business, etc.)
              </li>
              <li>
                When new content is available, only interested subscribers
                receive it
              </li>
              <li>Subscribers can cancel their subscription at any time</li>
              <li>
                The publisher doesn't need to know who the subscribers are
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-1">Common Use Cases:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>
                <strong>UI Components:</strong> Updating different parts of the
                UI when data changes
              </li>
              <li>
                <strong>Cross-component Communication:</strong> Allowing
                unrelated components to communicate
              </li>
              <li>
                <strong>Asynchronous Programming:</strong> Handling callbacks
                for async operations
              </li>
              <li>
                <strong>Logging and Analytics:</strong> Capturing events across
                an application
              </li>
              <li>
                <strong>Plugin Systems:</strong> Creating extensible
                architecture where plugins can hook into events
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-1">Benefits:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>
                <strong>Loose Coupling:</strong> Components don't need direct
                references to each other
              </li>
              <li>
                <strong>Scalability:</strong> Easy to add new subscribers
                without modifying the emitter
              </li>
              <li>
                <strong>Flexibility:</strong> Publishers and subscribers can
                evolve independently
              </li>
              <li>
                <strong>Testability:</strong> Components can be tested in
                isolation
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-1">Challenges:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>
                <strong>Memory Leaks:</strong> Failing to unsubscribe can lead
                to memory leaks
              </li>
              <li>
                <strong>Debugging Complexity:</strong> Events can make code flow
                harder to follow
              </li>
              <li>
                <strong>Race Conditions:</strong> Timing issues with
                asynchronous events
              </li>
              <li>
                <strong>Overuse:</strong> Using events for everything can create
                "event spaghetti"
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-1">
              Implementation Example:
            </h4>
            <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto">
              {`// Create an emitter
const chatEmitter = new EventEmitter();

// Subscribe to events
const unsubscribe = chatEmitter.on('message', (user, message) => {
  console.log(\`\${user}: \${message}\`);
});

// Emit events
chatEmitter.emit('message', 'Alice', 'Hello everyone!');

// Unsubscribe when no longer needed
unsubscribe();`}
            </pre>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-1">
              Real-world Implementations:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>
                <strong>Node.js EventEmitter:</strong> Core module providing
                event-driven architecture
              </li>
              <li>
                <strong>Browser Events:</strong> DOM event system
                (addEventListener/removeEventListener)
              </li>
              <li>
                <strong>React's Context API:</strong> Similar pattern for state
                management
              </li>
              <li>
                <strong>Redux:</strong> State management following similar
                principles
              </li>
              <li>
                <strong>RxJS:</strong> Advanced implementation with Observables
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-md font-semibold mb-1">This Implementation:</h4>
          <p className="text-sm text-gray-700">
            The EventEmitter class shown here implements the
            publisher-subscriber pattern, allowing components to subscribe to
            named events and be notified when those events are emitted. This
            pattern enables loose coupling between components that need to
            communicate with each other.
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            <li>
              <strong>on(event, callback)</strong>: Subscribe to an event
            </li>
            <li>
              <strong>once(event, callback)</strong>: Subscribe to an event once
            </li>
            <li>
              <strong>emit(event, ...args)</strong>: Emit an event with
              arguments
            </li>
            <li>
              <strong>removeAllListeners(event?)</strong>: Remove listeners
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
