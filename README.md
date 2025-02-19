# **API de Consulta de Revendas & Monitoramento de APIs com Discord Bot**

Este repositório contém dois projetos distintos:

1. **API de Consulta de Revendas**: Uma API construída com Express e SQL Server para consultar revendas usando um documento de identificação (CNPJ, CPF, ou documento alfanumérico) e gerenciar logs das consultas.
2. **Monitoramento de APIs com Discord Bot**: Um bot que monitora duas APIs externas e envia notificações no Discord quando alguma API está fora do ar ou voltou a funcionar.

---

# API de Consulta de Revendas

Esta é uma API construída com Express e SQL Server para consultar revendas usando o Documento. Ela também mantém um log das consultas e oferece endpoints para visualizar e limpar os logs.

### **Funcionalidades**

- **Consulta de Revendas**: permite que você consulte informações sobre uma revenda através do seu Documento de identificação (seja ele CNPJ, CPF ou documento alfanumérico (para clientes do exterior)). O documento pode ser fornecido com ou sem pontuação. A consulta é realizada em um banco de dados **SQL Server**, que contém os dados das revendas, como nome, razão social, tipo de suporte, categoria, estado e observações.
- **Logs**: mantém um log das últimas 100 consultas realizadas, com informações sobre as consultas feitas e erros.
- **Limpeza de Logs**: oferece um endpoint para limpar os logs armazenados.

### **Endpoints**

- /revendas/(cnpj): para consulta da revenda passando o documento da mesma (seja ele CPNJ, CPF ou alfanumérico) e usando o método **GET**.
- /logs: para consulta de logs dos últimos 100 documentos pesquisados na API, essa rota suporta o método **GET** para consultar e **DELETE** para apagar os logs.

### **Tecnologias Utilizadas**

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [SQL Server](https://www.microsoft.com/en-us/sql-server) configurado com as credenciais apropriadas
- Pacotes npm: `express`, `mssql`, `dotenv`

---

# **Monitoramento de APIs com Discord Bot**

### **Funcionalidades**

- Monitora duas APIs externas:
  - **API Bugtracker**
  - **API Octadesk**
- Envia mensagens para um canal no Discord notificando sobre o status das APIs.
- Verifica o status das APIs a cada 1 minuto.
- Notifica o canal do Discord quando alguma das APIs fica com o status offline e quando volta online.

### **Endpoints**
- /status: para consulta dos status das APIs.

### **Tecnologias Utilizadas**

- **Node.js**: Ambiente de execução para o código.
- **Discord.js**: Biblioteca para interagir com a API do Discord.
- **Axios**: Biblioteca para fazer requisições HTTP para as APIs externas.
- **Dotenv**: Para carregar variáveis de ambiente de um arquivo `.env`.

---

# Instalação

1. Clone o repositório ou baixe o código para sua máquina.
2. Instale as dependências necessárias:

```bash
npm install
```
