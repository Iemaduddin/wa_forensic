import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class extends BaseSeeder {
  public async run() {
    await User.query().delete()

    // await User.createMany([
    //   { username: 'didinn_id', email: 'iemaduddin@gmail.com', password: 'password' },
    //   { username: 'dudin_123', email: 'iemaduddin1@gmail.com', password: 'password' },
    //   { username: 'didin_12', email: 'iemaduddin2@gmail.com', password: 'password' },
    //   { username: 'didin_11', email: 'iemaduddin3@gmail.com', password: 'password' },
    //   { username: 'didin_102', email: 'iemaduddin4@gmail.com', password: 'password' },
    // ])
    await User.create({
      username: `admin`,
      email: `admin@gmail.com`,
      password: 'password'
    })   
    for (let index = 0; index < 30; index++) {
      await User.create({
        username: `iemaduddin${index}`,
        email: `iemaduddin${index}@gmail.com`,
        password: 'password'
      })      
    }
  }
}
