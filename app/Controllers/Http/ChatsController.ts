import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"

export default class ChatsController {
    public async index({ request, view }: HttpContextContract) {
        const chats = await Database.from('wa_clean').select('*')
        return view.render('chats/main')
      }
      public async data_wa_clean({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_clean');
    
        // Handle pencarian
        // if (search && search.value) {
        //   query = query.where((builder) => {
        //     builder
        //       .where('a_name', 'like', `%${search.value}%`)
        //       .orWhere('b_name', 'like', `%${search.value}%`)
        //       .orWhere('content', 'like', `%${search.value}%`);
        //   });
        // }
    
        // Handle sorting
        // const orderColumn = ['date', 'time', 'a_name', 'a_number', 'a_social_link', 'b_name', 'b_number', 'b_social_link', 'group_name', 'chat_type', 'direction', 'content'];
    
        // Dapatkan total semua data (tanpa filtering)
        const totalRecords = await Database.from('wa_clean').count('* as total');
    
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
      public async data_call_logs({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_call_logs');
    
    
    
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
    public async call_logs({ request, view }: HttpContextContract) {

        return view.render('chats/wa_call_logs')
      }
    public async display_profile({ request, view }: HttpContextContract) {
        const chats = await Database.from('wa_clean').select('*')
        return view.render('chats/wa_display_profile')
      }

      public async data_display_profile({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_display_profile');
    
    
    
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
    public async group_profile({ request, view }: HttpContextContract) {
        return view.render('chats/wa_group_profile')
      }
      public async data_group_profile({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_group_profile');
    
    
    
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
    public async contacts({ request, view }: HttpContextContract) {
        const chats = await Database.from('wa_clean').select('*')
        return view.render('chats/wa_contacts')
      }

      public async data_contacts({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_contacts');
    
    
    
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
    public async media({ request, view }: HttpContextContract) {
        const chats = await Database.from('wa_clean').select('*')
        return view.render('chats/wa_media')
      }

      public async data_media({ request, response }) {
        const { start, length, search, order } = request.only(['start', 'length', 'search', 'order']);
    
        // Query awal
        let query = Database.from('wa_media');
    
    
    
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
