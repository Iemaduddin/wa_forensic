import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

import User from 'App/Models/User'
export default class UsersController {
  public async index({ request, view }: HttpContextContract) {

    // const users = await Database.from('users').select('*').paginate(page, limit)
    const users = await Database.from('users').select('*')
    // Changes the baseURL for the pagination links
    // users.baseUrl('/users')
    return view.render('users/main', { users: users })
  }

  public async create({}: HttpContextContract) {}

  public async store({ request, response }: HttpContextContract) {
    try {
      const { email, username, password } = request.body()
      await User.create({ email, username, password })

      return response.redirect('back')
    } catch (error) {
 
      return response.redirect('back')
    }
  }

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({ params, request, response }: HttpContextContract) {
    try {
      const { id } = params
      const { email, username, password } = request.body()

      // Temukan user berdasarkan ID
      const user = await User.findOrFail(id)

      // Update user dengan data baru
      user.email = email
      user.username = username
      if (password) {
        user.password = password // Pastikan password di-hash jika diperlukan
      }
      await user.save()

      // const message = 'User updated successfully!'
      // const success = true
      // const users = await User.all()
      // return view.render('users/main', { message, success, users })

      return response.redirect('back')
    } catch (error) {
      // Tangani kesalahan jika terjadi
      // const message = 'Something went wrong!'
      // const success = false
      // const users = await User.all()
      return response.redirect('back')
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const { id } = params
      const user = await User.findOrFail(id)
      await user.delete()
      // const message = 'User deleted successfully!'
      // const success = true
      // const users = await User.all()
      // return view.render('users/main', { message, success, users })

      return response.redirect('back')
    } catch (error) {
      // Tangani kesalahan jika terjadi
      // const message = 'Something went wrong!'
      // const success = false
      // const users = await User.all()
      return response.redirect('back')
    }
  }
}
