import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from "@ioc:Adonis/Lucid/Database"
const fs = require('fs');
const path = require('path');
import PDFDocument from 'pdfkit'
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
              .orWhere('call_description', 'like', `%${search.value}%`)
              .orWhere('content', 'like', `%${search.value}%`);
          });
        }

          // Handle sorting
        const orderColumn = ['date', 'time', 'a_number','a_name', 'a_social_link', 'b_number', 'b_name', 'b_social_link', 'group_name', 'chat_type', 'direction','call_description', 'content'];
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

      // Fungsi untuk update a_identity
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

        // Fungsi untuk export PDF
        public async wa_clean_exportPdf({ response }: HttpContextContract) {
          try {
            // Create PDF document with A3 size
            const doc = new PDFDocument({
              margin: 30,
              size: [1190.55, 842.91], // Ukuran A3
              bufferPages: true
            });
        
            // Generate dynamic filename with current date
            const currentDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
            const filename = `Report_WA_Forensic_${currentDate}.pdf`;

            // Set response headers for automatic download
            response.header('Content-Type', 'application/pdf');
            response.header(
                'Content-Disposition',
                `attachment; filename="${filename}"`
            );
        
            // Pipe the PDF to the response
            doc.pipe(response.response);
        
            // Add title with smaller font size
            doc
              .font('Helvetica-Bold')
              .fontSize(16) 
              .text('WhatsApp Chat Data Export', { align: 'center' })
              .moveDown();
        
            // Add timestamp with smaller font size
            doc
              .font('Helvetica')
              .fontSize(8) 
              .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
        
            // Get data from database
            const data = await Database.from('wa_clean');
            let a_identity = '';
            data.forEach(wa_clean => {
              a_identity = wa_clean.a_number || '';
              if (wa_clean.a_name) {
                  if (wa_clean.a_social_link) {
                      a_identity += '\n' + wa_clean.a_name;
                  } else {
                      a_identity += '\n' + '(' + wa_clean.a_name + ')';
                  }
              }
              if (wa_clean.a_social_link) {
                  a_identity += '\n' + '(' + wa_clean.a_social_link + ')';
              }
            })
            let b_identity = '';
            data.forEach(wa_clean => {
              b_identity = wa_clean.b_number || '';
              if (wa_clean.b_name) {
                  if (wa_clean.b_social_link) {
                      b_identity += '\n' + wa_clean.b_name;
                  } else {
                      b_identity += '\n' + '(' + wa_clean.b_name + ')';
                  }
              }
              if (wa_clean.b_social_link) {
                  b_identity += '\n' + '(' + wa_clean.b_social_link + ')';
              }
            })
            // Define table layout with smaller widths
            const tableTop = 100;
            const rowHeight = 30; 
            const columns = {
              no: { x: 50, width: 30 }, 
              date: { x: 80, width: 40 }, 
              time: { x: 120, width: 40 }, 
              a_identity: { x: 160, width: 100 }, 
              b_identity: { x: 260, width: 100 }, 
              group_name: { x: 360, width: 100 }, 
              chat_type: { x: 460, width: 80 }, 
              media: { x: 540, width: 100 }, 
              direction: { x: 640, width: 80 }, 
              call_description: { x: 720, width: 80 }, 
              content: { x: 800, width: 360 } 
            };
        
            // Add table headers with a background color for styling
            doc.font('Helvetica-Bold').fontSize(8); 
            doc.rect(50, tableTop - 10, 1100, rowHeight).fill('#f0f0f0').stroke();
            Object.entries(columns).forEach(([key, value]) => {
              doc.fillColor('#000').text(key.charAt(0).toUpperCase() + key.slice(1), value.x, tableTop);
            });
        
            // Add table content with wrapping text
            let rowTop = tableTop + rowHeight;
            doc.font('Helvetica').fontSize(8); 
            let no = 1;
            for (const row of data) {
              // Check if we need a new page
              if (rowTop > 780) { // Periksa apakah kita perlu menambahkan halaman baru
                doc.addPage();
                rowTop = 50;
        
                // Add headers to new page
                doc.font('Helvetica-Bold').fontSize(8);
                doc.rect(50, rowTop - 10, 1100, rowHeight).fill('#f0f0f0').stroke();
                Object.entries(columns).forEach(([key, value]) => {
                  doc.fillColor('#000').text(key.charAt(0).toUpperCase() + key.slice(1), value.x, rowTop);
                });
        
                rowTop += rowHeight;
                doc.font('Helvetica').fontSize(8);
              }
        
              // Wrap text and add row data
              doc.text(no, columns.no.x, rowTop);
              doc.text(row.date, columns.date.x, rowTop);
              doc.text(row.time, columns.time.x, rowTop);
              doc.text(a_identity || '', columns.a_identity.x, rowTop, { width: columns.a_identity.width, height: rowHeight, ellipsis: false });
              doc.text(b_identity || '', columns.b_identity.x, rowTop, { width: columns.b_identity.width, height: rowHeight, ellipsis: false });
              doc.text(row.group_name || '', columns.group_name.x, rowTop, { width: columns.group_name.width, height: rowHeight, ellipsis: false });
              doc.text(row.chat_type || '', columns.chat_type.x, rowTop, { width: columns.chat_type.width, height: rowHeight, ellipsis: false });
              doc.text(row.media || '', columns.media.x, rowTop, { width: columns.media.width, height: rowHeight, ellipsis: false });
              doc.text(row.direction || '', columns.direction.x, rowTop, { width: columns.direction.width, height: rowHeight, ellipsis: false });
              doc.text(row.call_description || '', columns.call_description.x, rowTop, { width: columns.call_description.width, height: rowHeight, ellipsis: false });
              doc.text(row.content || '', columns.content.x, rowTop, { width: columns.content.width, height: rowHeight, ellipsis: false });
        
              rowTop += rowHeight; // Update row position
              no++;
            }
        
            // Add page numbers
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
              doc.switchToPage(i);
              doc.fontSize(8).text( 
                `Page ${i + 1} of ${pages.count}`,
                50,
                doc.page.height - 40,
                { align: 'left' }
              );
            }
        
            // Finalize PDF
            doc.end();
            return response.redirect('back')
          } catch (error) {
            console.error('Error generating PDF:', error);
            return response.status(500).send({ error: 'Failed to generate PDF' });
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
