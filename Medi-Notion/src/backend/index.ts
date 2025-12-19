/**
 * 공지사항 API 서버
 * @see docs/case1-notice-list/SDD.md
 */

import express from "express";
import cors from "cors";
import noticeRouter from "./routes/notice";
import notificationRouter from "./routes/notification";
import adminNotificationRouter from "./routes/admin/notification";
import insightRouter from "./routes/insight";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/notice", noticeRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/admin/notifications", adminNotificationRouter);

// Dr Insight (case-3)
app.use("/api", insightRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "서버 오류가 발생했습니다.",
      },
    });
  }
);

// NOTE: 테스트에서 import 시 서버가 자동으로 뜨지 않도록, 직접 실행할 때만 listen 합니다.
// @see docs/case-3-dr-insight/SDD.md
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
