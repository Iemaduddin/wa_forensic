import sys
import export_clean_table

try:
    database_name = sys.argv[1]
    folder_name = sys.argv[2]
except :
    print("Please provide folder name and database name")
    
export_clean_table.convert_database(database_name)
