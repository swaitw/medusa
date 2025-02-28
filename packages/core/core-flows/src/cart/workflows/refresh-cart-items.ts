import {
  filterObjectByKeys,
  isDefined,
  PromotionActions,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"
import { updateLineItemsStep } from "../steps"
import { validateVariantPricesStep } from "../steps/validate-variant-prices"
import {
  cartFieldsForPricingContext,
  cartFieldsForRefreshSteps,
  productVariantsFields,
} from "../utils/fields"
import {
  prepareLineItemData,
  PrepareLineItemDataInput,
} from "../utils/prepare-line-item-data"
import { refreshCartShippingMethodsWorkflow } from "./refresh-cart-shipping-methods"
import { refreshPaymentCollectionForCartWorkflow } from "./refresh-payment-collection"
import { updateCartPromotionsWorkflow } from "./update-cart-promotions"
import { updateTaxLinesWorkflow } from "./update-tax-lines"

/**
 * The details of the cart to refresh.
 */
export type RefreshCartItemsWorkflowInput = {
  /**
   * The cart's ID.
   */
  cart_id: string
  /**
   * The promotion codes applied on the cart.
   * These promotion codes will replace previously applied codes.
   */
  promo_codes?: string[]
  /**
   * Force refresh the cart items
   */
  force_refresh?: boolean
}

export const refreshCartItemsWorkflowId = "refresh-cart-items"
/**
 * This workflow refreshes a cart to ensure its prices, promotion codes, taxes, and other details are applied correctly. It's useful
 * after making a chnge to a cart, such as after adding an item to the cart or adding a promotion code.
 *
 * This workflow is used by other cart-related workflows, such as the {@link addToCartWorkflow} after an item
 * is added to the cart.
 *
 * You can use this workflow within your own customizations or custom workflows, allowing you to refresh the cart after making updates to it in your
 * custom flows.
 *
 * @example
 * const { result } = await refreshCartItemsWorkflow(container)
 * .run({
 *   input: {
 *     cart_id: "cart_123",
 *   }
 * })
 *
 * @summary
 *
 * Refresh a cart's details after an update.
 *
 */
export const refreshCartItemsWorkflow = createWorkflow(
  refreshCartItemsWorkflowId,
  (input: WorkflowData<RefreshCartItemsWorkflowInput>) => {
    when({ input }, ({ input }) => {
      return !!input.force_refresh
    }).then(() => {
      const cart = useRemoteQueryStep({
        entry_point: "cart",
        fields: cartFieldsForRefreshSteps,
        variables: { id: input.cart_id },
        list: false,
      })

      const variantIds = transform({ cart }, (data) => {
        return (data.cart.items ?? []).map((i) => i.variant_id).filter(Boolean)
      })

      const cartPricingContext = transform({ cart }, ({ cart }) => {
        return filterObjectByKeys(cart, cartFieldsForPricingContext)
      })

      const variants = useRemoteQueryStep({
        entry_point: "variants",
        fields: productVariantsFields,
        variables: {
          id: variantIds,
          calculated_price: {
            context: cartPricingContext,
          },
        },
      }).config({ name: "fetch-variants" })

      validateVariantPricesStep({ variants })

      const lineItems = transform({ cart, variants }, ({ cart, variants }) => {
        const items = cart.items.map((item) => {
          const variant = (variants ?? []).find(
            (v) => v.id === item.variant_id
          )!

          const input: PrepareLineItemDataInput = {
            item,
            variant: variant,
            cartId: cart.id,
            unitPrice: item.unit_price,
            isTaxInclusive: item.is_tax_inclusive,
          }

          if (variant && !item.is_custom_price) {
            input.unitPrice = variant.calculated_price?.calculated_amount
            input.isTaxInclusive =
              variant.calculated_price?.is_calculated_price_tax_inclusive
          }

          const preparedItem = prepareLineItemData(input)

          return {
            selector: { id: item.id },
            data: preparedItem,
          }
        })

        return items
      })

      updateLineItemsStep({
        id: cart.id,
        items: lineItems,
      })
    })

    const refetchedCart = useRemoteQueryStep({
      entry_point: "cart",
      fields: cartFieldsForRefreshSteps,
      variables: { id: input.cart_id },
      list: false,
    }).config({ name: "refetch–cart" })

    const refreshCartInput = transform(
      { refetchedCart, input },
      ({ refetchedCart, input }) => {
        return {
          cart: !input.force_refresh ? refetchedCart : undefined,
          cart_id: !!input.force_refresh ? input.cart_id : undefined,
        }
      }
    )

    refreshCartShippingMethodsWorkflow.runAsStep({
      input: refreshCartInput,
    })

    updateTaxLinesWorkflow.runAsStep({
      input: refreshCartInput,
    })

    const cartPromoCodes = transform(
      { refetchedCart, input },
      ({ refetchedCart, input }) => {
        if (isDefined(input.promo_codes)) {
          return input.promo_codes
        } else {
          return refetchedCart.promotions.map((p) => p?.code).filter(Boolean)
        }
      }
    )

    updateCartPromotionsWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        promo_codes: cartPromoCodes,
        action: PromotionActions.REPLACE,
      },
    })

    refreshPaymentCollectionForCartWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    })

    return new WorkflowResponse(refetchedCart)
  }
)
