import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
export default class UsersController {
  public async index({ view }: HttpContextContract) {
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
      const { username, password } = request.body()

      // Definisikan schema validasi
      const updateSchema = schema.create({
        email: schema.string({}, [rules.email()]),
      })

      // Validasi input dari request
      const payload = await request.validate({ schema: updateSchema })

      // Temukan user berdasarkan ID
      const user = await User.findOrFail(id)
      // Update user dengan data baru
      user.email = payload.email
      user.username = username
      if (password) {
        user.password = password
      }
      await user.save()

      return response.redirect('back')
    } catch (error) {
      return response.redirect('back')
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const { id } = params
      const user = await User.findOrFail(id)
      await user.delete()
      return response.redirect('back')
    } catch (error) {
      return response.redirect('back')
    }
  }
}
