require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

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
        accept: 'application/json',
        'X-API-KEY': apiKeyOctadesk,
      },
      timeout: 60000, // Espera máxima de 60 segundos
    });
    return response.status === 200;
  } catch (error) {
    // Verifica se o erro é de timeout
    if (error.code === 'ECONNABORTED') {
      console.log('🚨 Timeout atingido! A API Octadesk não respondeu em 60 segundos.');
      await sendMessage('🚨 **API Octadesk está offline (timeout de 60 segundos)!** @everyone');
    }
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

// Comando para apagar mensagens em massa
client.on('messageCreate', async (message) => {
  console.log('Mensagem recebida:', message.content); // Log do conteúdo da mensagem

  // Verifica se a mensagem é o comando '!clear'
  if (message.content && message.content === '!clear') {
    console.log('Comando !clear detectado!'); // Log quando o comando é detectado

    // Verifica se o autor da mensagem tem permissão para excluir mensagens
    if (message.member.permissions.has('MANAGE_MESSAGES')) {
      console.log('Permissão de MANAGE_MESSAGES verificada com sucesso.'); // Log de permissão

      // Define o canal onde as mensagens devem ser apagadas
      const channel = message.channel;

      try {
        // Variável para armazenar as mensagens
        let fetched;

        // Busca as últimas 50 mensagens
        console.log('Buscando mensagens...'); // Log de busca
        fetched = await channel.messages.fetch({ limit: 100 }); // Limita para 20 mensagens
        console.log(`Mensagens encontradas: ${fetched.size}`); // Log do número de mensagens encontradas

        // Deleta as mensagens buscadas
        await channel.bulkDelete(fetched);

        console.log('Mensagens deletadas com sucesso!');
        message.channel.send('As últimas 20 mensagens foram deletadas!');
      } catch (err) {
        console.error('Erro ao deletar mensagens:', err);
        message.channel.send('Houve um erro ao tentar deletar as mensagens.');
      }
    } else {
      console.log('Usuário sem permissão para deletar mensagens.'); // Log quando não tem permissão
      message.channel.send('Você não tem permissão para deletar mensagens.');
    }
  }
});

// Evento quando o bot estiver pronto
client.once('ready', () => {
  console.log('Bot conectado ao Discord!');

  // Verificação periódica a cada 15 segundos
  setInterval(async () => {
    const isApi1Up = await checkAPI1();
    const isApi2Up = await checkAPI2();

    api1Status = isApi1Up; // Atualiza o status da API Bugtracker
    api2Status = isApi2Up; // Atualiza o status da API Octadesk

    // Monitoramento da API Bugtracker
    if (!isApi1Up) {
      if (!api1WasDown) {
        console.log('🚨 API Bugtracker está fora do ar!');
        api1DownTime = new Date(); // Salva o horário em que a API Bugtracker caiu
        await sendMessage('🚨 **API Bugtracker está fora do ar!** @everyone');
        api1WasDown = true;
      }
    } else {
      if (api1WasDown) {
        const downtimeDuration = calculateDowntime(api1DownTime);
        console.log('✅ API Bugtracker voltou a funcionar!');
        await sendMessage(`✅ **API Bugtracker está online novamente!** Ela ficou inativa ${downtimeDuration}`);
        api1WasDown = false;
        api1DownTime = null; // Reseta o horário de queda
      }
    }

    // Monitoramento da API Octadesk
    if (!isApi2Up) {
      if (!api2WasDown) {
        api2DownTime = new Date(); // Salva o horário em que a API Octadesk caiu
        console.log('🚨 API Octadesk está fora do ar!');
        await sendMessage('🚨 **API Octadesk está fora do ar!** @everyone');
        api2WasDown = true;
      } else {
        // Verifica se passou mais de 60 segundos desde que a API caiu
        const downtimeDuration = calculateDowntime(api2DownTime);
        if (downtimeDuration >= 60) {
          console.log(`🚨 API Octadesk continua offline há ${downtimeDuration} segundos`);
          await sendMessage(`🚨 **API Octadesk está offline há mais de 60 segundos!** @everyone`);
        }
      }
    } else {
      if (api2WasDown) {
        const downtimeDuration = calculateDowntime(api2DownTime);
        console.log('✅ API Octadesk voltou a funcionar!');
        await sendMessage(`✅ **API Octadesk está online novamente!** Ela ficou inativa por ${downtimeDuration}`);
        api2WasDown = false;
        api2DownTime = null; // Reseta o horário de queda
      }
    }
  }, 15 * 1000); // Intervalo de 15 segundos
});

// Função para calcular o tempo de inatividade
function calculateDowntime(downTime) {
  const now = new Date();
  const diffMs = now - downTime; // Diferença em milissegundos
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60)); // Horas
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); // Minutos
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000); // Segundos

  return `${diffHours} horas, ${diffMinutes} minutos e ${diffSeconds} segundos`;
}

// Inicia o servidor Express para expor o endpoint de status
const app = express();
const port = process.env.MONITOR_PORT || 10001; // Define a porta do monitor

// Endpoint de status
app.get('/status', (req, res) => {
  res.json({
    Bugtracker: api1Status,
    Octadesk: api2Status,
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor de monitoramento rodando em http://localhost:${port}`);
});

// Login do bot
client.login(process.env.BOT_TOKEN);
