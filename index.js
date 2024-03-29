const { DisTube } = require('distube')
const { ActivityType, Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')

const fs = require('fs')
const path = require('node:path');
const config = require('./config.json')
const prefix = config.prefix
const embedColor = config.color

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
})

client.config = require('./config.json')
client.distube = new DisTube(client, {
    leaveOnStop: false,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [
        new SpotifyPlugin({
            emitEventsAfterFetching: true
        }),
        new SoundCloudPlugin(),
        new YtDlpPlugin()
    ]
})
client.commands = new Collection()
client.slashCommands = new Collection()
client.aliases = new Collection()
client.emotes = config.emoji

const commandsPath = path.join(__dirname, 'slash');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

fs.readdir('./commands/', (err, files) => {
    if (err) return console.log('Could not find any commands!')

    const jsFiles = files.filter(f => f.split('.').pop() === 'js')
    if (jsFiles.length <= 0) return console.log('Could not find any commands!')
  
    jsFiles.forEach(file => {
        const cmd = require(`./commands/${file}`)
        console.log(`Loaded ${file}`)
        client.commands.set(cmd.name, cmd)
        if (cmd.aliases) cmd.aliases.forEach(alias => client.aliases.set(alias, cmd.name))
    })
})

client.on('ready', () => {
    console.log(`${client.user.tag} is online!`)
    client.user.setStatus("online");    
    client.user.setActivity(
        "with mommy OwO"
        //"Mom working OwO", 
        //{ type: ActivityType.Watching }
        );
})

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return
    if (!message.content.startsWith(prefix)) {
        onMagicWords(message) 
        return
    } 

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase()
    const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))

    console.log("CMD", cmd)
    if (!cmd || cmd === undefined || cmd.name === undefined) {
        let embed = new EmbedBuilder()
            .setColor(embedColor.error)
            .setDescription(`I don't understand that command ;-; \n  Try ask my mom maybe?`)
        return message.channel.send({ embeds: [embed]})
    }
    if (cmd.inVoiceChannel && !message.member.voice.channel) {
        let embed = new EmbedBuilder()
            .setColor(embedColor.info)
            .setDescription(`Can you hop into any voice channel first, please? :>`)
        return message.channel.send({ embeds: [embed]})
    }
    try {
        cmd.run(client, message, args)
    } catch (e) {
        console.error(e)
        message.channel.send(`${client.emotes.error} | Error: \`${e}\``)
    }
})

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const slashCommand = require(filePath);
	// Set a new item in the Collection with the key as the slashCommand name and the value as the exported module
	if ('data' in slashCommand && 'execute' in slashCommand) {
		client.slashCommands.set(slashCommand.data.name, slashCommand);
		console.log("COMMAND OK", slashCommand.data.name)
	} else {
		console.log(`[WARNING] The slashCommand at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const slashCommand = client.slashCommands.get(interaction.commandName);
	if (!slashCommand) return;

	try {
		await slashCommand.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this slashCommand!', ephemeral: true });
	}
});

client.distube
    .on('playSong', (queue, song) => {
        let embed = new EmbedBuilder()
            .setColor(embedColor.play)
            .setDescription(
                `${client.emotes.play} \u200B Playing [${song.name}](${song.url}) - \`${song.formattedDuration}\``
            )
        queue.textChannel.send({ embeds: [embed]})
    })
    .on('addSong', (queue, song) => {
        let embed = new EmbedBuilder()
            .setColor(embedColor.queue)
            .setDescription(
                `Added [${song.name}](${song.url}) - \`${song.formattedDuration}\``
            )
        queue.textChannel.send({ embeds: [embed]})
    })
    .on('addList', (queue, playlist) => {
        let embed = new EmbedBuilder()
            .setColor(embedColor.queue)
            .setDescription(
                `Added playlist: \`${playlist.name}\` (${playlist.songs.length} songs) to queue`
            )
        queue.textChannel.send({ embeds: [embed]})
    })
    .on('error', (queue, e) => {
        if (queue.textChannel) {
            let embed = new EmbedBuilder()
            .setColor(embedColor.error)
            .setDescription(
                `I got an error! ;A; | ${e.toString().slice(0, 1974)}`
            )
        queue.textChannel.send({ embeds: [embed]})
        } else console.error(e)
    })
    .on('empty', queue => {
        let embed = new EmbedBuilder()
            .setColor(embedColor.info)
            .setDescription(`I left the channel since no one here ;-;`)
        queue.textChannel.send({ embeds: [embed]})
    })
    .on('searchNoResult', (message, query) => {
        let embed = new EmbedBuilder()
            .setColor(embedColor.error)
            .setDescription(`What is that (；A；) \n I can't find any song with that keyword...`)
        message.channel.send({ embeds: [embed]})
    })
    .on('finish', queue => {
        let embed = new EmbedBuilder()
            .setColor(embedColor.info)
            .setDescription(`End of song queue! Otsukare~ UwU`)
        queue.textChannel.send({ embeds: [embed]})
    })

    async function onMagicWords(message) {
        var magicWord = message.content.toLowerCase()
        let reactPien = '🥺'
                const customPien = message.guild.emojis.cache.find(emoji => 
                    emoji.name === 'pieeennn');
                if (customPien !== undefined) {
                   reactPien = customPien
                }
        switch (magicWord) {
            case 'pien':
            case 'pn':
                message.react(reactPien);
              break
            case 'gg':
                message.reply('ez')
              break
        }
    }

client.login(config.token)