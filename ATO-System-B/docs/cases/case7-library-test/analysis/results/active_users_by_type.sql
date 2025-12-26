SELECT
  U_KIND,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM USERS
WHERE U_ALIVE = 'Y'
GROUP BY U_KIND
ORDER BY user_count DESC;