import os
import subprocess
import time

def stop_server():
    platform = os.platform()
    
    # Tentukan perintah untuk menghentikan server
    if platform == 'win32':
        stop_command = 'taskkill /f /im node.exe'
    else:
        stop_command = 'pkill node'

    try:
        subprocess.run(stop_command, shell=True, check=True)
        print("Server berhasil dihentikan.")
    except subprocess.CalledProcessError as e:
        print(f"Gagal menghentikan server: {e}")

def start_server():
    start_command = 'pnpm run dev'
    try:
        # Jalankan server
        subprocess.Popen(start_command, shell=True)
        print("Server dimulai kembali.")
    except Exception as e:
        print(f"Gagal memulai server: {e}")

def main():
    stop_server()
    time.sleep(2)  # Tunggu sebentar sebelum memulai kembali
    start_server()

if __name__ == "__main__":
    main()
