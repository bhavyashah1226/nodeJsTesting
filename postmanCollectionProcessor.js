import fs, { readFileSync } from "fs";
import { aiChatCompletion } from "../utils/commonUtility.js";
import { logger } from "../utils/logUtility.js";
import { apiSpecType, userContent } from "../constants.js";
import { ApiSpecTypeEnum } from "../enums/enum.js";
import SwaggerParser from "swagger-parser";
import { convertOpenApiToPostman } from "../utils/openapiToPostmanConverter.js";
import { getObjectFromSwagger } from "../utils/fetcherUtility.js";
import path from "path";

function getUrlPath(urlObj) {
  let urlString = "";
  if (urlObj.path) {
    urlString += "/" + urlObj.path.join("/");
  }
  if (urlObj.query && urlObj.query.length > 0) {
    let queryParams = urlObj.query
      .map((query) => `${query.key}=${query.value}`)
      .join("&");
    urlString += `?${queryParams}`;
  }

  return urlString;
}

async function generateTestCase(
  testScript,
  responseObj,
  methodType,
  swaggerObj,
  swaggerContent
) {
  testScript += `
if (pm.response.code == ${responseObj.code}){
  pm.test("${responseObj.name}", function () {
    pm.expect(pm.response.status).to.be.eql("${responseObj.status}");
    pm.expect(pm.response.responseTime).to.be.below(800);
  });\n`;
  if (swaggerObj && swaggerObj.responses) {
    const responseDetails = swaggerObj.responses[responseObj.code.toString()];
    if (responseDetails) {
      const description = responseDetails.description;
      const content = responseDetails.content;
      const schema = responseDetails.schema;
      let Schema;
      if (schema) {
        Schema = schema;
      } else if (content && content["application/json"]) {
        const contentType = "application/json";
        Schema = content[contentType].schema;
      }
      if (Schema) {
        const Property = Schema.properties;
        if (Property) {
          for (const key in Property) {
            if (Property.hasOwnProperty(key)) {
              const property = Property[key];
              if (property) {
                if (property.type) {
                  testScript += `
  pm.expect(pm.response.json()).to.have.property("${key}");
  pm.expect(typeof pm.response.json().${key}).to.equal("${property.type}");\n`;
                  if (methodType === "POST" || methodType === "PUT") {
                    testScript += `
  if (pm.request.body && pm.request.body.hasOwnProperty("${key}")) {
    pm.expect(pm.response.json().${key}).to.eql(JSON.parse(pm.request.body).${key});
  }\n`;
                  }
                  if (property.enum) {
                    testScript += `
  pm.expect(pm.response.json().${key}).to.be.oneOf("${property.enum}");\n`;
                  }
                  if (property.maximum) {
                    testScript += `
  pm.expect(pm.response.json().${key}).to.at.least(${property.maximum});\n`;
                  }
                  if (property.minimum) {
                    testScript += `
  pm.expect(pm.response.json().${key}).to.at.most(${property.minumum});\n`;
                  }
                } else {
                  if (property.properties) {
                    for (const subKey in property.properties) {
                      if (property.properties.hasOwnProperty(subKey)) {
                        const subProperty = property.properties[subKey];
                        testScript += `
  pm.expect(pm.response.json().${key}).to.have.property("${subKey}");
  pm.expect(typeof pm.response.json().${key}.${subKey}).to.equal("${subProperty.type}");`;
                        if (subProperty.enum) {
                          testScript += `
  pm.expect(pm.response.json().${key}.${subKey}).to.be.oneOf("${subProperty.enum}");\n`;
                        }
                        if (subProperty.maximum) {
                          testScript += `
  pm.expect(pm.response.json().${key}.${subKey}).to.at.least(${subProperty.maximum});\n`;
                        }
                        if (subProperty.minimum) {
                          testScript += `
  pm.expect(pm.response.json().${key}.${subKey}).to.at.most(${subProperty.minumum});\n`;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          testScript += `}\n`;
        } else {
          testScript += `}\n`;
        }
      } else {
        testScript += `}\n`;
      }
    } else {
      testScript += `}\n`;
    }
  } else {
    if (responseObj.body) {
      if (responseObj.header) {
        for (let it in responseObj.header) {
          const key = responseObj.header[it].key;
          const value = responseObj.header[it].value;
          testScript += `
    pm.response.to.have.header("Content-Type");\n`;
          if (key == "Content-Type" && value == "application/json") {
            const jsonArray = JSON.parse(responseObj.body);
            let item;
            if (Array.isArray(jsonArray)) {
              if (jsonArray.length > 0) {
                item = jsonArray[0];
              } else {
                logger.info("The array is empty.");
              }
            } else if (typeof jsonArray === "object") {
              item = jsonArray;
            } else {
              logger.info("Invalid JSON data or unsupported format.");
            }
            for (const key1 in item) {
              if (jsonArray.hasOwnProperty(key1)) {
                const value1 = item[key1];
                const datatype = typeof value1;
                testScript += `
    pm.expect(pm.response.json()).to.have.property("${key1}");
    pm.expect(typeof pm.response.json().${key1}).to.equal("${datatype}");\n`;
                if (methodType === "POST" || methodType === "PUT") {
                  testScript += `
    pm.expect(pm.response.json().${key1}).to.eql(JSON.parse(pm.request.body).${key1});\n`;
                }
              }
            }
            testScript += `}\n`;
          }
        }
      } else {
        testScript += `}\n`;
      }
    } else {
      testScript += `}\n`;
    }
  }

  return testScript;
}

async function parsePostmanCollection(node, swaggerContent) {
  const exemptHeaders = ["Content-Type", "Accept"];
  const variablesSet = new Set();

  function addVariable(variable) {
    variablesSet.add(variable);
  }
  async function processResponse(responseNode) {
    if (responseNode.header && Array.isArray(responseNode.header)) {
      responseNode.header.forEach((header) => {
        if (
          !header.value.startsWith("{{") &&
          !header.value.endsWith("}}") &&
          !exemptHeaders.includes(header.key)
        ) {
          header.value = `{{res_${header.key}}}`;
          addVariable(header.value);
        } else if (
          header.value.startsWith("{{") &&
          header.value.endsWith("}}")
        ) {
          addVariable(header.value);
        }
      });
    }
    if (responseNode.body && Array.isArray(responseNode.body)) {
      let isJson =
        (responseNode.header &&
          responseNode.header.find(
            (h) =>
              h.key === "Content-Type" && h.value.includes("application/json")
          )) ||
        (responseNode.body.options &&
          responseNode.body.options.raw &&
          responseNode.body.options.raw.language === "json");

      if (isJson) {
        let jsonBody;
        try {
          jsonBody = JSON.parse(responseNode.body.raw);
        } catch (error) {
          logger.error(
            "Error parsing raw body:",
            error.message,
            responseNode.body.raw
          );
          return;
        }

        async function transformValues(json) {
          for (let key in json) {
            if (typeof json[key] === "object" && json[key] !== null) {
              transformValues(json[key]);
            } else {
              if (typeof json[key] === "string") {
                if (!json[key].startsWith("{{") || !json[key].endsWith("}}")) {
                  json[key] = `{{res_${key}}}`;
                  addVariable(json[key]);
                } else {
                  addVariable(json[key]);
                }
              }
            }
          }
          return json;
        }

        responseNode.body.raw = JSON.stringify(
          await transformValues(jsonBody),
          null,
          4
        );
      }
    }
    return responseNode;
  }

  async function processNode(node) {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        node[i] = await processNode(node[i]);
      }
    } else if (typeof node === "object" && node !== null) {
      if (node.header && Array.isArray(node.header)) {
        node.header.forEach((header) => {
          if (
            !header.value.startsWith("{{") &&
            !header.value.endsWith("}}") &&
            !exemptHeaders.includes(header.key)
          ) {
            header.value = `{{${header.key}}}`;
            addVariable(header.value);
          } else if (
            header.value.startsWith("{{") &&
            header.value.endsWith("}}")
          ) {
            addVariable(header.value);
          }
        });
      }

      if (node.url && node.url.variable && Array.isArray(node.url.variable)) {
        node.url.variable.forEach((variable) => {
          variable.value = `{{${variable.key}}}`;
          addVariable(variable.value);
        });
      }
      if (node.url && node.url.query && Array.isArray(node.url.query)) {
        node.url.query.forEach((query) => {
          if (!query.value.startsWith("{{") && !query.value.endsWith("}}")) {
            query.value = `{{${query.key}}}`;
            addVariable(query.value);
          } else if (
            query.value.startsWith("{{") &&
            query.value.endsWith("}}")
          ) {
            addVariable(query.value);
          }
        });
      }
      if (node.body) {
        switch (node.body.mode) {
          case "formdata":
            if (node.body.formdata && Array.isArray(node.body.formdata)) {
              node.body.formdata.forEach((item) => {
                if (
                  item.value &&
                  !item.value.startsWith("{{") &&
                  !item.value.endsWith("}}")
                ) {
                  item.value = `{{${item.key}}}`;
                  addVariable(item.value);
                } else if (
                  item.value &&
                  item.value.startsWith("{{") &&
                  item.value.endsWith("}}")
                ) {
                  addVariable(item.value);
                }
              });
            }
            break;

          case "urlencoded":
            if (node.body.urlencoded && Array.isArray(node.body.urlencoded)) {
              node.body.urlencoded.forEach((item) => {
                if (
                  item.value &&
                  !item.value.startsWith("{{") &&
                  !item.value.endsWith("}}")
                ) {
                  item.value = `{{${item.key}}}`;
                  addVariable(item.value);
                } else if (
                  item.value &&
                  item.value.startsWith("{{") &&
                  item.value.endsWith("}}")
                ) {
                  addVariable(item.value);
                }
              });
            }
            break;

          case "raw":
            if (node.body.raw) {
              let isJson =
                (node.header &&
                  node.header.find(
                    (h) =>
                      h.key === "Content-Type" &&
                      h.value.includes("application/json")
                  )) ||
                (node.body.options &&
                  node.body.options.raw &&
                  node.body.options.raw.language === "json");
              if (isJson) {
                let jsonBody;
                try {
                  jsonBody = JSON.parse(node.body.raw);
                } catch (error) {
                  logger.error(
                    "Error parsing raw body:",
                    error.message,
                    node.body.raw
                  );
                  return;
                }

                async function transformValues(json) {
                  for (let key in json) {
                    if (typeof json[key] === "object" && json[key] !== null) {
                      transformValues(json[key]);
                    } else {
                      if (typeof json[key] === "string") {
                        if (
                          !json[key].startsWith("{{") ||
                          !json[key].endsWith("}}")
                        ) {
                          json[key] = `{{${key}}}`;
                          addVariable(json[key]);
                        } else {
                          addVariable(json[key]);
                        }
                      }
                    }
                  }
                  return json;
                }
                node.body.raw = JSON.stringify(
                  await transformValues(jsonBody),
                  null,
                  4
                );
              }
            }
            break;
        }
      }
      if (node && node.request) {
        if (!node.event) {
          node.event = [];
        }

        let urlPath = getUrlPath(node.request.url);
        let requestObj = {
          method: node.request.method,
          header: node.request.header,
          url: node.request.url,
          body: node.request.body,
        };

        let swaggerObj = getObjectFromSwagger(
          swaggerContent,
          urlPath,
          node.request.method.toLowerCase()
        );

        let testScript = ` 
// Compare the statusCode variable with the response code for assertion
pm.expect(parseInt(pm.variables.get("statusCode"))).to.be.equal(pm.response.code);`;
        if (node.response && Array.isArray(node.response)) {
          for (let response of node.response) {
            await processResponse(response);
            let responseObj = {
              code: response.code,
              status: response.status,
              name: response.name,
              id: response.id,
              header: response.header,
              body: response.body,
            };
            // if (swaggerContent) {
            //   let swaggerObj = getObjectFromSwagger(
            //     swaggerContent,
            //     urlPath,
            //     node.request.method.toLowerCase()
            //   );
            //   testScript = await generateTestFromSwagger(
            //     testScript,
            //     responseObj,
            //     swaggerObj
            //   );
            // } else {
            //   testScript = await generateTestCase(
            //     testScript,
            //     responseObj,
            //     node.request.method
            //   );
            // }
            testScript = await generateTestCase(
              testScript,
              responseObj,
              node.request.method,
              swaggerObj,
              swaggerContent
            );
          }
          const testscript = {
            listen: "test",
            script: {
              exec: [testScript],
              type: "text/javascript",
            },
          };
          node.event.push(testscript);
        }
      }
      for (let key in node) {
        if (typeof node[key] === "object" && node[key] !== null) {
          node[key] = await processNode(node[key]);
        }
      }
    }
    return node;
  }
  await processNode(node);
  return node;
}

async function readSpecFile(specFile) {
  let swaggerApiData;
  try {
    swaggerApiData = await SwaggerParser.validate(specFile);
  } catch (error) {
    logger.warn(`Error validating swagger yaml: ${error}`);
  }
  try {
    const { postmanCollection } = await convertOpenApiToPostman(specFile);

    const content = JSON.parse(postmanCollection);

    let convertedPostmanJson = await parsePostmanCollection(
      content,
      swaggerApiData
    );
    fs.writeFileSync(
      "modified_postman.json",
      JSON.stringify(convertedPostmanJson, null, 2)
    );
  } catch (error) {
    logger.error("Error:", error.message);
  }
}
export { parsePostmanCollection, readSpecFile };
