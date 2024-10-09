import sys
import mysql.connector
from mysql.connector import Error
import bcrypt

def create_users_table(database_name):
    try:
        # Koneksi ke MySQL
        connection = mysql.connector.connect(
            host='localhost', 
            user='root',      
            password='',       
            database=database_name
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # 1. Buat tabel users
            create_table_query = """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(180) NOT NULL,
                remember_me_token VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
            """
            cursor.execute(create_table_query)
            print("Tabel 'users' berhasil dibuat.")

            # 2. Sisipkan data pengguna
            username = 'admin'
            email = 'admin@gmail.com'
            password = 'Intelijen'  
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            insert_user_query = """
            INSERT INTO users (username, email, password) VALUES (%s, %s, %s);
            """
            cursor.execute(insert_user_query, (username, email, hashed_password))
            connection.commit()
            print("Pengguna admin berhasil ditambahkan ke database.")

    except Error as e:
        print(f"Terjadi kesalahan: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Harap masukkan nama database sebagai argumen.")
    else:
        db_name = sys.argv[1]
        create_users_table(db_name)
