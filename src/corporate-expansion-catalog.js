export const CORPORATE_EXPANSIONS = Object.freeze({
  "OE-001": { cost: 12000, rate: 20, match: /caf[eé]|coffee/i },
  "OE-002": { cost: 18000, rate: 12, match: /.+/ },
  "OE-003": { cost: 35000, rate: 25, match: /com[eé]rc|mercad|varejo|distribui|loja/i },
  "OE-005": { cost: 25000, rate: 15, match: /servi[cç]|ag[eê]ncia|tecnolog|digital/i },
  "OE-006": { cost: 15000, rate: 12, match: /com[eé]rc|mercad|varejo|distribui|loja/i },
  "OE-008": { cost: 30000, rate: 18, match: /tecnolog|digital|software/i },
  "OE-019": { cost: 80000, rate: 30, match: /.+/, requiresProfit: true },
});
