import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { RemoteQueryFunction } from "@medusajs/types"
import { ContainerRegistrationKeys, defaultCurrencies } from "@medusajs/utils"
import { setTimeout } from "timers/promises"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(120000)

// NOTE: In this tests, both API are used to query, we use object pattern and string pattern

async function populateData(api: any) {
  const shippingProfile = (
    await api.post(
      `/admin/shipping-profiles`,
      { name: "Test", type: "default" },
      adminHeaders
    )
  ).data.shipping_profile

  const payload = [
    {
      title: "Test Product",
      status: "published",
      description: "test-product-description",
      shipping_profile_id: shippingProfile.id,
      options: [{ title: "Denominations", values: ["100"] }],
      variants: [
        {
          title: `Test variant 1`,
          sku: `test-variant-1`,
          prices: [
            {
              currency_code: Object.values(defaultCurrencies)[0].code,
              amount: 30,
            },
            {
              currency_code: Object.values(defaultCurrencies)[2].code,
              amount: 50,
            },
          ],
          options: {
            Denominations: "100",
          },
        },
      ],
    },
    {
      title: "Extra product",
      description: "extra description",
      status: "published",
      shipping_profile_id: shippingProfile.id,
      options: [{ title: "Colors", values: ["Red"] }],
      variants: new Array(2).fill(0).map((_, i) => ({
        title: `extra variant ${i}`,
        sku: `extra-variant-${i}`,
        prices: [
          {
            currency_code: Object.values(defaultCurrencies)[1].code,
            amount: 20,
          },
          {
            currency_code: Object.values(defaultCurrencies)[0].code,
            amount: 80,
          },
        ],
        options: {
          Colors: "Red",
        },
      })),
    },
  ]

  await api
    .post("/admin/products/batch", { create: payload }, adminHeaders)
    .catch((err) => {
      console.log(err)
    })

  await setTimeout(2000)
}

process.env.ENABLE_INDEX_MODULE = "true"

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, dbConnection, api, dbConfig }) => {
    let appContainer

    beforeAll(() => {
      appContainer = getContainer()
    })

    afterAll(() => {
      process.env.ENABLE_INDEX_MODULE = "false"
    })

    describe("Index engine - Query.index", () => {
      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("should use query.index to query the index module and hydrate the data", async () => {
        await populateData(api)

        const query = appContainer.resolve(
          ContainerRegistrationKeys.QUERY
        ) as RemoteQueryFunction

        const resultset = await query.index({
          entity: "product",
          fields: [
            "id",
            "description",
            "status",
            "title",
            "variants.sku",
            "variants.barcode",
            "variants.material",
            "variants.options.value",
            "variants.prices.amount",
            "variants.prices.currency_code",
            "variants.inventory_items.inventory.sku",
            "variants.inventory_items.inventory.description",
          ],
          filters: {
            "variants.sku": { $like: "%-1" },
            "variants.prices.amount": { $gt: 30 },
          },
          pagination: {
            take: 10,
            skip: 0,
            order: {
              "variants.prices.amount": "DESC",
            },
          },
        })

        expect(resultset.metadata).toEqual({
          count: 2,
          skip: 0,
          take: 10,
        })
        expect(resultset.data).toEqual([
          {
            id: expect.any(String),
            description: "extra description",
            title: "Extra product",
            status: "published",
            variants: [
              {
                sku: "extra-variant-0",
                barcode: null,
                material: null,
                id: expect.any(String),
                options: [
                  {
                    value: "Red",
                  },
                ],
                inventory_items: [
                  {
                    variant_id: expect.any(String),
                    inventory_item_id: expect.any(String),
                    inventory: {
                      sku: "extra-variant-0",
                      description: "extra variant 0",
                      id: expect.any(String),
                    },
                  },
                ],
                prices: expect.arrayContaining([]),
              },
              {
                sku: "extra-variant-1",
                barcode: null,
                material: null,
                id: expect.any(String),
                options: [
                  {
                    value: "Red",
                  },
                ],
                prices: expect.arrayContaining([
                  {
                    amount: 20,
                    currency_code: "CAD",
                    id: expect.any(String),
                  },
                  {
                    amount: 80,
                    currency_code: "USD",
                    id: expect.any(String),
                  },
                ]),
                inventory_items: [
                  {
                    variant_id: expect.any(String),
                    inventory_item_id: expect.any(String),
                    inventory: {
                      sku: "extra-variant-1",
                      description: "extra variant 1",
                      id: expect.any(String),
                    },
                  },
                ],
              },
            ],
          },
          {
            id: expect.any(String),
            description: "test-product-description",
            title: "Test Product",
            status: "published",
            variants: [
              {
                sku: "test-variant-1",
                barcode: null,
                material: null,
                id: expect.any(String),
                options: [
                  {
                    value: "100",
                  },
                ],
                prices: expect.arrayContaining([
                  {
                    amount: 30,
                    currency_code: "USD",
                    id: expect.any(String),
                  },
                  {
                    amount: 50,
                    currency_code: "EUR",
                    id: expect.any(String),
                  },
                ]),
                inventory_items: [
                  {
                    variant_id: expect.any(String),
                    inventory_item_id: expect.any(String),
                    inventory: {
                      sku: "test-variant-1",
                      description: "Test variant 1",
                      id: expect.any(String),
                    },
                  },
                ],
              },
            ],
          },
        ])
      })

      // TODO: Investigate why this test is flacky
      it.skip("should use query.index to query the index module sorting by price desc", async () => {
        await populateData(api)

        const query = appContainer.resolve(
          ContainerRegistrationKeys.QUERY
        ) as RemoteQueryFunction

        const resultset = await query.index({
          entity: "product",
          fields: [
            "id",
            "variants.prices.amount",
            "variants.prices.currency_code",
          ],
          filters: {
            "variants.prices.currency_code": "USD",
          },
          pagination: {
            take: 1,
            skip: 0,
            order: {
              "variants.prices.amount": "DESC",
            },
          },
        })

        // Limiting to 1 on purpose to keep it simple and check the correct order is maintained
        expect(resultset.data).toEqual([
          {
            id: expect.any(String),
            variants: expect.arrayContaining([
              expect.objectContaining({
                prices: expect.arrayContaining([
                  {
                    amount: 20,
                    currency_code: "CAD",
                    id: expect.any(String),
                  },
                  {
                    amount: 80,
                    currency_code: "USD",
                    id: expect.any(String),
                  },
                ]),
              }),
            ]),
          },
        ])

        const resultset2 = await query.index({
          entity: "product",
          fields: [
            "id",
            "variants.prices.amount",
            "variants.prices.currency_code",
          ],
          filters: {
            variants: {
              prices: {
                currency_code: "USD",
              },
            },
          },
          pagination: {
            take: 1,
            skip: 0,
            order: {
              variants: {
                prices: {
                  amount: "ASC",
                },
              },
            },
          },
        })

        // Limiting to 1 on purpose to keep it simple and check the correct order is maintained
        expect(resultset2.data).toEqual([
          {
            id: expect.any(String),
            variants: [
              expect.objectContaining({
                prices: expect.arrayContaining([
                  {
                    amount: 30,
                    currency_code: "USD",
                    id: expect.any(String),
                  },
                  {
                    amount: 50,
                    currency_code: "EUR",
                    id: expect.any(String),
                  },
                ]),
              }),
            ],
          },
        ])
      })
    })
  },
})
