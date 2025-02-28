import { IFileModuleService } from "@medusajs/framework/types"
import { Module, Modules } from "@medusajs/framework/utils"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { FileModuleService } from "@services"
import { resolve } from "path"

jest.setTimeout(100000)

const moduleOptions = {
  providers: [
    {
      resolve: resolve(
        process.cwd() +
          "/integration-tests/__fixtures__/providers/default-provider"
      ),
      id: "default-provider",
    },
  ],
}

moduleIntegrationTestRunner<IFileModuleService>({
  moduleName: Modules.FILE,
  moduleOptions: moduleOptions,
  testSuite: ({ service }) => {
    describe("File Module Service", () => {
      it(`should export the appropriate linkable configuration`, () => {
        const linkable = Module(Modules.FILE, {
          service: FileModuleService,
        }).linkable

        expect(Object.keys(linkable)).toEqual(["file"])

        Object.keys(linkable).forEach((key) => {
          delete linkable[key].toJSON
        })

        expect(linkable).toEqual({
          file: {
            id: {
              entity: "File",
              field: "file",
              linkable: "file_id",
              primaryKey: "id",
              serviceName: "file",
            },
          },
        })
      })

      it("creates and gets a file", async () => {
        const res = await service.createFiles({
          filename: "test.jpg",
          mimeType: "image/jpeg",
          content: Buffer.from("test"),
        })

        expect(res).toEqual({
          id: "test.jpg",
          url: "test.jpg",
        })

        // The fake provider returns the file content as the url
        const downloadUrl = await service.retrieveFile("test.jpg")
        expect(await new Response(downloadUrl.url).text()).toEqual("test")
      })
    })
  },
})
