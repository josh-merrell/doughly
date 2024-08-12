import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StringsService {
  public readonly onboardingStrings = {
    collectUserDetails: 'First things first! Tell us about yourself.',
    welcomeToDoughly: `Welcome to Doughly! Let's show you around before you get cooking.`,
    discoverPageOverview: `Recipes can be set as Public, Private, or Heirloom (only friends can see). The Discover page features popular Public recipes.`,
    publicRecipePage: `A great Choice! You'll find details about the recipe here. If you want to connect it to your kitchen, use the "Subscribe" button near the top. Let's try that now.`,
    subscribeRecipeModal: `Map each ingredient and tool to your own (we started you with a few) or choose "Copy to Kitchen". Doughly keeps track of all units and inventory behind the scenes, so we'll need some conversions as well. Our AI will offer suggestions, but you can always adjust them.`,
    subscribeRecipePage: `This copy of the Public recipe is now connected to your kitchen! Explore the "Make Now!" button, then navigate to "Social".`,
    socialPageOverview: `On the Social page you can connect with friends. Keep your cherished recipes in one place for family to refer to any time they're feeling hungry or nostalgic!`,
    kitchenPageOverview: `In the Kitchen page, you can see all your tools and ingredients. You can add new ones and manage stock entries.`,
    shoppingPageOverview: `From the Groceries page, select recipes you plan on using. If you enable the setting, the app will check your kitchen inventory and add only what you don't have in stock to your shopping list!`,
    recipesCreatedPage: `On the Created page, you'll see all the recipes you own. You have a few options when adding a new one...`,
    recipeCreateManual: `Want to get your hands dirty? Start a new recipe from scratch here.`,
    recipeCreateURL: `To speed things up, you can paste a URL from any recipe website and let AI build things for you. Avoid the stress of endless articles and ads!`,
    recipeCreateImageButton: `For now though, let's create a Recipe using an image.`,
    recipeCreateImage: `Choose a photo or screenshot of a recipe you'd like to add, handwritten is fine! Add a display image if you have one. AI will extract the details, map them to your existing kitchen items, and create any new ones you need. Give it a try when ready!`,
    recipeCreateImageSuccess: `Amazing! While not always perfect, this tool gets the bulk of the work done for you. Review and confirm any draft Ingredients in order to use this recipe.`,
    recipeCreateOverview: `Aside from manual entry, you may also import recipes from URLs or images. Stop dealing with ad-covered websites and let AI do the work for you!`,
    recipeCreateCreditUsage: `Using AI to import recipes requires tokens. We start you off with a few. To add more, upgrade to a Subscription plan.`,
    onboardingComplete: `We hope you're excited to build your collection for your loved ones to enjoy for years to come. Best wishes from Doughly.`,
  };
  public readonly productStrings = {
    subscribeFinePrint: `You will be automatically billed at the end of each period. You may cancel anytime in Google Play or App Store.`,
    noSubscribeOfferings: `We're sorry, we couldn't find any subscription offerings at this time. Please check again later.`,
    subscribeOverviewBenefit1of2: `Doughly Premium users import recipes`,
    subscribeOverviewBenefitmultiplier: ' 6.2 ',
    subscribeOverviewBenefit2of2: `times faster with AI!`,
    subscribeChartBenefit: `Premium users get the most from thier recipes!`,
    subscribeYourPremium: `Your Premium Subscription is serving you well. Thank you for your support!`,
    subscribeYourLifetime: `Add a Premium Subscription for monthly AI Import tokens and guaranteed data backups.`,
    manageSubscription: `You can manage your subscription in Google Play or App Store.`,
    timeToUpgrade: `Time to upgrade your account!`,
    timeToTopUp: `Time to top up your AI Tokens!`,
    changeSubscription: `change subscription`,
    beforeCanceling1: `Before canceling, select Recipes to keep as part of your free tier access. We'll hold onto the others in case you choose to resubscribe later.`,
    freeTierRecipeSelection: `Any Recipe not selected will be unavailable and archived upon canceling your Premium Membership.`,
    freeTierSubscriptionSelection: `Any Recipe Subscriptions not selected will be unavailable and archived upon canceling your Premium Membership.`,
    subscribeOverviewPoints: [
      {
        title: `Unlimited Recipes`,
        description: `Create as many and Subscribe to as many recipes as you like`,
      },
      {
        title: `Monthly Tokens`,
        description: `Regularly top up your tokens to import recipes in a snap`,
      },
      {
        title: `Daily Data Backups`,
        description: `Maintain peace of mind knowing your recipes are safe`,
      },
    ],
  };
  constructor() {}
}
