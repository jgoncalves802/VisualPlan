-- ============================================================================
-- Migration: Add mapa_id to takeoff_colunas_config
-- Purpose: Allow custom columns to be associated with specific maps instead of just disciplines
-- ============================================================================

-- 1. Add mapa_id column (nullable initially for backwards compatibility)
ALTER TABLE takeoff_colunas_config 
ADD COLUMN IF NOT EXISTS mapa_id UUID REFERENCES takeoff_mapas(id) ON DELETE CASCADE;

-- 2. Create index for mapa_id lookups
CREATE INDEX IF NOT EXISTS idx_takeoff_colunas_mapa ON takeoff_colunas_config(mapa_id);

-- 3. Drop the old unique constraint (disciplina_id, codigo)
ALTER TABLE takeoff_colunas_config 
DROP CONSTRAINT IF EXISTS takeoff_colunas_config_disciplina_id_codigo_key;

-- 4. Create new unique constraint that includes mapa_id
-- This allows same column code to exist in different maps within the same discipline
ALTER TABLE takeoff_colunas_config 
ADD CONSTRAINT takeoff_colunas_config_disciplina_mapa_codigo_key 
UNIQUE (disciplina_id, mapa_id, codigo);

-- 5. Comment for documentation
COMMENT ON COLUMN takeoff_colunas_config.mapa_id IS 'Optional association to a specific map. When set, column is map-specific. When NULL, column applies to all maps of the discipline.';
