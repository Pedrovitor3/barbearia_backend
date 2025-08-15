-- ============================================
-- SISTEMA DE AGENDAMENTO - BANCO POSTGRESQL (SERIAL)
-- ============================================
-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================
-- Tabela de endereços
CREATE TABLE enderecos (
    endereco_id SERIAL PRIMARY KEY,
    cep VARCHAR(10) NOT NULL,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    pais VARCHAR(50) DEFAULT 'Brasil',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de empresas
CREATE TABLE empresas (
    empresa_id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    cnpj CHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de pessoas
CREATE TABLE pessoas (
    pessoa_id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE,
    nome VARCHAR(255) NOT NULL,
    sobrenome VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'I')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de vínculo entre pessoa e empresa
CREATE TABLE pessoa_empresas (
    pessoa_empresa_id SERIAL PRIMARY KEY,
    pessoa_id INT REFERENCES pessoas(pessoa_id) ON DELETE CASCADE,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de endereços de pessoas
CREATE TABLE enderecos_pessoas (
    endereco_pessoa_id SERIAL PRIMARY KEY,
    pessoa_id INT REFERENCES pessoas(pessoa_id) ON DELETE CASCADE,
    endereco_id INT REFERENCES enderecos(endereco_id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('casa')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (pessoa_id, tipo)
);

CREATE TABLE enderecos_empresas (
    endereco_empresa_id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    endereco_id INT REFERENCES enderecos(endereco_id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sede', 'filial')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (empresa_id, tipo)
);

-- Tabela de administradores
CREATE TABLE administradores (
    admin_id SERIAL PRIMARY KEY,
    pessoa_id INT REFERENCES pessoas(pessoa_id) ON DELETE CASCADE,
    nivel VARCHAR(50) DEFAULT 'super',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(pessoa_id)
);

-- Tabela de clientes
CREATE TABLE clientes (
    cliente_id SERIAL PRIMARY KEY,
    pessoa_id INT REFERENCES pessoas(pessoa_id) ON DELETE CASCADE,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferencias JSONB,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(pessoa_id, empresa_id)
);

-- Tabela de funcionários
CREATE TABLE funcionarios (
    funcionario_id SERIAL PRIMARY KEY,
    pessoa_id INT REFERENCES pessoas(pessoa_id) ON DELETE CASCADE,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    cargo VARCHAR(100) NOT NULL,
    salario DECIMAL(10, 2),
    data_admissao DATE NOT NULL,
    data_demissao DATE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(pessoa_id, empresa_id)
);

-- Tabela de usuários do sistema
CREATE TABLE usuarios (
    usuario_id SERIAL PRIMARY KEY,
    pessoa_id INT REFERENCES pessoas(pessoa_id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ultimo_login TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de serviços
CREATE TABLE servicos (
    servico_id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL DEFAULT 60,
    preco DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de horários de trabalho
CREATE TABLE horarios_trabalho (
    horarios_trabalho_id SERIAL PRIMARY KEY,
    funcionario_id INT REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    dia_semana INTEGER CHECK (
        dia_semana BETWEEN 0
        AND 6
    ),
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CHECK (horario_fim > horario_inicio)
);

-- Tabela de agendamentos
CREATE TABLE agendamentos (
    agendamento_id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    cliente_id INT REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    funcionario_id INT REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE,
    servico_id INT REFERENCES servicos(servico_id) ON DELETE CASCADE,
    data_agendamento DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    status VARCHAR(20) CHECK (
        status IN (
            'agendado',
            'confirmado',
            'em_andamento',
            'concluido',
            'cancelado'
        )
    ) DEFAULT 'agendado',
    valor DECIMAL(10, 2),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CHECK (horario_fim > horario_inicio)
);

-- Tabela de notificações
CREATE TABLE notificacoes (
    notificacao_id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    agendamento_id INT REFERENCES agendamentos(agendamento_id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT,
    enviado_em TIMESTAMP,
    lido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de avaliações
CREATE TABLE avaliacoes (
    avaliacao_id SERIAL PRIMARY KEY,
    agendamento_id INT REFERENCES agendamentos(agendamento_id) ON DELETE CASCADE,
    cliente_id INT REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    funcionario_id INT REFERENCES funcionarios(funcionario_id) ON DELETE CASCADE,
    servico_id INT REFERENCES servicos(servico_id) ON DELETE CASCADE,
    nota INTEGER CHECK (
        nota BETWEEN 1
        AND 5
    ),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de promoções
CREATE TABLE promocoes (
    promocao_id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(empresa_id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_desconto VARCHAR(20) CHECK (tipo_desconto IN ('percentual', 'valor_fixo')),
    valor_desconto DECIMAL(10, 2),
    data_inicio DATE,
    data_fim DATE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabela de logs de atividades
CREATE TABLE logs_atividades (
    log_id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(50),
    registro_id INT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fidelidade
CREATE TABLE programa_fidelidade (
    fidelidade_id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    pontos_acumulados INTEGER DEFAULT 0,
    total_gasto DECIMAL(10, 2) DEFAULT 0,
    nivel VARCHAR(20) DEFAULT 'bronze',
    data_ultima_visita DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_pessoas_cpf ON pessoas(cpf);

CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);

CREATE INDEX idx_agendamentos_data_empresa ON agendamentos(data_agendamento, empresa_id);

CREATE INDEX idx_agendamentos_funcionario_periodo ON agendamentos(funcionario_id, data_agendamento);

CREATE INDEX idx_agendamentos_status ON agendamentos(status);

-- Índices GIN para JSONB
CREATE INDEX idx_clientes_preferencias ON clientes USING GIN (preferencias);

CREATE INDEX idx_logs_dados_anteriores ON logs_atividades USING GIN (dados_anteriores);

CREATE INDEX idx_logs_dados_novos ON logs_atividades USING GIN (dados_novos);

-- ============================================
-- TRIGGER GENÉRICA PARA UPDATED_AT
-- ============================================
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

DO $$ DECLARE r record;

BEGIN FOR r IN
SELECT
    table_name
FROM
    information_schema.columns
WHERE
    column_name = 'updated_at'
    AND table_schema = 'public' LOOP EXECUTE format(
        'CREATE TRIGGER trg_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        r.table_name,
        r.table_name
    );

END LOOP;

END $$;

-- ============================================
-- VIEW DE RELATÓRIOS
-- ============================================
CREATE VIEW v_agendamentos_detalhados AS
SELECT
    a.agendamento_id,
    e.nome_fantasia AS empresa,
    pc.nome || ' ' || pc.sobrenome AS cliente,
    pf.nome || ' ' || pf.sobrenome AS funcionario,
    s.nome AS servico,
    a.data_agendamento,
    a.horario_inicio,
    a.horario_fim,
    a.status,
    a.valor,
    a.observacoes
FROM
    agendamentos a
    JOIN empresas e ON a.empresa_id = e.empresa_id
    JOIN clientes c ON a.cliente_id = c.cliente_id
    JOIN pessoas pc ON c.pessoa_id = pc.pessoa_id
    JOIN funcionarios f ON a.funcionario_id = f.funcionario_id
    JOIN pessoas pf ON f.pessoa_id = pf.pessoa_id
    JOIN servicos s ON a.servico_id = s.servico_id;

-- ============================================
-- FUNÇÃO PARA DISPONIBILIDADE
-- ============================================
CREATE
OR REPLACE FUNCTION verificar_disponibilidade(
    p_funcionario_id INT,
    p_data DATE,
    p_horario_inicio TIME,
    p_duracao_minutos INTEGER
) RETURNS BOOLEAN AS $$ DECLARE v_horario_fim TIME := p_horario_inicio + (p_duracao_minutos || ' minutes') :: INTERVAL;

v_existente INT;

BEGIN
SELECT
    COUNT(*) INTO v_existente
FROM
    agendamentos
WHERE
    funcionario_id = p_funcionario_id
    AND data_agendamento = p_data
    AND status NOT IN ('cancelado')
    AND (horario_inicio, horario_fim) OVERLAPS (p_horario_inicio, v_horario_fim);

RETURN v_existente = 0;

END;

$$ LANGUAGE plpgsql;