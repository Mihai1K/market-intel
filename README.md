# Market Intel

A research pipeline and dashboard for evaluating business opportunities in Russian markets from open data. Each market is a set of versioned JSON fact files with sources; scripts validate the facts and check every link; a Next.js dashboard shows the result.

> Full case study in Russian: [CASE-STUDY.md](CASE-STUDY.md)

## Problem

"Find an idea, build a product, discover there is no market" is an expensive order of work. Market notes written by hand or by an LLM are hard to trust: numbers lose their sources, and links rot.

## Solution

Treat research as data with a schema and a build step:

- every fact is an object with a source, and a market size needs a range from at least two sources;
- `npm run validate` checks fact objects and scoring weights;
- `npm run verify-links` checks every URL and classifies failures;
- `npm run artifacts` produces dated reports with HTTP statuses and screenshots;
- decisions, experiments and rejected ideas are logged as data too.

There is no database on purpose: while the number of markets is small, JSON files versioned in git are easier to review and diff.

## Repository contents

```
data/
  markets/<slug>/     market.json, companies/*.json, pains.json, workflows.json, opportunities.json
  schema/             JSON Schemas for the structures
  patterns.json       cross-market patterns
  decisions.json      why an idea was rejected and when to return to it
  experiments.json    experiments with real costs and results
research/<slug>.md    full reports with quotes and links
scripts/              validate, verify-links, make-artifacts, snapshot-scores
artifacts/<date>/     validation output per run
dashboard/            Next.js 16 app (App Router, Server Components, Tailwind 4)
```

14 markets are covered, from apartment renovation to influencer marketing.

## Tech stack

Node.js scripts (ESM, no dependencies), JSON Schema, Next.js 16, React, TypeScript, Tailwind CSS 4.

## Run locally

```bash
npm run validate
npm run verify-links
npm run artifacts

cd dashboard && npm install && npm run dev
```

## Status and limitations

- A research tool for my own decisions, not a product. Data reflects the state of sources in July-August 2026.
- Company financials come from public registries; the files are research notes, not verified reports.
- No automated tests besides the validation scripts.

## How this was built

My role: founder and product owner - the methodology, the scoring model and the acceptance of results. The research sessions and the code were executed by AI agents (Claude Code) following written regulations, with validation scripts as the gate between an agent's output and the repository.
