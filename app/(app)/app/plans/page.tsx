"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../../../components/Sidebar";
import Link from "next/link";
import { FaCheckCircle, FaStar, FaArrowLeft, FaCrown } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  imageUrl: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeUsageId?: string;
}

interface SubscriptionData {
  id: string;
  status: string;
  planType: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

const PlansPage = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFreeUser, setIsFreeUser] = useState(true);

  useEffect(() => {
    // Check for success messages in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("downgraded") === "true") {
      toast.success(
        "Your subscription will be canceled at the end of the current billing period. You'll be downgraded to the free plan on your next billing date."
      );
    }

    if (urlParams.get("switched") === "true") {
      toast.success(
        "You've successfully switched to Pay As You Go! Your subscription has been canceled and you can now pay per session."
      );
    }

    async function fetchData() {
      if (session?.user?.id) {
        setLoading(true);
        try {
          // Fetch user data
          const userRes = await fetch(`/api/getUser?userId=${session.user.id}`);
          const userData = await userRes.json();
          setUserData(userData);

          // Check if user has any subscription
          const hasSubscription =
            userData.stripeSubscriptionId || userData.stripeUsageId;
          setIsFreeUser(!hasSubscription);

          // If they have a subscription, fetch subscription details
          if (userData.stripeSubscriptionId) {
            const subRes = await fetch(
              `/api/getSubscription?subscriptionId=${userData.stripeSubscriptionId}`
            );
            if (subRes.ok) {
              const subData = await subRes.json();
              setSubscriptionData(subData);
            }
          }
        } catch (error) {
          console.error("Error fetching plans data:", error);
          toast.error("Failed to load subscription information");
        } finally {
          setLoading(false);
        }
      }
    }

    fetchData();
  }, [session]);

  const handleUpgrade = async (planType: string) => {
    try {
      const response = await fetch("/api/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          userId: userData?.id,
          customerId: userData?.stripeCustomerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else if (data.success) {
          toast.success(data.message || "Subscription updated successfully");
          // Refresh the page to show updated status
          window.location.reload();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Something went wrong");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/createPortalSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: userData?.stripeCustomerId,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        if (error.needsSetup) {
          toast.error(
            "Customer portal is not set up yet. Please contact support to manage your subscription."
          );
        } else {
          toast.error(error.error || "Failed to open customer portal");
        }
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        {userData && (
          <Sidebar
            name={userData.name || "User"}
            profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
            phoneNumber={userData.phone || ""}
          />
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2D3E50]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {userData && (
        <Sidebar
          name={userData.name || "User"}
          profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
          phoneNumber={userData.phone || ""}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-[#FDF9F4] p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/app/dashboard"
            className="inline-flex items-center text-[#2D3E50] hover:text-[#24466d] mb-4"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-[#2D3E50] mb-2">
            Subscription Plans
          </h1>
          <p className="text-gray-600">
            {isFreeUser
              ? "Choose a plan that fits your needs"
              : "Manage your current subscription"}
          </p>
        </div>

        {/* Current Plan Status */}
        {!isFreeUser && subscriptionData && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
                  Current Plan:{" "}
                  {subscriptionData.planType === "paygo"
                    ? "Pay As You Go"
                    : subscriptionData.planType === "priority-paygo"
                    ? "Priority Pay As You Go"
                    : subscriptionData.planType === "plus-monthly"
                    ? "Plus Monthly"
                    : subscriptionData.planType === "plus-yearly"
                    ? "Plus Yearly"
                    : subscriptionData.planType}
                </h2>
                <p className="text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      subscriptionData.status === "active" &&
                      !subscriptionData.cancelAtPeriodEnd
                        ? "text-green-600"
                        : subscriptionData.cancelAtPeriodEnd
                        ? "text-orange-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {subscriptionData.cancelAtPeriodEnd
                      ? "Canceling at period end"
                      : subscriptionData.status.charAt(0).toUpperCase() +
                        subscriptionData.status.slice(1)}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {subscriptionData.cancelAtPeriodEnd
                    ? `Downgrades to free plan: ${new Date(
                        subscriptionData.currentPeriodEnd
                      ).toLocaleDateString()}`
                    : `Next billing: ${new Date(
                        subscriptionData.currentPeriodEnd
                      ).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={handleManageSubscription}
                className="bg-[#2D3E50] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#24466d] transition cursor-pointer"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Free Plan */}
          <PlanCard
            tier="Free"
            price="$0"
            subtitle="Perfect for getting started"
            features={[
              "3 sessions per month (unlimited length)",
              "Phone, text, or in-app support",
              "Monthly tech newsletter",
              "Dashboard to view past sessions",
              "Access to all support channels",
            ]}
            isCurrentPlan={isFreeUser}
            isFree={true}
            subscriptionData={subscriptionData}
            handleUpgrade={handleUpgrade}
          />

          {/* Plus Monthly */}
          <PlanCard
            tier="Plus Monthly"
            price="$20"
            subtitle="Priority support and unlimited chats"
            features={[
              "Everything in Free",
              "Priority queue – skip the line",
              "Unlimited chats per month",
              "Priority support response",
            ]}
            isCurrentPlan={
              !isFreeUser && subscriptionData?.planType === "plus-monthly"
            }
            onUpgrade={() => handleUpgrade("plus-monthly")}
            featured
            subscriptionData={subscriptionData}
            handleUpgrade={handleUpgrade}
          />

          {/* Plus Yearly */}
          <PlanCard
            tier="Plus Yearly"
            price="$17"
            subtitle="Save $36/year with annual billing"
            features={[
              "Everything in Plus Monthly",
              "Priority queue – skip the line",
              "Unlimited chats per month",
              "Priority support response",
              "Billed annually ($204/year)",
            ]}
            isCurrentPlan={
              !isFreeUser && subscriptionData?.planType === "plus-yearly"
            }
            onUpgrade={() => handleUpgrade("plus-yearly")}
            featured
            subscriptionData={subscriptionData}
            handleUpgrade={handleUpgrade}
          />

          {/* Pay As You Go */}
          <PlanCard
            tier="Pay As You Go"
            price="$9"
            subtitle="Perfect for occasional use"
            features={[
              "After your 3 free sessions",
              "$9 per additional question",
              "Phone, text, or in-app support",
              "Monthly tech newsletter",
              "Dashboard to view past sessions",
            ]}
            isCurrentPlan={
              !isFreeUser && subscriptionData?.planType === "paygo"
            }
            onUpgrade={() => handleUpgrade("paygo")}
            subscriptionData={subscriptionData}
            handleUpgrade={handleUpgrade}
          />

          {/* Priority Pay As You Go */}
          <PlanCard
            tier="Priority Pay As You Go"
            price="$11"
            subtitle="Skip the line, pay per use"
            features={[
              "After your 3 free sessions",
              "$11 per additional question",
              "Priority queue – skip the line",
              "Phone, text, or in-app support",
              "Priority support response",
            ]}
            isCurrentPlan={
              !isFreeUser && subscriptionData?.planType === "priority-paygo"
            }
            onUpgrade={() => handleUpgrade("priority-paygo")}
            featured
            subscriptionData={subscriptionData}
            handleUpgrade={handleUpgrade}
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-[#2D3E50] mb-1">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#2D3E50] mb-1">
                What happens to my unused sessions?
              </h3>
              <p className="text-gray-600 text-sm">
                Free plan sessions reset monthly. Paid plan sessions are
                unlimited or roll over depending on your plan.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#2D3E50] mb-1">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Absolutely! You can cancel your subscription at any time with no
                cancellation fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlanCardProps {
  tier: string;
  price: string;
  subtitle: string;
  features: string[];
  isCurrentPlan?: boolean;
  isFree?: boolean;
  featured?: boolean;
  onUpgrade?: () => void;
  subscriptionData?: SubscriptionData | null;
  handleUpgrade?: (planType: string) => void;
}

function PlanCard({
  tier,
  price,
  subtitle,
  features,
  isCurrentPlan = false,
  isFree = false,
  featured = false,
  onUpgrade,
  subscriptionData,
  handleUpgrade,
}: PlanCardProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 shadow-sm transform transition hover:shadow-xl hover:-translate-y-2 ${
        isCurrentPlan
          ? "border-green-500 bg-green-50"
          : featured
          ? "border-[#2D3E50] bg-white ring-4 ring-[#2D3E50]/20"
          : "border-[#C9D2E0] bg-white"
      }`}
    >
      {/* Tier header */}
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-2xl font-bold text-[#2D3E50]">{tier}</h2>
        {featured && (
          <FaStar className="text-[#F4C95D] text-xl animate-bounce-slow" />
        )}
        {isCurrentPlan && <FaCheckCircle className="text-green-500 text-xl" />}
      </div>

      <p className="text-[#2D3E50]/80 mb-4">{subtitle}</p>

      {/* Price */}
      <p className="text-4xl font-extrabold text-[#2D3E50] mb-1">{price}</p>
      {tier.includes("Monthly") && (
        <p className="text-[#2D3E50]/70 text-sm mb-6">per month</p>
      )}
      {tier.includes("Yearly") && (
        <p className="text-[#2D3E50]/70 text-sm mb-6">
          per month (billed annually)
        </p>
      )}
      {tier.includes("Pay As You Go") && (
        <p className="text-[#2D3E50]/70 text-sm mb-6">per question</p>
      )}
      {isFree && <p className="text-[#2D3E50]/70 text-sm mb-6">forever</p>}

      {/* Feature list */}
      <ul className="space-y-3 flex-1 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <FaCheckCircle className="text-[#5AA897] mt-1 flex-shrink-0" />
            <span className="text-[#2D3E50]/90 text-sm leading-snug">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrentPlan ? (
        <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg text-center font-semibold">
          Current Plan
        </div>
      ) : isFree ? (
        <div className="px-6 py-3 rounded-lg text-center font-semibold">
          {isCurrentPlan ? (
            <div className="bg-green-100 text-green-800">Current Plan</div>
          ) : subscriptionData?.cancelAtPeriodEnd ? (
            <div className="bg-orange-100 text-orange-800">
              Moving to Free Plan
            </div>
          ) : subscriptionData ? (
            <button
              onClick={() => handleUpgrade?.("free")}
              className="w-full border border-red-500 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
            >
              Downgrade to Free
            </button>
          ) : (
            <div className="bg-gray-100 text-gray-600">Free Plan</div>
          )}
        </div>
      ) : (
        <button
          onClick={onUpgrade}
          className={`px-6 py-3 rounded-lg font-semibold transition cursor-pointer ${
            featured
              ? "bg-[#2D3E50] text-white hover:bg-[#24466d]"
              : "border border-[#2D3E50] text-[#2D3E50] hover:bg-[#2D3E50]/10"
          }`}
        >
          {(() => {
            if (tier.includes("Pay As You Go")) {
              return "Upgrade to Pay As You Go";
            }

            // Determine if this is an upgrade or downgrade
            const currentPlan = subscriptionData?.planType;
            const isDowngrade =
              (currentPlan === "plus-monthly" && tier === "Free") ||
              (currentPlan === "plus-yearly" &&
                (tier === "Free" || tier === "Plus Monthly"));

            return isDowngrade ? `Downgrade to ${tier}` : `Upgrade to ${tier}`;
          })()}
        </button>
      )}
    </div>
  );
}

export default PlansPage;
