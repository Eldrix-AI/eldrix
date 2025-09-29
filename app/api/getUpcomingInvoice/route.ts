import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import Stripe from "stripe";

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
    const customerId = searchParams.get("customerId");
    const subscriptionId = searchParams.get("subscriptionId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching upcoming invoice for customer:", customerId);

    // Get the upcoming invoice for the customer using the new Create Preview Invoice API
    const response = await fetch(
      `https://api.stripe.com/v1/invoices/create_preview`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `customer=${customerId}&subscription=${subscriptionId}`,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe API error: ${response.status} - ${errorText}`);
    }

    const upcomingInvoice = await response.json();

    console.log("Upcoming invoice retrieved:", {
      id: upcomingInvoice.id,
      amount_due: upcomingInvoice.amount_due,
      currency: upcomingInvoice.currency,
      lines_count: upcomingInvoice.lines?.data?.length || 0,
    });

    // Calculate the amount due in dollars
    const amountDue = upcomingInvoice.amount_due / 100;
    const currency = upcomingInvoice.currency.toUpperCase();

    // Get the next payment attempt date
    const nextPaymentAttempt = upcomingInvoice.next_payment_attempt
      ? new Date(upcomingInvoice.next_payment_attempt * 1000)
      : null;

    // Get line items to show usage details
    const lineItems = upcomingInvoice.lines.data.map((item: any) => ({
      description: item.description,
      amount: item.amount / 100,
      quantity: item.quantity,
      period: {
        start: new Date(item.period.start * 1000),
        end: new Date(item.period.end * 1000),
      },
    }));

    return NextResponse.json({
      amountDue,
      currency,
      nextPaymentAttempt,
      lineItems,
      invoiceId: upcomingInvoice.id,
    });
  } catch (error) {
    console.error("Error fetching upcoming invoice:", error);

    // If there's no upcoming invoice (e.g., customer has no active subscriptions or usage)
    if (
      error instanceof Error &&
      (error.message.includes("No upcoming invoices") ||
        error.message.includes("No such customer") ||
        error.message.includes("No such subscription"))
    ) {
      console.log("No upcoming invoice found for customer");
      return NextResponse.json({
        amountDue: 0,
        currency: "USD",
        nextPaymentAttempt: null,
        lineItems: [],
        invoiceId: null,
      });
    }

    // Log the full error for debugging
    console.error("Full error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });

    return NextResponse.json(
      { error: "Failed to fetch upcoming invoice" },
      { status: 500 }
    );
  }
}
