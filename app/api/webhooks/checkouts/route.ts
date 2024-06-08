import { initializeLemonSqueezy } from "@/utils/lemonsqueezy/initialize";
import { createClient } from "@/utils/supabase/client";
import { getVariant } from "@lemonsqueezy/lemonsqueezy.js";

let client = createClient().from("order_details");
initializeLemonSqueezy();

type OrderDetailsTableType = {
  id?: number;
  product_name?: string;
  product_price?: string;
  product_type?: string;
  interval?: string;
  buyer_name?: string;
  buyer_email?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
};

export const POST = async (request: Request) => {
  try {
    const orderDetails = await request.json();

    const variantId =
      orderDetails?.data?.attributes?.first_order_item?.variant_id || 0;

    if ((orderDetails?.meta?.event_name || "") === "order_created") {
      // Create new entry for order
      let productInfo = {
        isSubscription: false,
        subscriptionInterval: "",
      };
      await getVariant(variantId).then(async (variantResponse) => {
        const isSubscription =
          (await variantResponse.data?.data?.attributes.is_subscription) ||
          false;

        const subscriptionInterval =
          (await variantResponse.data?.data?.attributes.interval) || "None";
        productInfo.isSubscription = isSubscription;
        productInfo.subscriptionInterval = subscriptionInterval;
      });

      const dataToInsert: OrderDetailsTableType = {
        id: orderDetails?.data?.id,
        product_name:
          orderDetails?.data?.attributes?.first_order_item?.product_name ||
          "No Product Name",
        product_price:
          orderDetails?.data?.attributes?.total_formatted || "No Price Info",
        buyer_name:
          orderDetails?.data?.attributes?.user_name || "No Buyer Name",
        buyer_email:
          orderDetails?.data?.attributes?.user_email || "No Buyer Email",
        interval: productInfo.subscriptionInterval,
        product_type: productInfo.isSubscription ? "Subscription" : "One-Time",
        updated_at: new Date().toISOString().toLocaleString(),
        status: orderDetails?.meta?.event_name || "Status Unknown",
      };
      await client.insert(dataToInsert);
    } else {
      // Update existing order
      const dataToInsert: OrderDetailsTableType = {
        id: orderDetails?.data?.attributes?.order_id,
        updated_at: new Date().toISOString().toLocaleString(),
        status: orderDetails?.meta?.event_name || "Status Unknown",
      };
      await client.update(dataToInsert).eq("id", dataToInsert.id);
    }

    return Response.json({ message: "Success" }, { status: 200 });
  } catch (exception) {
    return Response.json(exception, { status: 500 });
  }
};
