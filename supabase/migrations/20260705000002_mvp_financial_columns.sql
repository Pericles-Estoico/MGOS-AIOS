-- Story 1.6: Adiciona colunas financeiras em mvp_products
ALTER TABLE mvp_products
  ADD COLUMN IF NOT EXISTS preco_venda       numeric(10,2),
  ADD COLUMN IF NOT EXISTS taxa_canal        numeric(5,2),
  ADD COLUMN IF NOT EXISTS prazo_repasse_dias integer,
  ADD COLUMN IF NOT EXISTS data_venda_estimada date;
