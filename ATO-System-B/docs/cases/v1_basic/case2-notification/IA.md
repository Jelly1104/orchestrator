# IA.md: 알림 발송 정보 구조

> **생성일**: 2025-12-16
> **케이스**: #2 (L1)
> **Leader**: Claude Code

---

## 1. 라우팅 구조

```
[사용자 영역]
/notifications              # 내 알림 목록

[관리자 영역]
/admin/notifications        # 알림 발송 관리
/admin/notifications/send   # 알림 발송 폼
```

## 2. 페이지 계층

```
[내 알림 목록] (/notifications)
├── [Header]
│   └── 페이지 타이틀: "알림" + 안읽은 개수 뱃지
├── [Notification List]
│   ├── [Notification Item] x N
│   │   ├── [Icon] (타입별 아이콘)
│   │   ├── [Title]
│   │   ├── [Message] (2줄 truncate)
│   │   ├── [Time] (상대 시간: 5분 전, 1시간 전)
│   │   └── [Unread Dot] (읽지 않음 표시)
│   └── [Empty State] (알림 없을 때)
└── [Footer]

[알림 발송] (/admin/notifications/send)
├── [Header]
│   └── 뒤로가기 + "알림 발송"
├── [Form]
│   ├── [Target Selector] (전체/특정 회원)
│   ├── [Type Selector] (공지/이벤트/시스템)
│   ├── [Title Input]
│   ├── [Message Textarea]
│   └── [Submit Button]
└── [Footer]
```

## 3. 데이터 흐름

```
[사용자 - 알림 조회]
→ GET /api/v1/notifications
→ DB: NOTIFICATION 조회 (U_ID 기준)
→ 목록 렌더링

[사용자 - 알림 읽음 처리]
→ PATCH /api/v1/notifications/:id/read
→ DB: READ_FLAG 업데이트
→ UI 업데이트

[관리자 - 알림 발송]
→ POST /api/v1/admin/notifications
→ DB: NOTIFICATION INSERT (대상 회원별)
→ 발송 완료 메시지
```

---

**END OF IA.md**
