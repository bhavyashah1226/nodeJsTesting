// Test generated by RoostGPT for test nodeJsTest1 using AI Type Azure Open AI and AI Model roost-gpt4-32k

import { generateTestCase } from "./postmanCollectionProcessor.js";

describe("postmanCollectionProcessor > generateTestCase", () => {
  let testScript, responseObj, methodType, swaggerObj, swaggerContent;

  beforeEach(() => {
    testScript = "";
    responseObj = { code: 200, name: "success response", status: "OK" };
    methodType = "GET";
    swaggerObj = null;
    swaggerContent = null;
  });

  it("should create a valid test script for basic response", async () => {
    const result = await generateTestCase(testScript, responseObj, methodType, swaggerObj, swaggerContent);

    expect(result).toEqual(expect.stringContaining("pm.test(\"success response\", function () {"));
    expect(result).toEqual(expect.stringContaining("pm.expect(pm.response.status).to.be.eql(\"OK\");"));
    expect(result).toEqual(expect.stringContaining("pm.expect(pm.response.responseTime).to.be.below(800);"));
  });

  it("should create a valid test script for response with JSON body", async () => {
    swaggerObj = { responses: { "200": { description: "Success", content: { "application/json": { schema: { properties: { "id": { type: "integer" } } } } } } } };
    const result = await generateTestCase(testScript, responseObj, methodType, swaggerObj, swaggerContent);

    expect(result).toEqual(expect.stringContaining("pm.expect(pm.response.json()).to.have.property(\"id\");"));
  });

  it("should return error when responseObj is null", async () => {
    await expect(generateTestCase(testScript, null, methodType, swaggerObj, swaggerContent)).rejects.toThrow();
  });

  it("should return error when methodType is null", async () => {
    await expect(generateTestCase(testScript, responseObj, null, swaggerObj, swaggerContent)).rejects.toThrow();
  });
});
