require("dotenv").config();
const { Client, GatewayIntentBits, Permissions } = require("discord.js");  // Importando Permissions
const axios = require("axios");
const express = require("express");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const apiUrl1 = process.env.API_URL1; // API Bugtracker
const apiUrl2 = process.env.API_URL2; // API Octadesk
const channelId = process.env.CHANNEL_ID; // Canal do Discord
const apiKeyOctadesk = process.env.API_OCTADESK_KEY; // Chave API Octadesk

let api1WasDown = false; // Estado da API Bugtracker
let api2WasDown = false; // Estado da API Octadesk

let api1Status = false; // Estado atual da API Bugtracker
let api2Status = false; // Estado atual da API Octadesk

let api1DownTime = null; // Armazena o horário em que a API Bugtracker caiu
let api2DownTime = null; // Armazena o horário em que a API Octadesk caiu

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

// Comando para apagar mensagens em massa
client.on("messageCreate", async (message) => {
  console.log("Mensagem recebida:", message.content); // Log do conteúdo da mensagem

  // Verifica se a mensagem é o comando '!clear'
  if (message.content && message.content === "!clear") {
    console.log("Comando !clear detectado!"); // Log quando o comando é detectado

    // Verifica se o autor da mensagem tem permissão para gerenciar mensagens
    if (!message.guild.members.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      console.log("Você não tem permissão para gerenciar mensagens!");
      return message.reply("Você não tem permissão para gerenciar mensagens!");
    }

    console.log("Permissão de MANAGE_MESSAGES verificada com sucesso.");

    // Inicia a busca pelas mensagens
    try {
      let messages;
      let deletedMessagesCount = 0;
      do {
        messages = await message.channel.messages.fetch({ limit: 100 });
        await message.channel.bulkDelete(messages, true);
        deletedMessagesCount += messages.size;
        console.log(`Deletadas ${messages.size} mensagens`);
      } while (messages.size === 100);  // Continua até não haver mais 100 mensagens

      console.log(`Total de mensagens deletadas: ${deletedMessagesCount}`);
    } catch (error) {
      console.error("Erro ao deletar mensagens:", error);
      message.reply("Houve um erro ao tentar deletar as mensagens.");
    }
  }
});

// Loga o bot no Discord
client.login(process.env.DISCORD_TOKEN);
