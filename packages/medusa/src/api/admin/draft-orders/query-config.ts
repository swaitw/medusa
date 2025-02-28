export const defaultAdminListOrderFields = [
  "id",
  "display_id",
  "status",
  "version",
  "email",
  "region_id",
  "*items",
  "summary",
  "metadata",
  "created_at",
  "updated_at",
]

export const defaultAdminOrderFields = [
  "id",
  "display_id",
  "status",
  "version",
  "email",
  "region_id",
  "*items",
  "*items.tax_lines",
  "*items.adjustments",
  "*items.detail",
  "*items.variant",
  "*items.variant.product",
  "*shipping_address",
  "*billing_address",
  "*shipping_methods",
  "*shipping_methods.tax_lines",
  "*shipping_methods.adjustments",
  "summary",
  "metadata",
  "created_at",
  "updated_at",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminOrderFields,
  isList: false,
}

export const listTransformQueryConfig = {
  defaults: defaultAdminListOrderFields,
  defaultLimit: 20,
  isList: true,
}
