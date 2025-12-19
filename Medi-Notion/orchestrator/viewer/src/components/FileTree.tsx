import React, { useMemo } from 'react';
import type { FileInfo } from '../types';

interface FileTreeProps {
  files: FileInfo[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  loading: boolean;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: FileInfo;
}

export function FileTree({ files, selectedPath, onSelect, loading }: FileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        생성된 파일이 없습니다.
      </div>
    );
  }

  return (
    <div className="p-2">
      <TreeNodeComponent
        node={tree}
        selectedPath={selectedPath}
        onSelect={onSelect}
        depth={0}
      />
    </div>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth: number;
}

function TreeNodeComponent({ node, selectedPath, onSelect, depth }: TreeNodeComponentProps) {
  const [expanded, setExpanded] = React.useState(depth < 2);

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-2 py-1 hover:bg-secondary/30 rounded flex items-center gap-1"
          style={{ paddingLeft: depth * 12 + 8 }}
        >
          <span className="text-gray-500">{expanded ? '📂' : '📁'}</span>
          <span className="font-medium">{node.name}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map(child => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const icon = getFileIcon(node.file?.ext || '');
  const isSelected = node.path === selectedPath;

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full text-left px-2 py-1 rounded flex items-center gap-1 transition-colors ${
        isSelected
          ? 'bg-secondary text-white'
          : 'hover:bg-secondary/30'
      }`}
      style={{ paddingLeft: depth * 12 + 8 }}
    >
      <span>{icon}</span>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function buildTree(files: FileInfo[]): TreeNode {
  const root: TreeNode = {
    name: 'src/analysis',
    path: '',
    isDir: true,
    children: []
  };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const partPath = parts.slice(0, i + 1).join('/');

      if (isLast) {
        current.children.push({
          name: part,
          path: file.path,
          isDir: false,
          children: [],
          file
        });
      } else {
        let dir = current.children.find(c => c.name === part && c.isDir);
        if (!dir) {
          dir = {
            name: part,
            path: partPath,
            isDir: true,
            children: []
          };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  // Sort: directories first, then files alphabetically
  const sortChildren = (node: TreeNode) => {
    node.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortChildren);
  };
  sortChildren(root);

  return root;
}

function getFileIcon(ext: string): string {
  switch (ext) {
    case '.ts':
    case '.tsx':
      return '📘';
    case '.sql':
      return '🗃️';
    case '.md':
      return '📝';
    case '.json':
      return '📋';
    default:
      return '📄';
  }
}

export default FileTree;
