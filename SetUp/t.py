import sqlite3

# Replace with your actual database file path
database_path = 'database/astar.db'

def inspect_database(db_path):
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    if not tables:
        print("No tables found in the database.")
        return

    print("Tables in the database:")
    for table in tables:
        table_name = table[0]
        print(f"\n🧱 Structure of table '{table_name}':")

        # Get table structure
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()

        for column in columns:
            cid, name, datatype, notnull, dflt_value, pk = column
            print(f"  Column: {name}, Type: {datatype}, Not Null: {bool(notnull)}, "
                  f"Default: {dflt_value}, Primary Key: {bool(pk)}")

        # Get table contents (limit to 10 rows)
        print(f"\n📄 Contents of table '{table_name}' (up to 25 rows):")
        try:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 25;")
            rows = cursor.fetchall()
            if rows:
                for row in rows:
                    print("  ", row)
            else:
                print("  (No data found)")
        except Exception as e:
            print(f"  Could not read data from {table_name}: {e}")

    # Close connection
    conn.close()

# Run the function
inspect_database(database_path)
