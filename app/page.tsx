"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import SearchWithCancel from "@/components/debounce";
import DeepCloneDemo from "@/components/deepClone";
import ThrottleDemo from "@/components/throttleFunction";
import FlattenNestedArray from "@/components/flattenNestedArray";
import EventEmitterDemo from "@/components/EventEmitter";
import MemoizeDemo from "@/components/Memoize";
import ConcurrentPromiseDemo from "@/components/ConcurrentPromise";
import DataConverterDemo from "@/components/DataConverter";
import StringUtilsDemo from "@/components/StringUtils";
// List of Typescript utility functions
const components = [
  {
    id: "debounce",
    name: "Implement a debounce function for API calls",
    component: () => <SearchWithCancel />,
    description:
      "A function that delays invoking a function until after a specified wait time has elapsed since the last time it was called. Useful for API calls triggered by user input.",
  },
  {
    id: "deepClone",
    name: "Create a deep clone function without using JSON methods",
    component: () => <DeepCloneDemo />,
    description:
      "A recursive function that creates a deep copy of objects without using JSON.stringify and JSON.parse, which have limitations with circular references and certain data types.",
  },
  {
    id: "throttle",
    name: "Implement a throttle function for user interactions",
    component: () => <ThrottleDemo />,
    description:
      "A function that limits how often a function can be called in a given time period. Unlike debounce, throttle will execute the function at a regular interval.",
  },
  {
    id: "flattenArray",
    name: "Write a function to flatten a nested array",
    component: () => <FlattenNestedArray />,
    description:
      "A recursive function that transforms a multi-dimensional array into a single-level array, maintaining the order of elements.",
  },
  {
    id: "eventEmitter",
    name: "Implement a basic event emitter/publisher-subscriber pattern",
    component: () => <EventEmitterDemo />,
    description:
      "An implementation of the publisher-subscriber pattern, allowing components to subscribe to events and be notified when those events occur.",
  },
  {
    id: "memoize",
    name: "Create a function that memoizes results of expensive operations",
    component: () => <MemoizeDemo />,
    description:
      "A higher-order function that caches the results of function calls based on their arguments, improving performance for expensive calculations with repeated inputs.",
  },
  {
    id: "promiseLimit",
    name: "Implement a Promise.all variant with a concurrency limit",
    component: () => <ConcurrentPromiseDemo />,
    description:
      "A function that runs promises in parallel like Promise.all() but limits the number of concurrent promises to avoid overloading resources.",
  },
  {
    id: "dataConverter",
    name: "Create a function to convert between different data formats",
    component: () => <DataConverterDemo />,
    description:
      "A utility that converts data between formats like JSON, XML, CSV, etc. Includes specialized converters for different format pairs.",
  },
  // {
  //   id: "router",
  //   name: "Implement a simple router for a single-page application",
  //   component: () => <Router />,
  //   description:
  //     "A client-side router implementation for single-page applications that handles URL changes, browser history, and rendering different views without page reloads.",
  // },
  {
    id: "stringUtils",
    name: "Write utility functions for common string manipulations",
    component: () => <StringUtilsDemo />,
    description:
      "A collection of utility functions for manipulating strings, including case conversion, truncation, slug generation, and more.",
  },
];

export default function Home() {
  const [selectedComponent, setSelectedComponent] = useState(components[0]);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      {/* Left Navigation */}
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={40}
        className="border-r bg-gray-50"
      >
        <div className="p-4 font-medium">Typescript Utilities</div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="space-y-1 p-2">
            {components.map((component) => (
              <Button
                key={component.id}
                variant={
                  selectedComponent.id === component.id ? "default" : "ghost"
                }
                className={cn(
                  "w-full justify-start text-left",
                  selectedComponent.id === component.id
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700"
                )}
                onClick={() => setSelectedComponent(component)}
              >
                {component.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Content Area */}
      <ResizablePanel defaultSize={80}>
        <div className="p-6 overflow-auto h-full">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">{selectedComponent.name}</h2>
            <p className="text-gray-600">{selectedComponent.description}</p>
          </div>

          <Card className="p-6">
            <div className="flex flex-col items-start space-y-4">
              <h3 className="text-sm font-medium text-gray-500">
                Implementation
              </h3>
              <div className="w-full">{selectedComponent.component()}</div>
            </div>
          </Card>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
