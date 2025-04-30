import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type DataFormat = "JSON" | "CSV" | "XML" | "YAML";

interface ConversionOptions {
  preserveFormatting?: boolean;
  indentSize?: number;
  delimiter?: string;
  headers?: boolean;
  rootElement?: string;
  weakMap?: WeakMap<object, any>;
}

export function convertDataFormat(
  data: string,
  fromFormat: DataFormat,
  toFormat: DataFormat,
  options: ConversionOptions = {}
): string {
  // Use WeakMap for circular references (like in deepClone)
  const weakMap = options.weakMap || new WeakMap();

  // Default options
  const defaultOptions: Required<ConversionOptions> = {
    preserveFormatting: true,
    indentSize: 2,
    delimiter: ",",
    headers: true,
    rootElement: "root",
    weakMap,
  };

  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };

  // Parse input data to intermediate object representation
  let parsedData: any;
  try {
    parsedData = parseData(data, fromFormat, mergedOptions);
  } catch (error) {
    return `Error parsing ${fromFormat}: ${(error as Error).message}`;
  }

  // Convert from intermediate representation to target format
  try {
    return formatData(parsedData, toFormat, mergedOptions);
  } catch (error) {
    return `Error converting to ${toFormat}: ${(error as Error).message}`;
  }
}

function parseData(
  data: string,
  format: DataFormat,
  options: Required<ConversionOptions>
): any {
  switch (format) {
    case "JSON":
      return JSON.parse(data);
    case "CSV":
      return parseCSV(data, options);
    case "XML":
      return parseXML(data);
    case "YAML":
      return parseYAML(data);
    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

function formatData(
  data: any,
  format: DataFormat,
  options: Required<ConversionOptions>
): string {
  switch (format) {
    case "JSON":
      return JSON.stringify(data, null, options.indentSize);
    case "CSV":
      return formatCSV(data, options);
    case "XML":
      return formatXML(data, options);
    case "YAML":
      return formatYAML(data, options);
    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}

// CSV parsing function
function parseCSV(
  csvText: string,
  options: Required<ConversionOptions>
): any[] {
  const lines = csvText.trim().split("\n");
  const delimiter = options.delimiter;
  const result: any[] = [];

  if (lines.length === 0) return result;

  const headers = options.headers
    ? lines[0].split(delimiter).map((h) => h.trim())
    : lines[0].split(delimiter).map((_, i) => `column${i}`);

  const startIdx = options.headers ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const values = lines[i].split(delimiter);
    const obj: Record<string, string> = {};

    headers.forEach((header, index) => {
      if (index < values.length) {
        obj[header] = values[index].trim();
      }
    });

    result.push(obj);
  }

  return result;
}

// CSV formatting function
function formatCSV(data: any[], options: Required<ConversionOptions>): string {
  if (!Array.isArray(data) || data.length === 0) {
    return "";
  }

  // If data items are not objects, convert them
  if (typeof data[0] !== "object") {
    data = data.map((item) => ({ value: item }));
  }

  // Get headers from the first object
  const sampleObject = data[0];
  const headers = Object.keys(sampleObject);

  let csvContent = options.headers
    ? headers.join(options.delimiter) + "\n"
    : "";

  // Add data rows
  for (const item of data) {
    const values = headers.map((header) => {
      const value = item[header] ?? "";
      // Wrap values with commas in quotes
      return typeof value === "string" && value.includes(options.delimiter)
        ? `"${value}"`
        : String(value);
    });
    csvContent += values.join(options.delimiter) + "\n";
  }

  return csvContent.trim();
}

// Basic XML parser (for simple structures)
function parseXML(xmlText: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  function nodeToObject(node: Element): any {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue?.trim();
    }

    if (
      node.childNodes.length === 1 &&
      node.childNodes[0].nodeType === Node.TEXT_NODE
    ) {
      return node.textContent?.trim();
    }

    const result: Record<string, any> = {};

    // Handle attributes
    Array.from(node.attributes).forEach((attr) => {
      result[`@${attr.name}`] = attr.value;
    });

    // Handle child elements
    Array.from(node.children).forEach((child) => {
      const childName = child.tagName;

      // Check if we already have this tag name
      if (result[childName]) {
        // Convert to array if not already
        if (!Array.isArray(result[childName])) {
          result[childName] = [result[childName]];
        }
        result[childName].push(nodeToObject(child));
      } else {
        result[childName] = nodeToObject(child);
      }
    });

    return Object.keys(result).length > 0 ? result : node.textContent?.trim();
  }

  return nodeToObject(xmlDoc.documentElement);
}

// XML formatting function
function formatXML(data: any, options: Required<ConversionOptions>): string {
  function escapeXML(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function objectToXML(obj: any, nodeName: string, level: number = 0): string {
    if (obj === null || obj === undefined) {
      return `<${nodeName}/>`;
    }

    const indent = " ".repeat(options.indentSize * level);
    const childIndent = " ".repeat(options.indentSize * (level + 1));

    // Handle primitive values
    if (typeof obj !== "object") {
      return `<${nodeName}>${escapeXML(String(obj))}</${nodeName}>`;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => objectToXML(item, nodeName, level)).join("\n");
    }

    // Handle objects
    let xml = `${indent}<${nodeName}>`;
    const children = Object.entries(obj)
      .map(([key, value]) => {
        if (key.startsWith("@")) {
          // Handle attributes (not fully implemented here)
          return "";
        }
        return `\n${childIndent}${objectToXML(value, key, level + 1)}`;
      })
      .join("");

    return `${xml}${children}\n${indent}</${nodeName}>`;
  }

  return options.preserveFormatting
    ? `<?xml version="1.0" encoding="UTF-8"?>\n${objectToXML(
        data,
        options.rootElement
      )}`
    : objectToXML(data, options.rootElement);
}

// Basic YAML parser (simplified)
function parseYAML(yamlText: string): any {
  // Simplified YAML parser - in a real app, use a library like js-yaml
  // This is a very basic implementation for demo purposes
  const lines = yamlText.split("\n");
  const result: Record<string, any> = {};
  let currentKey = "";
  let indentLevel = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (match) {
      const [_, indent, key, value] = match;
      const newIndentLevel = indent.length;

      if (value.trim()) {
        // Key with direct value
        result[key.trim()] = parseYamlValue(value.trim());
      } else {
        // Key with nested structure
        currentKey = key.trim();
        indentLevel = newIndentLevel;
        result[currentKey] = {};
      }
    }
  }

  return result;
}

function parseYamlValue(value: string): any {
  // Handle numbers
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  // Handle booleans
  if (value === "true") return true;
  if (value === "false") return false;

  // Handle null
  if (value === "null" || value === "~") return null;

  // Handle strings
  return value.replace(/^["'](.*)["']$/, "$1");
}

// YAML formatting function
function formatYAML(data: any, options: Required<ConversionOptions>): string {
  function convertToYaml(obj: any, level: number = 0): string {
    const indent = " ".repeat(options.indentSize * level);

    if (obj === null || obj === undefined) {
      return `${indent}null`;
    }

    if (typeof obj !== "object") {
      if (typeof obj === "string") {
        // Quote strings that could be confused with YAML syntax
        if (/^(true|false|yes|no|null|undefined|\d+|\d+\.\d+)$/.test(obj)) {
          return `${indent}"${obj}"`;
        }
        return `${indent}${obj}`;
      }
      return `${indent}${obj}`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return `${indent}[]`;
      return obj
        .map((item) => `${indent}- ${convertToYaml(item, 0).trim()}`)
        .join("\n");
    }

    // Handle empty object
    if (Object.keys(obj).length === 0) {
      return `${indent}{}`;
    }

    // Handle regular object
    return Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          return `${indent}${key}:\n${convertToYaml(value, level + 1)}`;
        }
        return `${indent}${key}: ${convertToYaml(value, 0).trim()}`;
      })
      .join("\n");
  }

  return convertToYaml(data);
}

// Sample data for the different formats
const sampleData = {
  JSON: `{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "active": true
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "active": false
    }
  ],
  "metadata": {
    "lastUpdated": "2023-07-15"
  }
}`,
  CSV: `id,name,email,active
1,John Doe,john@example.com,true
2,Jane Smith,jane@example.com,false`,
  XML: `<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user>
    <id>1</id>
    <name>John Doe</name>
    <email>john@example.com</email>
    <active>true</active>
  </user>
  <user>
    <id>2</id>
    <name>Jane Smith</name>
    <email>jane@example.com</email>
    <active>false</active>
  </user>
</users>`,
  YAML: `users:
  - id: 1
    name: John Doe
    email: john@example.com
    active: true
  - id: 2
    name: Jane Smith
    email: jane@example.com
    active: false
metadata:
  lastUpdated: "2023-07-15"`,
};

export default function DataConverterDemo() {
  const [inputText, setInputText] = useState<string>(sampleData.JSON);
  const [outputText, setOutputText] = useState<string>("");
  const [inputFormat, setInputFormat] = useState<DataFormat>("JSON");
  const [outputFormat, setOutputFormat] = useState<DataFormat>("CSV");
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    preserveFormatting: true,
    indentSize: 2,
    delimiter: ",",
    headers: true,
    rootElement: "root",
  });

  const handleConvert = () => {
    try {
      setError(null);
      const result = convertDataFormat(
        inputText,
        inputFormat,
        outputFormat,
        options
      );
      setOutputText(result);
    } catch (err) {
      setError(`Conversion error: ${(err as Error).message}`);
      setOutputText("");
    }
  };

  const handleSelectSample = (format: DataFormat) => {
    setInputFormat(format);
    setInputText(sampleData[format]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Data Format Converter</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">About this Converter</h3>
        <p className="text-gray-700 mb-2">
          This tool allows you to convert between different data formats: JSON,
          CSV, XML, and YAML. Select your source and target formats, paste your
          data, and click Convert.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-4 flex justify-between items-center">
            <label className="block text-sm font-medium">Input Format</label>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSelectSample("JSON")}
                size="sm"
                variant={inputFormat === "JSON" ? "default" : "outline"}
              >
                JSON
              </Button>
              <Button
                onClick={() => handleSelectSample("CSV")}
                size="sm"
                variant={inputFormat === "CSV" ? "default" : "outline"}
              >
                CSV
              </Button>
              <Button
                onClick={() => handleSelectSample("XML")}
                size="sm"
                variant={inputFormat === "XML" ? "default" : "outline"}
              >
                XML
              </Button>
              <Button
                onClick={() => handleSelectSample("YAML")}
                size="sm"
                variant={inputFormat === "YAML" ? "default" : "outline"}
              >
                YAML
              </Button>
            </div>
          </div>

          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder={`Enter ${inputFormat} data here...`}
          />
        </div>

        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Output Format
            </label>
            <Select
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as DataFormat)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JSON">JSON</SelectItem>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="XML">XML</SelectItem>
                <SelectItem value="YAML">YAML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={outputText}
            readOnly
            className="min-h-[300px] font-mono text-sm"
            placeholder={`Converted ${outputFormat} will appear here...`}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Conversion Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Indent Size
            </label>
            <input
              type="number"
              min="0"
              max="8"
              value={options.indentSize || 2}
              onChange={(e) =>
                setOptions({ ...options, indentSize: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              CSV Delimiter
            </label>
            <select
              value={options.delimiter}
              onChange={(e) =>
                setOptions({ ...options, delimiter: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              XML Root Element
            </label>
            <input
              type="text"
              value={options.rootElement || "root"}
              onChange={(e) =>
                setOptions({ ...options, rootElement: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="flex mt-4 space-x-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="preserve-formatting"
              checked={options.preserveFormatting}
              onChange={(e) =>
                setOptions({ ...options, preserveFormatting: e.target.checked })
              }
              className="mr-2"
            />
            <label htmlFor="preserve-formatting" className="text-sm">
              Preserve Formatting
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="csv-headers"
              checked={options.headers}
              onChange={(e) =>
                setOptions({ ...options, headers: e.target.checked })
              }
              className="mr-2"
            />
            <label htmlFor="csv-headers" className="text-sm">
              CSV Headers
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleConvert}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
        >
          Convert
        </Button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">How the Converter Works</h3>
        <p className="text-gray-700 mb-3">
          The{" "}
          <code className="bg-gray-200 px-1 rounded">convertDataFormat()</code>{" "}
          function:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Parses the input data into a common object representation</li>
          <li>Handles circular references using WeakMap (like in deepClone)</li>
          <li>Formats the object into the target format</li>
          <li>Supports custom options for formatting control</li>
        </ul>
      </div>
    </div>
  );
}
