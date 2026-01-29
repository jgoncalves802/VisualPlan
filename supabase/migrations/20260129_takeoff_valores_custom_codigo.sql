-- ============================================================================
-- Migration: Add coluna_codigo to takeoff_valores_custom
-- Purpose: Allow storing custom values by column code directly, without requiring
--          a pre-existing coluna_config entry. This simplifies imports and allows
--          flexible column handling.
-- ============================================================================

-- 1. Add coluna_codigo column (nullable, as existing rows use coluna_config_id)
ALTER TABLE takeoff_valores_custom 
ADD COLUMN IF NOT EXISTS coluna_codigo VARCHAR(100);

-- 2. Make coluna_config_id nullable to support values stored by code only
ALTER TABLE takeoff_valores_custom 
ALTER COLUMN coluna_config_id DROP NOT NULL;

-- 3. Create index for coluna_codigo lookups
CREATE INDEX IF NOT EXISTS idx_takeoff_valores_custom_codigo ON takeoff_valores_custom(coluna_codigo);

-- 4. Add constraint to ensure at least one identifier is present
ALTER TABLE takeoff_valores_custom 
ADD CONSTRAINT takeoff_valores_custom_identifier_check 
CHECK (coluna_config_id IS NOT NULL OR coluna_codigo IS NOT NULL);

-- 5. Add unique constraint for item_id + coluna_codigo combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_takeoff_valores_custom_item_codigo 
ON takeoff_valores_custom(item_id, coluna_codigo) 
WHERE coluna_codigo IS NOT NULL;

-- 6. Comment for documentation
COMMENT ON COLUMN takeoff_valores_custom.coluna_codigo IS 'Column code for flexible value storage. Can be used instead of coluna_config_id for dynamic columns.';
