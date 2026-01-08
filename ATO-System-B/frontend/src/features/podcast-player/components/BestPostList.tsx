// BestPostList.tsx - 베스트 게시물 목록 컴포넌트 (SDD.md 명세 준수)

import type { BestPostListProps } from '../types';

export function BestPostList({ posts, onPostClick }: BestPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        오늘의 베스트 게시물이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        오늘의 베스트 TOP 5
      </h3>
      <ul className="space-y-2">
        {posts.map((post, index) => (
          <li
            key={post.BOARD_IDX}
            onClick={() => onPostClick(index)}
            className="flex justify-between items-center p-3 bg-white hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-sm text-gray-800 truncate">
                {post.TITLE.length > 25 ? `${post.TITLE.slice(0, 25)}...` : post.TITLE}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <span className="text-yellow-500">&#9733;</span>
              <span className="text-sm font-semibold text-gray-700">
                {post.engagement_score}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
