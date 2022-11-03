const {
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");
const config = require("./config");

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("เข้าห้องเสียง")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("เปิดเพลง")
    .addBooleanOption((opt) =>
      opt
        .setName("ใช้ลิงค์")
        .setDescription("ติ๊กเพื่อใช้ลิงค์เพลง")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("ที่อยู่").setDescription("ใส่ที่อยู่เพลง").setRequired(true)
    )
    .toJSON(),
  {
    name: "queue",
    description: "ดูคิวเพลงทั้งหมด",
  },
  {
    name: "stop",
    description: "หยุดเพลงทั้งหมด และ เคลียร์เพลย์ลิสต์",
  },
  {
    name: "pause",
    description: "หยุดเพลงชั่วคราว",
  },
  {
    name: "upause",
    description: "ยกเลิกหยุดเพลงชั่วคราว",
  },
  {
    name: "leave",
    description: "ออกจากห้อง",
  },
];

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(config.client_id), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
