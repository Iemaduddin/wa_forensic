import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
const fs = require('fs');
const path = require('path');
export default class ChatsController {
    public async index({ view }: HttpContextContract) {
      const a_identity = await Database.from('wa_clean').select('a_number', 'a_name', 'a_social_link').first()
        return view.render('wa_forensic/wa_clean', { a_identity: a_identity })
      }
      async data_wa_clean({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_clean');
    
       // Handle pencarian
        if (search && search.value) {
          query = query.where((builder) => {
            builder
              .where('date', 'like', `%${search.value}%`)
              .orWhere('time', 'like', `%${search.value}%`)
              .orWhere('a_number', 'like', `%${search.value}%`)
              .orWhere('a_name', 'like', `%${search.value}%`)
              .orWhere('a_social_link', 'like', `%${search.value}%`)
              .orWhere('b_number', 'like', `%${search.value}%`)
              .orWhere('b_name', 'like', `%${search.value}%`)
              .orWhere('b_social_link', 'like', `%${search.value}%`)
              .orWhere('group_name', 'like', `%${search.value}%`)
              .orWhere('chat_type', 'like', `%${search.value}%`)
              .orWhere('direction', 'like', `%${search.value}%`)
              .orWhere('content', 'like', `%${search.value}%`);
          });
        }

          // Handle sorting
        const orderColumn = ['date', 'time', 'a_number','a_name', 'a_social_link', 'b_number', 'b_name', 'b_social_link', 'group_name', 'chat_type', 'direction', 'content'];
        if (order && order.length > 0) {
          const columnIndex = order[0].column;
          const sortColumn = orderColumn[columnIndex - 1]; // Dikurangi 1 karena kolom pertama untuk index
          const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc';
          query = query.orderBy(sortColumn, sortDirection);
        }
  
        // Dapatkan total semua data (tanpa filtering)
        const totalRecords = await Database.from('wa_clean').count('* as total');
    
        // Dapatkan total data yang difilter
        const filteredRecords = await query.clone().count('* as total');
    
        // Dapatkan data sesuai dengan pagination
        const data = await query.offset(start).limit(length);
        // Cek dan siapkan mediaPath
        data.forEach(chat => {
          const mediaPath = chat.media;
          
          const fullPath = mediaPath ? path.join(__dirname, '..', 'public/', mediaPath) : null;

          // Cek apakah media ada di path
          chat.exists = fullPath ? fs.existsSync(fullPath) : false;
          chat.mediaPath = fullPath ? mediaPath : null;
      });

      // Response dalam format yang diminta oleh DataTables
      return response.json({
          draw: request.input('draw'),
          recordsTotal: totalRecords[0].total,
          recordsFiltered: filteredRecords[0].total,
          data: data,
      });
      }

      public async update_a_identity({ request, response }) {
        const a_number = request.input('a_number');
        const a_name = request.input('a_name');
        const a_social_link = request.input('a_social_link');
          try{

            const update_a_identity = await Database.from('wa_clean').where('a_number', a_number).update({
              a_name: a_name,
              a_social_link: a_social_link,
            });

            if (update_a_identity) {
              return response.json({ success: true, message: 'Data berhasil diperbarui' });
            } else {
              return response.json({ success: false, message: 'Update gagal' });
            }
          } catch (error) {
            return response.json({ success: false, message: 'Terjadi kesalahan: ' + error.message });
          }
        }
      public async data_call_logs({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_call_logs');
    
       // Handle pencarian
        if (search && search.value) {
          query = query.where((builder) => {
            builder
              .where('date', 'like', `%${search.value}%`)
              .orWhere('time', 'like', `%${search.value}%`)
              .orWhere('number', 'like', `%${search.value}%`)
              .orWhere('name', 'like', `%${search.value}%`)
              .orWhere('direction', 'like', `%${search.value}%`)
              .orWhere('call_id', 'like', `%${search.value}%`)
              .orWhere('call_type', 'like', `%${search.value}%`)
              .orWhere('duration', 'like', `%${search.value}%`)
              .orWhere('status_call', 'like', `%${search.value}%`);
          });
        }

          // Handle sorting
        const orderColumn = ['date', 'time', 'number', 'name','direction', 'call_id', 'call_type', 'duration', 'status_call'];
        if (order && order.length > 0) {
          const columnIndex = order[0].column;
          const sortColumn = orderColumn[columnIndex - 1]; // Dikurangi 1 karena kolom pertama untuk index
          const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc';
          query = query.orderBy(sortColumn, sortDirection);
        }
    
        // Dapatkan total semua data (tanpa filtering)
        const totalRecords = await Database.from('wa_call_logs').count('* as total');
    
        // Dapatkan total data yang difilter
        const filteredRecords = await query.clone().count('* as total');
    
        // Dapatkan data sesuai dengan pagination
        const data = await query.offset(start).limit(length);
    
        // Response dalam format yang diminta oleh DataTables
        return response.json({
          draw: request.input('draw'),
          recordsTotal: totalRecords[0].total,
          recordsFiltered: filteredRecords[0].total,
          data: data
        });
      }
    public async call_logs({ view }: HttpContextContract) {

        return view.render('wa_forensic/wa_call_logs')
      }
    public async display_profile({ view }: HttpContextContract) {
        return view.render('wa_forensic/wa_display_profile')
      }

      public async data_display_profile({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_display_profile');
    
       // Handle pencarian
        if (search && search.value) {
          query = query.where((builder) => {
            builder
              .where('display_name', 'like', `%${search.value}%`)
              .orWhere('number', 'like', `%${search.value}%`)
              .orWhere('email', 'like', `%${search.value}%`)
              .orWhere('address', 'like', `%${search.value}%`)
              .orWhere('business_description', 'like', `%${search.value}%`)
              .orWhere('websites', 'like', `%${search.value}%`)
              .orWhere('wa_type', 'like', `%${search.value}%`);
          });
        }

          // Handle sorting
        const orderColumn = ['display_name', 'number', 'email','address', 'business_description', 'websites', 'wa_type'];
        if (order && order.length > 0) {
          const columnIndex = order[0].column;
          const sortColumn = orderColumn[columnIndex - 1]; // Dikurangi 1 karena kolom pertama untuk index
          const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc';
          query = query.orderBy(sortColumn, sortDirection);
        }
    
    
        // Dapatkan total semua data (tanpa filtering)
        const totalRecords = await Database.from('wa_display_profile').count('* as total');
    
        // Dapatkan total data yang difilter
        const filteredRecords = await query.clone().count('* as total');
    
        // Dapatkan data sesuai dengan pagination
        const data = await query.offset(start).limit(length);
    
        // Response dalam format yang diminta oleh DataTables
        return response.json({
          draw: request.input('draw'),
          recordsTotal: totalRecords[0].total,
          recordsFiltered: filteredRecords[0].total,
          data: data
        });
      }
    public async group_profile({ view }: HttpContextContract) {
        return view.render('wa_forensic/wa_group_profile')
      }
      public async data_group_profile({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_group_profile');
    
       // Handle pencarian
        if (search && search.value) {
          query = query.where((builder) => {
            builder
              .where('jid', 'like', `%${search.value}%`)
              .orWhere('group_name', 'like', `%${search.value}%`)
              .orWhere('created_group_date', 'like', `%${search.value}%`)
              .orWhere('created_group_time', 'like', `%${search.value}%`)
              .orWhere('created_by', 'like', `%${search.value}%`)
              .orWhere('group_description', 'like', `%${search.value}%`)
              .orWhere('created_description_date', 'like', `%${search.value}%`)
              .orWhere('created_description_time','like', `%${search.value}%`)
              .orWhere('description_set_by', 'like', `%${search.value}%`)
              .orWhere('member_count', 'like', `%${search.value}%`)
              .orWhere('member_number', 'like', `%${search.value}%`)
              .orWhere('member_role', 'like', `%${search.value}%`)
              .orWhere('added_group_date', 'like', `%${search.value}%`)
              .orWhere('added_group_time', 'like', `%${search.value}%`);
          });
        }

          // Handle sorting
        const orderColumn = 
        [
          'jid', 'group_name', 'created_group_date', 'created_group_time',
          'created_by', 'group_description', 'created_description_date', 'created_description_time',
          'description_set_by', 'member_count', 'member_number', 'member_role', 'added_group_date',
          'added_group_time'
        ];
        if (order && order.length > 0) {
          const columnIndex = order[0].column;
          const sortColumn = orderColumn[columnIndex - 1]; // Dikurangi 1 karena kolom pertama untuk index
          const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc';
          query = query.orderBy(sortColumn, sortDirection);
        }
    
    
        // Dapatkan total semua data (tanpa filtering)
        const totalRecords = await Database.from('wa_group_profile').count('* as total');
    
        // Dapatkan total data yang difilter
        const filteredRecords = await query.clone().count('* as total');
    
        // Dapatkan data sesuai dengan pagination
        const data = await query.offset(start).limit(length);
    
        // Response dalam format yang diminta oleh DataTables
        return response.json({
          draw: request.input('draw'),
          recordsTotal: totalRecords[0].total,
          recordsFiltered: filteredRecords[0].total,
          data: data
        });
      }
    public async contacts({  view }: HttpContextContract) {
        return view.render('wa_forensic/wa_contacts')
      }

      public async data_contacts({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_contacts');
    
       // Handle pencarian
        if (search && search.value) {
          query = query.where((builder) => {
            builder
              .where('jid', 'like', `%${search.value}%`)
              .orWhere('status', 'like', `%${search.value}%`)
              .orWhere('status_timestamp', 'like', `%${search.value}%`)
              .orWhere('number', 'like', `%${search.value}%`)
              .orWhere('display_name','like', `%${search.value}%`)
              .orWhere('given_name', 'like', `%${search.value}%`)
              .orWhere('family_name', 'like', `%${search.value}%`)
              .orWhere('wa_name', 'like', `%${search.value}%`)
              .orWhere('nickname', 'like', `%${search.value}%`)
              .orWhere('company', 'like', `%${search.value}%`)
              .orWhere('title', 'like', `%${search.value}%`)
              .orWhere('favourite_contact', 'like', `%${search.value}%`)
              .orWhere('disappearing_mode_duration', 'like', `%${search.value}%`)
              .orWhere('disappearing_mode_timestamp', 'like', `%${search.value}%`);
          });
        }

          // Handle sorting
        const orderColumn = 
        [
          'jid', 'status', 'status_timestamp', 'number','display_name',
          'given_name', 'family_name', 'wa_name', 'nickname','company','title',
          'favourite_contact','disappearing_mode_duration','disappearing_mode_timestamp'
        ];
        if (order && order.length > 0) {
          const columnIndex = order[0].column;
          const sortColumn = orderColumn[columnIndex - 1]; // Dikurangi 1 karena kolom pertama untuk index
          const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc';
          query = query.orderBy(sortColumn, sortDirection);
        }
    
    
    
        // Dapatkan total semua data (tanpa filtering)
        const totalRecords = await Database.from('wa_contacts').count('* as total');
    
        // Dapatkan total data yang difilter
        const filteredRecords = await query.clone().count('* as total');
    
        // Dapatkan data sesuai dengan pagination
        const data = await query.offset(start).limit(length);
    
        // Response dalam format yang diminta oleh DataTables
        return response.json({
          draw: request.input('draw'),
          recordsTotal: totalRecords[0].total,
          recordsFiltered: filteredRecords[0].total,
          data: data
        });
      }
    public async media({  view }: HttpContextContract) {
        return view.render('wa_forensic/wa_media')
      }

      public async data_media({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_media');
    
       // Handle pencarian
        if (search && search.value) {
          query = query.where((builder) => {
            builder
              .where('date', 'like', `%${search.value}%`)
              .orWhere('time', 'like', `%${search.value}%`)
              .orWhere('number', 'like', `%${search.value}%`)
              .orWhere('file_path', 'like', `%${search.value}%`)
              .orWhere('media_type','like', `%${search.value}%`)
              .orWhere('file_size', 'like', `%${search.value}%`)
              .orWhere('media_name', 'like', `%${search.value}%`)
              .orWhere('media_caption', 'like', `%${search.value}%`)
              .orWhere('media_duration', 'like', `%${search.value}%`);
          });
        }

          // Handle sorting
        const orderColumn = 
        [
          'date', 'time', 'number', 'file_path','media_type',
          'file_size', 'media_name', 'media_caption', 'media_duration'
        ];
        if (order && order.length > 0) {
          const columnIndex = order[0].column;
          const sortColumn = orderColumn[columnIndex - 1]; // Dikurangi 1 karena kolom pertama untuk index
          const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc';
          query = query.orderBy(sortColumn, sortDirection);
        }
    
    
    
    
        // Dapatkan total semua data (tanpa filtering)
        const totalRecords = await Database.from('wa_media').count('* as total');
    
        // Dapatkan total data yang difilter
        const filteredRecords = await query.clone().count('* as total');
    
        // Dapatkan data sesuai dengan pagination
        const data = await query.offset(start).limit(length);
    
        // Response dalam format yang diminta oleh DataTables
        return response.json({
          draw: request.input('draw'),
          recordsTotal: totalRecords[0].total,
          recordsFiltered: filteredRecords[0].total,
          data: data
        });
      }
}
