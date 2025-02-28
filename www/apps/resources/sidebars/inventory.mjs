/** @type {import('types').RawSidebarItem[]} */
export const inventorySidebar = [
  {
    type: "category",
    title: "Inventory Module",
    isChildSidebar: true,
    children: [
      {
        type: "link",
        path: "/commerce-modules/inventory",
        title: "Overview",
      },
      {
        type: "separator",
      },
      {
        type: "category",
        title: "Concepts",
        initialOpen: false,
        autogenerate_tags: "concept+inventory",
        autogenerate_as_ref: true,
        children: [
          {
            type: "link",
            path: "/commerce-modules/inventory/concepts",
            title: "Inventory Concepts",
          },
          {
            type: "link",
            path: "/commerce-modules/inventory/inventory-in-flows",
            title: "Inventory in Flows",
          },
          {
            type: "link",
            path: "/commerce-modules/inventory/inventory-kit",
            title: "Inventory Kit",
          },
          {
            type: "link",
            path: "/commerce-modules/inventory/links-to-other-modules",
            title: "Links to Modules",
          },
        ],
      },
      {
        type: "category",
        title: "Server Guides",
        autogenerate_tags: "server+inventory",
        initialOpen: false,
        autogenerate_as_ref: true,
        description:
          "Learn how to use the Inventory Module in your customizations on the Medusa application server.",
      },
      {
        type: "category",
        title: "Storefront Guides",
        autogenerate_tags: "storefront+inventory,-jsSdk",
        initialOpen: false,
        autogenerate_as_ref: true,
        description:
          "Learn how to integrate the Inventory Module's features into your storefront.",
      },
      {
        type: "category",
        title: "Admin Guides",
        autogenerate_tags: "admin+inventory,-jsSdk",
        initialOpen: false,
        autogenerate_as_ref: true,
        description:
          "Learn how to utilize administative features of the Inventory Module.",
      },
      {
        type: "category",
        title: "Admin User Guides",
        autogenerate_tags: "userGuide+inventory",
        initialOpen: false,
        autogenerate_as_ref: true,
        description:
          "Learn how to utilize and manage Inventory features in the Medusa Admin dashboard.",
      },
      {
        type: "category",
        title: "References",
        initialOpen: false,
        description:
          "Find references for tools and resources related to the Inventory Module, such as data models, methods, and more. These are useful for your customizations.",
        children: [
          {
            type: "link",
            path: "/commerce-modules/inventory/workflows",
            title: "Workflows",
            hideChildren: true,
            children: [
              {
                type: "category",
                title: "Workflows",
                autogenerate_tags: "workflow+inventory",
                autogenerate_as_ref: true,
              },
              {
                type: "category",
                title: "Steps",
                autogenerate_tags: "step+inventory",
                autogenerate_as_ref: true,
              },
            ],
          },
          {
            type: "link",
            path: "/commerce-modules/inventory/js-sdk",
            title: "JS SDK",
            hideChildren: true,
            children: [
              {
                type: "sub-category",
                title: "Store",
                autogenerate_tags: "jsSdk+storefront+inventory",
                description:
                  "The following methods or properties are used to send requests to Store API Routes related to the Inventory Module.",
                autogenerate_as_ref: true,
              },
              {
                type: "sub-category",
                title: "Admin",
                autogenerate_tags: "jsSdk+admin+inventory",
                description:
                  "The following methods or properties are used to send requests to Admin API Routes related to the Inventory Module.",
                autogenerate_as_ref: true,
              },
            ],
          },
          {
            type: "link",
            path: "/commerce-modules/inventory/admin-widget-zones",
            title: "Admin Widget Zones",
          },
          {
            type: "link",
            path: "/references/inventory-next",
            title: "Main Service Reference",
            isChildSidebar: true,
            childSidebarTitle: "Inventory Module's Main Service Reference",
            children: [
              {
                type: "category",
                title: "Methods",
                autogenerate_path:
                  "/references/inventory_next/IInventoryService/methods",
              },
            ],
          },
          {
            type: "link",
            path: "/references/inventory-next/models",
            title: "Data Models Reference",
            isChildSidebar: true,
            childSidebarTitle: "Inventory Module Data Models Reference",
            children: [
              {
                type: "category",
                title: "Data Models",
                autogenerate_path:
                  "/references/inventory_next_models/variables",
              },
            ],
          },
        ],
      },
    ],
  },
]
