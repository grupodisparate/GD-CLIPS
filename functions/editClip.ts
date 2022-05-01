import editly, { Config } from 'editly'
import fs from 'fs'
import path from 'path'
import { getClipData } from './common'
import { Message, MessageEmbed } from 'discord.js'

export async function editClip (gdClipId: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Iniciando edição do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Iniciando...')
      ]
    }).catch(console.error)
  }
  const clipVideoPath = path.join(clipDataPath, 'clip.mp4')
  if (!fs.existsSync(clipVideoPath)) return new Error(`Clip video not found for: ${clipVideoPath}`)
  const lowerThirdPath = path.join(clipDataPath, 'lowerThird.png')
  if (!fs.existsSync(lowerThirdPath)) return new Error(`Lower third not found for: ${lowerThirdPath}`)

  const editSpec: Config = {
    outPath: path.join(clipDataPath, 'clipEdited.mp4'),
    clips: [
      {
        layers: [
          { type: 'video', path: clipVideoPath },
          { type: 'image-overlay', path: lowerThirdPath }
        ]
      }
    ],
    keepSourceAudio: true,
    width: 1920,
    height: 1080,
    fps: 60
  }

  const editedClip = await editly(editSpec).catch(err => {
    console.error(err)
    return new Error(`Editly failed for: ${gdClipId}`)
  })
  if (editedClip instanceof Error) return new Error(editedClip.message)
  if (!fs.existsSync(editSpec.outPath)) return new Error(`Edited clip not found for: ${editSpec.outPath}`)
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Clipe editado com sucesso!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Finalizado')
      ]
    }).catch(console.error)
  }
}
