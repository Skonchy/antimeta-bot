require('dotenv').config({path: "vars.env"});
const tmi = require('tmi.js');
const axios = require('axios');
const discord = require('discord.js');

let channels = ['twentz4215']

const discClient = new discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"] })

discClient.on('ready', () => {
    console.log(`Logged in as ${discClient.user.tag}!`);
});

discClient.login(process.env.DISCORD_CLIENT_TOKEN);

const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true
  },
  identity:{
      username: process.env.TWITCH_USERNAME,
      password: process.env.TWITCH_PASSWORD
  },
  channels: channels
});

client.connect();


client.on('message', async (channel, tags, message, self) => {
    getPotentialScum(await getViewerList(channel.slice(1,)), channel)
    console.log(`${tags['display-name']}: ${message}, ${channel}`);
    if(message === "!ShowScum"){
        client.say(channel, `@${tags.username}, SCUM: ${JSON.stringify(potentialScum)}`)
    }
});

setInterval(async () => {
    for(let channel in channels){
        let viewersList = await getViewerList(channel)
        let potentialScum = await getPotentialScum(viewersList)
        console.log(potentialScum)
    }
}, 60* 1000)


/*                  Functions                   */
async function getViewerList(channel){
    let viewerList = await axios.get(`https://tmi.twitch.tv/group/user/${channel}/chatters`).then( response => {
        let flatViewerList = []
        for(let group in response.data.chatters) {
            if(response.data.chatters[group].length > 0){
                for(let user in response.data.chatters[group]){
                    flatViewerList.push(response.data.chatters[group][user])
                }
            }
        }
        return flatViewerList
    })
    return viewerList
}

let potentialScum = []
async function getPotentialScum(viewersList, channel){

    await discClient.guilds.cache.forEach(async guild => {
        await guild.members.fetch().then((members) => {
            members.forEach((member) => {
                if(viewersList.includes(member.user.username.toLowerCase())){
                    let index = potentialScum?.findIndex(e => e.twitch === member.user.username.toLowerCase())
                    if(index >= 0){
                        potentialScum[index].last_found = Date()
                    } else {
                        potentialScum.push({
                            channel: channel,
                            twitch: `${member.user.username.toLowerCase()}`,
                            discord: `${member.user.username}#${member.user.discriminator}`,
                            first_found: Date(),
                            last_found: Date()
                        })
                    }
                }
            })
        })
    })
    return potentialScum

}
