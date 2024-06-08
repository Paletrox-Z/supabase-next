import {
  getAuthenticatedUser,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";

export const initializeLemonSqueezy = async () => {
  lemonSqueezySetup({
    apiKey: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_API_KEY!,
  });

  await getAuthenticatedUser();
};
