-- Migration: 014_cronograma_column_configs
-- Purpose: Store per-user, per-project Gantt column configurations
-- Created: December 2025

-- Create table for storing column configurations
CREATE TABLE IF NOT EXISTS cronograma_column_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    visible_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    column_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one config per user per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_column_configs_user_projeto 
    ON cronograma_column_configs(user_id, projeto_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_column_configs_empresa 
    ON cronograma_column_configs(empresa_id);

-- Enable RLS
ALTER TABLE cronograma_column_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own configs
CREATE POLICY "Users can view their own column configs"
    ON cronograma_column_configs
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own configs
CREATE POLICY "Users can insert their own column configs"
    ON cronograma_column_configs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own configs
CREATE POLICY "Users can update their own column configs"
    ON cronograma_column_configs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own configs
CREATE POLICY "Users can delete their own column configs"
    ON cronograma_column_configs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_column_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_column_configs_updated_at ON cronograma_column_configs;
CREATE TRIGGER trigger_column_configs_updated_at
    BEFORE UPDATE ON cronograma_column_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_column_configs_updated_at();

-- Comment on table
COMMENT ON TABLE cronograma_column_configs IS 'Stores per-user, per-project Gantt column visibility and order configurations';
