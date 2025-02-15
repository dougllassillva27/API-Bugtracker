require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const apiUrl1 = process.env.API_URL1; // API Bugtracker
const apiUrl2 = process.env.API_URL2; // API Octadesk
const channelId = process.env.CHANNEL_ID; // Canal do Discord
const apiKeyOctadesk = process.env.API_OCTADESK_KEY; // Chave API Octadesk

let api1WasDown = false; // Estado da API Bugtracker
let api2WasDown = false; // Estado da API Octadesk

// Função para verificar a API Bugtracker
async function checkAPI1() {
  try {
    const response = await axios.get(apiUrl1);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Função para verificar a API Octadesk
async function checkAPI2() {
  try {
    const response = await axios.get(`${apiUrl2}/chat?sort[direction]=asc`, {
      headers: {
        accept: "application/json",
        "X-API-KEY": apiKeyOctadesk,
      },
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Função para enviar mensagem no Discord
async function sendMessage(message) {
  try {
    const channel = await client.channels.fetch(channelId);
    await channel.send(message);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
  }
}

// Evento quando o bot estiver pronto
client.once("ready", () => {
  console.log("Bot conectado ao Discord!");

  // Verificação periódica a cada 1 minuto
  setInterval(async () => {
    const isApi1Up = await checkAPI1();
    const isApi2Up = await checkAPI2();

    // Monitoramento da API Bugtracker
    if (!isApi1Up) {
      if (!api1WasDown) {
        console.log("🚨 API Bugtracker está fora do ar!");
        await sendMessage("🚨 **API Bugtracker está fora do ar!** @everyone");
        api1WasDown = true;
      }
    } else {
      if (api1WasDown) {
        console.log("✅ API Bugtracker voltou a funcionar!");
        await sendMessage("✅ **API Bugtracker voltou a funcionar!**");
        api1WasDown = false;
      }
    }

    // Monitoramento da API Octadesk
    if (!isApi2Up) {
      if (!api2WasDown) {
        console.log("🚨 API Octadesk está fora do ar!");
        await sendMessage("🚨 **API Octadesk está fora do ar!** @everyone");
        api2WasDown = true;
      }
    } else {
      if (api2WasDown) {
        console.log("✅ API Octadesk voltou a funcionar!");
        await sendMessage("✅ **API Octadesk voltou a funcionar!**");
        api2WasDown = false;
      }
    }
  }, 60 * 1000); // Intervalo de 1 minuto
});

// Login do bot
client.login(process.env.BOT_TOKEN);
