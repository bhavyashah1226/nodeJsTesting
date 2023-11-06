// Test generated by RoostGPT for test nodeJsTest1 using AI Type Azure Open AI and AI Model roost-gpt4-32k

import { getUrlPath } from './postmanCollectionProcessor';

describe('getUrlPath function', () => {
  it('should return empty urlString when urlObj does not have path and query', () => {
    const urlObj = { path: null, query: null };
    const result = getUrlPath(urlObj);
    expect(result).toBe('');
  });

  it('should return urlString with path when urlObj has path but no query', () => {
    const urlObj = { path: ['users', '1'], query: null };
    const result = getUrlPath(urlObj);
    expect(result).toBe('/users/1');
  });

  it('should return urlString with path and query when urlObj has both', () => {
    const urlObj = { 
      path: ['users', '1'], 
      query: [{ key: 'name', value: 'John' }, { key: 'age', value: '25' }] 
    };
    const result = getUrlPath(urlObj);
    expect(result).toBe('/users/1?name=John&age=25');
  });
  
  it('should correctly encode query params', () => {
    const urlObj = { 
      path: ['users', '1'], 
      query: [{ key: 'name', value: 'John Smith' }, { key: 'age', value: '25' }] 
    };
    const result = getUrlPath(urlObj);
    expect(result).toBe('/users/1?name=John%20Smith&age=25');
  });
});
