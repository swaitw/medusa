import { WorkflowData, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { deletePricePreferencesStep } from "../steps"

/**
 * The IDs of price preferences to delete.
 */
export type DeletePricePreferencesWorkflowInput = string[]

export const deletePricePreferencesWorkflowId = "delete-price-preferences"
/**
 * This workflow deletes one or more price preferences. It's used by the
 * [Delete Price Preferences Admin API Route](https://docs.medusajs.com/api/admin#price-preferences_deletepricepreferencesid).
 * 
 * You can use this workflow within your customizations or your own custom workflows, allowing you to
 * delete price preferences in your custom flows.
 * 
 * @example
 * const { result } = await deletePricePreferencesWorkflow(container)
 * .run({
 *   input: ["pp_123"]
 * })
 * 
 * @summary
 * 
 * Delete one or more price preferences.
 */
export const deletePricePreferencesWorkflow = createWorkflow(
  deletePricePreferencesWorkflowId,
  (input: WorkflowData<DeletePricePreferencesWorkflowInput>) => {
    return deletePricePreferencesStep(input)
  }
)
