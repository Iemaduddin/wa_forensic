import sys
import export_clean_table

try:
    database_name = sys.argv[1]
except :
    print("Please provide database name")
    
export_clean_table.convert_database(database_name)
