import React from "react";
import type { Category } from "../types";

interface CategoryListProps {
  categories: Category[];
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리</h3>
      <ul className="space-y-3">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-start gap-3 rounded-md border border-gray-100 p-3 hover:border-gray-200"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-800 uppercase">
              {category.name.slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{category.name}</p>
              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
