import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Define types for common string manipulation functions
type CaseType =
  | "upper"
  | "lower"
  | "title"
  | "camel"
  | "snake"
  | "kebab"
  | "pascal";
type TrimType = "both" | "start" | "end" | "all";
type PadType = "start" | "end" | "both";

interface StringOptions {
  locale?: string;
  preserveFormatting?: boolean;
  wordSeparator?: string;
  weakMap?: WeakMap<object, any>;
}

// Main string manipulation function
export function manipulateString(
  text: string,
  operation: string,
  options: StringOptions = {}
): string {
  // Use WeakMap for tracking complex references (similar to deepClone)
  const weakMap = options.weakMap || new WeakMap();

  // Default options
  const defaultOptions: Required<StringOptions> = {
    locale: "en-US",
    preserveFormatting: true,
    wordSeparator: " ",
    weakMap,
  };

  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };

  try {
    // Process based on operation type
    switch (operation) {
      case "reverse":
        return reverseString(text, mergedOptions);
      case "trim":
        return trimString(text, "both", mergedOptions);
      case "truncate":
        return truncateString(text, 10, "...", mergedOptions);
      case "capitalize":
        return capitalizeString(text, mergedOptions);
      case "changeCase":
        return changeCase(text, "title", mergedOptions);
      case "pad":
        return padString(text, 20, " ", "both", mergedOptions);
      case "extract":
        return extractSubstring(text, 0, 10, mergedOptions);
      case "count":
        return countOccurrences(text, "a", mergedOptions).toString();
      case "slugify":
        return slugify(text, mergedOptions);
      case "template":
        return parseTemplate(text, { name: "World" }, mergedOptions);
      default:
        return text;
    }
  } catch (error) {
    return `Error: ${(error as Error).message}`;
  }
}

// ===== Core string manipulation functions =====

// Reverse a string
export function reverseString(
  text: string,
  options: Required<StringOptions>
): string {
  if (!text) return "";

  if (options.preserveFormatting) {
    // Preserve line breaks when reversing
    return text
      .split("\n")
      .map((line) => line.split("").reverse().join(""))
      .join("\n");
  }

  return text.split("").reverse().join("");
}

// Trim a string
export function trimString(
  text: string,
  type: TrimType = "both",
  options: Required<StringOptions>
): string {
  if (!text) return "";

  switch (type) {
    case "both":
      return text.trim();
    case "start":
      return text.trimStart();
    case "end":
      return text.trimEnd();
    case "all":
      // Remove all whitespace
      return text.replace(/\s+/g, "");
    default:
      return text;
  }
}

// Truncate a string
export function truncateString(
  text: string,
  maxLength: number = 30,
  suffix: string = "...",
  options: Required<StringOptions>
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  // If preserve formatting, try to truncate at a word boundary
  if (options.preserveFormatting) {
    // Find the last space before maxLength
    const lastSpace = text.lastIndexOf(" ", maxLength);
    if (lastSpace > 0) {
      return text.substring(0, lastSpace) + suffix;
    }
  }

  return text.substring(0, maxLength) + suffix;
}

// Capitalize a string
export function capitalizeString(
  text: string,
  options: Required<StringOptions>
): string {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Change case of a string
export function changeCase(
  text: string,
  caseType: CaseType = "lower",
  options: Required<StringOptions>
): string {
  if (!text) return "";

  switch (caseType) {
    case "upper":
      return text.toUpperCase();

    case "lower":
      return text.toLowerCase();

    case "title":
      // Title case (capitalize each word)
      return text
        .split(options.wordSeparator)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(options.wordSeparator);

    case "camel":
      // camelCase
      return text
        .split(/[\s_-]+/)
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");

    case "snake":
      // snake_case
      return text
        .replace(/([A-Z])/g, "_$1") // Add underscore before capital letters
        .toLowerCase()
        .replace(/[\s-]+/g, "_") // Replace spaces and hyphens with underscores
        .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores

    case "kebab":
      // kebab-case
      return text
        .replace(/([A-Z])/g, "-$1") // Add hyphen before capital letters
        .toLowerCase()
        .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    case "pascal":
      // PascalCase
      return text
        .split(/[\s_-]+/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");

    default:
      return text;
  }
}

// Pad a string
export function padString(
  text: string,
  length: number = 10,
  padChar: string = " ",
  padType: PadType = "end",
  options: Required<StringOptions>
): string {
  if (text.length >= length) return text;

  const padLength = length - text.length;

  switch (padType) {
    case "start":
      return padChar.repeat(padLength) + text;
    case "end":
      return text + padChar.repeat(padLength);
    case "both":
      const startPad = padChar.repeat(Math.floor(padLength / 2));
      const endPad = padChar.repeat(Math.ceil(padLength / 2));
      return startPad + text + endPad;
    default:
      return text;
  }
}

// Extract a substring
export function extractSubstring(
  text: string,
  startIndex: number,
  endIndex: number | undefined,
  options: Required<StringOptions>
): string {
  if (!text) return "";

  // Handle negative indices (like Python)
  if (startIndex < 0) startIndex = text.length + startIndex;
  if (endIndex !== undefined && endIndex < 0) endIndex = text.length + endIndex;

  return text.substring(startIndex, endIndex);
}

// Count occurrences of a substring
export function countOccurrences(
  text: string,
  searchString: string,
  options: Required<StringOptions>
): number {
  if (!text || !searchString) return 0;

  const regex = new RegExp(
    searchString,
    options.preserveFormatting ? "g" : "gi"
  );
  const matches = text.match(regex);

  return matches ? matches.length : 0;
}

// Slugify a string
export function slugify(
  text: string,
  options: Required<StringOptions>
): string {
  if (!text) return "";

  return text
    .normalize("NFD") // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, hyphens with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Parse template string
export function parseTemplate(
  template: string,
  data: Record<string, any>,
  options: Required<StringOptions>
): string {
  if (!template) return "";

  // Track processed objects to handle circular references (like in deepClone)
  // This is important for nested template data
  if (options.weakMap.has(data)) {
    return options.weakMap.get(data);
  }

  options.weakMap.set(data, template);

  // Replace {"{"}key{"}"} with data[key]
  return template.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();

    // Handle nested properties with dot notation
    if (trimmedKey.includes(".")) {
      const parts = trimmedKey.split(".");
      let value = data;

      for (const part of parts) {
        if (value === undefined || value === null) return match;
        value = value[part];
      }

      // Recursively process objects and arrays
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
      }

      return value !== undefined ? String(value) : match;
    }

    // Simple key lookup
    const value = data[trimmedKey];

    if (value === undefined) return match;

    // Handle nested objects
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

// Demo implementation of string utilities
export default function StringUtilsDemo() {
  const [inputText, setInputText] = useState<string>(
    "Hello world! This is a test string."
  );
  const [operation, setOperation] = useState<string>("changeCase");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Options specific to operations
  const [caseType, setCaseType] = useState<CaseType>("title");
  const [trimType, setTrimType] = useState<TrimType>("both");
  const [padType, setPadType] = useState<PadType>("end");
  const [padChar, setPadChar] = useState<string>(" ");
  const [padLength, setPadLength] = useState<number>(20);
  const [truncateLength, setTruncateLength] = useState<number>(10);
  const [truncateSuffix, setTruncateSuffix] = useState<string>("...");
  const [searchString, setSearchString] = useState<string>("a");
  const [startIndex, setStartIndex] = useState<number>(0);
  const [endIndex, setEndIndex] = useState<number>(10);
  const [templateData, setTemplateData] = useState<string>(
    '{"name":"World","greeting":"Hello"}'
  );

  // Common options
  const [preserveFormatting, setPreserveFormatting] = useState<boolean>(true);

  const handleOperation = () => {
    try {
      setError(null);
      let result = "";

      // Apply the selected operation with specific parameters
      switch (operation) {
        case "changeCase":
          result = changeCase(inputText, caseType, {
            preserveFormatting,
            wordSeparator: " ",
            locale: "en-US",
            weakMap: new WeakMap(),
          });
          break;

        case "trim":
          result = trimString(inputText, trimType, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          });
          break;

        case "pad":
          result = padString(inputText, padLength, padChar, padType, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          });
          break;

        case "truncate":
          result = truncateString(inputText, truncateLength, truncateSuffix, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          });
          break;

        case "reverse":
          result = reverseString(inputText, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          });
          break;

        case "count":
          result = countOccurrences(inputText, searchString, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          }).toString();
          break;

        case "extract":
          result = extractSubstring(inputText, startIndex, endIndex, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          });
          break;

        case "slugify":
          result = slugify(inputText, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          });
          break;

        case "template":
          let templateDataObj: Record<string, any> = {};
          try {
            templateDataObj = JSON.parse(templateData);
          } catch (e) {
            throw new Error("Invalid template data JSON");
          }

          result = parseTemplate(inputText, templateDataObj, {
            preserveFormatting,
            locale: "en-US",
            wordSeparator: " ",
            weakMap: new WeakMap(),
          });
          break;

        default:
          result = inputText;
      }

      setResult(result);
    } catch (err) {
      setError(`Operation error: ${(err as Error).message}`);
      setResult("");
    }
  };

  // Update result when input changes
  useEffect(() => {
    handleOperation();
  }, [
    operation,
    caseType,
    trimType,
    padType,
    padChar,
    padLength,
    truncateLength,
    truncateSuffix,
    searchString,
    startIndex,
    endIndex,
    preserveFormatting,
  ]);

  // Sample text options
  const handleSampleText = (sample: string) => {
    switch (sample) {
      case "hello":
        setInputText("Hello world! This is a test string.");
        break;
      case "lorem":
        setInputText(
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        );
        break;
      case "multiline":
        setInputText(
          "This is line one.\nThis is line two.\nThis is line three."
        );
        break;
      case "mixed":
        setInputText("MIXED case Text with-different_separators");
        break;
      case "template":
        setInputText("Hello {{name}}! Your message: {{message}}");
        setTemplateData('{"name":"User","message":"Welcome to string utils!"}');
        setOperation("template");
        break;
    }
  };

  // Render the operation-specific controls
  const renderOperationControls = () => {
    switch (operation) {
      case "changeCase":
        return (
          <div className="mb-4">
            <Label className="block mb-2">Case Type</Label>
            <Select
              value={caseType}
              onValueChange={(value) => setCaseType(value as CaseType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upper">UPPERCASE</SelectItem>
                <SelectItem value="lower">lowercase</SelectItem>
                <SelectItem value="title">Title Case</SelectItem>
                <SelectItem value="camel">camelCase</SelectItem>
                <SelectItem value="snake">snake_case</SelectItem>
                <SelectItem value="kebab">kebab-case</SelectItem>
                <SelectItem value="pascal">PascalCase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "trim":
        return (
          <div className="mb-4">
            <Label className="block mb-2">Trim Type</Label>
            <Select
              value={trimType}
              onValueChange={(value) => setTrimType(value as TrimType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select trim type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both ends</SelectItem>
                <SelectItem value="start">Start only</SelectItem>
                <SelectItem value="end">End only</SelectItem>
                <SelectItem value="all">All whitespace</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "pad":
        return (
          <div className="space-y-4">
            <div>
              <Label className="block mb-2">Pad Type</Label>
              <Select
                value={padType}
                onValueChange={(value) => setPadType(value as PadType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select pad type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Pad Start</SelectItem>
                  <SelectItem value="end">Pad End</SelectItem>
                  <SelectItem value="both">Pad Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Pad Character</Label>
                <Input
                  type="text"
                  value={padChar}
                  maxLength={1}
                  onChange={(e) => setPadChar(e.target.value || " ")}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="block mb-2">Target Length</Label>
                <Input
                  type="number"
                  value={padLength}
                  min={1}
                  onChange={(e) => setPadLength(parseInt(e.target.value) || 10)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case "truncate":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block mb-2">Max Length</Label>
              <Input
                type="number"
                value={truncateLength}
                min={1}
                onChange={(e) =>
                  setTruncateLength(parseInt(e.target.value) || 10)
                }
                className="w-full"
              />
            </div>

            <div>
              <Label className="block mb-2">Suffix</Label>
              <Input
                type="text"
                value={truncateSuffix}
                onChange={(e) => setTruncateSuffix(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        );

      case "count":
        return (
          <div className="mb-4">
            <Label className="block mb-2">Search String</Label>
            <Input
              type="text"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              className="w-full"
              placeholder="Enter text to count"
            />
          </div>
        );

      case "extract":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block mb-2">Start Index</Label>
              <Input
                type="number"
                value={startIndex}
                onChange={(e) => setStartIndex(parseInt(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            <div>
              <Label className="block mb-2">End Index</Label>
              <Input
                type="number"
                value={endIndex}
                onChange={(e) => setEndIndex(parseInt(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>
        );

      case "template":
        return (
          <div className="mb-4">
            <Label className="block mb-2">Template Data (JSON)</Label>
            <Textarea
              value={templateData}
              onChange={(e) => setTemplateData(e.target.value)}
              className="font-mono text-sm"
              rows={4}
              placeholder="Enter JSON data for template"
            />
            <div className="mt-2 text-xs text-gray-500">
              Use {"{"}key{"}"} syntax in the input text as placeholders
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">String Utilities</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">About String Utils</h3>
        <p className="text-gray-700">
          This utility provides a collection of string manipulation functions
          that follow the same pattern as deepClone and data converters. Select
          an operation and customize how you want to transform your text.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSampleText("hello")}
        >
          Sample: Hello
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSampleText("lorem")}
        >
          Sample: Lorem
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSampleText("multiline")}
        >
          Sample: Multiline
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSampleText("mixed")}
        >
          Sample: Mixed Case
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSampleText("template")}
        >
          Sample: Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-4">
            <Label className="block mb-2">Input Text</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
              placeholder="Enter text to manipulate..."
            />
          </div>

          <div className="mb-4">
            <Label className="block mb-2">Operation</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="changeCase">Change Case</SelectItem>
                <SelectItem value="trim">Trim</SelectItem>
                <SelectItem value="pad">Pad</SelectItem>
                <SelectItem value="truncate">Truncate</SelectItem>
                <SelectItem value="reverse">Reverse</SelectItem>
                <SelectItem value="count">Count Occurrences</SelectItem>
                <SelectItem value="extract">Extract Substring</SelectItem>
                <SelectItem value="slugify">Slugify</SelectItem>
                <SelectItem value="template">Template Parser</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderOperationControls()}

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="preserve-formatting"
              checked={preserveFormatting}
              onChange={(e) => setPreserveFormatting(e.target.checked)}
              className="mr-2"
            />
            <Label htmlFor="preserve-formatting">Preserve Formatting</Label>
          </div>
        </div>

        <div>
          <Label className="block mb-2">Result</Label>
          <Textarea
            value={result}
            readOnly
            className="min-h-[300px] font-mono text-sm bg-gray-50"
          />

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">How String Utils Works</h3>
        <p className="text-gray-700 mb-3">
          The{" "}
          <code className="bg-gray-200 px-1 rounded">manipulateString()</code>{" "}
          function follows the same pattern as
          <code className="bg-gray-200 px-1 rounded">deepClone()</code> and{" "}
          <code className="bg-gray-200 px-1 rounded">convertDataFormat()</code>:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>
            Takes input data (string) and transforms it based on operation type
          </li>
          <li>Handles options with sensible defaults</li>
          <li>Uses WeakMap for complex references (template processing)</li>
          <li>
            Provides specialized processing functions for each operation type
          </li>
          <li>Maintains consistent API pattern across different operations</li>
        </ul>
      </div>
    </div>
  );
}
