import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StringsService {
  public readonly onboardingStrings = {
    welcomeToDoughly: `Welcome to Doughly! Let's show you around before you get cooking.`,
    discoverPageOverview: `Recipes in Doughly can be set to be Public, Private, or Heirloom (friends only). This Discover page features popular Public recipes. Open one that catches your eye!`,
    publicRecipePage: `A great Choice! You'll find details about the recipe, ingredients, tools, and steps here. If you want to hold on to this for later, make use of the "Subscribe" button near the top. Let's try that now.`,
    subscribeRecipeModal: `Map each recipe ingredient and tool to your own (we started you with a few) or choose "Copy to Kitchen". Doughly keeps track of all units and inventory behind the scenes, so we'll need some conversions as well. Our AI will offer suggestions, but you can always adjust them.`,
    subscribeRecipePage: `We made it! This copy of the Public recipe is now connected to your kitchen. Explore the "Make Now!" button, then navigate to "Social".`,
    socialPageOverview: `The Social page is where you can find and connect with friends. You can see their recipes and they'll see yours here. Finally, keep your cherished recipes in one place for family to refer to any time they're feeling hungry or nostalgic~`,
    shoppingPageOverview: `To prep for a new grocery run, visit "Groceries" and add your recently subscribed recipe to the draft list. Once added, you'll see all needed ingredients appended. You can also add non-recipe items manually.`,
    recipesCreatedPage: `We're rounding the corner! On this page, you'll see all the recipes you've created. You have a few options when adding a new one.`,
    recipeCreateManual: `Want to get your hands dirty? You can start a new recipe from scratch here.`,
    recipeCreateURL: `To speed things up, you can paste a URL from any recipe website and let AI build things for you. Avoid the stress of endless articles and ads!`,
    recipeCreateImageButton: `For now though, let's create a Recipe using a photo.`,
    recipeCreateImage: `Take a photo of a recipe you'd like to add. It can be digital or handwritten! We'll use AI to extract the details, map them to your existing kitchen items, and create any new ones you need. You can also include an image to display for the recipe. Give it a go when you're ready!`,
    recipeCreateImageSuccess: `Amazing! While not always perfect, this tool gets the bulk of the work done for you. Review and confirm any yellow Ingredients in order to use this recipe.`,
    recipeCreateCreditUsage: `Using AI to create recipes gives our systems a workout, so it requires credits. We start you off with a few. To add more, upgrade to a Subscription plan in the Profile page.`,
    onboardingComplete: `We hope you're excited to build your collection for your loved ones to enjoy for years to come. Best wishes from Doughly.`,
  };
  constructor() {}
}