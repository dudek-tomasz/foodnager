-- Migration: Add manual conversions support to record_cooking_event function
-- This migration updates the function to support custom quantities for ingredients with incompatible units
-- Custom quantities are provided as JSONB: {"product_id": quantity_to_deduct, ...}

-- Drop the old function
DROP FUNCTION IF EXISTS record_cooking_event(UUID, BIGINT);

-- Create new function with manual_conversions parameter
CREATE OR REPLACE FUNCTION record_cooking_event(
  p_user_id UUID,
  p_recipe_id BIGINT,
  p_manual_conversions JSONB DEFAULT '{}'::JSONB
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
  v_qty_to_deduct DECIMAL;
  v_fridge_item RECORD;
  v_old_qty DECIMAL;
  v_new_qty DECIMAL;
  v_manual_qty TEXT;
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
      ri.unit_id as required_unit_id,
      u.abbreviation as required_unit,
      p.name as product_name
    FROM recipe_ingredients ri
    JOIN units u ON ri.unit_id = u.id
    JOIN products p ON ri.product_id = p.id
    WHERE ri.recipe_id = p_recipe_id
  LOOP
    -- Check if manual conversion is provided for this product
    v_manual_qty := p_manual_conversions->>v_ingredient.product_id::TEXT;
    
    IF v_manual_qty IS NOT NULL AND v_manual_qty::DECIMAL > 0 THEN
      -- Use manual quantity (ręczna konwersja przez użytkownika)
      v_qty_to_deduct := v_manual_qty::DECIMAL;
      
      -- Find the unit used in the fridge for this product (może być inna niż w przepisie!)
      SELECT unit_id INTO v_ingredient.required_unit_id
      FROM user_products
      WHERE user_id = p_user_id AND product_id = v_ingredient.product_id
      LIMIT 1;
      
      -- Get unit abbreviation
      SELECT abbreviation INTO v_ingredient.required_unit
      FROM units
      WHERE id = v_ingredient.required_unit_id;
    ELSE
      -- Use quantity from recipe
      v_qty_to_deduct := v_ingredient.required_qty;
    END IF;
    
    -- Skip if quantity is 0 (user pominął ten składnik)
    IF v_qty_to_deduct = 0 THEN
      CONTINUE;
    END IF;
    
    -- Get total available quantity in fridge for this product+unit combination
    SELECT COALESCE(SUM(quantity), 0) INTO v_available_qty
    FROM user_products
    WHERE user_id = p_user_id
      AND product_id = v_ingredient.product_id
      AND unit_id = v_ingredient.required_unit_id;
    
    -- Check if sufficient ingredients available
    IF v_available_qty < v_qty_to_deduct THEN
      RAISE EXCEPTION 'Insufficient ingredient: product_id=%, product_name=%, required=%, available=%',
        v_ingredient.product_id,
        v_ingredient.product_name,
        v_qty_to_deduct,
        v_available_qty;
    END IF;
    
    -- Deduct using FIFO strategy (oldest items first)
    v_remaining_to_deduct := v_qty_to_deduct;
    
    FOR v_fridge_item IN
      SELECT id, quantity
      FROM user_products
      WHERE user_id = p_user_id
        AND product_id = v_ingredient.product_id
        AND unit_id = v_ingredient.required_unit_id
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
    v_new_qty := v_available_qty - v_qty_to_deduct;
    v_updated_items := v_updated_items || JSONB_BUILD_ARRAY(
      JSONB_BUILD_OBJECT(
        'product_id', v_ingredient.product_id,
        'old_quantity', v_available_qty,
        'new_quantity', v_new_qty,
        'unit', v_ingredient.required_unit
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
COMMENT ON FUNCTION record_cooking_event(UUID, BIGINT, JSONB) IS 
'Records a cooking event and automatically updates fridge quantities using FIFO strategy. Supports manual conversions for ingredients with incompatible units. All operations are atomic.';

