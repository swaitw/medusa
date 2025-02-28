import { PromotionUtils, model } from "@medusajs/framework/utils"
import ApplicationMethod from "./application-method"
import Campaign from "./campaign"
import PromotionRule from "./promotion-rule"

const Promotion = model
  .define("Promotion", {
    id: model.id({ prefix: "promo" }).primaryKey(),
    code: model.text().searchable(),
    is_automatic: model.boolean().default(false),
    type: model.enum(PromotionUtils.PromotionType).index("IDX_promotion_type"),
    status: model
      .enum(PromotionUtils.PromotionStatus)
      .index("IDX_promotion_status")
      .default(PromotionUtils.PromotionStatus.DRAFT),
    campaign: model
      .belongsTo(() => Campaign, {
        mappedBy: "promotions",
      })
      .nullable(),
    application_method: model
      .hasOne<() => typeof ApplicationMethod>(() => ApplicationMethod, {
        mappedBy: "promotion",
      })
      .nullable(),
    rules: model.manyToMany<() => typeof PromotionRule>(() => PromotionRule, {
      pivotTable: "promotion_promotion_rule",
      mappedBy: "promotions",
    }),
  })
  .cascades({
    delete: ["application_method"],
  })
  .indexes([
    {
      name: "IDX_unique_promotion_code",
      on: ["code"],
      where: "deleted_at IS NULL",
      unique: true,
    },
  ])

export default Promotion
