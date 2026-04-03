import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const client = new Anthropic();

type ContentType = "listing_description" | "social_post" | "email_campaign" | "market_update" | "follow_up";

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  listing_description: `You are a luxury real estate copywriter for Shapiro Group, an Austin-based brokerage. Write compelling MLS listing descriptions that are:
- Professional but warm, highlighting lifestyle and unique features
- 150-250 words for standard listings, 250-400 for luxury ($1M+)
- Structured: opening hook, key features, lifestyle/location, call to action
- Use active voice, avoid clichés like "stunning" or "must-see"
- Include relevant Austin neighborhood context when applicable
- End with a subtle call to action mentioning Shapiro Group`,

  social_post: `You are a social media manager for Shapiro Group, an Austin real estate brokerage. Create engaging social media posts that:
- Are optimized for Instagram/Facebook (include suggested hashtags)
- Lead with an attention-grabbing hook
- Keep the main text under 150 words
- Include 5-8 relevant hashtags at the end
- Match a luxury but approachable brand voice
- Include a call to action (DM, link in bio, contact)`,

  email_campaign: `You are an email marketing specialist for Shapiro Group. Write email content that:
- Has a compelling subject line (included separately)
- Opens with a personal, value-driven hook
- Is 150-300 words in the body
- Includes clear CTA (schedule a showing, view listings, etc.)
- Professional but personable tone
- Optimized for mobile reading (short paragraphs)`,

  market_update: `You are a real estate market analyst for Shapiro Group in Austin, TX. Write market update content that:
- Leads with the most interesting data point
- Provides context for the numbers (what they mean for buyers/sellers)
- Is 200-350 words
- Includes actionable takeaways
- Professional and authoritative but accessible
- Positions Shapiro Group as a knowledgeable market resource`,

  follow_up: `You are a real estate agent at Shapiro Group writing personalized follow-up messages. Create messages that:
- Feel personal and genuine, not templated
- Reference specific details about the client's search or showing
- Are concise (50-100 words for texts, 100-200 for emails)
- Include a clear next step or question
- Are warm but professional
- Never pushy — focus on being helpful`,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { type, details } = body as { type: ContentType; details: Record<string, string> };

    if (!type || !SYSTEM_PROMPTS[type]) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    // Build the user prompt based on content type
    let userPrompt = "";

    switch (type) {
      case "listing_description":
        userPrompt = `Write a listing description for this property:
Address: ${details.address || "Not provided"}
City/Neighborhood: ${details.neighborhood || "Austin, TX"}
Price: ${details.price || "Not provided"}
Beds: ${details.beds || "N/A"} | Baths: ${details.baths || "N/A"} | Sqft: ${details.sqft || "N/A"}
Year Built: ${details.yearBuilt || "N/A"}
Property Type: ${details.propertyType || "Single Family"}
Key Features: ${details.features || "None specified"}
Additional Notes: ${details.notes || "None"}`;
        break;

      case "social_post":
        userPrompt = `Create a social media post for:
Type: ${details.postType || "New Listing"} (options: New Listing, Just Sold, Open House, Price Reduction, Market Update)
Property: ${details.address || ""} in ${details.neighborhood || "Austin"}
Price: ${details.price || ""}
Key Details: ${details.beds || ""} bed / ${details.baths || ""} bath / ${details.sqft || ""} sqft
Highlight: ${details.highlight || ""}
Additional Context: ${details.notes || ""}`;
        break;

      case "email_campaign":
        userPrompt = `Write an email campaign:
Purpose: ${details.purpose || "New listing announcement"}
Target Audience: ${details.audience || "Active buyers"}
Property/Topic: ${details.subject || ""}
Key Details: ${details.details || ""}
Call to Action: ${details.cta || "Schedule a showing"}
Additional Context: ${details.notes || ""}`;
        break;

      case "market_update":
        userPrompt = `Write a market update:
Area: ${details.area || "Austin, TX"}
Data Points: ${details.dataPoints || "Not provided"}
Timeframe: ${details.timeframe || "This month"}
Target Audience: ${details.audience || "Buyers and sellers"}
Key Takeaway: ${details.takeaway || ""}
Additional Context: ${details.notes || ""}`;
        break;

      case "follow_up":
        userPrompt = `Write a follow-up message:
Format: ${details.format || "text"} (text or email)
Client Name: ${details.clientName || ""}
Context: ${details.context || "After a showing"}
Properties Viewed: ${details.properties || ""}
Client Preferences: ${details.preferences || ""}
Next Step: ${details.nextStep || ""}
Additional Context: ${details.notes || ""}`;
        break;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPTS[type],
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      content,
      type,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    });
  } catch (e) {
    console.error("[ai-writer] Error:", e);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
