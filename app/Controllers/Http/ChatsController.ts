import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
const fs = require('fs')
const path = require('path')
import PDFDocument from 'pdfkit'
import { promisify } from 'util'
const execAsync = promisify(require('child_process').exec)
import Hash from '@ioc:Adonis/Core/Hash'
export default class ChatsController {
  public async index({ view }: HttpContextContract) {
    let a_identity = null // Inisialisasi dengan null
    try {
      a_identity = await Database.from('wa_clean')
        .select('a_number', 'a_name', 'a_social_link')
        .first()
    } catch (error) {
      console.error('Error fetching data from wa_clean:', error.message)
    }

    return view.render('wa_forensic/wa_clean', { a_identity: a_identity })
  }

  async data_wa_clean({ request, response }) {
    const { start, length, search, order } = request.only(['start', 'length', 'search', 'order'])

    // Query awal
    let query = Database.from('wa_clean')

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
          .orWhere('content', 'like', `%${search.value}%`)
      })
    }

    // Handle sorting
    const orderColumn = [
      'date',
      'time',
      'a_number',
      'a_name',
      'a_social_link',
      'b_number',
      'b_name',
      'b_social_link',
      'group_name',
      'chat_type',
      'direction',
      'call_description',
      'content',
    ]
    if (order && order.length > 0) {
      const columnIndex = order[0].column
      const sortColumn = orderColumn[columnIndex - 1] // Dikurangi 1 karena kolom pertama untuk index
      const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc'
      query = query.orderBy(sortColumn, sortDirection)
    }

    // Dapatkan total semua data (tanpa filtering)
    const totalRecords = await Database.from('wa_clean').count('* as total')

    // Dapatkan total data yang difilter
    const filteredRecords = await query.clone().count('* as total')

    // Dapatkan data sesuai dengan pagination
    const data = await query.offset(start).limit(length)
    // Cek dan siapkan mediaPath
    data.forEach((chat) => {
      const mediaPath = chat.media

      const fullPath = mediaPath ? path.join(__dirname, '..', 'public/', mediaPath) : null

      // Cek apakah media ada di path
      chat.exists = fullPath ? fs.existsSync(fullPath) : false
      chat.mediaPath = fullPath ? mediaPath : null
    })

    // Response dalam format yang diminta oleh DataTables
    return response.json({
      draw: request.input('draw'),
      recordsTotal: totalRecords[0].total,
      recordsFiltered: filteredRecords[0].total,
      data: data,
    })
  }

  // Fungsi untuk update a_identity
  public async update_a_identity({ request, response }) {
    const a_number = request.input('a_number')
    const a_name = request.input('a_name')
    const a_social_link = request.input('a_social_link')
    try {
      const update_a_identity = await Database.from('wa_clean').where('a_number', a_number).update({
        a_name: a_name,
        a_social_link: a_social_link,
      })

      if (update_a_identity) {
        return response.json({ success: true, message: 'Data berhasil diperbarui' })
      } else {
        return response.json({ success: false, message: 'Update gagal' })
      }
    } catch (error) {
      return response.json({ success: false, message: 'Terjadi kesalahan: ' + error.message })
    }
  }

  // Fungsi untuk export PDF
  public async wa_clean_exportPdf({ response }: HttpContextContract) {
    try {
      // Create PDF document with A4 size
      const doc = new PDFDocument({
        margin: 20,
        size: [841.89, 595.28], // Ukuran A4
        bufferPages: true,
      })

      // Generate dynamic filename with current date
      const currentDate = new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
      const filename = `Report_WA_Forensic_${currentDate}.pdf`

      // Set response headers for automatic download
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)

      // Pipe the PDF to the response
      doc.pipe(response.response)

      // Add title with smaller font size
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('WhatsApp Chat Data Export', { align: 'center' })
        .moveDown(0)

      // Add timestamp with smaller font size
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })

      // Get data from database
      const data = await Database.from('wa_clean')

      // Define table layout with smaller widths
      const tableTop = 60
      const rowHeight = 30 // Tinggi default baris
      const columns = {
        no: { x: 20, width: 30 },
        date: { x: 50, width: 40 },
        time: { x: 90, width: 40 },
        a_identity: { x: 130, width: 70 },
        b_identity: { x: 200, width: 70 },
        group_name: { x: 270, width: 80 },
        chat_type: { x: 350, width: 70 },
        media: { x: 420, width: 80 },
        direction: { x: 500, width: 70 },
        call_description: { x: 570, width: 70 },
        content: { x: 640, width: 180 },
      }

      // Add table headers
      doc.font('Helvetica-Bold').fontSize(8)
      doc.rect(20, tableTop, 800, rowHeight).fill('#f0f0f0').stroke()

      // Header style
      Object.entries(columns).forEach(([key, value]) => {
        doc
          .fillColor('#000')
          .text(key.charAt(0).toUpperCase() + key.slice(1), value.x + 5, tableTop + 5, {
            width: value.width - 10,
            align: 'center',
            height: rowHeight,
            valign: 'middle',
          })
        doc.rect(value.x, tableTop, value.width, rowHeight).stroke() // Border di sekitar header cell
      })

      // Add table content
      let rowTop = tableTop + rowHeight
      doc.font('Helvetica').fontSize(8)
      let no = 1

      // Function to format identity
      function formatIdentity(number, name, socialLink) {
        let identity = number || '' // Memulai dengan nomor
        if (name) {
          if (socialLink) {
            identity += '\n' + name // Menambahkan nama dengan baris baru di depan
          } else {
            identity += '\n' + '(' + name + ')' // Menambahkan tautan sosial dengan kurung
          }
        }
        if (socialLink) {
          identity += '\n' + '(' + socialLink + ')' // Menambahkan tautan sosial dengan kurung
        }
        return identity
      }

      for (const row of data) {
        const a_identity = formatIdentity(row.a_number, row.a_name, row.a_social_link)
        const b_identity = formatIdentity(row.b_number, row.b_name, row.b_social_link)
        const groupName = row.group_name || ''
        const chatType = row.chat_type || ''
        const direction = row.direction || ''
        const callDescription = row.call_description || ''
        const content = row.content || ''

        // Menghitung tinggi baris berdasarkan isi kolom
        const contentHeight = doc.heightOfString(content, { width: columns.content.width - 10 })
        const aIdentityHeight = doc.heightOfString(a_identity, {
          width: columns.a_identity.width - 10,
        })
        const bIdentityHeight = doc.heightOfString(b_identity, {
          width: columns.b_identity.width - 10,
        })
        const groupNameHeight = doc.heightOfString(groupName, {
          width: columns.group_name.width - 10,
        })
        const mediaHeight = doc.heightOfString(row.media, {
          width: columns.media.width - 10,
        })

        // Mendapatkan tinggi gambar jika ada
        const imagePath = row.media ? `public/${row.media}` : null // Mendapatkan path gambar jika ada
        let imageHeight = 0

        if (imagePath) {
          try {
            const image = doc.openImage(imagePath)
            imageHeight = (image.height * columns.media.width) / image.width // Hitung tinggi gambar
          } catch (err) {
            console.error('Error loading image:', err)
            imageHeight = 0 // Jika gambar tidak ada, set imageHeight ke 0
          }
        }

        // Menentukan tinggi baris saat ini berdasarkan kolom tertinggi
        const currentRowHeight = Math.max(
          rowHeight,
          contentHeight + 10,
          aIdentityHeight + 10,
          bIdentityHeight + 10,
          groupNameHeight + 10,
          mediaHeight + 10,
          imageHeight + 10 // Menambahkan tinggi gambar ke dalam perhitungan
        )

        // Cek jika tinggi baris melebihi batas halaman
        if (rowTop + currentRowHeight > 555) {
          doc.addPage()
          rowTop = 35

          // Tambahkan header ke halaman baru
          doc.font('Helvetica-Bold').fontSize(8)
          doc.rect(20, rowTop, 800, rowHeight).fill('#f0f0f0').stroke()

          // Menambahkan header untuk setiap kolom
          Object.entries(columns).forEach(([key, value]) => {
            doc
              .fillColor('#000')
              .text(key.charAt(0).toUpperCase() + key.slice(1), value.x + 5, rowTop + 5, {
                width: value.width - 10,
                align: 'center',
                height: rowHeight,
                valign: 'middle',
              })
            doc.rect(value.x, rowTop, value.width, rowHeight).stroke() // Border di sekitar header cell
          })

          rowTop += rowHeight // Tinggi setelah header
          doc.font('Helvetica').fontSize(8)
        }

        // Wrap text and add row data
        doc.text(no, columns.no.x + 5, rowTop + 5, {
          width: columns.no.width - 10,
          align: 'center',
        })
        doc.text(row.date, columns.date.x + 5, rowTop + 5, {
          width: columns.date.width - 10,
          align: 'center',
        })
        doc.text(row.time, columns.time.x + 5, rowTop + 5, {
          width: columns.time.width - 10,
          align: 'center',
        })
        doc.text(a_identity || '', columns.a_identity.x + 5, rowTop + 5, {
          width: columns.a_identity.width - 10,
        })
        doc.text(b_identity || '', columns.b_identity.x + 5, rowTop + 5, {
          width: columns.b_identity.width - 10,
        })
        doc.text(groupName, columns.group_name.x + 5, rowTop + 5, {
          width: columns.group_name.width - 10,
        })
        doc.text(chatType, columns.chat_type.x + 5, rowTop + 5, {
          width: columns.chat_type.width - 10,
        })
        doc.text(direction, columns.direction.x + 5, rowTop + 5, {
          width: columns.direction.width - 10,
        })
        doc.text(callDescription, columns.call_description.x + 5, rowTop + 5, {
          width: columns.call_description.width - 10,
        })

        // Membungkus teks untuk konten
        doc.text(content || '', columns.content.x + 5, rowTop + 5, {
          width: columns.content.width - 10,
        })

        // Menampilkan gambar jika ada
        if (imageHeight > 0) {
          doc.image(imagePath, columns.media.x + 5, rowTop + 5, {
            width: columns.media.width - 10,
            height: imageHeight,
          })
          rowTop += Math.max(currentRowHeight, imageHeight + 10) // Menyesuaikan rowTop
        } else {
          doc.text(row.media || '', columns.media.x + 5, rowTop + 5, {
            width: columns.media.width - 10,
          })
          rowTop += currentRowHeight // Menambah rowTop untuk baris baru
        }

        // Gambarkan border untuk setiap cell
        Object.entries(columns).forEach(([key, value]) => {
          doc.rect(value.x, rowTop - currentRowHeight, value.width, currentRowHeight).stroke()
        })

        no++
      }
      // Add page numbers
      const pages = doc.bufferedPageRange()
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i)
        doc
          .fontSize(8)
          .text(`Page ${i + 1} of ${pages.count}`, doc.page.width - 150, 20, { align: 'right' }) // Menempatkan di pojok kanan atas
      }

      // Finalize PDF
      doc.end()
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  public async data_call_logs({ request, response }) {
    const { start, length, search, order } = request.only(['start', 'length', 'search', 'order'])

    // Query awal
    let query = Database.from('wa_call_logs')

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
          .orWhere('status_call', 'like', `%${search.value}%`)
      })
    }

    // Handle sorting
    const orderColumn = [
      'date',
      'time',
      'number',
      'name',
      'direction',
      'call_id',
      'call_type',
      'duration',
      'status_call',
    ]
    if (order && order.length > 0) {
      const columnIndex = order[0].column
      const sortColumn = orderColumn[columnIndex - 1] // Dikurangi 1 karena kolom pertama untuk index
      const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc'
      query = query.orderBy(sortColumn, sortDirection)
    }

    // Dapatkan total semua data (tanpa filtering)
    const totalRecords = await Database.from('wa_call_logs').count('* as total')

    // Dapatkan total data yang difilter
    const filteredRecords = await query.clone().count('* as total')

    // Dapatkan data sesuai dengan pagination
    const data = await query.offset(start).limit(length)

    // Response dalam format yang diminta oleh DataTables
    return response.json({
      draw: request.input('draw'),
      recordsTotal: totalRecords[0].total,
      recordsFiltered: filteredRecords[0].total,
      data: data,
    })
  }
  public async call_logs({ view }: HttpContextContract) {
    return view.render('wa_forensic/wa_call_logs')
  }
  public async display_profile({ view }: HttpContextContract) {
    return view.render('wa_forensic/wa_display_profile')
  }

  public async data_display_profile({ request, response }) {
    const { start, length, search, order } = request.only(['start', 'length', 'search', 'order'])

    // Query awal
    let query = Database.from('wa_display_profile')

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
          .orWhere('wa_type', 'like', `%${search.value}%`)
      })
    }

    // Handle sorting
    const orderColumn = [
      'display_name',
      'number',
      'email',
      'address',
      'business_description',
      'websites',
      'wa_type',
    ]
    if (order && order.length > 0) {
      const columnIndex = order[0].column
      const sortColumn = orderColumn[columnIndex - 1] // Dikurangi 1 karena kolom pertama untuk index
      const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc'
      query = query.orderBy(sortColumn, sortDirection)
    }

    // Dapatkan total semua data (tanpa filtering)
    const totalRecords = await Database.from('wa_display_profile').count('* as total')

    // Dapatkan total data yang difilter
    const filteredRecords = await query.clone().count('* as total')

    // Dapatkan data sesuai dengan pagination
    const data = await query.offset(start).limit(length)

    // Response dalam format yang diminta oleh DataTables
    return response.json({
      draw: request.input('draw'),
      recordsTotal: totalRecords[0].total,
      recordsFiltered: filteredRecords[0].total,
      data: data,
    })
  }
  public async group_profile({ view }: HttpContextContract) {
    return view.render('wa_forensic/wa_group_profile')
  }
  public async data_group_profile({ request, response }) {
    const { start, length, search, order } = request.only(['start', 'length', 'search', 'order'])

    // Query awal
    let query = Database.from('wa_group_profile')

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
          .orWhere('created_description_time', 'like', `%${search.value}%`)
          .orWhere('description_set_by', 'like', `%${search.value}%`)
          .orWhere('member_count', 'like', `%${search.value}%`)
          .orWhere('member_number', 'like', `%${search.value}%`)
          .orWhere('member_role', 'like', `%${search.value}%`)
          .orWhere('added_group_date', 'like', `%${search.value}%`)
          .orWhere('added_group_time', 'like', `%${search.value}%`)
      })
    }

    // Handle sorting
    const orderColumn = [
      'jid',
      'group_name',
      'created_group_date',
      'created_group_time',
      'created_by',
      'group_description',
      'created_description_date',
      'created_description_time',
      'description_set_by',
      'member_count',
      'member_number',
      'member_role',
      'added_group_date',
      'added_group_time',
    ]
    if (order && order.length > 0) {
      const columnIndex = order[0].column
      const sortColumn = orderColumn[columnIndex - 1] // Dikurangi 1 karena kolom pertama untuk index
      const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc'
      query = query.orderBy(sortColumn, sortDirection)
    }

    // Dapatkan total semua data (tanpa filtering)
    const totalRecords = await Database.from('wa_group_profile').count('* as total')

    // Dapatkan total data yang difilter
    const filteredRecords = await query.clone().count('* as total')

    // Dapatkan data sesuai dengan pagination
    const data = await query.offset(start).limit(length)

    // Response dalam format yang diminta oleh DataTables
    return response.json({
      draw: request.input('draw'),
      recordsTotal: totalRecords[0].total,
      recordsFiltered: filteredRecords[0].total,
      data: data,
    })
  }
  public async contacts({ view }: HttpContextContract) {
    return view.render('wa_forensic/wa_contacts')
  }

  public async data_contacts({ request, response }) {
    const { start, length, search, order } = request.only(['start', 'length', 'search', 'order'])

    // Query awal
    let query = Database.from('wa_contacts')

    // Handle pencarian
    if (search && search.value) {
      query = query.where((builder) => {
        builder
          .where('jid', 'like', `%${search.value}%`)
          .orWhere('status', 'like', `%${search.value}%`)
          .orWhere('status_timestamp', 'like', `%${search.value}%`)
          .orWhere('number', 'like', `%${search.value}%`)
          .orWhere('display_name', 'like', `%${search.value}%`)
          .orWhere('given_name', 'like', `%${search.value}%`)
          .orWhere('family_name', 'like', `%${search.value}%`)
          .orWhere('wa_name', 'like', `%${search.value}%`)
          .orWhere('nickname', 'like', `%${search.value}%`)
          .orWhere('company', 'like', `%${search.value}%`)
          .orWhere('title', 'like', `%${search.value}%`)
          .orWhere('favourite_contact', 'like', `%${search.value}%`)
          .orWhere('disappearing_mode_duration', 'like', `%${search.value}%`)
          .orWhere('disappearing_mode_timestamp', 'like', `%${search.value}%`)
      })
    }

    // Handle sorting
    const orderColumn = [
      'jid',
      'status',
      'status_timestamp',
      'number',
      'display_name',
      'given_name',
      'family_name',
      'wa_name',
      'nickname',
      'company',
      'title',
      'favourite_contact',
      'disappearing_mode_duration',
      'disappearing_mode_timestamp',
    ]
    if (order && order.length > 0) {
      const columnIndex = order[0].column
      const sortColumn = orderColumn[columnIndex - 1] // Dikurangi 1 karena kolom pertama untuk index
      const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc'
      query = query.orderBy(sortColumn, sortDirection)
    }

    // Dapatkan total semua data (tanpa filtering)
    const totalRecords = await Database.from('wa_contacts').count('* as total')

    // Dapatkan total data yang difilter
    const filteredRecords = await query.clone().count('* as total')

    // Dapatkan data sesuai dengan pagination
    const data = await query.offset(start).limit(length)

    // Response dalam format yang diminta oleh DataTables
    return response.json({
      draw: request.input('draw'),
      recordsTotal: totalRecords[0].total,
      recordsFiltered: filteredRecords[0].total,
      data: data,
    })
  }
  public async media({ view }: HttpContextContract) {
    return view.render('wa_forensic/wa_media')
  }

  public async data_media({ request, response }) {
    const { start, length, search, order } = request.only(['start', 'length', 'search', 'order'])

    // Query awal
    let query = Database.from('wa_media')

    // Handle pencarian
    if (search && search.value) {
      query = query.where((builder) => {
        builder
          .where('date', 'like', `%${search.value}%`)
          .orWhere('time', 'like', `%${search.value}%`)
          .orWhere('number', 'like', `%${search.value}%`)
          .orWhere('file_path', 'like', `%${search.value}%`)
          .orWhere('media_type', 'like', `%${search.value}%`)
          .orWhere('file_size', 'like', `%${search.value}%`)
          .orWhere('media_name', 'like', `%${search.value}%`)
          .orWhere('media_caption', 'like', `%${search.value}%`)
          .orWhere('media_duration', 'like', `%${search.value}%`)
      })
    }

    // Handle sorting
    const orderColumn = [
      'date',
      'time',
      'number',
      'file_path',
      'media_type',
      'file_size',
      'media_name',
      'media_caption',
      'media_duration',
    ]
    if (order && order.length > 0) {
      const columnIndex = order[0].column
      const sortColumn = orderColumn[columnIndex - 1] // Dikurangi 1 karena kolom pertama untuk index
      const sortDirection = order[0].dir === 'desc' ? 'desc' : 'asc'
      query = query.orderBy(sortColumn, sortDirection)
    }

    // Dapatkan total semua data (tanpa filtering)
    const totalRecords = await Database.from('wa_media').count('* as total')

    // Dapatkan total data yang difilter
    const filteredRecords = await query.clone().count('* as total')

    // Dapatkan data sesuai dengan pagination
    const data = await query.offset(start).limit(length)

    // Response dalam format yang diminta oleh DataTables
    return response.json({
      draw: request.input('draw'),
      recordsTotal: totalRecords[0].total,
      recordsFiltered: filteredRecords[0].total,
      data: data,
    })
  }

  async run_script_py({ request, response }: HttpContextContract) {
    try {
      // Validasi input
      const databaseName =
        'wa_forensic_' + request.input('wa_owner_name').replace(/\s+/g, '_').toLowerCase()
      const folderName =
        'Forensic_' + request.input('wa_owner_name').replace(/\s+/g, '_').toUpperCase()

      if (!databaseName) {
        return response.status(422).json({
          status: 'error',
          message: 'Nama database harus diisi',
          details: 'Field database_name adalah wajib',
        })
      }

      // Jalankan script Python
      try {
        const { stdout, stderr } = await execAsync(
          `python3 resources/python/main.py ${databaseName} ${folderName}`
        )

        if (stderr) {
          return response.status(500).json({
            status: 'error',
            message: 'Terjadi error saat menjalankan script Python',
            error: stderr,
            details: 'Lihat log server untuk informasi lebih lanjut',
          })
        }
        // Jalankan script Python untuk membuat table users
        try {
          const { stdout, stderr } = await execAsync(
            `python3 resources/python/create_users_table.py ${databaseName}`
          )

          if (stderr) {
            return response.status(500).json({
              status: 'error',
              message: 'Terjadi error saat menjalankan script Python',
              error: stderr,
              details: 'Lihat log server untuk informasi lebih lanjut',
            })
          }
        } catch (e) {
          return response.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat membuat user',
            error: e.message,
          })
        }
        const envFilePath = path.join(process.cwd(), '.env')
        if (!fs.existsSync(envFilePath)) {
          throw new Error('File .env tidak ditemukan')
        }

        // Backup .env file terlebih dahulu
        const envBackupPath = path.join(process.cwd(), '.env.backup')
        fs.copyFileSync(envFilePath, envBackupPath)
        try {
          // Baca dan update konten .env
          let envContent = fs.readFileSync(envFilePath, 'utf-8')
          envContent = envContent.replace(
            /MYSQL_DB_NAME=.*(\r?\n|$)/g,
            `MYSQL_DB_NAME=${databaseName}$1`
          )
          fs.writeFileSync(envFilePath, envContent)

          // Hapus backup file jika semua berhasil
          fs.unlinkSync(envBackupPath)

          return response.status(200).json({
            status: 'success',
            message: `Database ${databaseName} telah berhasil dibuat!`,
            output: stdout,
          })
        } catch (error) {
          // Jika terjadi error, kembalikan .env ke kondisi semula
          if (fs.existsSync(envBackupPath)) {
            fs.copyFileSync(envBackupPath, envFilePath)
            fs.unlinkSync(envBackupPath)
          }
          throw error
        }
      } catch (error) {
        console.error('Server error:', error)
        return response.status(500).json({
          status: 'error',
          message: 'Terjadi kesalahan internal server',
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        })
      }
    } catch (error) {
      console.error('Server error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan internal server',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      })
    }
  }
}
