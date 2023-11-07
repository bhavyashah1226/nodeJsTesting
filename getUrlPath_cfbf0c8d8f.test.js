// Test generated by RoostGPT for test nodeJsTest1 using AI Type Azure Open AI and AI Model roost-gpt4-32k

import { getUrlPath } from './postmanCollectionProcessor.js';

describe('getUrlPath function', () => {
  let urlObj;

  beforeEach(() => {
    urlObj = {
      path: ['path1', 'path2', 'path3'],
      query: [
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' },
      ],
    };
  });

  test('should return correct URL path string when both path and query are present', () => {
    expect(getUrlPath(urlObj)).toEqual('/path1/path2/path3?param1=value1&param2=value2');
  });

  test('should return correct URL path string when only path is present', () => {
    delete urlObj.query;
    expect(getUrlPath(urlObj)).toEqual('/path1/path2/path3');
  });

  test('should return correct URL path string when only query is present', () => {
    urlObj = {
      query: [
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: 'value2' },
      ],
    };
    expect(getUrlPath(urlObj)).toEqual('?param1=value1&param2=value2');
  });

  test('should return an empty string when neither path nor query is present', () => {
    urlObj = {};
    expect(getUrlPath(urlObj)).toEqual('');
  });
});
