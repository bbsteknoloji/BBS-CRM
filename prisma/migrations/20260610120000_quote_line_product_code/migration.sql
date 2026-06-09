-- Manuel teklif kalemleri için ürün kodu
ALTER TABLE "quote_line_items" ADD COLUMN IF NOT EXISTS "product_code" VARCHAR(64);
