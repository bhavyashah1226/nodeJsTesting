// Test generated by RoostGPT for test nodeJsTest1 using AI Type Azure Open AI and AI Model roost-gpt4-32k

import { getUrlPath } from "./postmanCollectionProcessor.js";

describe("getUrlPath Testing Suite", () => {
  let urlObj;

  beforeEach(() => {
    urlObj = { 
      path: ['path1', 'path2'], 
      query: [{key: 'query1', value: 'value1'}, {key: 'query2', value: 'value2'}] 
    };
  });

  afterEach(() => {
    urlObj = null;
  });

  test("getUrlPath - Check with full url object", () => {
    const result = getUrlPath(urlObj);
    expect(result).toBe("/path1/path2?query1=value1&query2=value2");
  });

  test("getUrlPath - Check with only path", () => {
    delete urlObj.query;
    const result = getUrlPath(urlObj);
    expect(result).toBe("/path1/path2");
  });

  test("getUrlPath - Check with only query", () => {
    urlObj = { query: urlObj.query };
    const result = getUrlPath(urlObj);
    expect(result).toBe("?query1=value1&query2=value2");
  });

  test("getUrlPath - Check with empty object", () => {
    urlObj = {};
    const result = getUrlPath(urlObj);
    expect(result).toBe("");
  });

  test("getUrlPath - Check with null object", () => {
    urlObj = null;
    const result = getUrlPath(urlObj);
    expect(result).toBe("");
  });

  test("getUrlPath - Check with query containing special characters", () => {
    urlObj.query = [{key: 'query', value: 'value?&=/'}];
    const result = getUrlPath(urlObj);
    expect(result).toBe("/path1/path2?query=value?&=/");
  });
});
