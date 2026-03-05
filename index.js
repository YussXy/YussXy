import chalk from 'chalk'
import pino from 'pino'
import {
  default as makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} from 'baileys'
import { downloadContentFromMessage } from 'baileys'



//ISI DENGAN NOMER MU
global.pairingNumber = '6283188871798'







console.log(chalk.cyan('🚀 Starting WhatsApp Bot...'))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./sessions')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Edge'),
    markOnlineOnConnect: true
  })

  // PAIRING CODE
  if (!sock.authState.creds.registered) {
    console.log(chalk.yellow('📲 Generating pairing code...'))
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(global.pairingNumber)
        code = code?.match(/.{1,4}/g)?.join('-')
        console.log(chalk.black(chalk.bgGreen('PAIRING CODE')), chalk.white(code))
      } catch (err) {
        console.log(chalk.red('❌ Pairing failed'))
        console.error(err)
        process.exit(1)
      }
    }, 3000)
  }






  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0]
    if (!msg.message) return
    const sender = msg.key.remoteJid
    const jid = sender

    // animasi mengetik
    await sock.sendPresenceUpdate('composing', sender)
    await new Promise(r => setTimeout(r, 1000))

    const text =
      (msg.message.conversation) ||
      (msg.message.extendedTextMessage?.text)

    if (!text) return

if (text.toLowerCase() === '.tes') {
    await sock.sendMessage(
      sender,
      {
        text: '✅ bot on kak.'
      },
      { quoted: msg }
    )
  }





// fitur read viewOnce
  if (text.toLowerCase() === '.rvo' || text.toLowerCase() === '.readviewonce') {
    try {
      // pastikan membalas pesan viewOnce
      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return await sock.sendMessage(jid, {
          text: '❌ Reply pesan viewOnce nya!'
        }, { quoted: msg })
      }

      const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage

      const viewOnceMsg =
        quoted.viewOnceMessage?.message ||
        quoted.viewOnceMessageV2?.message ||
        quoted

      const mediaMsg =
        viewOnceMsg?.imageMessage ||
        viewOnceMsg?.videoMessage ||
        viewOnceMsg?.audioMessage

      if (!mediaMsg || !mediaMsg.viewOnce) {
        return await sock.sendMessage(jid, {
          text: '❌ Pesan itu bukan viewOnce!'
        }, { quoted: msg })
      }

      const stream = await downloadContentFromMessage(
        mediaMsg,
        mediaMsg.mimetype?.includes('image')
          ? 'image'
          : mediaMsg.mimetype?.includes('video')
          ? 'video'
          : 'audio'
      )

      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      if (/image/.test(mediaMsg.mimetype)) {
        await sock.sendMessage(jid, { image: buffer, caption: mediaMsg.caption || '' }, { quoted: msg })
      } else if (/video/.test(mediaMsg.mimetype)) {
        await sock.sendMessage(jid, { video: buffer, caption: mediaMsg.caption || '' }, { quoted: msg })
      } else if (/audio/.test(mediaMsg.mimetype)) {
        await sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg })
      }

    } catch (err) {
      console.error('Error rvo:', err)
      await sock.sendMessage(jid, { text: '❌ Gagal membaca viewOnce.' }, { quoted: msg })
    }
  }










//🙂🥲😛😌😇😋😅😌
  })

  // CONNECTION
sock.ev.on('connection.update', async (update) => {
    const { connection } = update


if (connection === 'open') {
    console.log(chalk.green('✅ WhatsApp Connected'))

    // ambil nomor bot
    const botNumber = sock.user.id.split(':')[0]

    // kirim pesan
    await sock.sendMessage(
      '6283159657382@s.whatsapp.net',
      {
        text: `🤖 BOT ONLINE

Bot berhasil terhubung
Nomor Bot : ${botNumber}
Status : Aktif ✅`
      }
    )
  }




    if (connection === 'close') {
      console.log(chalk.red('❌ Connection closed, restarting...'))
      startBot()
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('group-participants.update', () => {})
}

startBot()
