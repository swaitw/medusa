import { IFulfillmentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

/**
 * The ID of the fulfillment to cancel.
 */
export type CancelFulfillmentStepInput = string

export const cancelFulfillmentStepId = "cancel-fulfillment"
/**
 * This step cancels a fulfillment.
 */
export const cancelFulfillmentStep = createStep(
  cancelFulfillmentStepId,
  async (id: CancelFulfillmentStepInput, { container }) => {
    const service = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    await service.cancelFulfillment(id)

    return new StepResponse(void 0, id)
  }
)
