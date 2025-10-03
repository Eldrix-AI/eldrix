import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { query } from "../../../../lib/db";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;
  const customerId = session.customer as string;

  if (!userId || !planType) {
    console.error("Missing metadata in checkout session");
    return;
  }

  try {
    // Update user with Stripe customer ID
    await query('UPDATE "User" SET "stripeCustomerId" = $1 WHERE id = $2', [
      customerId,
      userId,
    ]);

    if (session.mode === "subscription" && session.subscription) {
      // Handle subscription
      await query(
        'UPDATE "User" SET "stripeSubscriptionId" = $1 WHERE id = $2',
        [session.subscription as string, userId]
      );

      // Insert into StripeSubscription table
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Check if this is a Pay As You Go plan
      const isPlanPaygo = planType.includes("paygo");

      // For Pay As You Go, we need to set both stripeSubscriptionId and stripeUsageId
      if (isPlanPaygo) {
        // Get the subscription item ID (si_...) which is needed for usage reporting
        const subscriptionItem = subscription.items.data[0];
        await query('UPDATE "User" SET "stripeUsageId" = $1 WHERE id = $2', [
          subscriptionItem.id, // This is the si_... ID needed for usage-based billing
          userId,
        ]);
      }

      await query(
        `INSERT INTO "StripeSubscription" 
         (id, "userId", "stripeSubscriptionId", "stripeCustomerId", status, "planType", "priceId", "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          crypto.randomUUID(),
          userId,
          session.subscription as string,
          customerId,
          subscription.status,
          planType,
          subscription.items.data[0]?.price.id,
          new Date(subscription.items.data[0].current_period_start * 1000),
          new Date(subscription.items.data[0].current_period_end * 1000),
          subscription.cancel_at_period_end,
        ]
      );
    } else if (session.mode === "payment") {
      // Handle one-time payment (pay-as-you-go)
      await query('UPDATE "User" SET "stripeUsageId" = $1 WHERE id = $2', [
        session.payment_intent as string,
        userId,
      ]);
    }

    console.log(`Successfully processed checkout session for user ${userId}`);
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    await query(
      `UPDATE "StripeSubscription" 
       SET status = $1, "currentPeriodStart" = $2, "currentPeriodEnd" = $3, "cancelAtPeriodEnd" = $4, "updatedAt" = now()
       WHERE "stripeSubscriptionId" = $5`,
      [
        subscription.status,
        new Date(subscription.items.data[0].current_period_start * 1000),
        new Date(subscription.items.data[0].current_period_end * 1000),
        subscription.cancel_at_period_end,
        subscription.id,
      ]
    );

    console.log(`Updated subscription ${subscription.id}`);
  } catch (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Remove subscription from user
    await query(
      'UPDATE "User" SET "stripeSubscriptionId" = NULL, "stripeUsageId" = NULL WHERE "stripeSubscriptionId" = $1',
      [subscription.id]
    );

    // Delete the subscription record from our database
    await query(
      'DELETE FROM "StripeSubscription" WHERE "stripeSubscriptionId" = $1',
      [subscription.id]
    );

    console.log(`Canceled and removed subscription ${subscription.id}`);
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // @ts-expect-error Stripe types vary by API version; subscription may be string
    if (invoice.subscription) {
      // Update subscription status
      await query(
        'UPDATE "StripeSubscription" SET status = \'active\', "updatedAt" = now() WHERE "stripeSubscriptionId" = $1',
        // @ts-expect-error Stripe Invoice.subscription can be string in some versions
        [invoice.subscription as string]
      );
    }

    console.log(`Payment succeeded for invoice ${invoice.id}`);
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    // @ts-expect-error Stripe types vary by API version; subscription may be string
    if (invoice.subscription) {
      // Update subscription status
      await query(
        'UPDATE "StripeSubscription" SET status = \'past_due\', "updatedAt" = now() WHERE "stripeSubscriptionId" = $1',
        // @ts-expect-error Stripe Invoice.subscription can be string in some versions
        [invoice.subscription as string]
      );
    }

    console.log(`Payment failed for invoice ${invoice.id}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}
