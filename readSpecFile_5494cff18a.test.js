// Test generated by RoostGPT for test nodeJsTest1 using AI Type Azure Open AI and AI Model roost-gpt4-32k

import { readSpecFile } from './postmanCollectionProcessor.js'
import SwaggerParser from "swagger-parser";
import { logger } from "../utils/logUtility.js";
import { convertOpenApiToPostman } from "../utils/openapiToPostmanConverter.js";
import fs from 'fs';

jest.mock('swagger-parser');
jest.mock('../utils/logUtility');
jest.mock('../utils/openapiToPostmanConverter');
jest.mock('fs');

describe('readSpecFile', () => {
  let mockValidate;
  let mockConvertOpenApiToPostman;
  let mockWriteFileSync;

  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();

    // Setup mocks
    mockValidate = SwaggerParser.validate = jest.fn();
    mockConvertOpenApiToPostman = convertOpenApiToPostman = jest.fn();
    mockWriteFileSync = fs.writeFileSync = jest.fn();
  });

  it('should handle SwaggerParser.validate() failure', async () => {
    mockValidate.mockRejectedValue(new Error('Validation error'));

    await readSpecFile('my-spec.yml');

    expect(logger.warn).toHaveBeenCalledWith('Error validating swagger yaml: Validation error');
  });

  it('should handle convertOpenApiToPostman() failure', async () => {
    mockValidate.mockResolvedValue({});
    mockConvertOpenApiToPostman.mockRejectedValue(new Error('Conversion error'));

    await readSpecFile('my-spec.yml');

    expect(logger.error).toHaveBeenCalledWith('Error:', 'Conversion error');
  });

  it('should handle successful file read', async () => {
    const dummySwaggerApiData = "dummyData";
    const dummyPostmanCollection = JSON.stringify({ id: '1234' });
    const dummyFileContent = "dummyConvertedPostmanJson";
    mockValidate.mockResolvedValue(dummySwaggerApiData);
    mockConvertOpenApiToPostman.mockResolvedValue({postmanCollection: dummyPostmanCollection});

    await readSpecFile('my-spec.yml');

    expect(fs.writeFileSync).toHaveBeenCalledWith('modified_postman.json', JSON.stringify(dummyFileContent, null, 2));
  });

});
