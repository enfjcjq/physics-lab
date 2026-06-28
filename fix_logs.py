import sqlite3, os
DB = r"C:\Users\lenovo\.codex\logs_2.sqlite"
conn = sqlite3.connect(DB)
c = conn.cursor()

c.execute("PRAGMA wal_checkpoint(TRUNCATE)")
print("WAL checkpoint:", c.fetchone())

c.execute("DROP TRIGGER IF EXISTS throttle_trace_logs")
c.execute("""
    CREATE TRIGGER throttle_trace_logs
    BEFORE INSERT ON logs
    WHEN NEW.level = 'TRACE'
    BEGIN
        SELECT CASE
            WHEN (SELECT COUNT(*) FROM logs 
                  WHERE level = 'TRACE' 
                  AND ts > (CAST(strftime('%s','now') AS INTEGER) * 1000) - 200
            ) > 50
            THEN RAISE(IGNORE)
        END;
    END;
""")
print("Trigger created")

c.execute("PRAGMA auto_vacuum = FULL")
c.execute("VACUUM")
conn.close()
print(f"DB size: {os.path.getsize(DB)/1024/1024:.1f} MB (was 95.9 MB)")

conn2 = sqlite3.connect(DB)
c2 = conn2.cursor()
c2.execute("SELECT COUNT(*), MAX(id) FROM logs")
r = c2.fetchone()
print(f"Rows: {r[0]}, MAX(id): {r[1]}")
for ext in ['-wal','-shm']:
    p = DB + ext
    if os.path.exists(p):
        print(f"{os.path.basename(p)}: {os.path.getsize(p)/1024:.1f} MB")
conn2.close()
print("Done - restart Codex now")
