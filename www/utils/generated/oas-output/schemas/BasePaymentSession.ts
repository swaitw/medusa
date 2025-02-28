/**
 * @schema BasePaymentSession
 * type: object
 * description: The payment session's details.
 * x-schemaName: BasePaymentSession
 * required:
 *   - id
 *   - amount
 *   - currency_code
 *   - provider_id
 *   - data
 *   - status
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The payment session's ID.
 *   amount:
 *     type: number
 *     title: amount
 *     description: The payment session's amount.
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The payment session's currency code.
 *     example: usd
 *   provider_id:
 *     type: string
 *     title: provider_id
 *     description: The ID of the payment provider processing this session.
 *   data:
 *     type: object
 *     description: The payment session's data, useful for the payment provider processing the payment.
 *     externalDocs:
 *       url: https://docs.medusajs.com/resources/commerce-modules/payment/payment-session#data-property
 *   context:
 *     type: object
 *     description: The context around the payment, such as the customer's details.
 *     example:
 *       customer:
 *         id: cus_123
 *   status:
 *     type: string
 *     description: The payment session's status.
 *     enum:
 *       - error
 *       - authorized
 *       - canceled
 *       - captured
 *       - pending
 *       - requires_more
 *   authorized_at:
 *     type: string
 *     title: authorized_at
 *     description: The date the payment session was authorized.
 *     format: date-time
 *   payment_collection:
 *     $ref: "#/components/schemas/BasePaymentCollection"
 *   payment:
 *     $ref: "#/components/schemas/BasePayment"
 * 
*/

