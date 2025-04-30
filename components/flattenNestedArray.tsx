import React, { useState } from "react";

/**
 * Flattens a nested array of any depth into a single-level array
 * @param arr - The nested array to flatten
 * @returns A new flattened array
 */
const flattenArray = <T,>(arr: any[]): T[] => {
  return arr.reduce((result, item) => {
    if (Array.isArray(item)) {
      return [...result, ...flattenArray(item)];
    }
    return [...result, item];
  }, []);
};

export default function FlattenNestedArray() {
  const [nestedArray, setNestedArray] = useState<string>(
    "[[1, 2], [3, [4, 5]], 6, [7, [8, [9]]]]"
  );
  const [flattenedArray, setFlattenedArray] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFlatten = () => {
    try {
      // Parse the input string as a JavaScript array
      const parsedArray = JSON.parse(nestedArray);

      if (!Array.isArray(parsedArray)) {
        setError("Input must be a valid array");
        return;
      }

      const result = flattenArray(parsedArray);
      setFlattenedArray(JSON.stringify(result));
      setError("");
    } catch (err) {
      setError("Invalid input format. Please enter a valid JSON array.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Flatten Nested Array</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nested Array (JSON format):
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={4}
          value={nestedArray}
          onChange={(e) => setNestedArray(e.target.value)}
          placeholder="Enter nested array in JSON format"
        />
      </div>

      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        onClick={handleFlatten}
      >
        Flatten Array
      </button>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {flattenedArray && !error && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Result:</h3>
          <div className="p-3 bg-gray-100 rounded-md overflow-x-auto">
            {flattenedArray}
          </div>
        </div>
      )}

      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <h3 className="text-md font-semibold mb-2">How it works:</h3>
        <p className="text-sm text-gray-700">
          The function uses recursion and the reduce method to flatten arrays of
          any depth. It checks if each item is an array and if so, recursively
          flattens it.
        </p>
        <pre className="mt-2 p-2 bg-gray-200 rounded text-sm overflow-x-auto">
          {`const flattenArray = <T,>(arr: any[]): T[] => {
  return arr.reduce((result, item) => {
    if (Array.isArray(item)) {
      return [...result, ...flattenArray(item)];
    }
    return [...result, item];
  }, []);
};`}
        </pre>
      </div>
    </div>
  );
}
