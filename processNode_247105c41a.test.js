// Test generated by RoostGPT for test nodeJsTest1 using AI Type Azure Open AI and AI Model roost-gpt4-32k

import { processNode } from '../postmanCollectionProcessor.js';

describe('processNode Function', () => {
  it('should process array nodes correctly', async () => {
    const arrayNode = [ 1, 2, 3 ];
    const result = await processNode(arrayNode);
    expect(result).toEqual([ 1, 2, 3 ]);
  });

  it('should process object nodes correctly', async () => {
    const objectNode = {
      url: {
        variable: [
          { key: 'var1', value: 'val1' },
          { key: 'var2', value: '{{val2}}' },
        ],
        query: [
          { key: 'query1', value: 'val1' },
          { key: 'query2', value: '{{val2}}' },
        ],
      },
      header: [
        { key: 'header1', value: 'val1' },
        { key: 'header2', value: '{{val2}}' },
      ],
    };

    const result = await processNode(objectNode);

    expect(result.url.variable[0].value).toEqual('{{var1}}');
    expect(result.url.variable[1].value).toEqual('{{var2}}');
    expect(result.url.query[0].value).toEqual('{{query1}}');
    expect(result.url.query[1].value).toEqual('{{query2}}');
    expect(result.header[0].value).toEqual('{{header1}}');
    expect(result.header[1].value).toEqual('{{header2}}');
  });

  it('Should handle errors correctly', async () => {
    const failingNode = null;

    try {
      await processNode(failingNode);
    } catch (error) {
      expect(error).toEqual(new TypeError("Cannot read property 'header' of null"));
    }
  });
});