import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planType, userId, customerId } = await request.json();

    if (!planType) {
      return NextResponse.json(
        { error: "Plan type is required" },
        { status: 400 }
      );
    }

    // Handle free plan downgrade
    if (planType === "free") {
      // Get user data directly from database
      const { getUserById } = await import("../../../lib/db");
      const userData = await getUserById(userId);

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (userData.stripeSubscriptionId) {
        // Cancel the current subscription
        await stripe.subscriptions.update(userData.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        return NextResponse.json({
          success: true,
          message:
            "Subscription will be canceled at the end of the current period",
          url: `${process.env.NEXTAUTH_URL}/app/plans?downgraded=true`,
        });
      } else {
        return NextResponse.json(
          { error: "No active subscription to cancel" },
          { status: 400 }
        );
      }
    }

    // Handle subscription to pay-as-you-go transition
    if (planType === "paygo" || planType === "priority-paygo") {
      // Get user data directly from database
      const { getUserById, query } = await import("../../../lib/db");
      const userData = await getUserById(userId);

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (userData.stripeSubscriptionId) {
        try {
          // Cancel the current subscription immediately
          await stripe.subscriptions.cancel(userData.stripeSubscriptionId);

          // Remove the subscription record from our database
          await query(
            'DELETE FROM "StripeSubscription" WHERE "stripeSubscriptionId" = $1',
            [userData.stripeSubscriptionId]
          );

          // Clear the subscription ID from user but DON'T return early
          // We need to continue to create the Pay As You Go checkout
          await query(
            'UPDATE "User" SET "stripeSubscriptionId" = NULL WHERE id = $1',
            [userId]
          );

          console.log(
            `Successfully canceled subscription and cleared subscription ID for user ${userId}`
          );

          // Continue to the checkout session creation below
          // DO NOT return early here - we need to create the Pay As You Go checkout
        } catch (err) {
          console.error("Error canceling subscription:", err);
          // Continue anyway to create the Pay As You Go checkout
        }
      }
    }

    // Handle pay-as-you-go to subscription transition
    if (planType === "plus-monthly" || planType === "plus-yearly") {
      // Get user data directly from database
      const { getUserById, query } = await import("../../../lib/db");
      const userData = await getUserById(userId);

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // If user has a Pay As You Go subscription, cancel it first
      if (userData.stripeSubscriptionId) {
        try {
          // Cancel the existing Pay As You Go subscription
          await stripe.subscriptions.cancel(userData.stripeSubscriptionId);

          // Remove the subscription record from our database
          await query(
            'DELETE FROM "StripeSubscription" WHERE "stripeSubscriptionId" = $1',
            [userData.stripeSubscriptionId]
          );

          console.log(
            `Successfully canceled Pay As You Go subscription ${userData.stripeSubscriptionId} for user ${userId}`
          );
        } catch (err) {
          console.error("Error canceling Pay As You Go subscription:", err);
          // Continue anyway to create the new subscription
        }
      }

      // Clear both subscription ID and usage ID when switching to a subscription plan
      // This handles both cases: free->subscription and paygo->subscription
      await query(
        'UPDATE "User" SET "stripeSubscriptionId" = NULL, "stripeUsageId" = NULL WHERE id = $1',
        [userId]
      );
    }

    // Get the price ID based on plan type
    let priceId: string;
    switch (planType) {
      case "plus-monthly":
        priceId = process.env.STRIPE_PRODUCT_PLUS_MONTHLY!;
        break;
      case "plus-yearly":
        priceId = process.env.STRIPE_PRODUCT_PLUS_YEARLY!;
        break;
      case "paygo":
        priceId = process.env.STRIPE_PRODUCT_PAYGO!;
        break;
      case "priority-paygo":
        priceId = process.env.STRIPE_PRODUCT_PRIORITY_PAYGO!;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid plan type" },
          { status: 400 }
        );
    }

    // Create or retrieve Stripe customer
    let stripeCustomer;
    if (customerId) {
      stripeCustomer = await stripe.customers.retrieve(customerId);
    } else {
      // Get user data to create customer
      const userRes = await fetch(
        `${process.env.NEXTAUTH_URL}/api/getUser?userId=${userId}`
      );
      const userData = await userRes.json();

      stripeCustomer = await stripe.customers.create({
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        metadata: {
          userId: userId,
        },
      });
    }

    // For Pay As You Go, we need to check the price type first
    let mode: "payment" | "subscription" = "subscription";

    // Retrieve the price to check its type and usage type
    const price = await stripe.prices.retrieve(priceId);

    if (planType.includes("paygo")) {
      // If it's a one-time price, use payment mode, otherwise use subscription
      mode = price.type === "one_time" ? "payment" : "subscription";
    }

    // Check if the price has metered usage
    const isMetered = price.recurring?.usage_type === "metered";

    // Create checkout session
    const checkoutSessionParams = {
      customer: stripeCustomer.id,
      payment_method_types: ["card" as const],
      line_items: [
        {
          price: priceId,
          // Only include quantity if not metered
          ...(isMetered ? {} : { quantity: 1 }),
        },
      ],
      mode: mode,
      success_url: `${process.env.NEXTAUTH_URL}/app/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/app/plans?canceled=true`,
      metadata: {
        userId: userId,
        planType: planType,
      },
    };

    const checkoutSession = await stripe.checkout.sessions.create(
      checkoutSessionParams
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
