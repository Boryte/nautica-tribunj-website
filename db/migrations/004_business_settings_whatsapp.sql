ALTER TABLE business_settings ADD COLUMN whatsapp_phone TEXT NOT NULL DEFAULT '';

UPDATE business_settings
SET whatsapp_phone = phone
WHERE TRIM(COALESCE(whatsapp_phone, '')) = '';
