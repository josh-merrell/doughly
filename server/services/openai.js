const { OpenAI } = require('openai');
const { createUserLog } = require('./dbLogger');
const { errorGen } = require('../middleware/errorHandling');
const units = process.env.MEASUREMENT_UNITS.split(',');

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

  // console.log(`RAW RECIPEJSON: ${chatCompletionObject.choices[0].message.content}`);
  //Clean up the response JSON
  let responseJSON = chatCompletionObject.choices[0].message.content.replace(/json\n|\n/g, '');
  responseJSON = responseJSON.trim().replace(/^`{3}|`{3}$/g, '');
  return {
    response: responseJSON,
  };
};

const matchRecipeItemRequest = async (userID, authorization, type, recipeItem, userItems) => {
  console.log(`MATCHING RECIPE ITEM: ${JSON.stringify(recipeItem)}, WITH USER ITEMS: ${JSON.stringify(userItems)}`);
  const client = await getClient();
  const body = {
    messages: [requestMessages[type].message],
    user: userID,
    model: 'gpt-3.5-turbo-1106',
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

const getUnitRatio = async (userID, authorization, substance, measurementUnit_A, measurementUnit_B) => {
  const client = await getClient();
  const body = {
    messages: [requestMessages['estimateUnitRatio'].message],
    user: userID,
    model: 'gpt-4-1106-preview',
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
        text: `'substance': ${substance}, 'measurementUnit_A': ${measurementUnit_A}, 'measurementUnit_B': ${measurementUnit_B}`,
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

const getGramRatio = async (userID, authorization, substance, measurementUnit) => {
  const client = await getClient();
  const body = {
    messages: [requestMessages['estimateGramRatio'].message],
    user: userID,
    model: 'gpt-3.5-turbo-1106',
    max_tokens: 1500,
    response_format: {
      type: requestMessages['estimateGramRatio'].response_format,
    },
  };
  // add the substance to the request
  body.messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Here is 'substance': ${substance}`,
      },
    ],
  });
  // add the measurementUnit to the request
  body.messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Here is 'measurementUnit': ${measurementUnit}`,
      },
    ],
  });
  const chatCompletionObject = await client.completions.create(body).catch((err) => {
    throw errorGen(`OpenAI request failed: ${err.message}`, 500);
  });

  //log token usage
  createUserLog(userID, authorization, 'openaiTokensUsed', 0, null, null, `${chatCompletionObject.usage.total_tokens}`, `Used ${chatCompletionObject.usage.total_tokens} tokens to estimate gram ratio of ${substance} in ${measurementUnit}`);

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
-'name' <string> (Disregard any adjective words and capitalize, for example 'stemmed broccoli' should be 'Broccoli', and 'dry yeast' should be 'Yeast'). If the ingredient is a component of something, such as 'Egg White' or 'Egg Yolk', just use the main item, eg: 'Egg', 
-'measurementUnit' <string> (required, choose the unit from this list that most closely matches the measurement unit defined in the recipe: ${JSON.stringify(
            units,
          )}. Example if recipe calls for 2 medium onions, the best measurementUnit would be "single" with a measurement of 2. Disregard adjectives like "medium"), 
-'measurement' <number> (required) estimate based on chosen measurementUnit if no measurement provided, 
-'preparation' <string>. 'preparation' is optional and describes how the ingredient should be prepared, for example, 'chopped' or 'thinly sliced minced'.
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
          text: `You are provided a recipe ingredient, which includes 'name', 'measurement', and 'measurementUnit'. You are also provided an array of user ingredients. each includes a 'name', 'ingredientID', and 'purchaseUnit'. Using only the 'name' property, attempt to find a matching user ingredient for the provided recipe ingredient. For example, 'flour' would be a match for 'wheat flour', but 'rose water' would not be a match for 'water' If no close match is found, return the following json:
          'lifespanDays' <number>: (required) estimate of number of days ingredient will stay usable if stored properly. Minimum is 1.,
          'purchaseUnit' <string>: (required) choose the unit from this list that most closely matches how the ingredient might be purchased: ${units}. The selection should be relavent to the ingredient. For example, 'flour' might be purchased in 'pounds', while 'milk' might be purchased in 'gallons'. Only use generic units like 'single' or 'carton' as a last resort. Value MUST be one of the units in the list., 
          'gramRatio' <integer>: (required) an estimate of how many grams the chosen purchaseUnit of this ingredient would weigh. Value must be a positive integer.,
          'purchaseUnitRatio' <number>: (required) an estimate of how many measurementUnits in a purchaseUnit of the matching user ingredient Must be greater than 0..
          
          If a match is found, return the following json:
          'ingredientID' <number>: (required) The ingredientID of the matching user ingredient,
          'purchaseUnitRatio' <number>: (required) an estimate of how many measurementUnits in a purchaseUnit of the matching user ingredient. Value must be a positive integer.

          Return body must resemble one of the following two examples:
          'example-1_no-match':{
            "lifespanDays": 7,
            "purchaseUnit": "pound",
            "gramRatio": 453,
            "purchaseUnitRatio": 16
          }

          'example-2_match-found':{
            "ingredientID": 1,
            "purchaseUnitRatio": 16
          }
          
          Do not include any properties in the JSON object responses except those defined for the two cases. Convert any fractions to decimals.`,
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
          text: `You are provided 'substance', 'measurementUnit_A', and 'measurementUnit_B'. Considering the provided 'substance', provide a json response with a single property 'unitRatio' <number> with a value of the estimated number of 'measurementUnit_A' that fit in a single 'measurementUnit_B'. Use two decimal accuracy. For example, if 'measurementUnit_A' is 'tablespoon' and 'measurementUnit_B' is liter, return {unitRatio: 67.63}. Always return a positive value, even if it is just an educated guess.`,
        },
      ],
    },
    response_format: 'json_object',
  },
  estimateGramRatio: {
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `You are provided 'substance' and 'measurementUnit'. Provide a json response with a single property 'gramRatio' <integer> with a value of the estimated number of grams in a single 'measurementUnit' of 'substance'. Use two decimal accuracy. For example, if 'substance' is 'flour' and 'measurementUnit' is 'cup', return {gramRatio: 120}. Returned value must be a postive integer. Always return a value, even if it is just an educated guess.`,
        },
      ],
    },
    response_format: 'json_object',
  },
};

module.exports = {
  visionRequest,
  matchRecipeItemRequest,
  getUnitRatio,
  getGramRatio,
};
