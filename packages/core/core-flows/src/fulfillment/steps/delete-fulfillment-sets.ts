import { IFulfillmentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/**
 * The IDs of the fulfillment sets to delete.
 */
export type DeleteFulfillmentSetsStepInput = string[]

export const deleteFulfillmentSetsStepId = "delete-fulfillment-sets"
/**
 * This step deletes one or more fulfillment sets.
 */
export const deleteFulfillmentSetsStep = createStep(
  deleteFulfillmentSetsStepId,
  async (ids: DeleteFulfillmentSetsStepInput, { container }) => {
    const service = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    await service.softDeleteFulfillmentSets(ids)

    return new StepResponse(void 0, ids)
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return
    }

    const service = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    await service.restoreFulfillmentSets(prevIds)
  }
)
