'use client'

const plans = [
  {
    name: 'Free',
    price: '£0',
    description: 'Get started and compete with friends.',
    features: [
      'Access to 1 league',
      'Limited friend invitations',
      'Delayed match results',
      'Ad-supported',
    ],
    featured: false,
  },
  {
    name: 'Gold',
    price: 'Coming soon',
    description: 'More leagues and ways to personalise your profile.',
    features: [
      'Access to all leagues',
      'Up to 200 friends',
      'Quick match results',
      'Choose a personalised avatar',
      'Choose 1 badge',
      'Ad-free',
    ],
    featured: false,
  },
  {
    name: 'Star',
    price: 'Coming soon',
    description: 'The complete Scorecast XI experience.',
    features: [
      'Access to all leagues',
      'Up to 200 friends',
      'Combine leagues in the same pool',
      'Personalised badges',
      'Weekly achievements',
      'Ad-free',
    ],
    featured: true,
  },
]


export default function PlansPage() {
  return (
    <main className="plans-page">
      <div className="plans-content">
        <div className="plans-heading">
          <p className="eyebrow">SCORECAST XI MEMBERSHIPS</p>
          <h1>Choose your plan</h1>
          <p className="intro">
            Make your predictions, challenge your friends, and choose the
            membership that suits how you play.
          </p>
        </div>

        <section className="plans-grid" aria-label="Membership plans">
          {plans.map((plan) => (
            <article
              className={`plan-card${plan.featured ? ' featured' : ''}`}
              key={plan.name}
            >
              {plan.featured && <span className="popular-label">POPULAR</span>}

              <h2>{plan.name}</h2>
              <p className="plan-description">{plan.description}</p>

              <p className="price">{plan.price}</p>
              {plan.price === '£0' ? (
                <p className="billing-note">Free, always</p>
              ) : (
                <p className="billing-note">
                  Subscription pricing to be announced
                </p>
              )}

              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className="plan-button"
                type="button"
                disabled
                aria-label={`${plan.name} membership — subscriptions not available yet`}
              >
                {plan.name === 'Free' ? 'Current free option' : 'Coming soon'}
              </button>
            </article>
          ))}
        </section>

        <p className="plans-footnote">
          Membership subscriptions are not available yet. No payment will be
          taken from this page.
        </p>
      </div>

      <style jsx>{`
        .plans-page {
          min-height: 100vh;
          padding: 48px 24px 64px;
        }

        .plans-content {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .plans-heading {
          max-width: 700px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #60a5fa;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .plans-heading h1 {
          margin: 0 0 12px;
        }

        .intro {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.7;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 18px;
        }

        .plan-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 24px 20px;
          border: 1px solid #334155;
          border-radius: 18px;
          background: linear-gradient(145deg, #1e293b, #111827);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
        }

        .plan-card.featured {
          border-color: #fbbf24;
          box-shadow: 0 0 24px rgba(251, 191, 36, 0.13);
        }

        .popular-label {
          position: absolute;
          top: -12px;
          right: 18px;
          padding: 5px 10px;
          border-radius: 999px;
          background: #f59e0b;
          color: #111827;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .plan-card h2 {
          margin: 0 0 8px;
        }

        .plan-description {
          min-height: 48px;
          margin: 0;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
        }

        .price {
          margin: 22px 0 0;
          color: #4ade80;
          font-size: 24px;
          font-weight: 900;
        }

        .billing-note {
          min-height: 34px;
          margin: 4px 0 18px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.5;
        }

        .plan-card ul {
          display: grid;
          gap: 12px;
          margin: 0 0 24px;
          padding: 0;
          list-style: none;
        }

        .plan-card li {
          display: flex;
          gap: 9px;
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.5;
        }

        .plan-card li span {
          flex: 0 0 auto;
          color: #4ade80;
          font-weight: 900;
        }

        .plan-button {
          width: 100%;
          margin-top: auto;
          opacity: 0.65;
          cursor: not-allowed;
        }

        .plans-footnote {
          margin: 24px 0 0;
          color: #94a3b8;
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 950px) {
          .plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 16px;
          }
        }

        @media (max-width: 560px) {
          .plans-page {
            padding: 32px 16px 48px;
          }

          .plans-grid {
            grid-template-columns: 1fr;
            gap: 22px;
          }

          .plans-heading {
            margin-bottom: 32px;
          }
        }
      `}</style>
    </main>
  )
}
