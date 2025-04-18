/*
MIT License

Copyright (c) 2025 Douglas Silva

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Inicializar o bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const apiUrl1 = process.env.API_URL1; // URL da primeira API (Bugtracker)
const apiUrl2 = process.env.API_URL2; // URL base da segunda API (Octadesk)
const channelId = process.env.CHANNEL_ID; // Canal do Discord onde as mensagens serão enviadas
const apiKeyOctadesk = process.env.API_OCTADESK_KEY; // Chave de API do Octadesk

// Função para verificar a primeira API (Bugtracker)
async function checkAPI1() {
  try {
    const response = await axios.get(apiUrl1);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Função para verificar a segunda API (Octadesk)
async function checkAPI2() {
  try {
    const response = await axios.get(`${apiUrl2}/chat?sort[direction]=asc`, {
      headers: {
        accept: 'application/json',
        'X-API-KEY': apiKeyOctadesk,
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
    console.error('Erro ao enviar mensagem:', err);
  }
}

// Evento de quando o bot estiver pronto
client.once('ready', () => {
  console.log('Bot conectado ao Discord!');

  // Verificação periódica a cada 1 minuto
  setInterval(async () => {
    const isApi1Up = await checkAPI1();
    const isApi2Up = await checkAPI2();

    // Verificar o status da primeira API (Bugtracker)
    if (isApi1Up) {
      console.log('✅ API Bugtracker está funcionando corretamente.');
      await sendMessage('✅ **API Bugtracker está funcionando corretamente!**');
    } else {
      console.log('🚨 API Bugtracker está fora do ar!');
      await sendMessage('🚨 **API Bugtracker está fora do ar!** @everyone');
    }

    // Verificar o status da segunda API (Octadesk)
    if (isApi2Up) {
      console.log('✅ API Octadesk está funcionando corretamente.');
      await sendMessage('✅ **API Octadesk está funcionando corretamente!**');
    } else {
      console.log('🚨 API Octadesk está fora do ar!');
      await sendMessage('🚨 **API Octadesk está fora do ar!** @everyone');
    }
  }, 60 * 1000); // Intervalo de 1 minuto
});

// Login do bot com o token
client.login(process.env.BOT_TOKEN);
