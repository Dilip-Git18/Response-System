import sqlite3
from werkzeug.security import generate_password_hash

# Replace this with your secure admin key
ADMIN_KEY = 'JAM18'

conn = sqlite3.connect('database/admin_auth.db')
c = conn.cursor()

c.execute('''
CREATE TABLE IF NOT EXISTS admin_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_hash TEXT NOT NULL
)
''')

# Hash the admin key
hashed_key = generate_password_hash(ADMIN_KEY)

# Insert the hashed key
c.execute("INSERT INTO admin_keys (key_hash) VALUES (?)", (hashed_key,))

conn.commit()
conn.close()

print("Database created and hashed key stored!")
