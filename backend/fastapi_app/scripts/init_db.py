import os
import sys
import psycopg2
from dotenv import load_dotenv, find_dotenv

def main():
    """
    Connects to the database and executes the SQL script to create tables.
    """
    print(" Starting database schema initialization...")
    env_file_path = find_dotenv() 
    if not env_file_path:
        print(" ERROR: Could not find the .env file.")
        print("   Please ensure a .env file exists in your 'backend' project root directory.")
        sys.exit(1)

    print(f"[*] Found .env file at: {env_file_path}")
    load_dotenv(dotenv_path=env_file_path)

    # --- GET CONNECTION STRING ---
    conn_string = os.getenv("SUPABASE_DB_CONNECTION_STRING")
    if not conn_string:
        print(" ERROR: SUPABASE_DB_CONNECTION_STRING not found in your .env file.")
        print("   Please double-check the variable name and the file content.")
        sys.exit(1)

    # --- GET SQL SCRIPT PATH ---
    project_root = os.path.dirname(env_file_path)
    sql_file_path = os.path.join(project_root, 'database_setup.sql')
    if not os.path.exists(sql_file_path):
        print(f" ERROR: SQL setup file not found at {sql_file_path}")
        sys.exit(1)

    print(f"[*] Found SQL script at: {sql_file_path}")
    conn = None
    cur = None
    try:
        # --- CONNECT AND EXECUTE SQL ---
        print("[*] Connecting to the database...")
        conn = psycopg2.connect(conn_string)
        cur = conn.cursor()
        print("[*] Connection successful. Executing SQL script...")

        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
            cur.execute(sql_script)

        conn.commit()
        print(" Database schema initialized successfully.")

    except psycopg2.Error as e:
        print(f"\n DATABASE ERROR: {e}")
        if "password authentication failed" in str(e):
            print("   Hint: Please double-check your database password in the .env file.")
        sys.exit(1)
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
        print("[*] Database connection closed.")

if __name__ == "__main__":
    main()

