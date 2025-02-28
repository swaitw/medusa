import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The IDs of the product categories to delete.
 */
export type DeleteProductCategoriesStepInput = string[]

export const deleteProductCategoriesStepId = "delete-product-categories"
/**
 * This step deletes one or more product categories.
 */
export const deleteProductCategoriesStep = createStep(
  deleteProductCategoriesStepId,
  async (ids: DeleteProductCategoriesStepInput, { container }) => {
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.softDeleteProductCategories(ids)
    return new StepResponse(void 0, ids)
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.restoreProductCategories(prevIds)
  }
)
