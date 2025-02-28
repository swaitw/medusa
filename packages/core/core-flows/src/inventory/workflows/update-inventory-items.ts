import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { InventoryTypes } from "@medusajs/framework/types"
import { updateInventoryItemsStep } from "../steps"

/**
 * The data to update the inventory items.
 */
export interface UpdateInventoryItemsWorkflowInput {
  /**
   * The items to update.
   */
  updates: InventoryTypes.UpdateInventoryItemInput[]
}

/**
 * The updated inventory items.
 */
export type UpdateInventoryItemsWorkflowOutput = InventoryTypes.InventoryItemDTO[]

export const updateInventoryItemsWorkflowId = "update-inventory-items-workflow"
/**
 * This workflow updates one or more inventory items. It's used by the
 * [Update an Inventory Item Admin API Route](https://docs.medusajs.com/api/admin#inventory-items_postinventoryitemsid).
 * 
 * You can use this workflow within your own customizations or custom workflows, allowing you
 * to update inventory items in your custom flows.
 * 
 * @example
 * const { result } = await updateInventoryItemsWorkflow(container)
 * .run({
 *   input: {
 *     updates: [
 *       {
 *         id: "iitem_123",
 *         sku: "shirt",
 *       }
 *     ]
 *   }
 * })
 * 
 * @summary
 * 
 * Update one or more inventory items.
 */
export const updateInventoryItemsWorkflow = createWorkflow(
  updateInventoryItemsWorkflowId,
  (
    input: WorkflowData<UpdateInventoryItemsWorkflowInput>
  ): WorkflowResponse<UpdateInventoryItemsWorkflowOutput> => {
    return new WorkflowResponse(updateInventoryItemsStep(input.updates))
  }
)
