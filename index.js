const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  AudioPlayerStatus,
  getVoiceConnection,
} = require("@discordjs/voice");
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const { createReadStream, createWriteStream } = require("fs");

const ytdl = require("ytdl-core");
const config = require("./config");
const player = createAudioPlayer();

let play_list = [];

const get_url = require("./get_url");

client.on("ready", (message) => {
  console.log(`Logged in as ${client.user.tag}!`);
});

async function probeAndCreateResource(readableStream) {
  const { stream, type } = await demuxProbe(readableStream);
  return createAudioResource(stream, { inputType: type });
}

client.on("interactionCreate", async (interaction) => {
  interaction_copy = interaction;
  if (!interaction.isChatInputCommand()) return;

  if (interaction.channel.name !== "สั่งบอท") {
    await interaction.reply("ไปสั่งคำสั่งในห้อง #สั่งบอท");
    return;
  }

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }

  if (interaction.commandName === "play") {
    let bot = interaction.guild.channels.cache.some(
      (e) =>
        e.name === interaction.member.voice.channel.name &&
        e.members.has(client.user.id)
    );
    if (!bot) {
      await interaction.reply("ใช้คำสั่ง /join ก่อนเปิดเพลง...");
      return;
    }

    await interaction.reply("กำลังหาเพลง รอสักครู่...");
    const sound = interaction.options.getString("ที่อยู่");
    const use_link = interaction.options.getBoolean("ใช้ลิงค์");
    const data = use_link ? { title: sound, url: sound } : await get_url(sound);

    if (player.state.status === AudioPlayerStatus.Playing) {
      play_list.push(data);
      await interaction.editReply(`เพิ่มเพลง ${data.title} ลงในคิวแล้ว!!`);
      return;
    }

    ytdl(data.url, {
      filter: "audioonly",
    })
      .on("error", async () => {
        await interaction.editReply("ไม่เจอ หรือไม่ก็ใส่ผิด ลองใหม่นะ...");
        return;
      })
      .pipe(createWriteStream("test.mp3"))
      .on("finish", async () => {
        await interaction.editReply(`เจอแล้ว!! ${data.url}`);
        const mp3Stream = await probeAndCreateResource(
          createReadStream("test.mp3")
        );
        player.play(mp3Stream);
      });
  }

  if (interaction.commandName === "join") {
    if (interaction.member.voice.channel !== null) {
      const voiceConnection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      voiceConnection.subscribe(player);
      player.stop();
      await interaction.reply(
        `เข้าห้อง #${interaction.member.voice.channel.name} แล้ว`
      );
    } else {
      await interaction.reply("เข้าห้องก่อนสั่ง...");
    }
  }

  if (interaction.commandName === "queue") {
    let text = "";
    if (play_list.length === 0) {
      text = "เพลย์ลิสต์ว่าง...";
    } else {
      for (let i = 0; i < play_list.length; i++) {
        text += `${i + 1}.) ${play_list[i].title}\n`;
      }
    }

    await interaction.reply(text);
  }

  if (interaction.commandName === "stop") {
    player.stop();
    play_list = [];
    await interaction.reply(
      "หยุดเล่นเพลง และ เคลียร์เพลย์ลิสต์ทั้งหมดเรียบร้อยแล้ว..."
    );
  }

  if (interaction.commandName === "pause") {
    player.pause();
    await interaction.reply("หยุดเล่นเพลงชั่วคราว...");
  }

  if (interaction.commandName === "upause") {
    player.unpause();
    await interaction.reply("เล่นเพลงต่อ...");
  }

  if (interaction.commandName === "leave") {
    player.stop();
    play_list = [];
    getVoiceConnection(interaction.guildId).disconnect();
    await interaction.reply("บ๊ายบ่าย...");
  }
});

player.on(AudioPlayerStatus.Idle, async () => {
  let channel = client.channels.cache.find((e) => e.name === "สั่งบอท");
  if (play_list.length === 0) {
    channel.send("เพลย์ลิสต์ ว่างแล้ว...");
    return;
  }
  let data = play_list.shift();

  channel.send(`เจอแล้ว!! ${data.url}`);
  ytdl(data.url, {
    filter: "audioonly",
  })
    .pipe(createWriteStream("test.mp3"))
    .on("finish", async () => {
      const mp3Stream = await probeAndCreateResource(
        createReadStream("test.mp3")
      );
      player.play(mp3Stream);
    });
});

client.login(config.token);
