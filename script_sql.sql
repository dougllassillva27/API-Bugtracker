CREATE DATABASE IntegracaoAPI;
GO

USE IntegracaoAPI;
GO

CREATE TABLE v_revendas_bugtracker (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(255) NOT NULL,
    [Razao Social] NVARCHAR(255) NOT NULL,
    [Estado] NVARCHAR(255) NOT NULL,
    [Codigo] NVARCHAR(255) NOT NULL,
    [CNPJ/doc] CHAR(14) NOT NULL,
    [Tipo Suporte] NVARCHAR(255) NOT NULL,
    [Categoria] NVARCHAR(255) NOT NULL,
    [Atendimento de Suporte] NVARCHAR(255) NULL,
    Obs NVARCHAR(MAX) NULL
);

-- Criar um índice para melhorar a busca pelo CNPJ
CREATE INDEX IDX_CNPJ ON v_revendas_bugtracker ([CNPJ/doc]);

-- Criar um índice para melhorar a busca pelo Nome
CREATE INDEX IDX_NOME ON v_revendas_bugtracker (Nome);

-- Inserir dados aleatórios
USE IntegracaoAPI;
GO

INSERT INTO v_revendas_bugtracker (Nome, [Razao Social], Estado, Codigo, [CNPJ/doc], [Tipo Suporte], [Categoria], [Atendimento de Suporte], Obs)
VALUES
    ('Tech Solutions', 'Tech Solutions LTDA', 'SP', FLOOR(RAND() * 10000), '12345678000195', 'Normal', 'Ouro', 'Bloqueado', 'Cliente com pendências'),
    ('InovaTech', 'InovaTech S.A.', 'RJ', FLOOR(RAND() * 10000), '98765432000160', 'Corporativo', 'Prata', 'Consultar Cobrança', 'Verificar fatura pendente'),
    ('MegaSoft', 'MegaSoft Comércio de Softwares', 'MG', FLOOR(RAND() * 10000), '56473829000188', 'Prioritário', 'Autorizada', '', 'Possível novo contrato'),
    ('Alpha Systems', 'Alpha Systems Ltda.', 'PR', FLOOR(RAND() * 10000), '11223344000155', 'Normal', 'Bronze', 'Bloqueado', 'Revisar suporte técnico'),
    ('NetCorp', 'NetCorp Telecomunicações', 'SC', FLOOR(RAND() * 10000), '55667788000122', 'Corporativo', 'Ouro', 'Consultar Cobrança', 'Aguardando aprovação de crédito'),
    ('SoftWareHouse', 'SoftWareHouse Inc.', 'BA', FLOOR(RAND() * 10000), '66554433000177', 'Prioritário', 'Prata', '', 'Cliente VIP'),
    ('Cloud Solutions', 'Cloud Solutions Ltda.', 'Comex', FLOOR(RAND() * 10000), '77889900000166', 'Normal', 'Autorizada', 'Bloqueado', 'Suporte em andamento'),
    ('DataCorp', 'DataCorp Inteligência de Dados', 'PE', FLOOR(RAND() * 10000), '99887766000155', 'Corporativo', 'Bronze', 'Consultar Cobrança', 'Problema crítico'),
    ('IT Global', 'IT Global Solutions', 'CE', FLOOR(RAND() * 10000), '88776655000144', 'Prioritário', 'Ouro', '', 'Análise de requisitos'),
    ('FastTech', 'FastTech Tecnologia', 'GO', FLOOR(RAND() * 10000), '77665544000133', 'Normal', 'Prata', 'Bloqueado', 'Em negociação');
