import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class extends BaseSeeder {
  public async run() {
    await User.query().delete()
    await User.create({
      username: `admin`,
      email: `admin@gmail.com`,
      password: 'password',
    })
  }
}
