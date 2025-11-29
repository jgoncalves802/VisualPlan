-- ============================================
-- MIGRATION 008: Adicionar Peso Estimado para WBS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar coluna peso_estimado à tabela eps_nodes
-- Default = 1.0 (representa 100% ou peso unitário)
ALTER TABLE eps_nodes 
ADD COLUMN IF NOT EXISTS peso_estimado DECIMAL(10,4) DEFAULT 1.0;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN eps_nodes.peso_estimado IS 'Peso estimado da WBS (default 1.0 = 100%). A soma dos pesos dos filhos deve totalizar 100% no nível do projeto (EPS).';

-- 3. Função para calcular soma de pesos dos filhos de um nó
CREATE OR REPLACE FUNCTION calculate_sibling_weight_sum(p_parent_id UUID, p_exclude_id UUID DEFAULT NULL)
RETURNS DECIMAL(10,4) AS $$
DECLARE
    total_weight DECIMAL(10,4);
BEGIN
    SELECT COALESCE(SUM(peso_estimado), 0)
    INTO total_weight
    FROM eps_nodes
    WHERE parent_id = p_parent_id
      AND ativo = true
      AND (p_exclude_id IS NULL OR id != p_exclude_id);
    
    RETURN total_weight;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para validar peso estimado antes de insert/update
CREATE OR REPLACE FUNCTION validate_wbs_weight()
RETURNS TRIGGER AS $$
DECLARE
    current_sum DECIMAL(10,4);
    new_sum DECIMAL(10,4);
    parent_nivel INTEGER;
BEGIN
    -- Só valida se tem parent_id (é WBS, não EPS raiz)
    IF NEW.parent_id IS NOT NULL THEN
        -- Calcula soma atual dos irmãos (excluindo o nó atual em update)
        IF TG_OP = 'UPDATE' THEN
            current_sum := calculate_sibling_weight_sum(NEW.parent_id, OLD.id);
        ELSE
            current_sum := calculate_sibling_weight_sum(NEW.parent_id, NULL);
        END IF;
        
        new_sum := current_sum + NEW.peso_estimado;
        
        -- Permite soma até 1.0 + tolerância (para evitar problemas de arredondamento)
        IF new_sum > 1.0001 THEN
            RAISE EXCEPTION 'A soma dos pesos excede 100%%. Soma atual: %%%, Novo peso: %%%, Total: %%%', 
                (current_sum * 100)::TEXT, 
                (NEW.peso_estimado * 100)::TEXT, 
                (new_sum * 100)::TEXT;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para validar peso em insert/update
DROP TRIGGER IF EXISTS validate_wbs_weight_trigger ON eps_nodes;
CREATE TRIGGER validate_wbs_weight_trigger
    BEFORE INSERT OR UPDATE OF peso_estimado ON eps_nodes
    FOR EACH ROW
    EXECUTE FUNCTION validate_wbs_weight();

-- 6. Função RPC para obter status de peso de um projeto
CREATE OR REPLACE FUNCTION get_project_weight_status(p_project_id UUID)
RETURNS TABLE(
    total_weight DECIMAL(10,4),
    is_valid BOOLEAN,
    remaining_weight DECIMAL(10,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(e.peso_estimado), 0) as total_weight,
        ABS(COALESCE(SUM(e.peso_estimado), 0) - 1.0) < 0.0001 as is_valid,
        1.0 - COALESCE(SUM(e.peso_estimado), 0) as remaining_weight
    FROM eps_nodes e
    WHERE e.parent_id = p_project_id
      AND e.ativo = true;
END;
$$ LANGUAGE plpgsql;

-- PRONTO! Coluna peso_estimado adicionada com validação.
