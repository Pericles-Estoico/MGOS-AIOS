-- MVP Tracker Schema (Story 1.1)
-- Tabelas isoladas com prefixo mvp_: mvp_products, mvp_stages, mvp_costs, mvp_category_templates
-- Zero impacto em tabelas existentes (tasks, evidence, qa_reviews, audit_logs, etc.)

-- ============================================================
-- TABELA: mvp_products
-- ============================================================
CREATE TABLE IF NOT EXISTS mvp_products (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                    TEXT NOT NULL,
  categoria               TEXT NOT NULL,
  canal_venda             TEXT NOT NULL DEFAULT 'ecommerce',
  quantidade              INT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  data_inicio_plan        DATE,
  status                  TEXT NOT NULL DEFAULT 'planejado'
                            CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'cancelado')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: mvp_stages
-- ============================================================
CREATE TABLE IF NOT EXISTS mvp_stages (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES mvp_products(id) ON DELETE CASCADE,
  nome                    TEXT NOT NULL,
  ordem                   INT NOT NULL DEFAULT 0,
  data_inicio_plan        DATE,
  data_fim_plan           DATE,
  data_inicio_real        DATE,
  data_fim_real           DATE,
  status                  TEXT NOT NULL DEFAULT 'planejada'
                            CHECK (status IN ('planejada', 'em_andamento', 'concluida', 'atrasada')),
  responsavel_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: mvp_costs
-- ============================================================
CREATE TABLE IF NOT EXISTS mvp_costs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id                UUID NOT NULL REFERENCES mvp_stages(id) ON DELETE CASCADE,
  tipo                    TEXT NOT NULL
                            CHECK (tipo IN (
                              'materia-prima',
                              'mao-de-obra',
                              'terceirizacao',
                              'logistica',
                              'embalagem',
                              'marketing',
                              'taxas-marketplace'
                            )),
  descricao               TEXT,
  valor_planejado         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (valor_planejado >= 0),
  valor_real              NUMERIC(10,2) DEFAULT 0 CHECK (valor_real >= 0),
  data_lancamento         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by              UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: mvp_category_templates
-- Dados compartilhados (seed) — sem user_id (não são por usuário)
-- ============================================================
CREATE TABLE IF NOT EXISTS mvp_category_templates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria               TEXT NOT NULL UNIQUE,
  stages                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mvp_products_user_id
  ON mvp_products(user_id);

CREATE INDEX IF NOT EXISTS idx_mvp_products_status
  ON mvp_products(status);

CREATE INDEX IF NOT EXISTS idx_mvp_stages_product_id
  ON mvp_stages(product_id);

CREATE INDEX IF NOT EXISTS idx_mvp_stages_status
  ON mvp_stages(status);

CREATE INDEX IF NOT EXISTS idx_mvp_costs_stage_id
  ON mvp_costs(stage_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mvp_products_updated_at
  BEFORE UPDATE ON mvp_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER mvp_stages_updated_at
  BEFORE UPDATE ON mvp_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- mvp_products: usuário acessa apenas seus próprios produtos
ALTER TABLE mvp_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mvp_products: usuario acessa apenas seus produtos"
  ON mvp_products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- mvp_stages: acesso via join com mvp_products
ALTER TABLE mvp_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mvp_stages: acesso via produto do usuario"
  ON mvp_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mvp_products
      WHERE mvp_products.id = mvp_stages.product_id
        AND mvp_products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mvp_products
      WHERE mvp_products.id = mvp_stages.product_id
        AND mvp_products.user_id = auth.uid()
    )
  );

-- mvp_costs: acesso via join com mvp_stages → mvp_products
ALTER TABLE mvp_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mvp_costs: acesso via etapa do produto do usuario"
  ON mvp_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM mvp_stages
      JOIN mvp_products ON mvp_products.id = mvp_stages.product_id
      WHERE mvp_stages.id = mvp_costs.stage_id
        AND mvp_products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM mvp_stages
      JOIN mvp_products ON mvp_products.id = mvp_stages.product_id
      WHERE mvp_stages.id = mvp_costs.stage_id
        AND mvp_products.user_id = auth.uid()
    )
  );

-- mvp_category_templates: leitura pública (dados de seed compartilhados)
-- escrita restrita a service_role via Supabase admin
ALTER TABLE mvp_category_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mvp_category_templates: leitura para usuarios autenticados"
  ON mvp_category_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED: 7 categorias de confecção de vestuário
-- ============================================================

INSERT INTO mvp_category_templates (categoria, stages) VALUES

('camiseta', '[
  {"nome": "Inventário de Insumos",       "ordem": 1,  "duracao_dias": 1},
  {"nome": "Planejamento PCP",             "ordem": 2,  "duracao_dias": 1},
  {"nome": "Compra/Reposição de Tecido",   "ordem": 3,  "duracao_dias": 3},
  {"nome": "Enfestamento",                 "ordem": 4,  "duracao_dias": 1},
  {"nome": "Corte",                        "ordem": 5,  "duracao_dias": 1},
  {"nome": "Separação e Loteamento",       "ordem": 6,  "duracao_dias": 1},
  {"nome": "Costura - Fechar Ombro",       "ordem": 7,  "duracao_dias": 1},
  {"nome": "Costura - Mangas",             "ordem": 8,  "duracao_dias": 1},
  {"nome": "Costura - Gola",               "ordem": 9,  "duracao_dias": 1},
  {"nome": "Costura - Bainha",             "ordem": 10, "duracao_dias": 1},
  {"nome": "Controle de Qualidade",        "ordem": 11, "duracao_dias": 1},
  {"nome": "Passadoria",                   "ordem": 12, "duracao_dias": 1},
  {"nome": "Etiquetagem e Embalagem",      "ordem": 13, "duracao_dias": 1},
  {"nome": "Cadastro no E-commerce",       "ordem": 14, "duracao_dias": 1},
  {"nome": "Fotos e Marketing",            "ordem": 15, "duracao_dias": 2},
  {"nome": "Expedição",                    "ordem": 16, "duracao_dias": 1},
  {"nome": "Recebimento do Pagamento",     "ordem": 17, "duracao_dias": 1}
]'::jsonb),

('calca', '[
  {"nome": "Inventário de Insumos",       "ordem": 1,  "duracao_dias": 1},
  {"nome": "Planejamento PCP",             "ordem": 2,  "duracao_dias": 1},
  {"nome": "Compra/Reposição de Tecido",   "ordem": 3,  "duracao_dias": 3},
  {"nome": "Enfestamento",                 "ordem": 4,  "duracao_dias": 1},
  {"nome": "Corte",                        "ordem": 5,  "duracao_dias": 1},
  {"nome": "Separação e Loteamento",       "ordem": 6,  "duracao_dias": 1},
  {"nome": "Costura - Frente e Fundo",     "ordem": 7,  "duracao_dias": 2},
  {"nome": "Costura - Cós",               "ordem": 8,  "duracao_dias": 1},
  {"nome": "Costura - Bolsos",             "ordem": 9,  "duracao_dias": 1},
  {"nome": "Costura - Barra",              "ordem": 10, "duracao_dias": 1},
  {"nome": "Controle de Qualidade",        "ordem": 11, "duracao_dias": 1},
  {"nome": "Passadoria",                   "ordem": 12, "duracao_dias": 1},
  {"nome": "Etiquetagem e Embalagem",      "ordem": 13, "duracao_dias": 1},
  {"nome": "Cadastro no E-commerce",       "ordem": 14, "duracao_dias": 1},
  {"nome": "Fotos e Marketing",            "ordem": 15, "duracao_dias": 2},
  {"nome": "Expedição",                    "ordem": 16, "duracao_dias": 1},
  {"nome": "Recebimento do Pagamento",     "ordem": 17, "duracao_dias": 1}
]'::jsonb),

('vestido', '[
  {"nome": "Inventário de Insumos",       "ordem": 1,  "duracao_dias": 1},
  {"nome": "Planejamento PCP",             "ordem": 2,  "duracao_dias": 1},
  {"nome": "Compra/Reposição de Tecido",   "ordem": 3,  "duracao_dias": 3},
  {"nome": "Enfestamento",                 "ordem": 4,  "duracao_dias": 1},
  {"nome": "Corte",                        "ordem": 5,  "duracao_dias": 1},
  {"nome": "Separação e Loteamento",       "ordem": 6,  "duracao_dias": 1},
  {"nome": "Costura - Corpo/Busto",        "ordem": 7,  "duracao_dias": 2},
  {"nome": "Costura - Saia/Barra",         "ordem": 8,  "duracao_dias": 1},
  {"nome": "Costura - Decote e Acabamentos","ordem": 9, "duracao_dias": 1},
  {"nome": "Costura - Zíper/Botões",       "ordem": 10, "duracao_dias": 1},
  {"nome": "Controle de Qualidade",        "ordem": 11, "duracao_dias": 1},
  {"nome": "Passadoria",                   "ordem": 12, "duracao_dias": 1},
  {"nome": "Etiquetagem e Embalagem",      "ordem": 13, "duracao_dias": 1},
  {"nome": "Cadastro no E-commerce",       "ordem": 14, "duracao_dias": 1},
  {"nome": "Fotos e Marketing",            "ordem": 15, "duracao_dias": 2},
  {"nome": "Expedição",                    "ordem": 16, "duracao_dias": 1},
  {"nome": "Recebimento do Pagamento",     "ordem": 17, "duracao_dias": 1}
]'::jsonb),

('conjunto', '[
  {"nome": "Inventário de Insumos",       "ordem": 1,  "duracao_dias": 1},
  {"nome": "Planejamento PCP",             "ordem": 2,  "duracao_dias": 1},
  {"nome": "Compra/Reposição de Tecido",   "ordem": 3,  "duracao_dias": 3},
  {"nome": "Enfestamento",                 "ordem": 4,  "duracao_dias": 1},
  {"nome": "Corte (todas as peças)",       "ordem": 5,  "duracao_dias": 2},
  {"nome": "Separação e Loteamento",       "ordem": 6,  "duracao_dias": 1},
  {"nome": "Costura - Peça Superior",      "ordem": 7,  "duracao_dias": 2},
  {"nome": "Costura - Peça Inferior",      "ordem": 8,  "duracao_dias": 2},
  {"nome": "Acabamentos Gerais",           "ordem": 9,  "duracao_dias": 1},
  {"nome": "Controle de Qualidade",        "ordem": 10, "duracao_dias": 1},
  {"nome": "Passadoria",                   "ordem": 11, "duracao_dias": 1},
  {"nome": "Etiquetagem e Embalagem",      "ordem": 12, "duracao_dias": 1},
  {"nome": "Cadastro no E-commerce",       "ordem": 13, "duracao_dias": 1},
  {"nome": "Fotos e Marketing",            "ordem": 14, "duracao_dias": 2},
  {"nome": "Expedição",                    "ordem": 15, "duracao_dias": 1},
  {"nome": "Recebimento do Pagamento",     "ordem": 16, "duracao_dias": 1}
]'::jsonb),

('moda-infantil', '[
  {"nome": "Inventário de Insumos",       "ordem": 1,  "duracao_dias": 1},
  {"nome": "Planejamento PCP",             "ordem": 2,  "duracao_dias": 1},
  {"nome": "Compra/Reposição de Tecido",   "ordem": 3,  "duracao_dias": 3},
  {"nome": "Enfestamento",                 "ordem": 4,  "duracao_dias": 1},
  {"nome": "Corte",                        "ordem": 5,  "duracao_dias": 1},
  {"nome": "Separação e Loteamento",       "ordem": 6,  "duracao_dias": 1},
  {"nome": "Costura - Estrutura",          "ordem": 7,  "duracao_dias": 2},
  {"nome": "Costura - Detalhes/Apliques",  "ordem": 8,  "duracao_dias": 1},
  {"nome": "Controle de Qualidade",        "ordem": 9,  "duracao_dias": 1},
  {"nome": "Passadoria",                   "ordem": 10, "duracao_dias": 1},
  {"nome": "Etiquetagem e Embalagem",      "ordem": 11, "duracao_dias": 1},
  {"nome": "Cadastro no E-commerce",       "ordem": 12, "duracao_dias": 1},
  {"nome": "Fotos e Marketing",            "ordem": 13, "duracao_dias": 2},
  {"nome": "Expedição",                    "ordem": 14, "duracao_dias": 1},
  {"nome": "Recebimento do Pagamento",     "ordem": 15, "duracao_dias": 1}
]'::jsonb),

('jaqueta', '[
  {"nome": "Inventário de Insumos",       "ordem": 1,  "duracao_dias": 1},
  {"nome": "Planejamento PCP",             "ordem": 2,  "duracao_dias": 1},
  {"nome": "Compra/Reposição de Materiais","ordem": 3,  "duracao_dias": 5},
  {"nome": "Enfestamento",                 "ordem": 4,  "duracao_dias": 1},
  {"nome": "Corte",                        "ordem": 5,  "duracao_dias": 2},
  {"nome": "Separação e Loteamento",       "ordem": 6,  "duracao_dias": 1},
  {"nome": "Costura - Estrutura/Corpo",    "ordem": 7,  "duracao_dias": 2},
  {"nome": "Costura - Mangas",             "ordem": 8,  "duracao_dias": 2},
  {"nome": "Costura - Forro Interno",      "ordem": 9,  "duracao_dias": 2},
  {"nome": "Costura - Zíper/Fechamento",   "ordem": 10, "duracao_dias": 1},
  {"nome": "Costura - Bolsos",             "ordem": 11, "duracao_dias": 1},
  {"nome": "Controle de Qualidade",        "ordem": 12, "duracao_dias": 1},
  {"nome": "Passadoria",                   "ordem": 13, "duracao_dias": 1},
  {"nome": "Etiquetagem e Embalagem",      "ordem": 14, "duracao_dias": 1},
  {"nome": "Cadastro no E-commerce",       "ordem": 15, "duracao_dias": 1},
  {"nome": "Fotos e Marketing",            "ordem": 16, "duracao_dias": 2},
  {"nome": "Expedição",                    "ordem": 17, "duracao_dias": 1},
  {"nome": "Recebimento do Pagamento",     "ordem": 18, "duracao_dias": 1}
]'::jsonb),

('acessorio', '[
  {"nome": "Inventário de Insumos",       "ordem": 1,  "duracao_dias": 1},
  {"nome": "Planejamento PCP",             "ordem": 2,  "duracao_dias": 1},
  {"nome": "Compra/Reposição de Materiais","ordem": 3,  "duracao_dias": 3},
  {"nome": "Corte/Preparação",             "ordem": 4,  "duracao_dias": 1},
  {"nome": "Montagem/Produção",            "ordem": 5,  "duracao_dias": 2},
  {"nome": "Acabamentos e Detalhes",       "ordem": 6,  "duracao_dias": 1},
  {"nome": "Controle de Qualidade",        "ordem": 7,  "duracao_dias": 1},
  {"nome": "Embalagem",                    "ordem": 8,  "duracao_dias": 1},
  {"nome": "Cadastro no E-commerce",       "ordem": 9,  "duracao_dias": 1},
  {"nome": "Fotos e Marketing",            "ordem": 10, "duracao_dias": 2},
  {"nome": "Expedição",                    "ordem": 11, "duracao_dias": 1},
  {"nome": "Recebimento do Pagamento",     "ordem": 12, "duracao_dias": 1}
]'::jsonb)

ON CONFLICT (categoria) DO NOTHING;
