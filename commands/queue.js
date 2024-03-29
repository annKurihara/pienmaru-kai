const { EmbedBuilder } = require('discord.js')
const config = require('../config.json')

module.exports = {
  name: 'queue',
  aliases: ['q'],
  run: async (client, message) => {
    const queue = client.distube.getQueue(message)
    if (!queue) {
      let embed = new EmbedBuilder()
        .setColor(config.color.error)
        .setDescription(
            `There is nothing playing!`
        )
      return message.channel.send({ embeds: [embed]})  
    }
    let q = queue.songs
      .slice(0, 10)
      .map((song, i) => `${i === 0 ? 'Playing:' : `${i}.`} ${song.name} - \`${song.formattedDuration}\` ${i === 0 ? `\n`: ''}`)
      .join('\n')
      let embed = new EmbedBuilder()
            .setColor(config.color.info)
            .setDescription(
                `＊＊＊＊＊＊＊ **Server Queue** ＊＊＊＊＊＊＊\n\n${q}`
            )
      message.channel.send({ embeds: [embed]})
  }
}
