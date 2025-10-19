-- Migration: Create record_cooking_event function
-- This function handles the complex logic of recording a cooking event:
-- 1. Validates recipe exists and belongs to user
-- 2. Captures current fridge state (before cooking)
-- 3. Validates sufficient ingredients
-- 4. Updates fridge quantities using FIFO strategy
-- 5. Captures new fridge state (after cooking)
-- 6. Creates cooking history record
-- All operations are atomic within a transaction

CREATE OR REPLACE FUNCTION record_cooking_event(
  p_user_id UUID,
  p_recipe_id BIGINT
) RETURNS TABLE (
  history_id BIGINT,
  recipe_id BIGINT,
  recipe_title TEXT,
  cooked_at TIMESTAMPTZ,
  fridge_before JSONB,
  fridge_after JSONB,
  updated_items JSONB
) AS $$
DECLARE
  v_fridge_before JSONB;
  v_fridge_after JSONB;
  v_recipe_title TEXT;
  v_history_id BIGINT;
  v_updated_items JSONB;
  v_ingredient RECORD;
  v_available_qty DECIMAL;
  v_remaining_to_deduct DECIMAL;
  v_fridge_item RECORD;
  v_old_qty DECIMAL;
  v_new_qty DECIMAL;
BEGIN
  -- Step 1: Verify recipe exists and belongs to user
  SELECT title INTO v_recipe_title
  FROM recipes
  WHERE id = p_recipe_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipe not found';
  END IF;
  
  -- Step 2: Capture current fridge state (before cooking)
  SELECT JSONB_BUILD_OBJECT('items', COALESCE(JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'product_id', up.product_id,
      'product_name', p.name,
      'quantity', up.quantity,
      'unit', u.abbreviation
    ) ORDER BY p.name
  ), '[]'::JSONB)) INTO v_fridge_before
  FROM user_products up
  JOIN products p ON up.product_id = p.id
  JOIN units u ON up.unit_id = u.id
  WHERE up.user_id = p_user_id;
  
  -- Initialize updated items array
  v_updated_items := '[]'::JSONB;
  
  -- Step 3 & 4: Process each ingredient (validate and update)
  FOR v_ingredient IN
    SELECT 
      ri.product_id, 
      ri.quantity as required_qty, 
      ri.unit_id, 
      u.abbreviation as unit,
      p.name as product_name
    FROM recipe_ingredients ri
    JOIN units u ON ri.unit_id = u.id
    JOIN products p ON ri.product_id = p.id
    WHERE ri.recipe_id = p_recipe_id
  LOOP
    -- Get total available quantity in fridge for this product+unit combination
    SELECT COALESCE(SUM(quantity), 0) INTO v_available_qty
    FROM user_products
    WHERE user_id = p_user_id
      AND product_id = v_ingredient.product_id
      AND unit_id = v_ingredient.unit_id;
    
    -- Check if sufficient ingredients available
    IF v_available_qty < v_ingredient.required_qty THEN
      RAISE EXCEPTION 'Insufficient ingredient: product_id=%, product_name=%, required=%, available=%',
        v_ingredient.product_id,
        v_ingredient.product_name,
        v_ingredient.required_qty,
        v_available_qty;
    END IF;
    
    -- Deduct using FIFO strategy (oldest items first)
    v_remaining_to_deduct := v_ingredient.required_qty;
    
    FOR v_fridge_item IN
      SELECT id, quantity
      FROM user_products
      WHERE user_id = p_user_id
        AND product_id = v_ingredient.product_id
        AND unit_id = v_ingredient.unit_id
      ORDER BY created_at ASC
      FOR UPDATE
    LOOP
      IF v_remaining_to_deduct <= 0 THEN
        EXIT;
      END IF;
      
      v_old_qty := v_fridge_item.quantity;
      
      IF v_fridge_item.quantity >= v_remaining_to_deduct THEN
        -- This item has enough to satisfy remaining requirement
        UPDATE user_products
        SET quantity = quantity - v_remaining_to_deduct
        WHERE id = v_fridge_item.id;
        
        v_remaining_to_deduct := 0;
      ELSE
        -- Consume entire item and continue to next
        UPDATE user_products
        SET quantity = 0
        WHERE id = v_fridge_item.id;
        
        v_remaining_to_deduct := v_remaining_to_deduct - v_fridge_item.quantity;
      END IF;
    END LOOP;
    
    -- Delete zero-quantity items
    DELETE FROM user_products
    WHERE user_id = p_user_id
      AND product_id = v_ingredient.product_id
      AND quantity = 0;
    
    -- Record the update for this ingredient
    v_new_qty := v_available_qty - v_ingredient.required_qty;
    v_updated_items := v_updated_items || JSONB_BUILD_ARRAY(
      JSONB_BUILD_OBJECT(
        'product_id', v_ingredient.product_id,
        'old_quantity', v_available_qty,
        'new_quantity', v_new_qty,
        'unit', v_ingredient.unit
      )
    );
  END LOOP;
  
  -- Step 5: Capture new fridge state (after cooking)
  SELECT JSONB_BUILD_OBJECT('items', COALESCE(JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'product_id', up.product_id,
      'product_name', p.name,
      'quantity', up.quantity,
      'unit', u.abbreviation
    ) ORDER BY p.name
  ), '[]'::JSONB)) INTO v_fridge_after
  FROM user_products up
  JOIN products p ON up.product_id = p.id
  JOIN units u ON up.unit_id = u.id
  WHERE up.user_id = p_user_id;
  
  -- Step 6: Insert cooking history record
  INSERT INTO cooking_history (
    user_id, 
    recipe_id, 
    cooked_at,
    fridge_state_before, 
    fridge_state_after
  ) VALUES (
    p_user_id, 
    p_recipe_id, 
    NOW(),
    v_fridge_before, 
    v_fridge_after
  ) RETURNING id INTO v_history_id;
  
  -- Return comprehensive result
  RETURN QUERY SELECT
    v_history_id,
    p_recipe_id,
    v_recipe_title,
    NOW(),
    v_fridge_before,
    v_fridge_after,
    v_updated_items;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION record_cooking_event(UUID, BIGINT) IS 
'Records a cooking event and automatically updates fridge quantities using FIFO strategy. All operations are atomic.';

