/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer''
|
*/

import Route from '@ioc:Adonis/Core/Route'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { promisify } from 'util'
const execAsync = promisify(require('child_process').exec)
Route.get('/', async ({ response }) => {
  return response.redirect('/login')
})
Route.group(() => {
  Route.get('/chats/wa_clean', 'ChatsController.index')
  Route.post('/chats/data/wa_clean', 'ChatsController.data_wa_clean').as('chats.data_wa_clean')
  Route.post('/chats/update_a_identity', 'ChatsController.update_a_identity').as(
    'chats.update_a_identity'
  )
  Route.post('/chats/wa_clean/export_Pdf', 'ChatsController.wa_clean_exportPdf').as(
    'chats.wa_clean_exportPdf'
  )
  // run script python
  Route.post(
    '/chats/wa_clean/run_script_py',
    async ({ request, response }: HttpContextContract) => {
      try {
        // Validasi input
        const databaseName =
          'wa_forensic_' + request.input('wa_owner_name').replace(/\s+/g, '_').toLowerCase()
        const folderName =
          'Forensic_' + request.input('wa_owner_name').replace(/\s+/g, '_').toUpperCase()

        // Validasi yang lebih detail
        if (!databaseName) {
          return response.status(422).json({
            status: 'error',
            message: 'Nama database harus diisi',
            details: 'Field database_name adalah wajib',
          })
        }

        // Jalankan script python
        try {
          const { stdout, stderr } = await execAsync(
            `python3 resources/python/main.py ${databaseName} ${folderName}`
          )

          if (stderr) {
            return response.status(500).json({
              status: 'error',
              message: 'Terjadi error saat menjalankan script',
              error: stderr,
              details: 'Lihat log server untuk informasi lebih lanjut',
            })
          }

          return response.status(200).json({
            status: 'success',
            message: `Database ${databaseName} telah berhasil dibuat!`,
            output: stdout,
          })
        } catch (execError) {
          console.error('Script execution error:', execError)
          return response.status(500).json({
            status: 'error',
            message: 'Gagal menjalankan script Python',
            error: execError.message,
            details: 'Pastikan Python dan dependensi yang diperlukan sudah terinstall',
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
  ).as('run_script_py')

  Route.get('/chats/wa_call_logs', 'ChatsController.call_logs')
  Route.post('/chats/data/call_logs', 'ChatsController.data_call_logs').as('chats.data_call_logs')

  Route.get('/chats/wa_display_profile', 'ChatsController.display_profile')
  Route.post('/chats/data_display_profile', 'ChatsController.data_display_profile').as(
    'chats.data_display_profile'
  )

  Route.get('/chats/wa_contacts', 'ChatsController.contacts')
  Route.post('/chats/data_contacts', 'ChatsController.data_contacts').as('chats.data_contacts')

  Route.get('/chats/wa_group_profile', 'ChatsController.group_profile')
  Route.post('/chats/data_group_profile', 'ChatsController.data_group_profile').as(
    'chats.data_group_profile'
  )

  Route.get('/chats/wa_media', 'ChatsController.media')
  Route.post('/chats/data_media', 'ChatsController.data_media').as('chats.data_media')

  Route.get('/users', 'UsersController.index')
  Route.post('/users/store', 'UsersController.store').as('users.store')
  Route.post('/users/update/:id', 'UsersController.update').as('users.update')
  Route.post('/users/delete/:id', 'UsersController.destroy').as('users.delete')
}).middleware('auth')
Route.post('/register', 'AuthController.register')
Route.get('/login', 'AuthController.login_show')
Route.post('/login', 'AuthController.login')
Route.post('/logout', 'AuthController.logout')
