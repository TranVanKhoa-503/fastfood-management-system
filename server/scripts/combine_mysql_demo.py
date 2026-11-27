from pathlib import Path


SERVER_DIR = Path(__file__).resolve().parents[1]
SQL_DIR = SERVER_DIR / "sql" / "mysql"
SCHEMA_FILE = SQL_DIR / "fastfood_demo_mysql.sql"
QUERIES_FILE = SQL_DIR / "fastfood_demo_queries.sql"
FULL_FILE = SQL_DIR / "fastfood_demo_full.sql"
SEPARATOR = "\n\n-- ============================================================\n-- QUERY WORKBOOK: 28 SQL examples\n-- ============================================================\n\n"


def main() -> None:
    for required_file in (SCHEMA_FILE, QUERIES_FILE):
        if not required_file.is_file():
            raise SystemExit(f"Required SQL component not found: {required_file}")

    schema = SCHEMA_FILE.read_text(encoding="utf-8").rstrip()
    queries = QUERIES_FILE.read_text(encoding="utf-8").lstrip()
    with FULL_FILE.open("w", encoding="utf-8", newline="\n") as output:
        output.write(schema)
        output.write(SEPARATOR)
        output.write(queries)

    print(f"Wrote {FULL_FILE} ({FULL_FILE.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
