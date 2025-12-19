import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

// Mermaid 초기화
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#e94560',
    primaryTextColor: '#fff',
    primaryBorderColor: '#333',
    lineColor: '#888',
    secondaryColor: '#0f3460',
    tertiaryColor: '#16213e'
  }
});

interface DocViewerProps {
  content: string;
  filename: string;
}

export function DocViewer({ content, filename }: DocViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mermaid 다이어그램 렌더링
  useEffect(() => {
    if (containerRef.current) {
      const mermaidBlocks = containerRef.current.querySelectorAll('.mermaid');
      mermaidBlocks.forEach(async (block, index) => {
        try {
          const code = block.textContent || '';
          const { svg } = await mermaid.render(`mermaid-${index}`, code);
          block.innerHTML = svg;
        } catch (e) {
          console.error('Mermaid render error:', e);
        }
      });
    }
  }, [content]);

  return (
    <div className="p-6">
      <div className="mb-4 pb-4 border-b border-dark-border">
        <h2 className="text-xl font-bold text-primary">{filename}</h2>
      </div>

      <div ref={containerRef} className="prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 코드 블록 커스텀 렌더링
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              // Mermaid 다이어그램
              if (language === 'mermaid') {
                return (
                  <div className="mermaid bg-dark-card p-4 rounded-lg overflow-x-auto">
                    {String(children).replace(/\n$/, '')}
                  </div>
                );
              }

              // 인라인 코드
              if (inline) {
                return (
                  <code className="bg-dark-card px-1.5 py-0.5 rounded text-primary" {...props}>
                    {children}
                  </code>
                );
              }

              // 코드 블록
              return (
                <pre className="bg-dark-card p-4 rounded-lg overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },

            // 테이블 스타일링
            table({ children }) {
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    {children}
                  </table>
                </div>
              );
            },
            th({ children }) {
              return (
                <th className="border border-dark-border bg-dark-card px-4 py-2 text-left">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="border border-dark-border px-4 py-2">
                  {children}
                </td>
              );
            },

            // 링크
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {children}
                </a>
              );
            },

            // 헤딩
            h1({ children }) {
              return <h1 className="text-2xl font-bold mt-6 mb-4 text-white">{children}</h1>;
            },
            h2({ children }) {
              return <h2 className="text-xl font-bold mt-5 mb-3 text-white">{children}</h2>;
            },
            h3({ children }) {
              return <h3 className="text-lg font-semibold mt-4 mb-2 text-white">{children}</h3>;
            },

            // 리스트
            ul({ children }) {
              return <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>;
            },

            // 인용
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-gray-400">
                  {children}
                </blockquote>
              );
            },

            // 구분선
            hr() {
              return <hr className="border-dark-border my-6" />;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default DocViewer;
