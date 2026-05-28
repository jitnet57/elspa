# 🔴 Track C: Customer Retention & NPS Optimization Framework
## Philippines Spa Industry Edition

**Target**: Existing spa/massage business customers  
**Goal**: Reduce churn from 40% to 18% within 3 months  
**Responsibility**: PM + Data Scientist

---

## 📊 Current Churn Crisis

### Baseline (May 2026)

```
Monthly Active Customers: 1,800 spa visitors
Average Customer Value: ₱8,000/month (4 visits @ ₱2,000 per visit)
Monthly Revenue: ₱14.4M

Customer Churn Rate: 40% monthly
   = 720 customers lost per month
   = ₱5.76M monthly revenue loss

Churn Breakdown:
├─ Economic hardship (72%): Customer can't afford services
├─ Experience dissatisfaction (15%): Bad service, long wait, unfriendly staff
├─ Competitor switch (13%): Another spa nearby is better

Current loss: ₱5.76M/month (40% of revenue)
   = Unsustainable. We're losing more money than we earn.
```

---

## 🎯 Track C Strategy: NPS-Based Segmentation + AI Intervention

### Phase 1: Data Collection (Week 1)

**Step 1: NPS Survey**
- Send SMS after each massage appointment
- "On scale 1-10: How likely to recommend us?"
- Get 10 reasons why (text feedback)
- Response rate target: 40%+ (offer discount for feedback)

**Sample Size**: 
- Week 1: 200-300 responses
- By Month 3: 10,000+ responses
- Enough data for AI to predict churn

**Output**: NPS score per customer + text feedback

---

### Phase 2: Segmentation (Week 2)

**NPS Segments**:

```
SEGMENT 1: DETRACTORS (NPS < 0)
├─ Count: ~360 customers (20% of base)
├─ Behavior: Already at risk, likely to churn
├─ Reason codes: Wait time (35%), staff rudeness (30%), cleanliness (20%), price (15%)
├─ Intervention: IMMEDIATE personal outreach
│  ├─ Call within 24 hours
│  ├─ Offer: "We're sorry. Here's ₱1,000 credit as apology"
│  ├─ Root cause: Ask what went wrong
│  ├─ Fix: Make promise ("We fixed this", manager follow-up)
│  └─ Win-back offer: "First massage free, come back this week"
├─ Expected outcome: Convert 40% back to promoters (144 customers retained)
└─ Value: ₱144K monthly savings (if they stay 3+ months)

SEGMENT 2: NEUTRALS (NPS 0-30)
├─ Count: ~450 customers (25% of base)
├─ Behavior: Satisfied but no loyalty
├─ Reason codes: Fine but nothing special (50%), hassle with booking (30%)
├─ Intervention: PERSONALIZED recommendations
│  ├─ Send monthly email: "Try this package based on your history"
│  ├─ Offer: Limited-time package (₱2,000 → ₱1,500, expires in 1 week)
│  ├─ Exclusive: Members-only perks (priority booking, 10% bonus credit)
│  └─ Loyalty program: "5 visits = 1 free, you're at 4 now"
├─ Expected outcome: Convert 35% to promoters (157 customers)
└─ Value: ₱157K monthly additional visits (upsell)

SEGMENT 3: PROMOTERS (NPS > 70)
├─ Count: ~540 customers (30% of base)
├─ Behavior: Loyal, likely repeat, refer friends
├─ Reason codes: Great therapist (60%), clean place (25%), good value (15%)
├─ Intervention: VIP LOYALTY PROGRAM
│  ├─ Recognition: Personal thank you from owner
│  ├─ Rewards: Double points on membership (usually 1 point per ₱100 spent, they get 2)
│  ├─ Access: Priority booking, skip queue, free upgrade to premium therapist
│  ├─ Events: VIP appreciation dinner/event quarterly
│  └─ Referral: "Bring a friend, both get ₱500 credit"
├─ Expected outcome: Increase visit frequency by 30% (customer goes from 4x to 5.2x monthly)
├─ Value: ₱162K monthly additional revenue (540 × 30% increase in visits)
└─ Retention rate: Already 90%, maintain at 95%+
```

---

### Phase 3: AI Churn Prediction (Week 2-3)

**Building ML Model**:

Input Features:
- Days since last visit (increases = churn risk)
- Visit frequency trend (declining = risk)
- Average spend per visit (decreasing = risk)
- Session cancellations (increasing = risk)
- Review sentiment (becoming negative = risk)
- Therapist switch (unusual = risk)

Output: Churn probability score (0-100%)

**Threshold Rules**:
- Score > 70%: HIGH RISK → Immediate intervention
- Score 40-70%: MEDIUM RISK → Personalized offer
- Score < 40%: LOW RISK → Standard loyalty program

**Training Data**:
- Use past 12 months of customer behavior
- Label: Customers who churned vs. retained
- Test accuracy: Target 85%+

**Expected Results**:
- Identify 80% of churners 2 weeks before they actually leave
- Enable proactive intervention (not reactive)

---

### Phase 4: Intervention Campaigns (Week 3-4)

**Campaign 1: High-Risk (Churn Score > 70%)**

Action: Cold call from manager
```
Manager: "Hi [Name]! Haven't seen you in 2 weeks. Is everything okay?"
Listen to reason → Acknowledge → Offer solution

If reason = price:
  Manager: "Let's set up a standing Thursday 2 PM slot. I'll give you ₱500/month discount."
  
If reason = specific therapist:
  Manager: "Let's get you back with [therapist name]. How about this Friday?"
  
If reason = wait time:
  Manager: "We're doing 30-min express massages now. Faster checkout. Can you try?"

Offer: ₱1,000 credit (free massage) if they book within 7 days
Callback: Manager calls 3 days later to confirm booking
```

Expected outcome: Convert 40% of high-risk customers = 180 retained

---

**Campaign 2: Medium-Risk (Churn Score 40-70%)**

Action: WhatsApp message + email
```
WhatsApp: "Hey [Name]! 🎉 We have a new Thai massage package (your favorite). 
          Just for you: ₱2,000→₱1,500 this week only. Book now? [Link]"

Email: 
  Subject: "Your favorite therapist has an opening"
  Body: "[Name], [Therapist] has cancelled/moved, but [New Therapist] trained by her. 
          Try a free trial Thursday? [Link to book]"

Add to loyalty program:
  - Automatic: Every visit earns points
  - 10 visits = 1 free massage
  - Show progress: "You're at 4/10 visits. 6 more until free massage!"
```

Expected outcome: Convert 35% → 315 customers retained/activated

---

**Campaign 3: Promoters (NPS > 70%)**

Action: Exclusive VIP perks + referral
```
SMS: "Thank you for being our #1 customer! 🌟 
      You've earned VIP status: Priority booking, free upgrade to premium.
      Plus: Refer a friend, both get ₱500 credit. [Share link]"

Email: "VIP Appreciation Night
        Date: [2nd Saturday of month]
        Time: 6-8 PM
        Location: [Spa lounge]
        Include: Light food, drinks, 20% off services that night
        RSVP: [Link]"

Quarterly: Personal call from owner
  "Thank you for being loyal. How can we improve? Coffee meeting?"
```

Expected outcome: 30% increase in visit frequency, 95% retention

---

## 📈 Expected Results (3-Month Timeline)

```
BASELINE (May 2026):
├─ Active customers: 1,800
├─ Churn rate: 40%
├─ Monthly revenue: ₱14.4M
└─ Monthly loss: ₱5.76M (40% churn damage)

MONTH 1 (Jun - After segmentation + first campaigns):
├─ Detractors winback: +144 customers
├─ Neutrals activated: +157 additional visits (upside)
├─ Promoters loyalty bonus: +162 additional visits
├─ Churn rate: 40% → 35% (due to early interventions)
├─ Monthly revenue: ₱14.4M + ₱319K (new visits) = ₱14.7M
├─ Monthly loss prevented: ₱720 × 5% = ₱360K (fewer churners)
└─ Net gain: ₱680K

MONTH 2 (Jul - AI model trained, predictions accurate):
├─ High-risk interventions: 180 saved
├─ Medium-risk activations: 315 boosted
├─ Promoters loyalty growth: 20% frequency increase
├─ Churn rate: 35% → 25% (model now predicting accurately)
├─ Monthly revenue: ₱14.4M + ₱952K = ₱15.35M
├─ Loss prevented: ₱1.44M (600 fewer churners)
└─ Net gain: ₱2.4M (vs. baseline)

MONTH 3 (Aug - Campaigns mature, network effects):
├─ Detractors now promoters: 200+ converted
├─ Word-of-mouth referrals: +100 new customers (promoters told friends)
├─ Promoters loyalty: 30% frequency increase = +162 additional visits
├─ Churn rate: 25% → 18% (TARGET ACHIEVED ✅)
├─ Active customers: 1,800 → 2,050 (net growth)
├─ Monthly revenue: ₱14.4M + ₱1.64M = ₱16.04M
├─ Loss prevented: ₱1.76M (352 fewer churners)
└─ Net gain: ₱3.5M (vs. baseline)

3-MONTH CUMULATIVE:
├─ Total revenue gain: ₱4.6M additional
├─ Customers retained (not lost): 800 people over 3 months
├─ Direct Track C cost: ₱500K (AI dev + campaigns)
└─ ROI: 920% (₱4.6M gain ÷ ₱500K investment)
```

---

## 🛠️ Implementation Checklist

### Week 1: NPS Data Collection
- [ ] Design NPS survey (SMS template)
- [ ] Deploy survey system (Twilio + database)
- [ ] Send 500+ surveys
- [ ] Collect 200+ responses
- [ ] Segment customers (Detractors/Neutrals/Promoters)

### Week 2-3: AI Model Development
- [ ] Gather 12 months historical data
- [ ] Label customers: Churned vs. Retained
- [ ] Build churn prediction model (Python/TensorFlow)
- [ ] Test accuracy (target 85%+)
- [ ] Deploy to production

### Week 3-4: Campaign Execution
- [ ] High-risk cold call campaign (180 customers)
- [ ] Medium-risk WhatsApp/email (315 customers)
- [ ] Promoters VIP program launch
- [ ] Track conversions, measure ROI

---

## 💡 Key Learnings from Data

**Insight 1**: Price sensitivity is high (72% churn), but...
- Only 15% truly cannot afford → Problem is opportunity cost ("Why spend ₱2K on massage when I need rice money?")
- Solution: Add budget options (express 30-min massage ₱1,200 vs. luxury 90-min ₱4,000)

**Insight 2**: Experience issues (15% churn) are fixable
- Wait time: Add express lane
- Staff rudeness: Train/replace one therapist
- Cleanliness: Daily audit checklist
- Quick fixes yield 40% of churners back

**Insight 3**: Promoters are underutilized
- 30% of base, but only refer 2-3 people annually
- With VIP program + referral incentive: Can drive 100+ new customers/month (organic growth)

---

## 🎯 Success Metrics

| Metric | Baseline | Month 1 | Month 3 | Target |
|--------|----------|---------|---------|--------|
| **Churn Rate** | 40% | 35% | 18% | ✅ |
| **Active Customers** | 1,800 | 1,830 | 2,050 | ✅ |
| **Monthly Revenue** | ₱14.4M | ₱14.7M | ₱16.04M | ✅ |
| **NPS Score** | 5 | 25 | 55 | ✅ |
| **LTV** | ₱96K | ₱108K | ₱126K | ✅ |

---

**Track C Plan**: May 29, 2026  
**Version**: 1.0 (Philippines Edition)  
**Owner**: Track C PM + Data Scientist
