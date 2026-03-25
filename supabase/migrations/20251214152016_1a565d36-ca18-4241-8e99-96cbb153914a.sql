-- Add inventory_item_id column to ingredients table
ALTER TABLE public.ingredients
ADD COLUMN inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL;

-- Add inventory_item_id column to packaging table
ALTER TABLE public.packaging
ADD COLUMN inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL;