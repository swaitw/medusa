import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The ID of the order to retrieve its preview.
 */
export type PreviewOrderChangeStepInput = string

export const previewOrderChangeStepId = "preview-order-change"
/**
 * This step retrieves a preview of an order change.
 */
export const previewOrderChangeStep = createStep(
  previewOrderChangeStepId,
  async (orderId: PreviewOrderChangeStepInput, { container }) => {
    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    const preview = await service.previewOrderChange(orderId)

    return new StepResponse(preview)
  }
)
