/**
 * DataTable - 분석 결과 테이블 시각화
 *
 * Phase 4: 분석 결과 시각화
 *
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';

interface Column {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  data: Record<string, any>[];
  pageSize?: number;
  sortable?: boolean;
  searchable?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  pageSize = 10,
  sortable = true,
  searchable = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key];
        return value?.toString().toLowerCase().includes(term);
      })
    );
  }, [data, columns, searchTerm]);

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortOrder]);

  // 페이지네이션
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const formatValue = (col: Column, value: any): string => {
    if (value === null || value === undefined) return '-';
    if (col.format) return col.format(value);
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  return (
    <div className="bg-[#16213e] rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}

        {searchable && (
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-[#1a1a2e] border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560]"
          />
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0f3460]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-sm font-medium text-gray-300 ${
                    sortable ? 'cursor-pointer hover:bg-[#16213e]' : ''
                  }`}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left'
                  }}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortable && sortKey === col.key && (
                      <span className="text-[#e94560]">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-700 hover:bg-[#1a1a2e] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-gray-300"
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {formatValue(col, row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            총 {sortedData.length}건 중 {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, sortedData.length)}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm rounded bg-[#1a1a2e] text-gray-300 disabled:opacity-50 hover:bg-[#0f3460]"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm rounded bg-[#1a1a2e] text-gray-300 disabled:opacity-50 hover:bg-[#0f3460]"
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3
                ? i + 1
                : currentPage >= totalPages - 2
                  ? totalPages - 4 + i
                  : currentPage - 2 + i;

              if (page < 1 || page > totalPages) return null;

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    page === currentPage
                      ? 'bg-[#e94560] text-white'
                      : 'bg-[#1a1a2e] text-gray-300 hover:bg-[#0f3460]'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm rounded bg-[#1a1a2e] text-gray-300 disabled:opacity-50 hover:bg-[#0f3460]"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm rounded bg-[#1a1a2e] text-gray-300 disabled:opacity-50 hover:bg-[#0f3460]"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
