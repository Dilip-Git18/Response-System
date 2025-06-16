import sqlite3

conn = sqlite3.connect('database/astar.db')
c = conn.cursor()

# Ensure the table exists
c.execute('''CREATE TABLE IF NOT EXISTS grid (
    x INTEGER,
    y INTEGER,
    city TEXT,
    is_obstacle INTEGER
)''')

# Fill 10x10 grid if missing
for y in range(10):
    for x in range(10):
        c.execute("SELECT 1 FROM grid WHERE x=? AND y=?", (x, y))
        if not c.fetchone():
            c.execute("INSERT INTO grid (x, y, city, is_obstacle) VALUES (?, ?, ?, ?)",
                      (x, y, f"City{x}_{y}", 0))  # Change naming as needed

conn.commit()
conn.close()
