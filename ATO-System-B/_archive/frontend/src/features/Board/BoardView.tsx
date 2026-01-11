// 프론트엔드 컴포넌트

import React, { useEffect, useState } from 'react';

interface Board {
  BOARD_IDX: number;
  TITLE: string;
  CONTENT: string;
  REG_DATE: string;
}

const BoardView: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    fetch('/api/boards')
      .then((response) => response.json())
      .then((data) => setBoards(data))
      .catch((error) => console.error('Error fetching boards:', error));
  }, []);

  return (
    <div>
      <h1>Boards</h1>
      <ul>
        {boards.map((board) => (
          <li key={board.BOARD_IDX}>
            <h2>{board.TITLE}</h2>
            <p>{board.CONTENT}</p>
            <small>{new Date(board.REG_DATE).toLocaleDateString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BoardView;