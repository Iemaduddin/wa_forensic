import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'
import View from '@ioc:Adonis/Core/View'
export default class AuthController {
  public async login_show({ view }: HttpContextContract) {
    return view.render('Auth/login')
  }
  public async register({ request, response, auth }: HttpContextContract) {
    const { username, email, password } = request.body()
    const existUser = await User.query()
      .where({ username: username })
      .orWhere({ email: email })
      .first()

    if (existUser) {
      if (existUser.username === username) {
        return response.status(422).json({
          message: 'Username already exists',
        })
      } else if (existUser.email === email) {
        return response.status(422).json({
          message: 'Email already exists',
        })
      }
    }

    const users = await User.create({
      username: username,
      email: email,
      password: password,
    })

    // Generate token
    // const token = await auth.use('api').generate(users)
    // return response.json({
    //   data: {
    //     user: users,
    //     token: token,
    //   },
    // })
  }
  public async login({ request, response, auth }: HttpContextContract) {
    try {
      const { email, password } = request.body()
      const rememberMe = request.input('rememberMe') === 'on'
      await auth.use('web').attempt(email, password, rememberMe)
      return response.redirect('/users')
    } catch {
      return response.badRequest('Invalid credentials He')
    }
  }
  // Generate token
  // const token = await auth.use('api').generate(user)
  // return response.json({
  //   data: {
  //     username: user.username,
  //     email: user.email,
  //     token: token,
  //   },
  // })

  public async logout({ auth, response }: HttpContextContract) {
    try {
      await auth.use('web').logout()
      return response.redirect('/login')
    } catch (error) {
      console.error('Logout Error:', error.message)
      return response.internalServerError('An error occurred during logout')
    }
  }
}
