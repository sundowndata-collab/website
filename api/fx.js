// Country and live exchange rates for Sundown price display.
// Country comes from Vercel's own geolocation header. Rates come from the free daily
// exchange-api feed (no key, no rate limits), with a second mirror as fallback.
// Prices on the site stay set in US dollars; this only powers the on-page conversion.
export const config = { runtime: 'edge' };

// ISO country code to official currency, from the country-to-currency package (MIT licence)
const COUNTRY_CURRENCY = {AD:'EUR',AE:'AED',AF:'AFN',AG:'XCD',AI:'XCD',AL:'ALL',AM:'AMD',AN:'ANG',AO:'AOA',AQ:'USD',AR:'ARS',AS:'USD',AT:'EUR',AU:'AUD',AW:'AWG',AX:'EUR',AZ:'AZN',BA:'BAM',BB:'BBD',BD:'BDT',BE:'EUR',BF:'XOF',BG:'EUR',BH:'BHD',BI:'BIF',BJ:'XOF',BL:'EUR',BM:'BMD',BN:'BND',BO:'BOB',BQ:'USD',BR:'BRL',BS:'BSD',BT:'BTN',BV:'NOK',BW:'BWP',BY:'BYN',BZ:'BZD',CA:'CAD',CC:'AUD',CD:'CDF',CF:'XAF',CG:'XAF',CH:'CHF',CI:'XOF',CK:'NZD',CL:'CLP',CM:'XAF',CN:'CNY',CO:'COP',CR:'CRC',CU:'CUP',CV:'CVE',CW:'XCG',CX:'AUD',CY:'EUR',CZ:'CZK',DE:'EUR',DJ:'DJF',DK:'DKK',DM:'XCD',DO:'DOP',DZ:'DZD',EC:'USD',EE:'EUR',EG:'EGP',EH:'MAD',ER:'ERN',ES:'EUR',ET:'ETB',FI:'EUR',FJ:'FJD',FK:'FKP',FM:'USD',FO:'DKK',FR:'EUR',GA:'XAF',GB:'GBP',GD:'XCD',GE:'GEL',GF:'EUR',GG:'GBP',GH:'GHS',GI:'GIP',GL:'DKK',GM:'GMD',GN:'GNF',GP:'EUR',GQ:'XAF',GR:'EUR',GS:'FKP',GT:'GTQ',GU:'USD',GW:'XOF',GY:'GYD',HK:'HKD',HM:'AUD',HN:'HNL',HR:'EUR',HT:'HTG',HU:'HUF',ID:'IDR',IE:'EUR',IL:'ILS',IM:'GBP',IN:'INR',IO:'USD',IQ:'IQD',IR:'IRR',IS:'ISK',IT:'EUR',JE:'GBP',JM:'JMD',JO:'JOD',JP:'JPY',KE:'KES',KG:'KGS',KH:'KHR',KI:'AUD',KM:'KMF',KN:'XCD',KP:'KPW',KR:'KRW',KW:'KWD',KY:'KYD',KZ:'KZT',LA:'LAK',LB:'LBP',LC:'XCD',LI:'CHF',LK:'LKR',LR:'LRD',LS:'LSL',LT:'EUR',LU:'EUR',LV:'EUR',LY:'LYD',MA:'MAD',MC:'EUR',MD:'MDL',ME:'EUR',MF:'EUR',MG:'MGA',MH:'USD',MK:'MKD',ML:'XOF',MM:'MMK',MN:'MNT',MO:'MOP',MP:'USD',MQ:'EUR',MR:'MRU',MS:'XCD',MT:'EUR',MU:'MUR',MV:'MVR',MW:'MWK',MX:'MXN',MY:'MYR',MZ:'MZN',NA:'NAD',NC:'XPF',NE:'XOF',NF:'AUD',NG:'NGN',NI:'NIO',NL:'EUR',NO:'NOK',NP:'NPR',NR:'AUD',NU:'NZD',NZ:'NZD',OM:'OMR',PA:'PAB',PE:'PEN',PF:'XPF',PG:'PGK',PH:'PHP',PK:'PKR',PL:'PLN',PM:'EUR',PN:'NZD',PR:'USD',PS:'ILS',PT:'EUR',PW:'USD',PY:'PYG',QA:'QAR',RE:'EUR',RO:'RON',RS:'RSD',RU:'RUB',RW:'RWF',SA:'SAR',SB:'SBD',SC:'SCR',SD:'SDG',SE:'SEK',SG:'SGD',SH:'SHP',SI:'EUR',SJ:'NOK',SK:'EUR',SL:'SLE',SM:'EUR',SN:'XOF',SO:'SOS',SR:'SRD',SS:'SSP',ST:'STN',SV:'USD',SX:'XCG',SY:'SYP',SZ:'SZL',TC:'USD',TD:'XAF',TF:'EUR',TG:'XOF',TH:'THB',TJ:'TJS',TK:'NZD',TL:'USD',TM:'TMT',TN:'TND',TO:'TOP',TR:'TRY',TT:'TTD',TV:'AUD',TW:'TWD',TZ:'TZS',UA:'UAH',UG:'UGX',UM:'USD',US:'USD',UY:'UYU',UZ:'UZS',VA:'EUR',VC:'XCD',VE:'VES',VG:'USD',VI:'USD',VN:'VND',VU:'VUV',WF:'XPF',WS:'WST',XK:'EUR',YE:'YER',YT:'EUR',ZA:'ZAR',ZM:'ZMW',ZW:'ZWG'};

const SOURCES = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
  'https://latest.currency-api.pages.dev/v1/currencies/usd.json'
];

const WANTED = new Set(Object.values(COUNTRY_CURRENCY).concat(['USD','EUR','GBP','KES']));

function reply(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Private: the answer depends on the visitor's country. Browsers may reuse it for 30 minutes.
      'cache-control': 'private, max-age=1800'
    }
  });
}

export default async function handler(request) {
  const country = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const currency = COUNTRY_CURRENCY[country] || 'USD';
  let data = null;
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (res.ok) { data = await res.json(); if (data && data.usd) break; }
    } catch (e) { /* try the next source */ }
  }
  if (!data || !data.usd) return reply({ country, currency, date: null, rates: null }, 503);
  const rates = {};
  for (const [code, value] of Object.entries(data.usd)) {
    const up = code.toUpperCase();
    if (WANTED.has(up) && typeof value === 'number' && value > 0) rates[up] = value;
  }
  rates.USD = 1;
  return reply({ country, currency, date: data.date, rates });
}
