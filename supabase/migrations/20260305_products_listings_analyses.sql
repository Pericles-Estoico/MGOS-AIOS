-- Migration: Products + Listings + Analyses schema
-- Date: 2026-03-05
-- Story: STORY-5.1
-- Purpose: Modelo produto base (1) → listings por canal (N) → análises (N)

-- ============================================================================
-- TABLE: products (produto base)
-- ============================================================================
-- Um produto é uma entidade genérica independente de canal.
-- Ex: "Tênis Nike Air" — existe em múltiplos marketplaces como listings.

CREATE TABLE IF NOT EXISTS public.products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(500) NOT NULL,
  description  TEXT,
  category     VARCHAR(200),
  brand        VARCHAR(200),
  created_by   UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  public.products                IS 'Produto base — entidade genérica independente de marketplace';
COMMENT ON COLUMN public.products.created_by     IS 'Usuário dono do produto — base para RLS';

-- ============================================================================
-- TABLE: product_listings (listing por canal)
-- ============================================================================
-- Um listing é a representação do produto em um marketplace específico.
-- Tem URL pública, preço, imagem e score da última análise AI.

CREATE TABLE IF NOT EXISTS public.product_listings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  marketplace    VARCHAR(50) NOT NULL
                   CHECK (marketplace IN ('amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway')),
  url            TEXT,
  title          VARCHAR(500),
  price          VARCHAR(100),
  image_url      TEXT,
  listing_score  SMALLINT CHECK (listing_score BETWEEN 0 AND 100),
  status         VARCHAR(30) NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'analyzing', 'inactive')),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  public.product_listings               IS 'Listing do produto em um marketplace específico';
COMMENT ON COLUMN public.product_listings.listing_score IS 'Score 0-100 da última análise AI (null = ainda não analisado)';
COMMENT ON COLUMN public.product_listings.status        IS 'active | analyzing (análise em andamento) | inactive';

-- ============================================================================
-- TABLE: listing_analyses (histórico de análises AI)
-- ============================================================================
-- Cada análise executada para um listing é persistida.
-- Permite rastrear evolução do score ao longo do tempo.

CREATE TABLE IF NOT EXISTS public.listing_analyses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES public.product_listings(id) ON DELETE CASCADE,
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  summary         TEXT NOT NULL,
  strengths       JSONB NOT NULL DEFAULT '[]',
  weaknesses      JSONB NOT NULL DEFAULT '[]',
  analysis_data   JSONB NOT NULL DEFAULT '{}',
  analyzed_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  public.listing_analyses              IS 'Histórico de análises AI por listing — permite rastrear evolução';
COMMENT ON COLUMN public.listing_analyses.strengths    IS 'Array de strings com pontos fortes identificados pela AI';
COMMENT ON COLUMN public.listing_analyses.weaknesses   IS 'Array de strings com pontos a melhorar identificados pela AI';
COMMENT ON COLUMN public.listing_analyses.analysis_data IS 'Payload completo retornado pela AI para referência';

-- ============================================================================
-- ALTER TABLE: marketplace_tasks — adicionar listing_id (nullable)
-- ============================================================================
-- Tasks geradas pela análise AI são vinculadas ao listing que as originou.
-- Usa DO block para não falhar se a tabela ainda não existir neste ambiente.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'marketplace_tasks'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'marketplace_tasks' AND column_name = 'listing_id'
    ) THEN
      ALTER TABLE public.marketplace_tasks
        ADD COLUMN listing_id UUID REFERENCES public.product_listings(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_created_by
  ON public.products(created_by);

CREATE INDEX IF NOT EXISTS idx_product_listings_product_id
  ON public.product_listings(product_id);

CREATE INDEX IF NOT EXISTS idx_product_listings_marketplace
  ON public.product_listings(marketplace);

CREATE INDEX IF NOT EXISTS idx_product_listings_status
  ON public.product_listings(status);

CREATE INDEX IF NOT EXISTS idx_listing_analyses_listing_id
  ON public.listing_analyses(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_analyses_analyzed_at
  ON public.listing_analyses(analyzed_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_tasks' AND column_name = 'listing_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_marketplace_tasks_listing_id ON public.marketplace_tasks(listing_id);
  END IF;
END $$;

-- ============================================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

CREATE OR REPLACE FUNCTION update_product_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_listings_updated_at
  BEFORE UPDATE ON public.product_listings
  FOR EACH ROW EXECUTE FUNCTION update_product_listings_updated_at();

-- ============================================================================
-- RLS: Row-Level Security
-- ============================================================================

ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_analyses ENABLE ROW LEVEL SECURITY;

-- products: usuário vê apenas seus próprios produtos
DROP POLICY IF EXISTS "products_select_own" ON public.products;
CREATE POLICY "products_select_own" ON public.products
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (created_by = auth.uid());

-- product_listings: acesso via ownership do produto pai
DROP POLICY IF EXISTS "product_listings_select_own" ON public.product_listings;
CREATE POLICY "product_listings_select_own" ON public.product_listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_listings.product_id
        AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_listings_insert_own" ON public.product_listings;
CREATE POLICY "product_listings_insert_own" ON public.product_listings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_listings.product_id
        AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_listings_update_own" ON public.product_listings;
CREATE POLICY "product_listings_update_own" ON public.product_listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_listings.product_id
        AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_listings_delete_own" ON public.product_listings;
CREATE POLICY "product_listings_delete_own" ON public.product_listings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_listings.product_id
        AND p.created_by = auth.uid()
    )
  );

-- listing_analyses: acesso via ownership do listing → produto pai
DROP POLICY IF EXISTS "listing_analyses_select_own" ON public.listing_analyses;
CREATE POLICY "listing_analyses_select_own" ON public.listing_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1
        FROM public.product_listings pl
        JOIN public.products p ON p.id = pl.product_id
       WHERE pl.id = listing_analyses.listing_id
         AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "listing_analyses_insert_own" ON public.listing_analyses;
CREATE POLICY "listing_analyses_insert_own" ON public.listing_analyses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.product_listings pl
        JOIN public.products p ON p.id = pl.product_id
       WHERE pl.id = listing_analyses.listing_id
         AND p.created_by = auth.uid()
    )
  );
