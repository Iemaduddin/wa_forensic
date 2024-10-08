import sqlite3
import os
import subprocess
import mysql.connector
from mysql.connector import Error
from datetime import datetime
# Method untuk menghindari tanda kutip tunggal dalam string
def escape_single_quotes(value):
    if value is not None:
        return str(value).replace("'", "''")
    return 'NULL'

def create_wa_clean_dump(sqlite_db_1, sqlite_db_2, dump_file):
    conn1 = sqlite3.connect(sqlite_db_1)  # Connection to msgstore.db
    conn2 = sqlite3.connect(sqlite_db_2)  # Connection to wa.db
    cursor1 = conn1.cursor()
    cursor2 = conn2.cursor()
    # Ambil data wa_group_admin_settings dari wa.db
    cursor2.execute("SELECT jid FROM wa_group_admin_settings;")
    wa_group_admin_settings = cursor2.fetchall()
    group_jids = {jid[0] for jid in wa_group_admin_settings}

    with open(dump_file, 'a', encoding='utf-8') as f:
        # Struktur tabel wa_clean
        f.write(f"\n\n-- Struktur tabel wa_clean\n")
        f.write(f"DROP TABLE IF EXISTS wa_clean;\n")
        f.write(f"""
        CREATE TABLE wa_clean (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            date VARCHAR(255),
            time VARCHAR(255),
            a_number VARCHAR(255),
            a_name VARCHAR(255),
            a_social_link VARCHAR(255),
            b_number VARCHAR(255),
            b_name VARCHAR(255),
            b_social_link VARCHAR(255),
            group_name VARCHAR(255),
            chat_type VARCHAR(255), 
            media VARCHAR(255), 
            direction VARCHAR(255),
            call_description VARCHAR(255),
            content TEXT,
            content_definition TEXT
        );
        """)

        # Query untuk mendapatkan data wa_contacts dari wa.db
        cursor2.execute("SELECT number, display_name FROM wa_contacts;")
        wa_contacts = cursor2.fetchall()
        display_names = {b_number: display_name for b_number, display_name in wa_contacts}

        # Query untuk mendapatkan data wa_biz_profiles dari wa.db
        
        cursor2.execute("SELECT _id, jid, email, address, business_description FROM wa_biz_profiles;")
        data_wa_biz_profiles = cursor2.fetchall()
        wa_biz_profiles = {
            row[0]: {
                "jid": row[1],
                "email": row[2],
                "address": row[3],
                "business_description": row[4]
            } 
            for row in data_wa_biz_profiles
        }


        # Query untuk mendapatkan data wa_biz_profiles_websites dari wa.db
        cursor2.execute("SELECT wa_biz_profile_id,websites FROM wa_biz_profiles_websites;")
        data_wa_biz_profiles_websites = cursor2.fetchall()
        wa_biz_profile_web = {row[0]: row[1] for row in data_wa_biz_profiles_websites}
        
        # Query untuk mendapatkan data wa_clean dari msgstore.db
        cursor1.execute("""
            SELECT DISTINCT
                DATE(message.timestamp / 1000, 'unixepoch','+7 hours') AS 'date',
                TIME(message.timestamp / 1000, 'unixepoch','+7 hours') AS 'time',
                (
                CASE 
                    WHEN (SELECT user FROM jid WHERE _id = 1) IS NULL 
                        OR (SELECT user FROM jid WHERE _id = 1) = '' 
                    THEN (SELECT user FROM jid WHERE _id = (
                        SELECT MIN(_id) 
                        FROM jid 
                        WHERE _id > 1 AND (user IS NOT NULL AND user != '')
                    ))
                    ELSE (SELECT user FROM jid WHERE _id = 1)
                END
                ) AS 'a_number',
                CASE
                    WHEN message.sender_jid_row_id > 0 THEN
                        (SELECT user FROM jid WHERE _id = message.sender_jid_row_id)
                    ELSE jid.user
                END AS 'b_number',  
                jid.raw_string AS 'jid_raw_string',
                chat.subject AS 'chat_subject',
                CASE 
                    WHEN EXISTS (SELECT 1 FROM message_media WHERE message._id = message_media.message_row_id) THEN
                        CASE 
                            WHEN EXISTS (SELECT 1 FROM message_media WHERE message._id = message_media.message_row_id AND mime_type LIKE '%image%') THEN
                                CASE 
                                    WHEN message.text_data IS NOT NULL THEN 'Image, Text'
                                    ELSE 'Image'
                                END
                            WHEN EXISTS (SELECT 1 FROM message_media WHERE message._id = message_media.message_row_id AND mime_type LIKE '%video%') THEN
                                CASE 
                                    WHEN message.text_data IS NOT NULL THEN 'Video, Text'
                                    ELSE 'Video'
                                END
                            WHEN EXISTS (SELECT 1 FROM message_media WHERE message._id = message_media.message_row_id AND mime_type LIKE '%audio/ogg%') THEN 'Voice Notes'
                            WHEN EXISTS (SELECT 1 FROM message_media WHERE message._id = message_media.message_row_id AND mime_type LIKE '%audio/mpeg%') THEN 'File Audio'
                            ELSE 'Document'
                        END
                    WHEN EXISTS (SELECT 1 FROM message_location WHERE message._id = message_location.message_row_id) THEN
                        CASE 
                            WHEN message.text_data IS NOT NULL THEN 'Location, Text'
                            ELSE 'Location'
                        END
                    WHEN EXISTS (
                        SELECT 1 
                        FROM message_call_log mcl
                        JOIN call_log cl ON cl._id = mcl.call_log_row_id
                        WHERE mcl.message_row_id = message._id
                    ) THEN
                        CASE 
                            WHEN EXISTS (
                                SELECT 1 
                                FROM message_call_log mcl
                                JOIN call_log cl ON cl._id = mcl.call_log_row_id
                                WHERE mcl.message_row_id = message._id AND cl.video_call = 1
                            ) THEN 'Video Call'
                            ELSE 'Voice Call'
                        END
                    WHEN message.text_data IS NOT NULL THEN 'Text'
                    ELSE 'Other Type'
                END AS 'chat_type',
                (SELECT file_path FROM message_media WHERE message._id = message_media.message_row_id LIMIT 1) AS 'media',
                CASE 
                    WHEN message.from_me = 1 THEN 'Outgoing' 
                    ELSE 'Incoming' 
                END AS 'direction',
                (
                    SELECT cl.duration 
                    FROM message_call_log mcl
                    JOIN call_log cl ON cl._id = mcl.call_log_row_id
                    WHERE mcl.message_row_id = message._id
                    LIMIT 1
                ) AS 'call_duration',
                (
                    SELECT 
                        CASE 
                            WHEN cl.call_result = 2 THEN
                                CASE
                                    WHEN cl.from_me = 1 THEN 'Not answered'
                                    ELSE 'Missed'
                                END
                            WHEN cl.call_result = 3 THEN 'Unavailable'
                            WHEN cl.call_result = 4 THEN 'Missed'
                            WHEN cl.call_result = 5 THEN 'Answered'
                            WHEN cl.call_result = 6 THEN 'Accepted On Other Device'
                        END
                    FROM message_call_log mcl
                    JOIN call_log cl ON cl._id = mcl.call_log_row_id
                    WHERE mcl.message_row_id = message._id
                    LIMIT 1
                ) AS 'status_call',
                message.text_data AS 'content'
            FROM message
            JOIN chat ON message.chat_row_id = chat._id
            JOIN jid ON chat.jid_row_id = jid._id;
        """)

        data = cursor1.fetchall()

        # Menulis data wa_clean ke dump file dengan join ke wa_contacts dan wa_group_admin_settings
        for row in data:
            date, time, a_number, b_number, jid_raw_string, chat_subject, chat_type, media, direction, call_duration, status_call, content = row
            # Ambil b_name dari wa_contacts
            b_name = display_names.get(b_number, None)
            
            # Tentukan group_name berdasarkan apakah jid_raw_string ada di wa_group_admin_settings
            if jid_raw_string in group_jids:
                group_name = chat_subject  # Ini adalah grup
            else:
                group_name = None  # Ini adalah chat personal
            
            # Inisialisasi b_social_link
            b_social_link = None

            # Loop untuk memeriksa kecocokan jid_raw_string
            for _id, profile in wa_biz_profiles.items():
                if profile["jid"] == jid_raw_string:  # Membandingkan 'jid' dengan 'jid_raw_string'
                    # Jika ditemukan, ambil email
                    if profile["email"]:
                        b_social_link = '(' + profile["email"]

                    # Jika _id juga ada di wa_biz_profile_web, ambil websites
                    if _id in wa_biz_profile_web:
                        website = wa_biz_profile_web[_id]
                        # Tambahkan pemisah koma jika b_social_link sudah berisi email
                        if b_social_link:
                            b_social_link += ', ' + website + ')'
                        else:
                            b_social_link = '(' + website + ')'
                 
            # b_identity = None
            # if b_number:
            #     b_identity = b_number
            #     if b_name:
            #         b_identity += ', ' + b_name
            #         if b_social_link:
            #             b_identity += ', ' + b_social_link
            
            # Mengubah format date menjadi, misal  "10-Sep-24"
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            formatted_date = date_obj.strftime("%d-%b-%y")
            
            call_description = f"{call_duration or '0'}{f' ({status_call})' if status_call else ''}"
            # Menyiapkan data untuk insert ke wa_clean
            row_data = [
                f"'{escape_single_quotes(str(col))}'" if col is not None else 'NULL'
                for col in [formatted_date, time, a_number, b_number, b_name, b_social_link, group_name, chat_type, media, direction, call_description, content]
            ]
            row_str = ', '.join(row_data)

            insert_query = f"INSERT INTO wa_clean (date, time, a_number, b_number,b_name, b_social_link, group_name, chat_type, media, direction, call_description, content) VALUES ({row_str});\n"
            f.write(insert_query)

    conn1.close()
    conn2.close()



# Method untuk dump data wa_display_profile dari SQLite ke MySQL dump file
def create_wa_display_profile_dump(sqlite_db, dump_file):
    conn = sqlite3.connect(sqlite_db)
    cursor = conn.cursor()

    with open(dump_file, 'a', encoding='utf-8') as f:
        # Struktur tabel wa_display_profile
        f.write(f"\n\n-- Struktur tabel wa_display_profile\n")
        f.write(f"DROP TABLE IF EXISTS wa_display_profile;\n")
        f.write(f"""
        CREATE TABLE wa_display_profile (
            _id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            display_name VARCHAR(255),
            number VARCHAR(255),
            email VARCHAR(255),
            address VARCHAR(255),
            business_description TEXT,
            websites VARCHAR(255),
            wa_type VARCHAR(255)
        );
        """)

        # Query untuk mendapatkan data wa_contacts dengan join wa_biz_profiles
        cursor.execute("""
            SELECT wc.display_name, wc.jid,
            CASE 
                WHEN wbp.jid = wc.jid THEN wbp.email 
                ELSE NULL
            END AS email,
            CASE
                WHEN wbp.jid = wc.jid THEN wbp.address 
                ELSE NULL
            END AS address,
            CASE 
                WHEN wbp.jid = wc.jid  THEN wbp.business_description
                ELSE NULL
            END AS business_description,
            GROUP_CONCAT(CASE 
                WHEN wbw.wa_biz_profile_id = wbp._id THEN wbw.websites 
                ELSE NULL
            END, ', ') AS websites,
            CASE WHEN wbp.jid IS NOT NULL THEN 'Wa Business' ELSE 'Wa Regular' END AS wa_type
            FROM wa_contacts AS wc
            LEFT JOIN wa_biz_profiles AS wbp ON wc.jid = wbp.jid
            LEFT JOIN wa_biz_profiles_websites AS wbw ON wbp._id = wbw.wa_biz_profile_id
            WHERE wc.jid IS NOT NULL
            GROUP BY wbp.jid;
        """)

        data = cursor.fetchall()

        # Menulis data wa_display_profile ke dump file
        for row in data:
            display_name, jid, email, address, business_description, websites, wa_type = row
            row_data = [
                'NULL',  # Placeholder untuk _id (jika menggunakan auto_increment)
                f"'{escape_single_quotes(display_name)}'",
                f"'{escape_single_quotes(jid.split('@')[0])}'",
                f"'{escape_single_quotes(email)}'",
                f"'{escape_single_quotes(address)}'",
                f"'{escape_single_quotes(business_description)}'",
                f"'{escape_single_quotes(websites)}'",
                f"'{wa_type}'"
            ]
            row_str = ', '.join(row_data)
            insert_query = f"INSERT INTO wa_display_profile (_id, display_name, number, email, address, business_description, websites, wa_type) VALUES ({row_str});\n"
            f.write(insert_query)

    conn.close()
    

# Method untuk dump data wa_contacts dari SQLite ke MySQL dump file
def create_wa_contacts_dump(sqlite_db, dump_file):
    conn = sqlite3.connect(sqlite_db)
    cursor = conn.cursor()

    with open(dump_file, 'a', encoding='utf-8') as f:
        # Struktur tabel wa_contacts
        f.write(f"\n\n-- Struktur tabel wa_contacts\n")
        f.write(f"DROP TABLE IF EXISTS wa_contacts;\n")
        f.write(f"""
        CREATE TABLE wa_contacts (
            _id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            jid VARCHAR(255),
            status VARCHAR(255),
            status_timestamp VARCHAR(255),
            number VARCHAR(255),
            display_name VARCHAR(255),
            given_name VARCHAR(255),
            family_name VARCHAR(255),
            wa_name VARCHAR(255),
            nickname VARCHAR(255),
            company VARCHAR(255),
            title VARCHAR(255),
            favorite_contact VARCHAR(255),
            disappearing_mode_duration INT,
            disappearing_mode_timestamp VARCHAR(255)
        );
        """)

        # Query untuk mendapatkan data wa_contacts
        cursor.execute("""
            SELECT jid, status, 
            CASE 
                WHEN status_timestamp IS NOT NULL AND status_timestamp > 0 THEN DATETIME(status_timestamp/1000, 'unixepoch', '+7 hours') 
                ELSE ''
            END AS 'status_timestamp', 
            number, display_name, given_name, 
            family_name, wa_name, nickname, company, title, 
            CASE 
                WHEN is_starred = 1 THEN 'Yes' 
                ELSE 'No'
            END AS 'favorite_contact', 
            CASE
                WHEN disappearing_mode_duration IS NOT NULL AND disappearing_mode_duration > 0 
                THEN disappearing_mode_duration
                ELSE 0
            END AS disappearing_mode_duration,
            CASE 
                WHEN disappearing_mode_timestamp IS NOT NULL AND status_timestamp > 0 THEN DATETIME(disappearing_mode_timestamp/1000, 'unixepoch', '+7 hours')
                ELSE ''
            END AS 'disappearing_mode_timestamp'
            FROM wa_contacts;
        """)
        data = cursor.fetchall()
        
        # Menulis data wa_contacts ke dump file
        for row in data:
            jid, status, status_timestamp, number, display_name, given_name, family_name, wa_name, \
            nickname, company, title, favorite_contact, disappearing_mode_duration, disappearing_mode_timestamp = row
            
            row_data = [
                'NULL',  # Placeholder untuk _id (jika menggunakan auto_increment)
                f"'{escape_single_quotes(jid)}'",
                f"'{escape_single_quotes(status)}'",
                f"'{status_timestamp}'",
                f"'{escape_single_quotes(number)}'",
                f"'{escape_single_quotes(display_name)}'",
                f"'{escape_single_quotes(given_name)}'",
                f"'{escape_single_quotes(family_name)}'",
                f"'{escape_single_quotes(wa_name)}'",
                f"'{escape_single_quotes(nickname)}'",
                f"'{escape_single_quotes(company)}'",
                f"'{escape_single_quotes(title)}'",
                f"'{favorite_contact}'",
                f"'{disappearing_mode_duration}'",
                f"'{disappearing_mode_timestamp}'"
            ]
            row_str = ', '.join(row_data)
            insert_query = f"INSERT INTO wa_contacts (_id, jid, status, status_timestamp, number, display_name, given_name, family_name, wa_name, nickname, company, title, favorite_contact, disappearing_mode_duration, disappearing_mode_timestamp) VALUES ({row_str});\n"
            f.write(insert_query)

    conn.close()


# Method untuk dump data wa_call_logs dari SQLite ke MySQL dump file
def create_wa_call_logs_dump(sqlite_db_1,sqlite_db_2, dump_file):
    conn1 = sqlite3.connect(sqlite_db_1)
    cursor1 = conn1.cursor()
    conn2 = sqlite3.connect(sqlite_db_2)
    cursor2 = conn2.cursor()

    with open(dump_file, 'a', encoding='utf-8') as f:
        # Struktur tabel wa_call_logs
        f.write(f"\n\n-- Struktur tabel wa_call_logs\n")
        f.write(f"DROP TABLE IF EXISTS wa_call_logs;\n")
        f.write(f"""
        CREATE TABLE wa_call_logs (
            _id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            date VARCHAR(255),
            time VARCHAR(255),
            number VARCHAR(255),
            name VARCHAR(255),
            direction VARCHAR(255),
            call_id VARCHAR(255),
            call_type VARCHAR(255),
            duration INT,
            status_call VARCHAR(255)
        );
        """)
        # Query untuk mendapatkan data wa_contacts dari wa.db
        cursor2.execute("SELECT number, display_name FROM wa_contacts;")
        wa_contacts = cursor2.fetchall()
        display_names = {number: display_name for number, display_name in wa_contacts}
        
        # Query untuk mendapatkan data call_logs dari msgstore.db
        cursor1.execute("""
            SELECT 
                DATE(timestamp/1000, 'unixepoch','+7 hours') AS 'date',
                TIME(timestamp/1000, 'unixepoch','+7 hours') AS 'time',
                jid.user AS 'number',
                CASE 
                    WHEN call_log.from_me = 1 THEN 'Outgoing' 
                    ELSE 'Incoming' 
                END AS 'direction',
                call_id,
                CASE 
                    WHEN call_log.video_call = 1 THEN 'Video Call'
                    ELSE 'Voice Call'
                END AS 'call_type',
                duration,
                CASE
                    WHEN call_log.call_result = 2 THEN
                        CASE
                            WHEN call_log.from_me = 1 THEN 'Not answered'
                            ELSE 'Missed'
                        END
                    WHEN call_log.call_result = 3 THEN 'Unavailable'
                    WHEN call_log.call_result = 4 THEN 'Missed'
                    WHEN call_log.call_result = 5 THEN 'Answered'
                    WHEN call_log.call_result = 6 THEN 'Accepted On Other Device'
                END AS 'status_call'
            FROM call_log
            JOIN jid ON call_log.jid_row_id = jid._id;
        """)

        data = cursor1.fetchall()
        
        # Menulis data wa_contacts ke dump file
        for row in data:
            date, time, number, direction, call_id, call_type, duration, status_call = row
            name = display_names.get(number, 'NULL')
            row_data = [
                'NULL',  # Placeholder untuk _id (jika menggunakan auto_increment)
                f"'{date}'",
                f"'{time}'",
                f"'{escape_single_quotes(number)}'",
                f"'{escape_single_quotes(name)}'",
                f"'{direction}'",
                f"'{escape_single_quotes(call_id)}'",
                f"'{call_type}'",
                f"'{duration}'",
                f"'{status_call}'"
            ]
            row_str = ', '.join(row_data)
            insert_query = f"INSERT INTO wa_call_logs (_id, date, time, number,name, direction, call_id, call_type, duration, status_call) VALUES ({row_str});\n"
            f.write(insert_query)

    conn1.close()
    conn2.close()

# Method untuk dump data message_media dari SQLite ke MySQL dump file
def create_message_media_dump(sqlite_db, dump_file):
    conn = sqlite3.connect(sqlite_db)
    cursor = conn.cursor()

    with open(dump_file, 'a', encoding='utf-8') as f:
        # Struktur tabel message_media
        f.write(f"\n\n-- Struktur tabel wa_media\n")
        f.write(f"DROP TABLE IF EXISTS wa_media;\n")
        f.write(f"""
        CREATE TABLE wa_media (
            _id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            date VARCHAR(255),
            time VARCHAR(255),
            number VARCHAR(255),
            file_path TEXT,
            media_type VARCHAR(255),
            file_size VARCHAR(255),
            media_name VARCHAR(255),
            media_caption VARCHAR(255),
            media_duration INT
        );
        """)

        # Query untuk mendapatkan data message_media
        cursor.execute("""
            SELECT 
            DATE(media_key_timestamp/1000, 'unixepoch','+7 hours') AS 'date', 
            TIME(media_key_timestamp/1000, 'unixepoch','+7 hours') AS 'time', 
            jid.user AS 'number', 
            file_path, 
            CASE 
                WHEN mime_type LIKE '%image%' THEN 'Image'
                WHEN mime_type LIKE '%video%' THEN 'Video'
                WHEN mime_type LIKE '%audio/ogg%' THEN 'Voice Notes'
                WHEN mime_type LIKE '%audio/mpeg%' THEN 'File Audio'
                WHEN mime_type LIKE '%comma-separated-values%' THEN 'File csv'
                WHEN mime_type LIKE '%text%' THEN 'File txt'
                WHEN mime_type LIKE '%application/vnd.android.package-archive%' THEN 'File Apk'
                ELSE 'Document'
            END AS 'media_type',
            file_length as 'file_size', 
            media_name, 
            media_caption, 
            media_duration
            FROM message_media
            JOIN chat ON message_media.chat_row_id = chat._id
            JOIN jid ON chat.jid_row_id = jid._id;
        """)
           
        data = cursor.fetchall()
        
        # Menulis data message_media ke dump file
        for row in data:
            date, time, number, file_path, media_type, file_size, media_name, media_caption, media_duration = row
            
            row_data = [
                'NULL',  # Placeholder untuk _id (jika menggunakan auto_increment)
                f"'{date}'",
                f"'{time}'",
                f"'{number}'",
                f"'{escape_single_quotes(file_path)}'",
                f"'{media_type}'",
                f"'{file_size}'",
                f"'{escape_single_quotes(media_name)}'",
                f"'{escape_single_quotes(media_caption)}'",
                f"'{media_duration}'",
            ]
            row_str = ', '.join(row_data)
            insert_query = f"INSERT INTO wa_media (_id, date, time, number, file_path, media_type, file_size, media_name, media_caption, media_duration) VALUES ({row_str});\n"
            f.write(insert_query)

    conn.close()
# Method untuk dump data wa_group_profile dari SQLite ke MySQL dump file
import sqlite3

def create_wa_group_profile_dump(sqlite_db_1, sqlite_db_2, dump_file):
    conn1 = sqlite3.connect(sqlite_db_1)
    cursor1 = conn1.cursor()
    conn2 = sqlite3.connect(sqlite_db_2)
    cursor2 = conn2.cursor()

    with open(dump_file, 'a', encoding='utf-8') as f:
        # Struktur tabel wa_group_profile
        f.write(f"\n\n-- Struktur tabel wa_group_profile\n")
        f.write(f"DROP TABLE IF EXISTS wa_group_profile;\n")
        f.write(f"""
        CREATE TABLE wa_group_profile (
            _id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            jid VARCHAR(255),
            group_name VARCHAR(255),
            created_group_date VARCHAR(255),
            created_group_time VARCHAR(255),
            created_by VARCHAR(255),
            group_description TEXT,
            created_description_date VARCHAR(255),
            created_description_time VARCHAR(255),
            description_set_by VARCHAR(255),
            member_count INT,
            member_number VARCHAR(255),
            member_role VARCHAR(255),
            added_group_date VARCHAR(255),
            added_group_time VARCHAR(255)
        );
        """)

        # Query untuk mendapatkan data dari msgstore.db
        cursor1.execute("""
            SELECT 
                jid.raw_string AS 'jid',
                chat.subject AS 'group_name',
                DATE(chat.created_timestamp/1000, 'unixepoch', '+7 hours') AS 'created_group_date',
                TIME(chat.created_timestamp/1000, 'unixepoch', '+7 hours') AS 'created_group_time',
                (
                    SELECT COUNT(*) 
                    FROM group_participant_user 
                    WHERE group_participant_user.group_jid_row_id = jid._id
                ) AS 'member_count',
                CASE 
                    WHEN (SELECT jid.user FROM jid WHERE jid._id = group_participant_user.user_jid_row_id) IS NULL OR 
                        (SELECT jid.user FROM jid WHERE jid._id = group_participant_user.user_jid_row_id) = ''
                    THEN (SELECT jid.user FROM jid WHERE jid._id = 1)
                    ELSE (SELECT jid.user FROM jid WHERE jid._id = group_participant_user.user_jid_row_id)
                END AS 'member_number',
                CASE
                    WHEN group_participant_user.rank = 0 THEN 'Member'
                    WHEN group_participant_user.rank = 1 THEN 'Admin'
                    WHEN group_participant_user.rank = 2 THEN 'Creator & Admin'
                END AS 'member_role',
                DATE(group_participant_user.add_timestamp/1000, 'unixepoch', '+7 hours') AS 'added_group_date',
                TIME(group_participant_user.add_timestamp/1000, 'unixepoch', '+7 hours') AS 'added_group_time'
            FROM group_participant_user
            JOIN jid ON group_participant_user.group_jid_row_id = jid._id
            JOIN chat ON group_participant_user.group_jid_row_id = chat.jid_row_id;
        """)

        msgstore_data = cursor1.fetchall()

        # Query untuk mendapatkan data dari wa.db
        cursor2.execute("""
            SELECT 
                wa_group_admin_settings.jid AS 'jid',
                wa_group_admin_settings.creator_jid AS 'created_by',
                wa_group_descriptions.jid AS 'description_jid',
                wa_group_descriptions.description AS 'group_description',
                DATE(wa_group_descriptions.description_time, 'unixepoch', '+7 hours') AS 'created_description_date',
                TIME(wa_group_descriptions.description_time, 'unixepoch', '+7 hours') AS 'created_description_time',
                wa_group_descriptions.description_setter_jid AS 'description_set_by'
            FROM wa_group_admin_settings
            JOIN wa_group_descriptions ON wa_group_admin_settings.jid = wa_group_descriptions.jid;
        """)

        wa_data = cursor2.fetchall()
        # Membuat dictionary untuk memetakan data wa.db berdasarkan jid
        wa_data_dict = {row[0]: row for row in wa_data}

        # Menulis data wa_group_profile ke dump file
        for row in msgstore_data:
            jid, group_name, created_group_date, created_group_time, member_count, member_number, member_role, added_group_date, added_group_time = row
            
            # Ambil data dari wa.db berdasarkan jid
            wa_row = wa_data_dict.get(jid)
            if wa_row:
                jid, created_by, _, group_description, created_description_date, created_description_time, description_set_by = wa_row
            else:
                jid = created_by = group_description = created_description_date = created_description_time = description_set_by = 'NULL'

            row_data = [
                'NULL',  # Placeholder untuk _id (jika menggunakan auto_increment)
                f"'{jid}'",
                f"'{group_name}'",
                f"'{created_group_date}'",
                f"'{created_group_time}'",
                f"'{created_by}'",
                f"'{group_description}'",
                f"'{created_description_date}'",
                f"'{created_description_time}'",
                f"'{description_set_by}'",
                f"{member_count}",
                f"'{member_number}'",
                f"'{member_role}'",
                f"'{added_group_date}'",
                f"'{added_group_time}'"
            ]
            row_str = ', '.join(row_data)
            insert_query = f"INSERT INTO wa_group_profile (_id, jid, group_name, created_group_date, created_group_time, created_by, group_description, created_description_date, created_description_time, description_set_by, member_count, member_number, member_role, added_group_date, added_group_time) VALUES ({row_str});\n"
            f.write(insert_query)

    conn1.close()
    conn2.close()

# Fungsi untuk menangani dua database SQLite dan menggabungkan ke dalam satu database MySQL
def merge_sqlite_to_mysql(sqlite_db_1, sqlite_db_2, mysql_dump_file, mysql_user, mysql_password, mysql_db):
    # Hapus file dump lama jika sudah ada
    db_result_dir = 'resources/python/db_result'
    os.makedirs(db_result_dir, exist_ok=True)

    # Tentukan path baru untuk dump file
    mysql_dump_file_path = os.path.join(db_result_dir, mysql_dump_file)
    
    if os.path.exists(mysql_dump_file_path):
        os.remove(mysql_dump_file_path)

    # Dump data wa_chat dari database SQLite
    create_wa_clean_dump(sqlite_db_1, sqlite_db_2, mysql_dump_file_path)

    # Dump data wa_display_profile dari database SQLite
    create_wa_display_profile_dump(sqlite_db_2, mysql_dump_file_path)
    
    # Dump data wa_contacts dari database SQLite
    create_wa_contacts_dump(sqlite_db_2, mysql_dump_file_path)
    
    # Dump data call_log dari database SQLite
    create_wa_call_logs_dump(sqlite_db_1, sqlite_db_2, mysql_dump_file_path)
    
    # Dump data wa_media dari database SQLite
    create_message_media_dump(sqlite_db_1, mysql_dump_file_path)
    
    # Dump data wa_group_profile dari database SQLite
    create_wa_group_profile_dump(sqlite_db_1, sqlite_db_2, mysql_dump_file_path)
    
    print("Tabel 'wa_clean', 'wa_display_profile', 'wa_call_logs', 'wa_media', 'wa_contacts', dan 'wa_group_profile' telah berhasil dibuat di", mysql_dump_file_path, "\n")
    
    # Cek dan buat database jika belum ada
    create_database_if_not_exists(mysql_user, mysql_password, mysql_db)
    
    # Import the dump into MySQL
    import_to_mysql(mysql_dump_file_path, mysql_user, mysql_password, mysql_db)

    
def create_database_if_not_exists(mysql_user, mysql_password, mysql_db):
    try:
        # Connect to MySQL server
        connection = mysql.connector.connect(
            host='localhost',  # Adjust host as needed
            user=mysql_user,
            password=mysql_password
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{mysql_db}`;")
            print(f"Database `{mysql_db}` checked/created successfully.")
    except Error as e:
        print(f"Error while creating database: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
               
def import_to_mysql(mysql_dump_file, mysql_user, mysql_password, mysql_db):
    # Command to import SQL dump to MySQL
    if mysql_password:
        command = f"mysql -u {mysql_user} -p{mysql_password} {mysql_db} < {mysql_dump_file}"
    else:
        command = f"mysql -u {mysql_user} {mysql_db} < {mysql_dump_file}"
    
    # Use subprocess to execute the command
    try:
        subprocess.run(command, shell=True, check=True)
        print(f"Data berhasil diimpor ke database {mysql_db}.")
    except subprocess.CalledProcessError as e:
        print(f"Terjadi kesalahan saat mengimpor data ke MySQL: {e}")
        

# Run to convert mysql db
    # source and output db
def convert_database(database_name):
    sqlite_db_file_1 = 'resources/python/msgstore.db'
    sqlite_db_file_2 = 'resources/python/wa.db'
    mysql_dump_file = database_name + '.sql'

    # MySQL credentials
    mysql_user = 'root'
    mysql_password =''
    mysql_db = database_name

    # Gabungkan database SQLite yang ditentukan ke dalam satu file dump MySQL
    merge_sqlite_to_mysql(sqlite_db_file_1, sqlite_db_file_2, mysql_dump_file, mysql_user, mysql_password, mysql_db)

