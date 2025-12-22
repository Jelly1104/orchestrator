import React from 'react';

interface CodeViewerProps {
  content: string;
  filename: string;
  language: string;
}

export function CodeViewer({ content, filename, language }: CodeViewerProps) {
  const lines = content.split('\n');

  return (
    <div className="p-6">
      <div className="mb-4 pb-4 border-b border-dark-border flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">{filename}</h2>
        <span className="text-sm text-gray-500">
          {language.toUpperCase()} • {lines.length} lines
        </span>
      </div>

      <div className="bg-dark-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <pre className="p-4">
            <code className={`language-${language}`}>
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-12 pr-4 text-right text-gray-600 select-none flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 whitespace-pre">
                    {highlightLine(line, language)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 구문 강조
 */
function highlightLine(line: string, language: string): React.ReactNode {
  if (language === 'sql') {
    return highlightSQL(line);
  }
  if (language === 'ts' || language === 'typescript') {
    return highlightTS(line);
  }
  return line;
}

function highlightSQL(line: string): React.ReactNode {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
    'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'IN',
    'NOT', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN',
    'ELSE', 'END', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'WITH',
    'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX'
  ];

  // 주석
  if (line.trim().startsWith('--')) {
    return <span className="text-gray-500">{line}</span>;
  }

  // 키워드 강조
  let result = line;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="text-blue-400 font-medium">
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (parts.length === 0) return line;

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return <>{parts}</>;
}

function highlightTS(line: string): React.ReactNode {
  const keywords = [
    'import', 'export', 'from', 'const', 'let', 'var', 'function', 'class',
    'interface', 'type', 'extends', 'implements', 'return', 'if', 'else',
    'for', 'while', 'async', 'await', 'new', 'this', 'try', 'catch', 'throw',
    'public', 'private', 'protected', 'static', 'readonly', 'true', 'false',
    'null', 'undefined', 'typeof', 'instanceof'
  ];

  // 주석
  if (line.trim().startsWith('//')) {
    return <span className="text-gray-500">{line}</span>;
  }

  let result = line;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="text-purple-400">
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (parts.length === 0) return line;

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return <>{parts}</>;
}

export default CodeViewer;
