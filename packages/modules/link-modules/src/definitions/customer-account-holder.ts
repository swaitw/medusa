import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { LINKS, Modules } from "@medusajs/framework/utils"

export const CustomerAccountHolder: ModuleJoinerConfig = {
  serviceName: LINKS.CustomerAccountHolder,
  isLink: true,
  databaseConfig: {
    tableName: "customer_account_holder",
    idPrefix: "custacchldr",
  },
  alias: [
    {
      name: ["customer_account_holder", "customer_account_holders"],
      entity: "LinkCustomerAccountHolder",
    },
  ],
  primaryKeys: ["id", "customer_id", "account_holder_id"],
  relationships: [
    {
      serviceName: Modules.CUSTOMER,
      entity: "Customer",
      primaryKey: "id",
      foreignKey: "customer_id",
      alias: "customer",
      args: {
        methodSuffix: "Customers",
      },
    },
    {
      serviceName: Modules.PAYMENT,
      entity: "AccountHolder",
      primaryKey: "id",
      foreignKey: "account_holder_id",
      alias: "account_holder",
      args: {
        methodSuffix: "AccountHolders",
      },
    },
  ],
  extends: [
    {
      serviceName: Modules.CUSTOMER,
      entity: "Customer",
      fieldAlias: {
        account_holder: "account_holder_link.account_holder",
      },
      relationship: {
        serviceName: LINKS.CustomerAccountHolder,
        primaryKey: "customer_id",
        foreignKey: "id",
        alias: "account_holder_link",
      },
    },
    {
      serviceName: Modules.PAYMENT,
      entity: "AccountHolder",
      fieldAlias: {
        customer: "customer_link.customer",
      },
      relationship: {
        serviceName: LINKS.CustomerAccountHolder,
        primaryKey: "account_holder_id",
        foreignKey: "id",
        alias: "customer_link",
      },
    },
  ],
}
