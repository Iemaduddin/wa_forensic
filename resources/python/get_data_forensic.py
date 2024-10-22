import subprocess
import os
from datetime import datetime
import sys

try:
    wa_type = sys.argv[1]
    folder_name = sys.argv[2]
except :
    print("Please provide wa type and folder name")

def get_data( wa_type, folder_name):

    # Langkah-langkah ADB commands
    commands = [
        # # 1. Buat folder dengan hak akses root
        # f"adb shell mkdir /storage/self/primary/{folder_name}",

        # # 2. Copy data WhatsApp (Database) ke directory primary HP dengan hak akses root
        # f"adb shell 'su -c \"cp -r /data/data/com.whatsapp/ /storage/self/primary/{folder_name}/\"'" if wa_type == 'wa_regular' 
        #     else f"adb shell 'su -c \"cp -r /data/data/com.whatsapp.w4b/ /storage/self/primary/{folder_name}/\"'",

        # # 3. Copy data WhatsApp (Media) ke directory primary HP dengan hak akses root
        # f"adb shell cp -r /storage/self/primary/WhatsApp/ /storage/self/primary/{folder_name}/" if wa_type == 'wa_regular' 
        #     else f"adb shell cp -r /storage/self/primary/WhatsApp\\ Business/ /storage/self/primary/{folder_name}/",

        # # 4. Pull data ke Desktop (tidak perlu `su root`)
        # f"adb pull /storage/self/primary/{folder_name}/ ~/Desktop/",

        # # 5. Copy database msgstore.db ke directory project web forensic (tidak perlu `adb shell`)
        # f"cp ~/Desktop/{folder_name}/com.whatsapp/databases/msgstore.db ~/Desktop/wa_forensic/resources/python/msgstore.db" if wa_type == 'wa_regular' 
        #     else f"cp ~/Desktop/{folder_name}/com.whatsapp.w4b/databases/msgstore.db ~/Desktop/wa_forensic/resources/python/msgstore.db",
        
        #         # 5. Copy database wa.db ke directory project web forensic (tidak perlu `adb shell`)
        # f"cp ~/Desktop/{folder_name}/com.whatsapp/databases/wa.db ~/Desktop/wa_forensic/resources/python/wa.db" if wa_type == 'wa_regular' 
        #     else f"cp ~/Desktop/{folder_name}/com.whatsapp.w4b/databases/wa.db ~/Desktop/wa_forensic/resources/python/wa.db",


        # # 6. Copy data WhatsApp (Media) ke directory project (tidak perlu `adb shell`)
        # f"cp -r ~/Desktop/{folder_name}/WhatsApp/Media ~/Desktop/wa_forensic/public/" if wa_type == 'wa_regular'
        #     else f"cp -r ~/Desktop/{folder_name}/WhatsApp\\ Business/Media ~/Desktop/wa_forensic/public/",

        # # 7. Buat zip dari folder {folder_name} di Desktop (tidak perlu `adb shell`)
        f"zip -r ~/Desktop/{folder_name}.zip ~/Desktop/{folder_name}",

        # # 8. Hapus folder {folder_name} di perangkat dengan hak akses root
        # f"adb shell rm -rf /storage/self/primary/{folder_name}"
    ]

    # Eksekusi perintah satu per satu
    for cmd in commands:
        run_command(cmd)

# Fungsi untuk menjalankan perintah shell
def run_command(command):
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    if process.returncode == 0:
        print(f"Sukses menjalankan perintah: {command}")
        print(stdout.decode())
    else:
        print(f"Error pada perintah: {command}")
        print(stderr.decode())

if __name__ == "__main__":
    get_data(wa_type, folder_name)
