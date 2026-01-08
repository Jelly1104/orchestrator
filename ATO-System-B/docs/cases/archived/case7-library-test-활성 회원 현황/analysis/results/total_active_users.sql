SELECT COUNT(*) as active_user_count
FROM USERS
WHERE U_ALIVE = 'Y';