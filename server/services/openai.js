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
    temperature: 0.4,
    user: userID,
    model: 'gpt-4-vision-preview',
    max_tokens: 2000,
  };
  body.messages[0].content[1].image_url.url = recipeImageURL;

  const chatCompletionObject = await client.chat.completions.create(body).catch((err) => {
    throw errorGen(`OpenAI request failed: ${err.message}`, 500);
  });

  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to ${messageType}`);

  //Check for unsuccessful completions
  if (chatCompletionObject.choices[0].finish_reason === 'length') {
    throw errorGen('OpenAI request or response too long. Consider increasing "max_tokens" request property', 400);
  }
  if (chatCompletionObject.choices[0].finish_reason === 'content_fiter') {
    throw errorGen('Content Omitted due to filter being flagged', 400);
  }

  // global.logger.info(`RAW RECIPEJSON: ${chatCompletionObject.choices[0].message.content}`);
  //Clean up the response JSON
  let responseJSON = chatCompletionObject.choices[0].message.content.replace(/json\n|\n/g, '');
  responseJSON = responseJSON.trim().replace(/^`{3}|`{3}$/g, '');
  return {
    response: responseJSON,
  };
};
const textRequest = async (userID, authorization, messageType, messageStrings) => {
  const client = await getClient();
  const body = {
    messages: [requestMessages[messageType].message],
    temperature: 0.2,
    user: userID,
    model: 'gpt-3.5-turbo',
    max_tokens: 1500,
    response_format: {
      type: requestMessages[messageType].response_format,
    },
  };
  // for each message string object, add it to the request joining the 'string.preamble' and 'string.value' properties
  messageStrings.forEach((messageString) => {
    body.messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `${messageString.preamble}: ${messageString.value}`,
        },
      ],
    });
  });
  const chatCompletionObject = await client.chat.completions.create(body).catch((err) => {
    throw errorGen(`OpenAI request failed: ${err.message}`, 500);
  });

  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to ${messageType}`);

  //Check for unsuccessful completions
  if (chatCompletionObject.choices[0].finish_reason === 'length') {
    throw errorGen('OpenAI request or response too long. Consider increasing "max_tokens" request property', 400);
  }
  if (chatCompletionObject.choices[0].finish_reason === 'content_fiter') {
    throw errorGen('Content Omitted due to filter being flagged', 400);
  }
  //Clean up the response JSON
  let responseJSON = chatCompletionObject.choices[0].message.content.replace(/json\n|\n/g, '');
  responseJSON = responseJSON.trim().replace(/^`{3}|`{3}$/g, '');
  return {
    response: responseJSON,
  };
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
    // global.logger.info(`RI NAME: ${recipeIngredient} VERTEXAI RESPONSE: ${data.predictions[0].content}. FULL RESPONSE: ${JSON.stringify(data)}`);
    global.logger.info(`RI NAME: ${recipeIngredient} VERTEXAI RESPONSE: ${data.predictions[0].content}`);
    const matchResult = data.predictions[0].content;
    let resultJSON;
    const characterCount = data.metadata.tokenMetadata.inputTokenCount.totalBillableCharacters + data.metadata.tokenMetadata.outputTokenCount.totalBillableCharacters;
    const cost = (characterCount / 1000) * billRatePer1000Chars;
    global.logger.info(`CHARACTER COUNT: ${characterCount}, COST: $${cost}`);
    const prepReturn = async () => {
      if (matchResult === 'null') {
        //need to get openai estimate of lifespanDays and purchaseUnit
        const lifespanDaysAndPurchaseUnitresponse = await textRequest(userID, authorization, 'estimateDaysAndPurchaseUnit', [{ preamble: 'INGREDIENT: ', value: recipeIngredient }]);
        global.logger.info(`Lifespan and purchase unit estimate: ${lifespanDaysAndPurchaseUnitresponse.response}`);
        resultJSON = JSON.parse(lifespanDaysAndPurchaseUnitresponse.response);
        if (!units.includes(resultJSON.purchaseUnit)) {
          resultJSON.purchaseUnit = 'weightOunce';
        }
        resultJSON['foundMatch'] = false;
      } else {
        //need to get openai estimate of purchaseUnit
        const purchaseUnitresponse = await textRequest(userID, authorization, 'estimatePurchaseUnit', [{ preamble: 'INGREDIENT: ', value: recipeIngredient }]);
        global.logger.info(`Purchase unit estimate: ${purchaseUnitresponse.response}`);
        resultJSON = JSON.parse(purchaseUnitresponse.response);
        if (!units.includes(resultJSON.purchaseUnit)) {
          resultJSON.purchaseUnit = 'weightOunce';
        }
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
    global.logger.error(`Error matching ingredient: ${error.message}`);
    return {
      reponse: { error: error.message },
      cost: cost || 0,
    };
  }
};

const matchRecipeItemRequest = async (userID, authorization, type, recipeItem, userItems) => {
  global.logger.info(`MATCHING RECIPE ITEM: ${JSON.stringify(recipeItem)}, WITH USER ITEMS`);
  const client = await getClient();
  const body = {
    messages: [requestMessages[type].message],
    temperature: 0.2,
    user: userID,
    model: 'gpt-4-0125-preview',
    max_tokens: 1500,
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
    throw errorGen(`OpenAI request failed: ${err.message}`, 500);
  });

  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to map recipe item "${JSON.stringify(recipeItem)}" to user item, type: ${type}`);

  //Check for unsuccessful completions
  if (chatCompletionObject.choices[0].finish_reason === 'length') {
    throw errorGen('OpenAI request or response too long. Consider increasing "max_tokens" request property', 400);
  }
  if (chatCompletionObject.choices[0].finish_reason === 'content_fiter') {
    throw errorGen('Content Omitted due to filter being flagged', 400);
  }
  //Clean up the response JSON
  let responseJSON = chatCompletionObject.choices[0].message.content.replace(/json\n|\n/g, '');
  responseJSON = responseJSON.trim().replace(/^`{3}|`{3}$/g, '');
  return {
    response: responseJSON,
  };
};

const getUnitRatioAI = async (userID, authorization, substance, measurementUnit_A, measurementUnit_B) => {
  const client = await getClient();
  const body = {
    messages: [requestMessages['estimateUnitRatio'].message],
    user: userID,
    temperature: 0.2,
    model: 'gpt-4-turbo-preview',
    max_tokens: 1500,
    response_format: {
      type: requestMessages['estimateUnitRatio'].response_format,
    },
  };
  // add the params to the request
  body.messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: `'substance': ${substance}, 'numerator': ${measurementUnit_A}, 'denominator': ${measurementUnit_B}`,
      },
    ],
  });
  const chatCompletionObject = await client.chat.completions.create(body).catch((err) => {
    throw errorGen(`OpenAI request failed: ${err.message}`, 500);
  });

  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to estimate unit ratio between ${measurementUnit_A} and ${measurementUnit_B}`);

  //Check for unsuccessful completions
  if (chatCompletionObject.choices[0].finish_reason === 'length') {
    throw errorGen('OpenAI request or response too long. Consider increasing "max_tokens" request property', 400);
  }
  if (chatCompletionObject.choices[0].finish_reason === 'content_fiter') {
    throw errorGen('Content Omitted due to filter being flagged', 400);
  }
  let responseJSON = chatCompletionObject.choices[0].message.content;
  return {
    response: responseJSON,
  };
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
-'measurementUnit' <string> (required, choose the unit from this list that most closely matches the measurement unit defined in the recipe: ${JSON.stringify(
            units,
          )}. Example if recipe calls for 2 medium onions, the best measurementUnit would be "single" with a measurement of 2. Disregard adjectives like "medium"). If the recipe Ingredient measurement unit is "ounce", select "weightOunce"., 
-'measurement' <number> (required) estimate based on chosen measurementUnit if no measurement provided, 
-'preparation' <string>. 'preparation' is optional and describes how the ingredient should be prepared, for example, 'chopped' or 'thinly sliced minced'.
-'component' <string> (optional) If the ingredient is associated with a recipe component, such as "sauce" or "filling", include the component name.
'tools' <array>: An array of objects, each one a 'tool'
'tool' <object>: An object with properties 'name' <string> and 'quantity' <number> (default 1).
'steps' <array> (required): An array of objects, each one a 'step'
'step' <object>: An object with properties 'title' <string>, 'description' <string>, and 'sequence' <number> (1-indexed)

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
  findMatchingIngredient: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided a recipe ingredient, which includes 'name', 'measurement', and 'measurementUnit'. You are also provided an array of user ingredients. each includes a 'name', 'ingredientID', and 'purchaseUnit'. Using only the 'name' property, review all available user ingredients and attempt to find the closest match for the provided recipe ingredient. If no close match is found, return the following json:
          'lifespanDays' <number>: (required) estimate of number of days ingredient will stay usable if stored properly. Minimum is 1.,
          'purchaseUnit' <string>: (required) choose the unit from this list that most closely matches how the ingredient might be purchased: ${units}. The selection should be relavent to the ingredient. For example, 'flour' might be purchased in 'pounds', while 'milk' might be purchased in 'gallons'. Only use generic units like 'single' or 'carton' as a last resort. Value MUST be one of the units in the list., 
          
          If a match is found, return the following json:
          'ingredientID' <number>: (required) The ingredientID of the matching user ingredient,
          'purchaseUnit' <string>: (required) The purchaseUnit of the matching user ingredient.

          Return body must resemble one of the following two examples:
          'example-1_no-match':{
            "lifespanDays": 7,
            "purchaseUnit": "pound",
          }

          'example-2_match-found':{
            "ingredientID": 1,
            "purchaseUnit": "ounce",
          }
          
          Do not include any properties in the JSON object responses except those defined for the two cases. Convert any fractions to decimals.`,
        },
      ],
    },
    response_format: 'json_object',
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
  matchRecipeItemRequest,
  getUnitRatioAI,
  matchRecipeIngredientRequest,
};
