-- TODO_LIST 테이블 생성
CREATE TABLE IF NOT EXISTS TODO_LIST (
  TODO_ID         INT PRIMARY KEY AUTO_INCREMENT,
  U_ID            VARCHAR(14) NOT NULL,
  CONTENT         VARCHAR(500) NOT NULL,
  REG_DATE        DATETIME DEFAULT NOW(),
  DEL_FLAG        CHAR(1) DEFAULT 'N',
  
  -- 인덱스 최적화
  INDEX idx_user_active (U_ID, DEL_FLAG),
  INDEX idx_reg_date (REG_DATE),
  
  -- 외래키 제약조건 (USERS 테이블 존재 시)
  CONSTRAINT FK_TODO_USER FOREIGN KEY (U_ID) REFERENCES USERS(U_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 테스트 데이터 (선택사항)
INSERT IGNORE INTO TODO_LIST (U_ID, CONTENT, REG_DATE, DEL_FLAG) VALUES
('test_user', '첫 번째 할일입니다', NOW(), 'N'),
('test_user', '두 번째 할일입니다', NOW(), 'N'),
('test_user', '완료된 할일입니다', NOW(), 'Y');