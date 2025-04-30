import React, { use, useEffect, useState } from "react";
import { Button } from "./ui/button";

export function deepClone<T>(value: T, weakMap = new WeakMap()): T {
  // Handle null, undefined, primitive types
  if (value === null || typeof value !== "object") {
    return value;
  }

  // Handle cyclic references
  if (weakMap.has(value)) {
    return weakMap.get(value);
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as any;
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as any;
  }

  // Handle Map
  if (value instanceof Map) {
    const clonedMap = new Map();
    weakMap.set(value, clonedMap);
    value.forEach((v, k) => {
      clonedMap.set(deepClone(k, weakMap), deepClone(v, weakMap));
    });
    return clonedMap as any;
  }

  // Handle Set
  if (value instanceof Set) {
    const clonedSet = new Set();
    weakMap.set(value, clonedSet);
    value.forEach((v) => {
      clonedSet.add(deepClone(v, weakMap));
    });
    return clonedSet as any;
  }

  // Handle Array
  if (Array.isArray(value)) {
    const clonedArr: any[] = [];
    weakMap.set(value, clonedArr);
    value.forEach((item, index) => {
      clonedArr[index] = deepClone(item, weakMap);
    });
    return clonedArr as any;
  }

  // Handle plain objects
  const clonedObj: Record<string | symbol, any> = {};
  weakMap.set(value, clonedObj);
  Reflect.ownKeys(value).forEach((key) => {
    clonedObj[key] = deepClone((value as any)[key], weakMap);
  });
  return clonedObj as T;
}

interface Person {
  name: string;
  address: {
    city: string;
    country: string;
  };
}

export default function DeepCloneDemo() {
  const [person, setPerson] = useState<Person>({
    name: "Alice",
    address: {
      city: "New York",
      country: "USA",
    },
  });
  const [cloned, setCloned] = useState<Person | null>(null);
  const [useDeepClone, setUseDeepClone] = useState<boolean>(true);
  const [showComparison, setShowComparison] = useState<boolean>(false);

  useEffect(() => {
    console.log("person: ", person);
  }, [person]);

  useEffect(() => {
    console.log("cloned: ", cloned);
  }, [cloned]);

  const handleCloneAndModify = () => {
    let clonedPerson;

    if (useDeepClone) {
      // Deep clone
      clonedPerson = deepClone(person);
    } else {
      // Shallow clone (reference)
      clonedPerson = { ...person };
      clonedPerson.address = person.address; // Ensure address is a reference
    }

    // Store the original for comparison
    setCloned({ ...person });

    // Modify the person object
    clonedPerson.address.city = "Vancouver";
    clonedPerson.address.country = "Canada";

    setPerson(clonedPerson);
    setShowComparison(true);
  };

  const handleReset = () => {
    setPerson({
      name: "Alice",
      address: {
        city: "New York",
        country: "USA",
      },
    });
    setCloned(null);
    setShowComparison(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Deep Clone Demonstration</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">What is Deep Cloning?</h3>
        <p className="text-gray-700 mb-2">
          Deep cloning creates a completely independent copy of an object,
          including all nested objects. When you modify the clone, the original
          remains unchanged.
        </p>
        <p className="text-gray-700">
          Without deep cloning (shallow clone), changes to nested objects affect
          both the clone and the original because they reference the same object
          in memory.
        </p>
      </div>

      <div className="mb-6 flex items-center space-x-4">
        <div className="flex items-center">
          <input
            type="radio"
            id="deep-clone"
            name="clone-type"
            checked={useDeepClone}
            onChange={() => setUseDeepClone(true)}
            className="mr-2"
          />
          <label htmlFor="deep-clone" className="text-gray-700 font-medium">
            Use Deep Clone
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="radio"
            id="shallow-clone"
            name="clone-type"
            checked={!useDeepClone}
            onChange={() => setUseDeepClone(false)}
            className="mr-2"
          />
          <label htmlFor="shallow-clone" className="text-gray-700 font-medium">
            Use Shallow Clone
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Current Person Object</h3>
          <div className="space-y-2">
            <div className="flex">
              <span className="w-20 font-medium">Name:</span>
              <span className="text-blue-600">{person.name}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-medium">City:</span>
              <span className="text-blue-600">{person.address.city}</span>
            </div>
            <div className="flex">
              <span className="w-20 font-medium">Country:</span>
              <span className="text-blue-600">{person.address.country}</span>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
            {JSON.stringify(person, null, 2)}
          </div>
        </div>

        {showComparison && cloned && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">
              Original Person Object
            </h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="w-20 font-medium">Name:</span>
                <span className="text-green-600">{cloned.name}</span>
              </div>
              <div className="flex">
                <span className="w-20 font-medium">City:</span>
                <span className="text-green-600">{cloned.address.city}</span>
              </div>
              <div className="flex">
                <span className="w-20 font-medium">Country:</span>
                <span className="text-green-600">{cloned.address.country}</span>
              </div>
            </div>
            <div className="mt-4 bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(cloned, null, 2)}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4 mb-6">
        <Button
          onClick={handleCloneAndModify}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Move to Canada
        </Button>

        <Button
          onClick={handleReset}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Reset
        </Button>
      </div>

      {showComparison && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold mb-2">Observation</h3>
          {useDeepClone ? (
            <p className="text-gray-700">
              <span className="font-medium">Using Deep Clone:</span> The
              original person object remains in {cloned?.address.city},{" "}
              {cloned?.address.country}, while the new object's address is
              updated to Vancouver, Canada. This demonstrates that deep cloning
              created an independent copy.
            </p>
          ) : (
            <p className="text-gray-700">
              <span className="font-medium">Using Shallow Clone:</span> If the
              original object's address also changed to Vancouver, Canada, it
              demonstrates that shallow cloning kept a reference to the same
              nested address object, so modifying one affects both.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">How Deep Clone Works</h3>
        <p className="text-gray-700 mb-3">
          The <code className="bg-gray-200 px-1 rounded">deepClone()</code>{" "}
          function recursively copies all nested objects and arrays, handling
          special cases like:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Primitive values (strings, numbers, etc.)</li>
          <li>Dates, RegExp, Maps, and Sets</li>
          <li>Arrays and nested objects</li>
          <li>Circular references using WeakMap</li>
        </ul>
      </div>
    </div>
  );
}
