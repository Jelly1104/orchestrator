-- Todo List 테이블 생성
CREATE TABLE TODO_LIST (
  TODO_ID         INT PRIMARY KEY AUTO_INCREMENT,
  U_ID            VARCHAR(14) NOT NULL,
  CONTENT         VARCHAR(500) NOT NULL,
  REG_DATE        DATETIME DEFAULT CURRENT_TIMESTAMP,
  DEL_FLAG        CHAR(1) DEFAULT 'N',
  
  -- 인덱스 생성
  INDEX idx_todo_user_status (U_ID, DEL_FLAG),
  INDEX idx_todo_reg_date (REG_DATE),
  
  -- 외래키 제약조건 (USERS 테이블 존재 시)
  CONSTRAINT FK_TODO_USER FOREIGN KEY (U_ID) REFERENCES USERS(U_ID)
);

-- 초기 테스트 데이터 (선택사항)
INSERT INTO TODO_LIST (U_ID, CONTENT, REG_DATE, DEL_FLAG) VALUES
('doc123', '첫 번째 할일입니다', NOW(), 'N'),
('doc123', '두 번째 할일입니다', NOW(), 'N'),
('doc456', '다른 사용자의 할일', NOW(), 'N');