import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem?.price.id;

    // Map price ID to plan type
    let planType = "unknown";
    if (priceId === process.env.STRIPE_PRODUCT_PLUS_MONTHLY) {
      planType = "plus-monthly";
    } else if (priceId === process.env.STRIPE_PRODUCT_PLUS_YEARLY) {
      planType = "plus-yearly";
    } else if (priceId === process.env.STRIPE_PRODUCT_PAYGO) {
      planType = "paygo";
    } else if (priceId === process.env.STRIPE_PRODUCT_PRIORITY_PAYGO) {
      planType = "priority-paygo";
    }

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      planType: planType,
      currentPeriodStart: new Date(
        subscriptionItem.current_period_start * 1000
      ).toISOString(),
      currentPeriodEnd: new Date(
        subscriptionItem.current_period_end * 1000
      ).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    return NextResponse.json(
      { error: "Failed to retrieve subscription" },
      { status: 500 }
    );
  }
}
