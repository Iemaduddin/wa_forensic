import sys
import export_clean_table
import get_data_forensic

try:
    database_name = sys.argv[1]
except :
    print("Please provide database name")
    
get_data_forensic.get_data(wa_type, folder_name)
export_clean_table.convert_database(database_name)
