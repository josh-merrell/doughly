/* eslint-disable */
const { OpenAI } = require('openai');
const { createUserLog } = require('./dbLogger');
const { errorGen } = require('../middleware/errorHandling');
const units = process.env.MEASUREMENT_UNITS.split(',');
let fetch;

(async () => {
  fetch = (await import('node-fetch')).default;
})();

const { getAccessToken } = require('./google/google-api');

// create openai Client
const getClient = async () => {
  const openai = new OpenAI({
    apiKey: `${process.env.OPENAI_API_KEY}`,
    organization: process.env.OPENAI_ORG_ID,
  });

  return openai;
};

const visionRequest = async (recipeImageURL, userID, authorization, messageType) => {
  const client = await getClient();
  const body = {
    messages: [requestMessages[messageType].message],
    temperature: 0.3,
    user: userID,
    model: 'gpt-4o',
    max_tokens: 4000,
  };
  body.messages[0].content[1].image_url.url = recipeImageURL;

  const chatCompletionObject = await client.chat.completions.create(body).catch((err) => {
    throw errorGen(`OpenAI request failed: ${err.message}`, 515, 'cannotComplete', false, 3);
  });

  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to ${messageType}`);

  //Check for unsuccessful completions
  if (chatCompletionObject.choices[0].finish_reason === 'length') {
    throw errorGen(`OpenAI request or response too long. Consider increasing "max_tokens" request property`, 515, 'aiContentTooLong', false, 3);
  }
  if (chatCompletionObject.choices[0].finish_reason === 'content_fiter') {
    throw errorGen(`Content Omitted due to filter being flagged`, 515, 'aiContentViolation', false, 3);
  }

  //Clean up the response JSON
  let responseJSON = chatCompletionObject.choices[0].message.content.replace(/json\n|\n/g, '');
  responseJSON = responseJSON.trim().replace(/^`{3}|`{3}$/g, '');
  return {
    response: responseJSON,
  };
};

const recipeFromTextRequest = async (recipeText, userID, authorization) => {
  const client = await getClient();
  const body = {
    messages: [requestMessages['generateRecipeFromText'].message],
    temperature: 0.1,
    user: userID,
    model: 'gpt-4o',
    max_tokens: 4000,
    response_format: {
      type: requestMessages['generateRecipeFromText'].response_format,
    },
  };
  // add the recipe text to the request as a user message
  body.messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: `STRING: ${recipeText}`,
      },
    ],
  });

  const chatCompletionObject = await client.chat.completions.create(body).catch((err) => {
    throw errorGen(`OpenAI request failed: ${err.message}`, 515, 'cannotComplete', false, 3);
  });


  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to generateRecipeFromText`);

  //Check for unsuccessful completions
  if (chatCompletionObject.choices[0].finish_reason === 'length') {
    throw errorGen(`OpenAI request or response too long. Consider increasing "max_tokens" request property`, 515, 'aiContentTooLong', true, 3);
  }
  if (chatCompletionObject.choices[0].finish_reason === 'content_fiter') {
    // throw errorGen('Content Omitted due to filter being flagged', 400);
    throw errorGen(`Content Omitted due to filter being flagged`, 515, 'aiContentViolation', true, 3);
  }
  //Clean up the response JSON
  let responseJSON = chatCompletionObject.choices[0].message.content.replace(/json\n|\n/g, '');
  responseJSON = responseJSON.trim().replace(/^`{3}|`{3}$/g, '');
  return {
    response: responseJSON,
  };
};

getPurchaseUnitLifespanDaysEstimate = async (ingredient) => {
  // uses the vertexai tuned model 'purchaseUnit-lifespanDays_selection' to estimate the purchase unit and lifespan days of an ingredient
  try {
    const billRatePer1000Chars = 0.00025;
    const token = await getAccessToken();
    const vertexaiProject = '911585064385';
    const vertexaiLocation = 'us-central1';
    const vertexaiEndpointID = '8420950649927106560';
    const promptText = `You are provided the name of a ingredient. You are also provided an array measurement units. Return two strings separated by a comma. The first should be a purchaseUnit appropriate for the ingredient and must be selected from the provided array of units. It should reflect the way in which this ingredient is purchased. When possible, this should be a specific unit, like 'weightOunce' or 'fluidOunce'. The second string should be a number estimate of how many days the ingredient will remain usable or fresh, assuming it is stored properly (this might involve refrigeration or freezing). For example, for the ingredient 'tomato', the return value might be 'weightOunce,12'. INGREDIENT:${ingredient}, UNITS: [${units}]`;
    global.logger.info({message:`GETTING PU/LD VERTEXAI REQUEST: ${promptText}`, level:7, timestamp: new Date().toISOString(), 'userID': 0});

    const requestJson = {
      instances: [
        {
          content: promptText,
        },
      ],
      parameters: {
        candidateCount: 1,
        maxOutputTokens: 1024,
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      },
    };
    const API_ENDPOINT = `${vertexaiLocation}-aiplatform.googleapis.com`;
    const response = await fetch(`https://${API_ENDPOINT}/v1/projects/${vertexaiProject}/locations/${vertexaiLocation}/endpoints/${vertexaiEndpointID}:predict`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestJson),
    });
    const data = await response.json();
    const result = data.predictions[0].content.split(',');
    if (result[0] === 'weighOunce') result[0] = 'weightOunce';
    global.logger.info({message:`RI NAME: ${ingredient} PU/LD VERTEXAI RESPONSE: ${result[0]}, ${result[1]}`, level:7, timestamp: new Date().toISOString(), 'userID': 0});

    // calculate cost
    const characterCount = data.metadata.tokenMetadata.inputTokenCount.totalBillableCharacters + data.metadata.tokenMetadata.outputTokenCount.totalBillableCharacters;
    const cost = (characterCount / 1000) * billRatePer1000Chars;
    global.logger.info({message:`CHARACTER COUNT: ${characterCount}, COST: $${cost}`, level:7, timestamp: new Date().toISOString(), 'userID': 0});
    return {
      purchaseUnit: result[0],
      lifespanDays: result[1],
      cost: cost,
    };
  } catch (error) {
    global.logger.info({message:`Error estimating purchaseUnit and lifespanDays: ${error.message}`, level:3, timestamp: new Date().toISOString(), 'userID': 0});
    return {
      purchaseUnit: 'weightOunce',
      lifespanDays: 7,
      cost: cost || 0,
    };
  }
};

const matchRecipeIngredientRequest = async (userID, authorization, recipeIngredient, userIngredients) => {
  try {
    const billRatePer1000Chars = 0.00025;
    const token = await getAccessToken();
    const vertexaiProject = '911585064385';
    const vertexaiLocation = 'us-central1';
    const vertexaiEndpointID = '2044698002500616192';
    const promptText = `You are provided the name of a recipe ingredient. You are also provided an array of user ingredient names. Attempt to find the most closely related match from the user ingredients for the provided recipe ingredient. If no close match is found, return 'null'. RECIPE INGREDIENT:${recipeIngredient}, USER INGREDIENTS:[${userIngredients}]`;

    const requestJson = {
      instances: [
        {
          content: promptText,
        },
      ],
      parameters: {
        candidateCount: 1,
        maxOutputTokens: 1024,
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      },
    };
    const API_ENDPOINT = `${vertexaiLocation}-aiplatform.googleapis.com`;
    const response = await fetch(`https://${API_ENDPOINT}/v1/projects/${vertexaiProject}/locations/${vertexaiLocation}/endpoints/${vertexaiEndpointID}:predict`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestJson),
    });
    const data = await response.json();
    global.logger.info({message:`RI NAME: ${recipeIngredient} MATCHING VERTEXAI RESPONSE: ${data.predictions[0].content}`, level:7, timestamp: new Date().toISOString(), 'userID': 0});
    const matchResult = data.predictions[0].content;
    let resultJSON;
    const characterCount = data.metadata.tokenMetadata.inputTokenCount.totalBillableCharacters + data.metadata.tokenMetadata.outputTokenCount.totalBillableCharacters;
    let cost = (characterCount / 1000) * billRatePer1000Chars;
    global.logger.info({message:`CHARACTER COUNT: ${characterCount}, COST: $${cost}`, level:7, timestamp: new Date().toISOString(), 'userID': 0});

    // get est for purchaseUnit and lifespanDays from vertexai
    resultJSON = await getPurchaseUnitLifespanDaysEstimate(recipeIngredient);
    // add cost from finding purchaseUnit and lifespanDays
    cost += resultJSON.cost;

    const prepReturn = async () => {
      if (matchResult === 'null') {
        resultJSON['foundMatch'] = false;
      } else {
        // remove 'lifespanDays' from resultJSON
        delete resultJSON.lifespanDays;
        resultJSON['ingredientName'] = matchResult;
        resultJSON['foundMatch'] = true;
      }
    };
    await prepReturn();
    return {
      response: resultJSON,
      cost: cost,
    };
  } catch (error) {
    global.logger.info({message:`Error matching ingredient: ${error.message}`, level:3, timestamp: new Date().toISOString(), 'userID': 0});
    return {
      reponse: { error: error.message },
      cost: cost || 0,
    };
  }
};

const matchRecipeItemRequest = async (userID, authorization, type, recipeItem, userItems) => {
  global.logger.info({message:`MATCHING RECIPE ITEM: ${JSON.stringify(recipeItem)}, WITH USER ITEMS`, level:6, timestamp: new Date().toISOString(), 'userID': 0});
  const client = await getClient();
  const body = {
    messages: [requestMessages[type].message],
    temperature: 0.2,
    user: userID,
    model: 'gpt-4o',
    max_tokens: 3000,
    response_format: {
      type: requestMessages[type].response_format,
    },
  };
  // add the recipe item to the request
  body.messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Here is the recipe item: ${JSON.stringify(recipeItem)}`,
      },
    ],
  });
  // add the user items to the request
  body.messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Here are the user items: ${JSON.stringify(userItems)}`,
      },
    ],
  });
  const chatCompletionObject = await client.chat.completions.create(body).catch((err) => {
    throw errorGen(`OpenAI request failed: ${err.message}`, 515, 'cannotComplete', false, 3);
  });

  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to map recipe item "${JSON.stringify(recipeItem)}" to user item, type: ${type}`);

  //Check for unsuccessful completions
  if (chatCompletionObject.choices[0].finish_reason === 'length') {
    throw errorGen(`OpenAI request or response too long. Consider increasing "max_tokens" request property`, 515, 'aiContentTooLong', false, 3);
  }
  if (chatCompletionObject.choices[0].finish_reason === 'content_fiter') {
    throw errorGen(`Content Omitted due to filter being flagged`, 515, 'aiContentViolation', false, 3);
  }
  //Clean up the response JSON
  let responseJSON = chatCompletionObject.choices[0].message.content.replace(/json\n|\n/g, '');
  responseJSON = responseJSON.trim().replace(/^`{3}|`{3}$/g, '');
  return {
    response: responseJSON,
  };
};

const getUnitRatioAI = async (userID, authorization, substance, measurementUnit_A, measurementUnit_B) => {
  try {
    const billRatePer1000Chars = 0.00025;
    const token = await getAccessToken();
    const vertexaiProject = '911585064385';
    const vertexaiLocation = 'us-central1';
    const vertexaiEndpointID = '3241811078451036160';
    const promptText = `You are provided 'substance', 'unitA', and 'unitB'. Estimate the ratio of unitA per single unitB, for the given substance. Return ONLY the number estimate and nothing else. Example: substance='salt', unitA='ounce', unitB='teaspoon', could return 0.167. Example: substance='milk', unitA='gram', unitB='gallon', could return 3840. SUBSTANCE:${substance},UNITA:${measurementUnit_A},UNITB:${measurementUnit_B}`;

    const requestJson = {
      instances: [
        {
          content: promptText,
        },
      ],
      parameters: {
        candidateCount: 1,
        maxOutputTokens: 1024,
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      },
    };
    const API_ENDPOINT = `${vertexaiLocation}-aiplatform.googleapis.com`;
    const response = await fetch(`https://${API_ENDPOINT}/v1/projects/${vertexaiProject}/locations/${vertexaiLocation}/endpoints/${vertexaiEndpointID}:predict`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestJson),
    });
    const data = await response.json();

    if (!data.predictions || !Array.isArray(data.predictions) || data.predictions.length === 0) {
      global.logger.info({message:`API response did not include expected 'predictions' array or it was empty.`, level:3, timestamp: new Date().toISOString(), 'userID': 0});
      return {
        response: 1,
        cost: 0,
      };
    }

    const result = data.predictions[0].content;
    global.logger.info({message:`UNIT CONVERSION VERTEXAI ${substance}-${measurementUnit_A}-${measurementUnit_B} RESPONSE: ${result}`, level:7, timestamp: new Date().toISOString(), 'userID': 0});
    // if result can not be converted to a number, return 1
    if (isNaN(result)) {
      global.logger.info({message:`AI Unit Ratio estimate was not a number: ${result}, returning default "1"`, level:3, timestamp: new Date().toISOString(), 'userID': 0});
      return {
        response: 1,
        cost: cost || 0,
      };
    }

    // calculate cost
    const characterCount = data.metadata.tokenMetadata.inputTokenCount.totalBillableCharacters + data.metadata.tokenMetadata.outputTokenCount.totalBillableCharacters;
    const cost = (characterCount / 1000) * billRatePer1000Chars;
    global.logger.info({message:`CHARACTER COUNT: ${characterCount}, COST: $${cost}`, level:7, timestamp: new Date().toISOString(), 'userID': 0});
    return {
      response: result,
      cost: cost,
    };
  } catch (error) {
    global.logger.info({message:`Error estimating unit ratio: ${error.message}`, level:3, timestamp: new Date().toISOString(), 'userID': 0});
    return {
      response: 1,
      cost: cost || 0,
    };
  }
};

const requestMessages = {
  generateRecipeFromImage: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Attempt to gather information from this image depicting a recipe. Return a JSON object. If the image does not depict a recipe, or if any of the required properties can't be reasonably estimated, the JSON should include a single property 'error' with a number value of 10. Otherwise, include the following properties:
'title' <string> (required): The title of the recipe converted to title case,
'servings' <number>: The number of servings the recipe makes. estimate if not provided,
'lifespanDays' <number>: The number of days the dish can be stored after being made,
'timePrep' <number> (estimate): The number of minutes it takes to complete the steps, not including waiting time.
'timeBake' <number>: The number of minutes it takes to bake the dish or any other waiting time.
'category' <string> (required): An appropriate one-word category for the recipe based on the title
'ingredients' <array> (required): An array of objects, each one an 'ingredient'
'ingredient' <object>: An object with properties: 
-'name' <string> (Disregard any adjective words and capitalize, for example 'stemmed broccoli' should be 'Broccoli', and 'dry yeast' should be 'Yeast'). If the ingredient is a component of something, such as 'Egg White' or 'Egg Yolk', just use the main item, eg: 'Egg'. If the ingredient is a specific version of something, include the full name, ex: 'Apple Cider Vinegar'. If an adjective describes a different ingredient, include it, ex: 'Green Olive' or 'White Wine'.
-'measurementUnit' <string> (required, choose the unit from this list that most closely matches the measurement unit defined in the recipe. UNITS:${JSON.stringify(
            units,
          )}. Example if recipe calls for 2 medium onions, the best measurementUnit would be "single" with a measurement of 2. Disregard adjectives like "medium"). If the recipe Ingredient measurement unit is "ounce", select "weightOunce"., 
-'measurement' <number> (required) estimate based on chosen measurementUnit if no measurement provided, 
-'preparation' <string>. 'preparation' is optional and describes how the ingredient should be prepared, for example, 'chopped' or 'thinly sliced minced'.
-'component' <string> (optional) If the ingredient is associated with a recipe component, such as "sauce" or "filling", include the component name.
'tools' <array>: An array of objects, each one a 'tool'
'tool' <object>: An object with properties 'name' <string> and 'quantity' <number> (default 1).
'steps' <array> (required): An array of objects, each one a 'step'
'step' <object>: An object with properties 'title' <string>, 'description' <string>

Do not include any other properties in the JSON object response. If an optional property can't be confidently determined, do not include it in the response. Do not return anything other than a JSON object. Convert any fractions to decimals.`,
        },
        {
          type: 'image_url',
          image_url: {
            url: 'placeholder',
          },
        },
      ],
    },
    response_format: 'text',
  },
  generateRecipeFromText: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided a STRING with text retrieved from a browser page. From this string, find the details as described following.

Return a JSON object. If the image does not depict a recipe, or if any of the required properties can't be reasonably estimated, the JSON should include a single property 'error' with a number value of 10. Otherwise, include the following properties:
'title' <string> (required): The title of the recipe converted to title case,
'servings' <number>: The number of servings the recipe makes. estimate if not provided,
'lifespanDays' <number>: The number of days the dish can be stored after being made,
'timePrep' <number> (estimate): The number of minutes it takes to complete the steps, not including waiting time.
'timeBake' <number>: The number of minutes it takes to bake the dish or any other waiting time.
'category' <string> (required): An appropriate one-word category for the recipe based on the title
'ingredients' <array> (required): An array of objects, each one an 'ingredient'
'ingredient' <object>: An object with properties: 
-'name' <string> (Disregard any adjective words and capitalize, for example 'stemmed broccoli' should be 'Broccoli', and 'dry yeast' should be 'Yeast'). If the ingredient is a component of something, such as 'Egg White' or 'Egg Yolk', just use the main item, eg: 'Egg'. If the ingredient is a specific version of something, include the full name, ex: 'Apple Cider Vinegar'. If an adjective describes a different ingredient, include it, ex: 'Green Olive' or 'White Wine'.
-'measurementUnit' <string> (required, choose the unit from this list that most closely matches the measurement unit defined in the recipe. UNITS:${JSON.stringify(
            units,
          )}. Example if recipe calls for 2 medium onions, the best measurementUnit would be "single" with a measurement of 2. Disregard adjectives like "medium"). If the recipe Ingredient measurement unit is "ounce", select "weightOunce".,
-'measurement' <number> (required) estimate based on chosen measurementUnit if no measurement provided,
-'preparation' <string>. 'preparation' is optional and describes how the ingredient should be prepared, for example, 'chopped' or 'thinly sliced minced'.
-'component' <string> (optional) If the ingredient is associated with a recipe component, such as "sauce" or "filling", include the component name.
'tools' <array>: An array of objects, each one a 'tool'
'tool' <object>: An object with properties 'name' <string> and 'quantity' <number> (default 1).
'steps' <array> (required): An array of objects, each one a 'step'
'step' <object>: An object with properties 'title' <string>, 'description' <string>. If the provided text does not have a title and description for a step, use the step text for the 'description' and create a relevant 'title' for the step.

Do not include any other properties in the JSON object response. If an optional property can't be confidently determined, do not include it in the response. Do not return anything other than a JSON object. Convert any fractions to decimals. Ignore any unrelated text such as links to other recipes, recipe categories, reviews, browser navigation related text, etc. It's okay not to get all the details, but do your best to get as much as possible.`,
        },
      ],
    },
    response_format: 'text',
  },
  estimatePurchaseUnit: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided an ingredient name. Return the following json:
          'purchaseUnit' <string>: (required) choose the unit from the provded list that most closely matches how the ingredient might be purchased. The selection should be relavent to the ingredient. For example, 'flour' might be purchased in 'pounds', while 'milk' might be purchased in 'gallons'. Value MUST be one of these UNITS: ${units},

          Return body must resemble following example:
          **{
            "purchaseUnit": "pound",
          }**`,
        },
      ],
    },
    response_format: 'json_object',
  },
  estimateDaysAndPurchaseUnit: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided an ingredient name. Return the following json:
          'lifespanDays' <number>: (required) estimate of number of days ingredient will stay usable if stored properly. Minimum is 1.,
          'purchaseUnit' <string>: (required) choose the unit from the provided list that most closely matches how the ingredient might be purchased. The selection should be relavent to the ingredient. For example, 'flour' might be purchased in 'pounds', while 'milk' might be purchased in 'gallons'. Value MUST be one of these UNITS: ${units},

          Return body must resemble following example:
          **
          {
            "lifespanDays": 7,
            "purchaseUnit": "pound",
          }
          **
          `,
        },
      ],
    },
    response_format: 'json_object',
  },
  findMatchingTool: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided a recipe tool name. You are also provided an array of user tools. each includes a 'name' and 'toolID'. Using only the 'name' property, attempt to find a matching user tool for the provided recipe tool. For example, 'knife' would be a match for 'paring knife', but 'spoon' would not be a match for 'paring knife' If no close match is found, return the following json:
          'na`,
        },
      ],
    },
    response_format: 'json_object',
  },
  findMatchingCategory: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided a recipe Category name. You are also provided an array of user Categories. each includes a 'name' and 'recipeCategoryID'. Using only the 'name' property, attempt to find a matching user Category for the provided recipe Category. For example, 'Soups' would be a match for 'Soup', but 'Soups' would not be a match for 'Japanese' If no close match is found, return the ID of the category 'Other'. The returned value must be in JSON format, with nothing else returned. The JSON should have a single property 'recipeCategoryID'.`,
        },
      ],
    },
    response_format: 'json_object',
  },
  estimateUnitRatio: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided 'substance', 'unitA', and 'unitB'. Estimate the ratio of unitA per single unitB, for the given substance. Return the number estimate and nothing else.
Example: substance='salt', unitA='ounce', unitB='teaspoon', could return 0.167
Example: substance='milk', unitA='gram', unitB='gallon', could return 3840`,
        },
      ],
    },
    response_format: 'text',
  },
};

module.exports = {
  visionRequest,
  recipeFromTextRequest,
  matchRecipeItemRequest,
  getUnitRatioAI,
  matchRecipeIngredientRequest,
};
