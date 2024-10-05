import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Chat extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public date: DateTime
  @column()
  public time: DateTime
  @column()
  public name: string
  @column()
  public number: string
  @column()
  public direction: string
  @column()
  public message_type: string
  @column()
  public content: string
  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
