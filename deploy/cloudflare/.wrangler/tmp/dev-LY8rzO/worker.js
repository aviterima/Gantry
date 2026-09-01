var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
import appHtml from "./33734047f4c772ba2b81265f1c59943506e23205-index.html";
import loginHtml from "./62b75ec30b19504b2c9887290cb458fb65c74bb0-login.html";

// src/seed.json
var seed_default = {
  candidates: [
    {
      slug: "permit-pilot",
      name: "PermitPilot",
      one_liner: "AI permit-expediting service for small general contractors: we prepare, file, and chase municipal permits so the GC never sits in a queue.",
      lane: "vertical",
      delivery_mode: "service_first",
      persona: "Owner/office manager at a 5-30 person GC doing residential and light commercial work.",
      channel: "Outbound email to licensed GCs (public license rolls) + construction-smb cluster list.",
      cluster: "construction-smb",
      cluster_exception: "",
      operator: "jordan-reyes",
      operator_exception: "",
      case_against: "Municipal heterogeneity may resist automation: every jurisdiction is a special case, and margins could collapse into manual labor that never productizes. Expediting relationships with clerks may matter more than filing quality.",
      kill_criterion: "Kill if >50% of engagement hours are still manual after 10 filings across 3 jurisdictions, or turnaround beats the GC's own baseline by <20%.",
      scorecard: {
        dimensions: {
          pain_intensity: {
            score: 5,
            evidence: "Permit delays stall jobs and crews; GCs quote 2-6 week losses per project."
          },
          buyer_reachability: {
            score: 5,
            evidence: "Public contractor license registries; 40k+ emails harvestable; cluster list exists."
          },
          time_to_signal: {
            score: 4,
            evidence: "Service-first: paid expediting engagements can close in 2-3 weeks."
          },
          budget_existence: {
            score: 5,
            evidence: "GCs already pay human expediters $500-2k per permit."
          },
          incumbent_exposure: {
            score: 4,
            evidence: "No horizontal incumbent owns municipal permitting workflows."
          },
          ai_leverage: {
            score: 4,
            evidence: "AI drafts applications, tracks jurisdiction rules, chases status \u2014 the expert work."
          },
          moat_trajectory: {
            score: 4,
            evidence: "Jurisdiction rulebook + outcome data compounds per filing."
          },
          founder_market_access: {
            score: 4,
            evidence: "Jordan (bench) sold into SMB GCs for 6 years."
          },
          expansion_path: {
            score: 4,
            evidence: "Inspections scheduling, lien waivers, licensing renewals to the same buyer."
          },
          portfolio_synergy: {
            score: 5,
            evidence: "Anchor launch for the construction-smb cluster."
          }
        }
      },
      thresholds: {
        g1_reachability: "\u22653% qualified reply/booking rate on 1,500 outbound contacts",
        g2_engagement: "\u22653 paid expediting engagements delivered and accepted",
        g3_retention: "\u22654 paying GCs, \u22651 from pure outbound, \u22651 repeat filing",
        budget_cap_usd: 2e3,
        time_cap_weeks: 3
      },
      memo: "# G0 Memo \u2014 PermitPilot\n\n**Thesis:** AI permit-expediting service for small general contractors: we prepare, file, and chase municipal permits so the GC never sits in a queue.\n\n- **Lane:** Lane two \u2014 vertical, AI as domain expert (FRAMEWORK \xA72.3)\n- **Delivery mode:** Service-first (sell the work before building the product)\n- **Buyer persona:** Owner/office manager at a 5-30 person GC doing residential and light commercial work.\n- **Primary channel:** Outbound email to licensed GCs (public license rolls) + construction-smb cluster list.\n- **Cluster:** construction-smb\n- **Operator match:** jordan-reyes\n\n## Scorecard\n\n| Dimension | Score | Evidence |\n|---|---|---|\n| pain_intensity | 5 | Permit delays stall jobs and crews; GCs quote 2-6 week losses per project. |\n| buyer_reachability *(gating)* | 5 | Public contractor license registries; 40k+ emails harvestable; cluster list exists. |\n| time_to_signal *(gating)* | 4 | Service-first: paid expediting engagements can close in 2-3 weeks. |\n| budget_existence | 5 | GCs already pay human expediters $500-2k per permit. |\n| incumbent_exposure | 4 | No horizontal incumbent owns municipal permitting workflows. |\n| ai_leverage | 4 | AI drafts applications, tracks jurisdiction rules, chases status \u2014 the expert work. |\n| moat_trajectory | 4 | Jurisdiction rulebook + outcome data compounds per filing. |\n| founder_market_access | 4 | Jordan (bench) sold into SMB GCs for 6 years. |\n| expansion_path | 4 | Inspections scheduling, lien waivers, licensing renewals to the same buyer. |\n| portfolio_synergy | 5 | Anchor launch for the construction-smb cluster. |\n\n**Total:** 44 / 50 \u2014 band: **STRONG** (Rare. Launch early in the next tournament.)\n\n## Case against (required at G0)\n\nMunicipal heterogeneity may resist automation: every jurisdiction is a special case, and margins could collapse into manual labor that never productizes. Expediting relationships with clerks may matter more than filing quality.\n\n**Kill criterion:** Kill if >50% of engagement hours are still manual after 10 filings across 3 jurisdictions, or turnaround beats the GC's own baseline by <20%.\n\n## Pre-committed thresholds (locked at G0)\n\n- **G1 reachability:** \u22653% qualified reply/booking rate on 1,500 outbound contacts\n- **G2 engagement:** \u22653 paid expediting engagements delivered and accepted\n- **G3 retention:** \u22654 paying GCs, \u22651 from pure outbound, \u22651 repeat filing\n- **Caps:** $2,000 / 3 weeks\n\n## Decision\n\n_Pending G0 review._\n",
      decision: null,
      created_at: "2026-09-01T15:51:21.410800Z"
    },
    {
      slug: "complicore",
      name: "CompliCore",
      one_liner: "AI QA/compliance expert for specialty food manufacturers: FSMA plans, audit prep, and supplier docs delivered as a service, then productized.",
      lane: "vertical",
      delivery_mode: "service_first",
      persona: "QA manager or owner at a 10-200 person specialty food producer / co-packer.",
      channel: "Vox social in food-manufacturing communities + outbound to FDA registration lists.",
      cluster: "specialty-food",
      cluster_exception: "",
      operator: "priya-natarajan",
      operator_exception: "",
      case_against: "Audit-prep buying is episodic; retainers may not stick between audit cycles, leaving a services business whose software margins never materialize. Liability exposure if a plan we drafted fails an audit.",
      kill_criterion: "Kill if fewer than 1 of the first 5 customers converts to a monthly compliance retainer within 60 days of audit completion.",
      scorecard: {
        dimensions: {
          pain_intensity: {
            score: 5,
            evidence: "Failed audits stop shipments; SQF/FSMA deadlines are forcing events."
          },
          buyer_reachability: {
            score: 4,
            evidence: "FDA facility registrations are public; active communities identified."
          },
          time_to_signal: {
            score: 4,
            evidence: "Audit-prep engagements are bought under deadline pressure."
          },
          budget_existence: {
            score: 5,
            evidence: "They already pay consultants $10-30k per audit cycle."
          },
          incumbent_exposure: {
            score: 5,
            evidence: "Incumbent QMS vendors target enterprise; SMB tier is greenfield."
          },
          ai_leverage: {
            score: 5,
            evidence: "The product *is* the domain expert: plan drafting, gap analysis, doc chasing."
          },
          moat_trajectory: {
            score: 4,
            evidence: "Corpus of audit findings and supplier docs compounds."
          },
          founder_market_access: {
            score: 5,
            evidence: "Priya (bench) ran QA at a co-packer."
          },
          expansion_path: {
            score: 4,
            evidence: "Supplier verification, label compliance, recall drills."
          },
          portfolio_synergy: {
            score: 4,
            evidence: "Anchor launch for the specialty-food cluster."
          }
        }
      },
      thresholds: {
        g1_reachability: "\u22652.5% qualified inquiry rate across outbound + community posts",
        g2_engagement: "\u22652 paid audit-prep engagements delivered",
        g3_retention: "\u22653 paying customers, \u22651 on a monthly compliance retainer",
        budget_cap_usd: 2e3,
        time_cap_weeks: 3
      },
      memo: "# G0 Memo \u2014 CompliCore\n\n**Thesis:** AI QA/compliance expert for specialty food manufacturers: FSMA plans, audit prep, and supplier docs delivered as a service, then productized.\n\n- **Lane:** Lane two \u2014 vertical, AI as domain expert (FRAMEWORK \xA72.3)\n- **Delivery mode:** Service-first (sell the work before building the product)\n- **Buyer persona:** QA manager or owner at a 10-200 person specialty food producer / co-packer.\n- **Primary channel:** Vox social in food-manufacturing communities + outbound to FDA registration lists.\n- **Cluster:** specialty-food\n- **Operator match:** priya-natarajan\n\n## Scorecard\n\n| Dimension | Score | Evidence |\n|---|---|---|\n| pain_intensity | 5 | Failed audits stop shipments; SQF/FSMA deadlines are forcing events. |\n| buyer_reachability *(gating)* | 4 | FDA facility registrations are public; active communities identified. |\n| time_to_signal *(gating)* | 4 | Audit-prep engagements are bought under deadline pressure. |\n| budget_existence | 5 | They already pay consultants $10-30k per audit cycle. |\n| incumbent_exposure | 5 | Incumbent QMS vendors target enterprise; SMB tier is greenfield. |\n| ai_leverage | 5 | The product *is* the domain expert: plan drafting, gap analysis, doc chasing. |\n| moat_trajectory | 4 | Corpus of audit findings and supplier docs compounds. |\n| founder_market_access | 5 | Priya (bench) ran QA at a co-packer. |\n| expansion_path | 4 | Supplier verification, label compliance, recall drills. |\n| portfolio_synergy | 4 | Anchor launch for the specialty-food cluster. |\n\n**Total:** 45 / 50 \u2014 band: **STRONG** (Rare. Launch early in the next tournament.)\n\n## Case against (required at G0)\n\nAudit-prep buying is episodic; retainers may not stick between audit cycles, leaving a services business whose software margins never materialize. Liability exposure if a plan we drafted fails an audit.\n\n**Kill criterion:** Kill if fewer than 1 of the first 5 customers converts to a monthly compliance retainer within 60 days of audit completion.\n\n## Pre-committed thresholds (locked at G0)\n\n- **G1 reachability:** \u22652.5% qualified inquiry rate across outbound + community posts\n- **G2 engagement:** \u22652 paid audit-prep engagements delivered\n- **G3 retention:** \u22653 paying customers, \u22651 on a monthly compliance retainer\n- **Caps:** $2,000 / 3 weeks\n\n## Decision\n\n_Pending G0 review._\n",
      decision: null,
      created_at: "2026-09-01T15:51:21.410941Z"
    },
    {
      slug: "ledgerlite",
      name: "LedgerLite",
      one_liner: "De-configured, AI-native fund administration for micro-VCs and syndicates priced at 1/10th of the legacy fund-admin stack.",
      lane: "substitution",
      delivery_mode: "self_serve",
      persona: "GP or ops lead at a sub-$50M fund or active syndicate, no back office.",
      channel: "Founder/VC social (Vox), emerging-manager communities, targeted outbound.",
      cluster: null,
      cluster_exception: "Substitution-lane launch; buyer pool (emerging managers) doesn't map to a current cluster. Revisit if a fintech cluster forms.",
      operator: "sam-okafor",
      operator_exception: "",
      case_against: "Fund admin is a trust purchase: emerging managers may pay legacy premiums precisely because LPs recognize the name, and 'cheap + AI' could read as audit risk rather than efficiency.",
      kill_criterion: "Kill if >=3 qualified GPs cite LP acceptance as the blocker and none converts after we provide an LP-facing assurance letter.",
      scorecard: {
        dimensions: {
          pain_intensity: {
            score: 4,
            evidence: "Emerging managers defer admin until an LP or audit forces it."
          },
          buyer_reachability: {
            score: 4,
            evidence: "Form D filings are public; emerging-manager communities are dense."
          },
          time_to_signal: {
            score: 3,
            evidence: "Self-serve signups fast; paid conversion tied to quarter-end cycles."
          },
          budget_existence: {
            score: 5,
            evidence: "They already pay $15-40k/yr to legacy fund admins."
          },
          incumbent_exposure: {
            score: 3,
            evidence: "Legacy admins could ship a cheap tier, but their cost base resists it."
          },
          ai_leverage: {
            score: 4,
            evidence: "AI handles capital-call docs, K-1 prep support, LP reporting."
          },
          moat_trajectory: {
            score: 3,
            evidence: "Workflow embedding and multi-year records; weaker data moat."
          },
          founder_market_access: {
            score: 3,
            evidence: "Sam is a generalist; no deep fund-admin background on bench."
          },
          expansion_path: {
            score: 4,
            evidence: "Tax docs, LP portal, compliance calendar."
          },
          portfolio_synergy: {
            score: 3,
            evidence: "Reuses launch stack; no cluster sharing."
          }
        }
      },
      thresholds: {
        g1_reachability: "\u22653% qualified signup rate on 1,000 targeted contacts",
        g2_engagement: "\u226535% of signups complete fund setup and issue one capital call",
        g3_retention: "\u22654 paying funds, \u22651 from pure outbound, \u22651 renewal into a second quarter",
        budget_cap_usd: 2e3,
        time_cap_weeks: 3
      },
      memo: "# G0 Memo \u2014 LedgerLite\n\n**Thesis:** De-configured, AI-native fund administration for micro-VCs and syndicates priced at 1/10th of the legacy fund-admin stack.\n\n- **Lane:** Lane one \u2014 product substitution (FRAMEWORK \xA72.2)\n- **Delivery mode:** Self-serve product\n- **Buyer persona:** GP or ops lead at a sub-$50M fund or active syndicate, no back office.\n- **Primary channel:** Founder/VC social (Vox), emerging-manager communities, targeted outbound.\n- **Cluster:** _exception: Substitution-lane launch; buyer pool (emerging managers) doesn't map to a current cluster. Revisit if a fintech cluster forms._\n- **Operator match:** sam-okafor\n\n## Scorecard\n\n| Dimension | Score | Evidence |\n|---|---|---|\n| pain_intensity | 4 | Emerging managers defer admin until an LP or audit forces it. |\n| buyer_reachability *(gating)* | 4 | Form D filings are public; emerging-manager communities are dense. |\n| time_to_signal *(gating)* | 3 | Self-serve signups fast; paid conversion tied to quarter-end cycles. |\n| budget_existence | 5 | They already pay $15-40k/yr to legacy fund admins. |\n| incumbent_exposure | 3 | Legacy admins could ship a cheap tier, but their cost base resists it. |\n| ai_leverage | 4 | AI handles capital-call docs, K-1 prep support, LP reporting. |\n| moat_trajectory | 3 | Workflow embedding and multi-year records; weaker data moat. |\n| founder_market_access | 3 | Sam is a generalist; no deep fund-admin background on bench. |\n| expansion_path | 4 | Tax docs, LP portal, compliance calendar. |\n| portfolio_synergy | 3 | Reuses launch stack; no cluster sharing. |\n\n**Total:** 36 / 50 \u2014 band: **CREDIBLE** (Launchable \u2014 queue it.)\n\n## Case against (required at G0)\n\nFund admin is a trust purchase: emerging managers may pay legacy premiums precisely because LPs recognize the name, and 'cheap + AI' could read as audit risk rather than efficiency.\n\n**Kill criterion:** Kill if >=3 qualified GPs cite LP acceptance as the blocker and none converts after we provide an LP-facing assurance letter.\n\n## Pre-committed thresholds (locked at G0)\n\n- **G1 reachability:** \u22653% qualified signup rate on 1,000 targeted contacts\n- **G2 engagement:** \u226535% of signups complete fund setup and issue one capital call\n- **G3 retention:** \u22654 paying funds, \u22651 from pure outbound, \u22651 renewal into a second quarter\n- **Caps:** $2,000 / 3 weeks\n\n## Decision\n\n_Pending G0 review._\n",
      decision: null,
      created_at: "2026-09-01T15:51:21.410969Z"
    },
    {
      slug: "harbordesk",
      name: "HarborDesk",
      one_liner: "Ops platform for port agency and vessel husbandry workflows.",
      lane: "vertical",
      delivery_mode: "self_serve",
      persona: "Port agents coordinating vessel calls at mid-size ports.",
      channel: "Unclear \u2014 no automatable channel identified; relationship-driven industry.",
      cluster: null,
      cluster_exception: "No cluster fit; maritime is a one-off.",
      operator: null,
      operator_exception: "No bench operator with maritime background.",
      case_against: "",
      kill_criterion: "",
      scorecard: {
        dimensions: {
          pain_intensity: {
            score: 4,
            evidence: "Real coordination pain across agents, terminals, and masters."
          },
          buyer_reachability: {
            score: 2,
            evidence: "Buyers are unreachable via automatable channels \u2014 port agency is relationship-driven; no public roll, no dense community found."
          },
          time_to_signal: {
            score: 2,
            evidence: "Procurement runs through long relationship cycles; no fast paid commitment plausible."
          },
          budget_existence: {
            score: 3,
            evidence: "Budgets exist but sit inside agency fees."
          },
          incumbent_exposure: {
            score: 4,
            evidence: "No dominant horizontal incumbent."
          },
          ai_leverage: {
            score: 3,
            evidence: "Some document automation; core value is coordination."
          },
          moat_trajectory: {
            score: 3,
            evidence: "Port-pair operational data could compound."
          },
          founder_market_access: {
            score: 2,
            evidence: "No bench operator; domain trust is earned over years."
          },
          expansion_path: {
            score: 3,
            evidence: "Customs docs, disbursement accounts."
          },
          portfolio_synergy: {
            score: 2,
            evidence: "Nothing shared with current clusters."
          }
        }
      },
      thresholds: {
        g1_reachability: "n/a \u2014 fails gating",
        g2_engagement: "n/a",
        g3_retention: "n/a",
        budget_cap_usd: 2e3,
        time_cap_weeks: 3
      },
      memo: "# G0 Memo \u2014 HarborDesk\n\n**Thesis:** Ops platform for port agency and vessel husbandry workflows.\n\n- **Lane:** Lane two \u2014 vertical, AI as domain expert (FRAMEWORK \xA72.3)\n- **Delivery mode:** Self-serve product\n- **Buyer persona:** Port agents coordinating vessel calls at mid-size ports.\n- **Primary channel:** Unclear \u2014 no automatable channel identified; relationship-driven industry.\n- **Cluster:** _exception: No cluster fit; maritime is a one-off._\n- **Operator match:** _exception: No bench operator with maritime background._\n\n## Scorecard\n\n| Dimension | Score | Evidence |\n|---|---|---|\n| pain_intensity | 4 | Real coordination pain across agents, terminals, and masters. |\n| buyer_reachability *(gating)* | 2 | Buyers are unreachable via automatable channels \u2014 port agency is relationship-driven; no public roll, no dense community found. |\n| time_to_signal *(gating)* | 2 | Procurement runs through long relationship cycles; no fast paid commitment plausible. |\n| budget_existence | 3 | Budgets exist but sit inside agency fees. |\n| incumbent_exposure | 4 | No dominant horizontal incumbent. |\n| ai_leverage | 3 | Some document automation; core value is coordination. |\n| moat_trajectory | 3 | Port-pair operational data could compound. |\n| founder_market_access | 2 | No bench operator; domain trust is earned over years. |\n| expansion_path | 3 | Customs docs, disbursement accounts. |\n| portfolio_synergy | 2 | Nothing shared with current clusters. |\n\n**Total:** 28 / 50 \u2014 **UNTESTABLE** (gating dimension failed or unscored)\n\n## Case against (required at G0)\n\n_NOT WRITTEN \u2014 approval is blocked until the strongest case against is argued._\n\n**Kill criterion:** _NOT SET \u2014 approval is blocked until a falsifiable kill criterion exists._\n\n## Pre-committed thresholds (locked at G0)\n\n- **G1 reachability:** n/a \u2014 fails gating\n- **G2 engagement:** n/a\n- **G3 retention:** n/a\n- **Caps:** $2,000 / 3 weeks\n\n## Decision\n\n_Pending G0 review._\n",
      decision: null,
      created_at: "2026-09-01T15:51:21.411434Z"
    },
    {
      slug: "crewcast",
      name: "CrewCast",
      one_liner: "AI dispatcher for specialty subcontractors: crew scheduling that re-plans around weather, no-shows, and inspection slips.",
      lane: "vertical",
      delivery_mode: "self_serve",
      persona: "Ops lead at a 10-50 person specialty sub (electrical, roofing, concrete).",
      channel: "Construction-smb cluster list (sequential reuse after PermitPilot) + Vox.",
      cluster: "construction-smb",
      cluster_exception: "",
      operator: "jordan-reyes",
      operator_exception: "",
      case_against: "",
      kill_criterion: "",
      scorecard: {
        dimensions: {}
      },
      thresholds: {
        g1_reachability: "",
        g2_engagement: "",
        g3_retention: "",
        budget_cap_usd: 2e3,
        time_cap_weeks: 3
      },
      memo: "# G0 Memo \u2014 CrewCast\n\n**Thesis:** AI dispatcher for specialty subcontractors: crew scheduling that re-plans around weather, no-shows, and inspection slips.\n\n- **Lane:** Lane two \u2014 vertical, AI as domain expert (FRAMEWORK \xA72.3)\n- **Delivery mode:** Self-serve product\n- **Buyer persona:** Ops lead at a 10-50 person specialty sub (electrical, roofing, concrete).\n- **Primary channel:** Construction-smb cluster list (sequential reuse after PermitPilot) + Vox.\n- **Cluster:** construction-smb\n- **Operator match:** jordan-reyes\n\n## Scorecard\n\n| Dimension | Score | Evidence |\n|---|---|---|\n| pain_intensity | \u2014 | _unscored_ |\n| buyer_reachability *(gating)* | \u2014 | _unscored_ |\n| time_to_signal *(gating)* | \u2014 | _unscored_ |\n| budget_existence | \u2014 | _unscored_ |\n| incumbent_exposure | \u2014 | _unscored_ |\n| ai_leverage | \u2014 | _unscored_ |\n| moat_trajectory | \u2014 | _unscored_ |\n| founder_market_access | \u2014 | _unscored_ |\n| expansion_path | \u2014 | _unscored_ |\n| portfolio_synergy | \u2014 | _unscored_ |\n\n**Total:** 0 / 50 \u2014 **UNTESTABLE** (gating dimension failed or unscored)\n\n## Case against (required at G0)\n\n_NOT WRITTEN \u2014 approval is blocked until the strongest case against is argued._\n\n**Kill criterion:** _NOT SET \u2014 approval is blocked until a falsifiable kill criterion exists._\n\n## Pre-committed thresholds (locked at G0)\n\n- **G1 reachability:** _not set_\n- **G2 engagement:** _not set_\n- **G3 retention:** _not set_\n- **Caps:** $2,000 / 3 weeks\n\n## Decision\n\n_Pending G0 review._\n",
      decision: null,
      created_at: "2026-09-01T15:51:21.411442Z"
    },
    {
      slug: "packproof",
      name: "PackProof",
      one_liner: "AI label and packaging compliance checker for specialty food brands.",
      lane: "vertical",
      delivery_mode: "self_serve",
      persona: "Founder or brand manager at a specialty food brand shipping retail SKUs.",
      channel: "Specialty-food cluster list (sequential reuse after CompliCore).",
      cluster: "specialty-food",
      cluster_exception: "",
      operator: "priya-natarajan",
      operator_exception: "",
      case_against: "Single-feature product: label checks may be a one-off purchase rather than a workflow, capping LTV below CAC even with cluster list reuse.",
      kill_criterion: "Kill if the repeat-check rate is <20% within 60 days of the first paid check.",
      scorecard: {
        dimensions: {
          pain_intensity: {
            score: 4,
            evidence: "Label errors trigger recalls and retailer rejections."
          },
          buyer_reachability: {
            score: 5,
            evidence: "Same cluster audience as CompliCore; list reuse is free."
          },
          time_to_signal: {
            score: 4,
            evidence: "Single-SKU check is an impulse-priced first purchase."
          },
          budget_existence: {
            score: 4,
            evidence: "Currently paid to labeling consultants per SKU."
          },
          incumbent_exposure: {
            score: 4,
            evidence: "Enterprise labeling suites ignore small brands."
          },
          ai_leverage: {
            score: 5,
            evidence: "Regulation-aware review is the whole product."
          },
          moat_trajectory: {
            score: 3,
            evidence: "Ruling corpus compounds; single-feature risk."
          },
          founder_market_access: {
            score: 5,
            evidence: "Priya covers the domain."
          },
          expansion_path: {
            score: 4,
            evidence: "Nutrition panels, claims review, retailer spec packs."
          },
          portfolio_synergy: {
            score: 5,
            evidence: "Second launch into specialty-food; compounds the cluster."
          }
        }
      },
      thresholds: {
        g1_reachability: "\u22654% qualified capture on cluster list + 1,000 new contacts",
        g2_engagement: "\u226530% of signups run a paid single-SKU check",
        g3_retention: "\u22655 paying brands, \u22651 from pure outbound, \u22651 multi-SKU repeat",
        budget_cap_usd: 1500,
        time_cap_weeks: 3
      },
      memo: "# G0 Memo \u2014 PackProof\n\n**Thesis:** AI label and packaging compliance checker for specialty food brands.\n\n- **Lane:** Lane two \u2014 vertical, AI as domain expert (FRAMEWORK \xA72.3)\n- **Delivery mode:** Self-serve product\n- **Buyer persona:** Founder or brand manager at a specialty food brand shipping retail SKUs.\n- **Primary channel:** Specialty-food cluster list (sequential reuse after CompliCore).\n- **Cluster:** specialty-food\n- **Operator match:** priya-natarajan\n\n## Scorecard\n\n| Dimension | Score | Evidence |\n|---|---|---|\n| pain_intensity | 4 | Label errors trigger recalls and retailer rejections. |\n| buyer_reachability *(gating)* | 5 | Same cluster audience as CompliCore; list reuse is free. |\n| time_to_signal *(gating)* | 4 | Single-SKU check is an impulse-priced first purchase. |\n| budget_existence | 4 | Currently paid to labeling consultants per SKU. |\n| incumbent_exposure | 4 | Enterprise labeling suites ignore small brands. |\n| ai_leverage | 5 | Regulation-aware review is the whole product. |\n| moat_trajectory | 3 | Ruling corpus compounds; single-feature risk. |\n| founder_market_access | 5 | Priya covers the domain. |\n| expansion_path | 4 | Nutrition panels, claims review, retailer spec packs. |\n| portfolio_synergy | 5 | Second launch into specialty-food; compounds the cluster. |\n\n**Total:** 43 / 50 \u2014 band: **STRONG** (Rare. Launch early in the next tournament.)\n\n## Case against (required at G0)\n\nSingle-feature product: label checks may be a one-off purchase rather than a workflow, capping LTV below CAC even with cluster list reuse.\n\n**Kill criterion:** Kill if the repeat-check rate is <20% within 60 days of the first paid check.\n\n## Pre-committed thresholds (locked at G0)\n\n- **G1 reachability:** \u22654% qualified capture on cluster list + 1,000 new contacts\n- **G2 engagement:** \u226530% of signups run a paid single-SKU check\n- **G3 retention:** \u22655 paying brands, \u22651 from pure outbound, \u22651 multi-SKU repeat\n- **Caps:** $1,500 / 3 weeks\n\n## Decision\n\n**APPROVED** by studio-review \u2014 Approved as the second specialty-food launch; staggered 3 weeks behind CompliCore per cluster rules.\n",
      decision: {
        approved: true,
        decided_by: "studio-review",
        notes: "Approved as the second specialty-food launch; staggered 3 weeks behind CompliCore per cluster rules.",
        decided_at: "2026-09-01T15:51:21.411874Z"
      },
      created_at: "2026-09-01T15:51:21.411880Z"
    }
  ],
  clusters: [
    {
      slug: "construction-smb",
      name: "SMB Construction & Trades",
      description: "Small GCs, specialty subs, and trade contractors: 5-50 seats, run on spreadsheets, phone calls, and one hated legacy vendor.",
      watering_holes: [
        "r/Construction",
        "AGC chapters",
        "Procore-adjacent LinkedIn groups"
      ]
    },
    {
      slug: "specialty-food",
      name: "Specialty Food Manufacturers",
      description: "Co-packers and specialty producers, 10-200 employees, drowning in FDA/FSMA compliance paperwork handled by one overloaded QA manager.",
      watering_holes: [
        "IFT communities",
        "r/FoodManufacturing",
        "Specialty Food Association"
      ]
    }
  ],
  operators: [
    {
      slug: "jordan-reyes",
      name: "Jordan Reyes",
      domain_profile: "Ex-PM at a construction-tech vendor; 6 years selling into SMB GCs.",
      load: 1
    },
    {
      slug: "priya-natarajan",
      name: "Priya Natarajan",
      domain_profile: "Former QA director at a co-packer; FSMA/HACCP domain depth.",
      load: 1
    },
    {
      slug: "sam-okafor",
      name: "Sam Okafor",
      domain_profile: "Two-time SMB SaaS founder; generalist bench for substitution-lane launches.",
      load: 0
    }
  ],
  allowed_emails: [
    "aviteri@neubloc.com"
  ]
};

// src/worker.js
var DIMS = [
  "pain_intensity",
  "buyer_reachability",
  "time_to_signal",
  "budget_existence",
  "incumbent_exposure",
  "ai_leverage",
  "moat_trajectory",
  "founder_market_access",
  "expansion_path",
  "portfolio_synergy"
];
var GATING = ["buyer_reachability", "time_to_signal"];
var BANDS = [
  [43, "strong", "Rare. Launch early in the next tournament."],
  [35, "credible", "Launchable \u2014 queue it."],
  [28, "conditional", "Fix the named weakness first."],
  [20, "weak", "Park it; revisit only with new evidence."],
  [0, "not_this_one", "No."]
];
var dims = /* @__PURE__ */ __name((c) => c.scorecard && c.scorecard.dimensions || {}, "dims");
var missingDims = /* @__PURE__ */ __name((c) => DIMS.filter((d) => !dims(c)[d]), "missingDims");
var failedGates = /* @__PURE__ */ __name((c) => GATING.filter((d) => {
  const ds = dims(c)[d];
  return !ds || ds.score < 3 || !(ds.evidence || "").trim();
}), "failedGates");
var totalScore = /* @__PURE__ */ __name((c) => DIMS.reduce((t, d) => t + (dims(c)[d]?.score || 0), 0), "totalScore");
var band = /* @__PURE__ */ __name((c) => {
  if (missingDims(c).length) return null;
  const t = totalScore(c);
  for (const [floor, name, note] of BANDS) if (t >= floor) return { name, note };
  return null;
}, "band");
var status = /* @__PURE__ */ __name((c) => c.decision ? c.decision.approved ? "g0_approved" : "g0_rejected" : missingDims(c).length ? "draft" : failedGates(c).length ? "untestable" : "scored", "status");
var declGaps = /* @__PURE__ */ __name((c) => {
  const g = [];
  if (!c.cluster && !(c.cluster_exception || "").trim()) g.push("cluster");
  if (!c.operator && !(c.operator_exception || "").trim()) g.push("operator");
  const t = c.thresholds || {};
  if (![t.g1_reachability, t.g2_engagement, t.g3_retention].every((v) => (v || "").trim()))
    g.push("thresholds");
  if (!(c.case_against || "").trim()) g.push("case-against");
  if (!(c.kill_criterion || "").trim()) g.push("kill-criterion");
  return g;
}, "declGaps");
var blockers = /* @__PURE__ */ __name((c) => {
  const b = [];
  if (missingDims(c).length) b.push("unscored dimensions: " + missingDims(c).join(", "));
  if (failedGates(c).length) b.push("failed gating dimensions: " + failedGates(c).join(", "));
  if (declGaps(c).length) b.push("missing declarations: " + declGaps(c).join(", "));
  return b;
}, "blockers");
var decidable = /* @__PURE__ */ __name((c) => blockers(c).length === 0, "decidable");
var LANE_LABELS = {
  substitution: "Lane one \u2014 product substitution (FRAMEWORK \xA72.2)",
  vertical: "Lane two \u2014 vertical, AI as domain expert (FRAMEWORK \xA72.3)"
};
var MODE_LABELS = {
  service_first: "Service-first (sell the work before building the product)",
  self_serve: "Self-serve product"
};
function draftMemo(c) {
  const t = c.thresholds || {};
  const bd = band(c);
  const testable = !missingDims(c).length && !failedGates(c).length;
  const cluster = c.cluster || `_exception: ${c.cluster_exception || "none given"}_`;
  const operator = c.operator || `_exception: ${c.operator_exception || "none given"}_`;
  const lines = [
    `# G0 Memo \u2014 ${c.name}`,
    "",
    `**Thesis:** ${c.one_liner}`,
    "",
    `- **Lane:** ${LANE_LABELS[c.lane]}`,
    `- **Delivery mode:** ${MODE_LABELS[c.delivery_mode]}`,
    `- **Buyer persona:** ${c.persona || "_not yet defined_"}`,
    `- **Primary channel:** ${c.channel || "_not yet defined_"}`,
    `- **Cluster:** ${cluster}`,
    `- **Operator match:** ${operator}`,
    "",
    "## Scorecard",
    "",
    "| Dimension | Score | Evidence |",
    "|---|---|---|"
  ];
  for (const d of DIMS) {
    const ds = dims(c)[d];
    const gate = GATING.includes(d) ? " *(gating)*" : "";
    lines.push(ds ? `| ${d}${gate} | ${ds.score} | ${ds.evidence || "\u2014"} |` : `| ${d}${gate} | \u2014 | _unscored_ |`);
  }
  let bandNote = "";
  if (!testable) bandNote = " \u2014 **UNTESTABLE** (gating dimension failed or unscored)";
  else if (bd) bandNote = ` \u2014 band: **${bd.name.toUpperCase().replace(/_/g, " ")}** (${bd.note})`;
  lines.push(
    "",
    `**Total:** ${totalScore(c)} / 50${bandNote}`,
    "",
    "## Case against (required at G0)",
    "",
    c.case_against || "_NOT WRITTEN \u2014 approval is blocked until the strongest case against is argued._",
    "",
    `**Kill criterion:** ${c.kill_criterion || "_NOT SET \u2014 approval is blocked until a falsifiable kill criterion exists._"}`,
    "",
    "## Pre-committed thresholds (locked at G0)",
    "",
    `- **G1 reachability:** ${t.g1_reachability || "_not set_"}`,
    `- **G2 engagement:** ${t.g2_engagement || "_not set_"}`,
    `- **G3 retention:** ${t.g3_retention || "_not set_"}`,
    `- **Caps:** $${(t.budget_cap_usd || 0).toLocaleString("en-US")} / ${t.time_cap_weeks || 0} weeks`,
    "",
    "## Decision",
    ""
  );
  lines.push(c.decision ? `**${c.decision.approved ? "APPROVED" : "REJECTED"}** by ${c.decision.decided_by} \u2014 ${c.decision.notes || "no notes"}` : "_Pending G0 review._");
  return lines.join("\n") + "\n";
}
__name(draftMemo, "draftMemo");
function view(c) {
  return {
    ...c,
    memo: draftMemo(c),
    status: status(c),
    total_score: totalScore(c),
    band: band(c),
    failed_gates: failedGates(c),
    decidable: decidable(c),
    blockers: blockers(c)
  };
}
__name(view, "view");
var store = {
  async seedIfNeeded(kv) {
    if (await kv.get("seeded")) return;
    for (const c of seed_default.candidates) await kv.put("candidate:" + c.slug, JSON.stringify(c));
    await kv.put("clusters", JSON.stringify(seed_default.clusters));
    await kv.put("operators", JSON.stringify(seed_default.operators));
    if (!await kv.get("allowed")) await kv.put("allowed", JSON.stringify(seed_default.allowed_emails));
    await kv.put("seeded", (/* @__PURE__ */ new Date()).toISOString());
  },
  async candidates(kv) {
    const list = await kv.list({ prefix: "candidate:" });
    const out = [];
    for (const k of list.keys) {
      const raw = await kv.get(k.name);
      if (raw) out.push(JSON.parse(raw));
    }
    out.sort((a, b) => a.slug < b.slug ? -1 : 1);
    return out;
  },
  async candidate(kv, slug) {
    const raw = await kv.get("candidate:" + slug);
    return raw ? JSON.parse(raw) : null;
  },
  saveCandidate: /* @__PURE__ */ __name((kv, c) => kv.put("candidate:" + c.slug, JSON.stringify(c)), "saveCandidate"),
  getList: /* @__PURE__ */ __name(async (kv, key) => JSON.parse(await kv.get(key) || "[]"), "getList"),
  putList: /* @__PURE__ */ __name((kv, key, v) => kv.put(key, JSON.stringify(v)), "putList")
};
var COOKIE = "gantry_session";
var TTL = 30 * 24 * 3600;
async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacHex, "hmacHex");
async function makeCookie(secret, email) {
  const payload = `${email}|${Math.floor(Date.now() / 1e3) + TTL}`;
  return `${payload}|${await hmacHex(secret, payload)}`;
}
__name(makeCookie, "makeCookie");
async function verifyCookie(secret, kv, cookieHeader) {
  const raw = (cookieHeader || "").split(";").map((s) => s.trim()).find((s) => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const parts = decodeURIComponent(raw).split("|");
  if (parts.length !== 3) return null;
  const [email, expires, sig] = parts;
  if (await hmacHex(secret, `${email}|${expires}`) !== sig) return null;
  if (parseInt(expires, 10) < Date.now() / 1e3) return null;
  const allowed = await store.getList(kv, "allowed");
  return allowed.includes(email) ? email : null;
}
__name(verifyCookie, "verifyCookie");
var json = /* @__PURE__ */ __name((data, status2 = 200, headers = {}) => new Response(JSON.stringify(data), {
  status: status2,
  headers: { "Content-Type": "application/json", ...headers }
}), "json");
var err = /* @__PURE__ */ __name((status2, detail) => json({ detail }, status2), "err");
var html = /* @__PURE__ */ __name((body) => new Response(body, {
  headers: { "Content-Type": "text/html; charset=utf-8" }
}), "html");
var worker_default = {
  async fetch(request, env) {
    const kv = env.GANTRY_KV;
    const secret = env.GANTRY_SECRET;
    if (!secret) return err(500, "GANTRY_SECRET is not set (wrangler secret put GANTRY_SECRET)");
    await store.seedIfNeeded(kv);
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const body = /* @__PURE__ */ __name(async () => {
      try {
        return await request.json();
      } catch {
        return {};
      }
    }, "body");
    if (path === "/login") return html(loginHtml);
    if (path === "/api/login" && method === "POST") {
      const email2 = ((await body()).email || "").trim().toLowerCase();
      const allowed = await store.getList(kv, "allowed");
      if (!allowed.includes(email2))
        return err(403, "This email is not on the allowlist. Ask an existing member to add it.");
      return json({ email: email2 }, 200, {
        "Set-Cookie": `${COOKIE}=${await makeCookie(secret, email2)}; Max-Age=${TTL}; Path=/; HttpOnly; Secure; SameSite=Lax`
      });
    }
    const email = await verifyCookie(secret, kv, request.headers.get("Cookie"));
    if (!email) {
      if (path.startsWith("/api/")) return err(401, "authentication required");
      return Response.redirect(new URL("/login", url).toString(), 302);
    }
    if (path === "/" || path === "") return html(appHtml);
    if (path === "/api/logout" && method === "POST")
      return json({ ok: true }, 200, {
        "Set-Cookie": `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`
      });
    if (path === "/api/me") return json({ email });
    if (path === "/api/summary") {
      const cs = (await store.candidates(kv)).map(view);
      const by = { draft: 0, scored: 0, untestable: 0, g0_approved: 0, g0_rejected: 0 };
      cs.forEach((c) => by[c.status]++);
      return json({
        candidates: cs.length,
        by_status: by,
        g0_queue: cs.filter((c) => c.status === "scored" && c.decidable).length,
        clusters: (await store.getList(kv, "clusters")).length,
        operators: (await store.getList(kv, "operators")).length
      });
    }
    if (path === "/api/candidates" && method === "GET")
      return json((await store.candidates(kv)).map(view));
    if (path === "/api/candidates" && method === "POST") {
      const b = await body();
      const slug = (b.slug || "").trim();
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return err(422, "slug must be lowercase-kebab");
      if (await store.candidate(kv, slug)) return err(409, `candidate '${slug}' already exists`);
      const c = {
        slug,
        name: b.name || slug,
        one_liner: b.one_liner || "",
        lane: b.lane === "substitution" ? "substitution" : "vertical",
        delivery_mode: b.delivery_mode === "service_first" ? "service_first" : "self_serve",
        persona: b.persona || "",
        channel: b.channel || "",
        cluster: b.cluster || null,
        cluster_exception: b.cluster_exception || "",
        operator: b.operator || null,
        operator_exception: b.operator_exception || "",
        case_against: b.case_against || "",
        kill_criterion: b.kill_criterion || "",
        scorecard: { dimensions: {} },
        thresholds: {
          g1_reachability: "",
          g2_engagement: "",
          g3_retention: "",
          budget_cap_usd: 2e3,
          time_cap_weeks: 3
        },
        memo: "",
        decision: null,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      await store.saveCandidate(kv, c);
      return json(view(c), 201);
    }
    if (path === "/api/g0-queue")
      return json((await store.candidates(kv)).map(view).filter((c) => ["scored", "untestable"].includes(c.status)));
    const m = path.match(/^\/api\/candidates\/([a-z0-9-]+)(?:\/(\w+))?$/);
    if (m) {
      const [, slug, action] = m;
      const c = await store.candidate(kv, slug);
      if (!c) return err(404, `no candidate '${slug}'`);
      if (!action && method === "GET") return json(view(c));
      const locked = /* @__PURE__ */ __name(() => c.decision != null, "locked");
      if (action === "score" && method === "POST") {
        if (locked()) return err(409, "candidate already has a G0 decision; the scorecard is locked");
        const b = await body();
        for (const [d, ds] of Object.entries(b.dimensions || {})) {
          if (!DIMS.includes(d)) continue;
          const score = Math.round(Number(ds.score));
          if (score >= 1 && score <= 5)
            c.scorecard.dimensions[d] = { score, evidence: String(ds.evidence || "") };
        }
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "thresholds" && method === "POST") {
        if (locked()) return err(409, "thresholds are locked at G0; use the extension-memo flow");
        const b = await body();
        c.thresholds = {
          g1_reachability: String(b.g1_reachability || ""),
          g2_engagement: String(b.g2_engagement || ""),
          g3_retention: String(b.g3_retention || ""),
          budget_cap_usd: Number(b.budget_cap_usd) || 0,
          time_cap_weeks: Number(b.time_cap_weeks) || 0
        };
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "case" && method === "POST") {
        if (locked()) return err(409, "candidate already has a G0 decision; the case against is locked");
        const b = await body();
        c.case_against = String(b.case_against || "");
        c.kill_criterion = String(b.kill_criterion || "");
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "decision" && method === "POST") {
        if (locked()) return err(409, "candidate already decided");
        const b = await body();
        if (b.approved && !decidable(c))
          return err(422, "cannot approve: " + blockers(c).join("; "));
        c.decision = {
          approved: !!b.approved,
          decided_by: email,
          notes: String(b.notes || ""),
          decided_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "memo" && method === "POST") return json({ memo: draftMemo(c) });
    }
    for (const [route, key] of [["/api/clusters", "clusters"], ["/api/operators", "operators"]]) {
      if (path === route && method === "GET") return json(await store.getList(kv, key));
      if (path === route && method === "POST") {
        const b = await body();
        const items = await store.getList(kv, key);
        if (!/^[a-z0-9][a-z0-9-]*$/.test(b.slug || "")) return err(422, "slug must be lowercase-kebab");
        if (items.some((i) => i.slug === b.slug)) return err(409, `'${b.slug}' already exists`);
        items.push(b);
        await store.putList(kv, key, items);
        return json(b, 201);
      }
    }
    if (path === "/api/allowed-emails" && method === "GET")
      return json(await store.getList(kv, "allowed"));
    if (path === "/api/allowed-emails" && method === "POST") {
      const e = ((await body()).email || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return err(422, "That doesn't look like an email address.");
      const allowed = await store.getList(kv, "allowed");
      if (allowed.includes(e)) return err(409, `${e} is already on the allowlist`);
      allowed.push(e);
      await store.putList(kv, "allowed", allowed);
      return json({ email: e }, 201);
    }
    return err(404, "not found");
  }
};

// ../../../../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-YgzrU7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-YgzrU7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
