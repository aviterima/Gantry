"""Seed the registry with demo data. Run from the repo root:

    python -m engine.seed [--reset]
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from .app.main import DATA_DIR
from .app.memo import draft_memo
from .app.models import (
    Candidate,
    Cluster,
    DimensionScore,
    G0Decision,
    GateThresholds,
    Operator,
    Scorecard,
)
from .app.registry import Registry

CLUSTERS = [
    Cluster(
        slug="construction-smb",
        name="SMB Construction & Trades",
        description="Small GCs, specialty subs, and trade contractors: 5-50 seats, "
        "run on spreadsheets, phone calls, and one hated legacy vendor.",
        watering_holes=["r/Construction", "AGC chapters", "Procore-adjacent LinkedIn groups"],
    ),
    Cluster(
        slug="specialty-food",
        name="Specialty Food Manufacturers",
        description="Co-packers and specialty producers, 10-200 employees, drowning "
        "in FDA/FSMA compliance paperwork handled by one overloaded QA manager.",
        watering_holes=["IFT communities", "r/FoodManufacturing", "Specialty Food Association"],
    ),
]

OPERATORS = [
    Operator(
        slug="jordan-reyes",
        name="Jordan Reyes",
        domain_profile="Ex-PM at a construction-tech vendor; 6 years selling into SMB GCs.",
        load=1,
    ),
    Operator(
        slug="priya-natarajan",
        name="Priya Natarajan",
        domain_profile="Former QA director at a co-packer; FSMA/HACCP domain depth.",
        load=1,
    ),
    Operator(
        slug="sam-okafor",
        name="Sam Okafor",
        domain_profile="Two-time SMB SaaS founder; generalist bench for substitution-lane launches.",
        load=0,
    ),
]


def _sc(**scores_and_evidence) -> Scorecard:
    dims = {
        k: DimensionScore(score=v[0], evidence=v[1]) for k, v in scores_and_evidence.items()
    }
    return Scorecard(dimensions=dims)


def build_candidates() -> list[Candidate]:
    permit_pilot = Candidate(
        slug="permit-pilot",
        name="PermitPilot",
        one_liner="AI permit-expediting service for small general contractors: we prepare, "
        "file, and chase municipal permits so the GC never sits in a queue.",
        lane="vertical",
        delivery_mode="service_first",
        persona="Owner/office manager at a 5-30 person GC doing residential and light commercial work.",
        channel="Outbound email to licensed GCs (public license rolls) + construction-smb cluster list.",
        cluster="construction-smb",
        operator="jordan-reyes",
        case_against="Municipal heterogeneity may resist automation: every jurisdiction is a "
        "special case, and margins could collapse into manual labor that never productizes. "
        "Expediting relationships with clerks may matter more than filing quality.",
        kill_criterion="Kill if >50% of engagement hours are still manual after 10 filings "
        "across 3 jurisdictions, or turnaround beats the GC's own baseline by <20%.",
        scorecard=_sc(
            pain_intensity=(5, "Permit delays stall jobs and crews; GCs quote 2-6 week losses per project."),
            buyer_reachability=(5, "Public contractor license registries; 40k+ emails harvestable; cluster list exists."),
            time_to_signal=(4, "Service-first: paid expediting engagements can close in 2-3 weeks."),
            budget_existence=(5, "GCs already pay human expediters $500-2k per permit."),
            incumbent_exposure=(4, "No horizontal incumbent owns municipal permitting workflows."),
            ai_leverage=(4, "AI drafts applications, tracks jurisdiction rules, chases status — the expert work."),
            moat_trajectory=(4, "Jurisdiction rulebook + outcome data compounds per filing."),
            founder_market_access=(4, "Jordan (bench) sold into SMB GCs for 6 years."),
            expansion_path=(4, "Inspections scheduling, lien waivers, licensing renewals to the same buyer."),
            portfolio_synergy=(5, "Anchor launch for the construction-smb cluster."),
        ),
        thresholds=GateThresholds(
            g1_reachability="≥3% qualified reply/booking rate on 1,500 outbound contacts",
            g2_engagement="≥3 paid expediting engagements delivered and accepted",
            g3_retention="≥4 paying GCs, ≥1 from pure outbound, ≥1 repeat filing",
            budget_cap_usd=2000,
            time_cap_weeks=3,
        ),
    )

    complicore = Candidate(
        slug="complicore",
        name="CompliCore",
        one_liner="AI QA/compliance expert for specialty food manufacturers: FSMA plans, "
        "audit prep, and supplier docs delivered as a service, then productized.",
        lane="vertical",
        delivery_mode="service_first",
        persona="QA manager or owner at a 10-200 person specialty food producer / co-packer.",
        channel="Vox social in food-manufacturing communities + outbound to FDA registration lists.",
        cluster="specialty-food",
        operator="priya-natarajan",
        case_against="Audit-prep buying is episodic; retainers may not stick between audit "
        "cycles, leaving a services business whose software margins never materialize. "
        "Liability exposure if a plan we drafted fails an audit.",
        kill_criterion="Kill if fewer than 1 of the first 5 customers converts to a monthly "
        "compliance retainer within 60 days of audit completion.",
        scorecard=_sc(
            pain_intensity=(5, "Failed audits stop shipments; SQF/FSMA deadlines are forcing events."),
            buyer_reachability=(4, "FDA facility registrations are public; active communities identified."),
            time_to_signal=(4, "Audit-prep engagements are bought under deadline pressure."),
            budget_existence=(5, "They already pay consultants $10-30k per audit cycle."),
            incumbent_exposure=(5, "Incumbent QMS vendors target enterprise; SMB tier is greenfield."),
            ai_leverage=(5, "The product *is* the domain expert: plan drafting, gap analysis, doc chasing."),
            moat_trajectory=(4, "Corpus of audit findings and supplier docs compounds."),
            founder_market_access=(5, "Priya (bench) ran QA at a co-packer."),
            expansion_path=(4, "Supplier verification, label compliance, recall drills."),
            portfolio_synergy=(4, "Anchor launch for the specialty-food cluster."),
        ),
        thresholds=GateThresholds(
            g1_reachability="≥2.5% qualified inquiry rate across outbound + community posts",
            g2_engagement="≥2 paid audit-prep engagements delivered",
            g3_retention="≥3 paying customers, ≥1 on a monthly compliance retainer",
            budget_cap_usd=2000,
            time_cap_weeks=3,
        ),
    )

    ledgerlite = Candidate(
        slug="ledgerlite",
        name="LedgerLite",
        one_liner="De-configured, AI-native fund administration for micro-VCs and syndicates "
        "priced at 1/10th of the legacy fund-admin stack.",
        lane="substitution",
        delivery_mode="self_serve",
        persona="GP or ops lead at a sub-$50M fund or active syndicate, no back office.",
        channel="Founder/VC social (Vox), emerging-manager communities, targeted outbound.",
        cluster=None,
        cluster_exception="Substitution-lane launch; buyer pool (emerging managers) doesn't map "
        "to a current cluster. Revisit if a fintech cluster forms.",
        operator="sam-okafor",
        case_against="Fund admin is a trust purchase: emerging managers may pay legacy "
        "premiums precisely because LPs recognize the name, and 'cheap + AI' could read "
        "as audit risk rather than efficiency.",
        kill_criterion="Kill if >=3 qualified GPs cite LP acceptance as the blocker and "
        "none converts after we provide an LP-facing assurance letter.",
        scorecard=_sc(
            pain_intensity=(4, "Emerging managers defer admin until an LP or audit forces it."),
            buyer_reachability=(4, "Form D filings are public; emerging-manager communities are dense."),
            time_to_signal=(3, "Self-serve signups fast; paid conversion tied to quarter-end cycles."),
            budget_existence=(5, "They already pay $15-40k/yr to legacy fund admins."),
            incumbent_exposure=(3, "Legacy admins could ship a cheap tier, but their cost base resists it."),
            ai_leverage=(4, "AI handles capital-call docs, K-1 prep support, LP reporting."),
            moat_trajectory=(3, "Workflow embedding and multi-year records; weaker data moat."),
            founder_market_access=(3, "Sam is a generalist; no deep fund-admin background on bench."),
            expansion_path=(4, "Tax docs, LP portal, compliance calendar."),
            portfolio_synergy=(3, "Reuses launch stack; no cluster sharing."),
        ),
        thresholds=GateThresholds(
            g1_reachability="≥3% qualified signup rate on 1,000 targeted contacts",
            g2_engagement="≥35% of signups complete fund setup and issue one capital call",
            g3_retention="≥4 paying funds, ≥1 from pure outbound, ≥1 renewal into a second quarter",
            budget_cap_usd=2000,
            time_cap_weeks=3,
        ),
    )

    harbordesk = Candidate(
        slug="harbordesk",
        name="HarborDesk",
        one_liner="Ops platform for port agency and vessel husbandry workflows.",
        lane="vertical",
        delivery_mode="self_serve",
        persona="Port agents coordinating vessel calls at mid-size ports.",
        channel="Unclear — no automatable channel identified; relationship-driven industry.",
        cluster=None,
        cluster_exception="No cluster fit; maritime is a one-off.",
        operator=None,
        operator_exception="No bench operator with maritime background.",
        scorecard=_sc(
            pain_intensity=(4, "Real coordination pain across agents, terminals, and masters."),
            buyer_reachability=(2, "Buyers are unreachable via automatable channels — port agency is relationship-driven; no public roll, no dense community found."),
            time_to_signal=(2, "Procurement runs through long relationship cycles; no fast paid commitment plausible."),
            budget_existence=(3, "Budgets exist but sit inside agency fees."),
            incumbent_exposure=(4, "No dominant horizontal incumbent."),
            ai_leverage=(3, "Some document automation; core value is coordination."),
            moat_trajectory=(3, "Port-pair operational data could compound."),
            founder_market_access=(2, "No bench operator; domain trust is earned over years."),
            expansion_path=(3, "Customs docs, disbursement accounts."),
            portfolio_synergy=(2, "Nothing shared with current clusters."),
        ),
        thresholds=GateThresholds(
            g1_reachability="n/a — fails gating",
            g2_engagement="n/a",
            g3_retention="n/a",
        ),
    )
    # Demonstrates the framework's gating rule: attractive market, untestable
    # in this system (FRAMEWORK §3 — belongs in a conviction-funded process).

    crewcast = Candidate(
        slug="crewcast",
        name="CrewCast",
        one_liner="AI dispatcher for specialty subcontractors: crew scheduling that "
        "re-plans around weather, no-shows, and inspection slips.",
        lane="vertical",
        delivery_mode="self_serve",
        persona="Ops lead at a 10-50 person specialty sub (electrical, roofing, concrete).",
        channel="Construction-smb cluster list (sequential reuse after PermitPilot) + Vox.",
        cluster="construction-smb",
        operator="jordan-reyes",
    )
    # Draft: intentionally unscored, to show the registry->scored flow live.

    packproof = Candidate(
        slug="packproof",
        name="PackProof",
        one_liner="AI label and packaging compliance checker for specialty food brands.",
        lane="vertical",
        delivery_mode="self_serve",
        persona="Founder or brand manager at a specialty food brand shipping retail SKUs.",
        channel="Specialty-food cluster list (sequential reuse after CompliCore).",
        cluster="specialty-food",
        operator="priya-natarajan",
        case_against="Single-feature product: label checks may be a one-off purchase rather "
        "than a workflow, capping LTV below CAC even with cluster list reuse.",
        kill_criterion="Kill if the repeat-check rate is <20% within 60 days of the first "
        "paid check.",
        scorecard=_sc(
            pain_intensity=(4, "Label errors trigger recalls and retailer rejections."),
            buyer_reachability=(5, "Same cluster audience as CompliCore; list reuse is free."),
            time_to_signal=(4, "Single-SKU check is an impulse-priced first purchase."),
            budget_existence=(4, "Currently paid to labeling consultants per SKU."),
            incumbent_exposure=(4, "Enterprise labeling suites ignore small brands."),
            ai_leverage=(5, "Regulation-aware review is the whole product."),
            moat_trajectory=(3, "Ruling corpus compounds; single-feature risk."),
            founder_market_access=(5, "Priya covers the domain."),
            expansion_path=(4, "Nutrition panels, claims review, retailer spec packs."),
            portfolio_synergy=(5, "Second launch into specialty-food; compounds the cluster."),
        ),
        thresholds=GateThresholds(
            g1_reachability="≥4% qualified capture on cluster list + 1,000 new contacts",
            g2_engagement="≥30% of signups run a paid single-SKU check",
            g3_retention="≥5 paying brands, ≥1 from pure outbound, ≥1 multi-SKU repeat",
            budget_cap_usd=1500,
            time_cap_weeks=3,
        ),
        decision=G0Decision(
            approved=True,
            decided_by="studio-review",
            notes="Approved as the second specialty-food launch; staggered 3 weeks behind CompliCore per cluster rules.",
        ),
    )

    return [permit_pilot, complicore, ledgerlite, harbordesk, crewcast, packproof]


def main() -> None:
    if "--reset" in sys.argv and DATA_DIR.exists():
        shutil.rmtree(DATA_DIR)
    registry = Registry(DATA_DIR)
    registry.save_clusters(CLUSTERS)
    registry.save_operators(OPERATORS)
    for c in build_candidates():
        c.memo = draft_memo(c)
        registry.save_candidate(c)
    print(f"Seeded {len(build_candidates())} candidates, {len(CLUSTERS)} clusters, "
          f"{len(OPERATORS)} operators into {DATA_DIR}")


if __name__ == "__main__":
    main()
