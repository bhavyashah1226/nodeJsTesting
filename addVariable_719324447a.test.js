// Test generated by RoostGPT for test nodeJsTest1 using AI Type Azure Open AI and AI Model roost-gpt4-32k

import { addVariable } from "./postmanCollectionProcessor.js";

describe("Testing addVariable method", () => {
  let variablesSet;

  beforeEach(() => {
    variablesSet = new Set();
  });

  test('Should successfully add a new variable', () => {
    const variable = 'variable1';
    addVariable(variable);
    expect(variablesSet.has(variable)).toBeTruthy();
  });

  test('Should not add an already-existing variable', () => {
    const variable = 'variable1';
    addVariable(variable);
    addVariable(variable);
    expect(variablesSet.size).toBe(1);
  });

  test('Should not add undefined variable', () => {
    const variable = undefined;
    addVariable(variable);
    expect(variablesSet.has(variable)).toBeFalsy();
  });

  test('Should not add null variable', () => {
    const variable = null;
    addVariable(variable);
    expect(variablesSet.has(variable)).toBeFalsy();
  });
});
