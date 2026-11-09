/* MapAble Signal — conservative, deterministic accessibility evidence logic. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (root) root.MapAbleCore = core;
})(typeof window !== 'undefined' ? window : null, function () {
  const RATINGS = ['red', 'amber', 'green', 'unknown'];
  const EVIDENCE = ['reported', 'reviewed', 'outdated', 'disputed'];
  function hasEvidence(o) {
    return Boolean(o && String(o.finding || '').trim().length >= 12 &&
      String(o.method || '').trim() && String(o.observedAt || '').trim() &&
      (String(o.measurement || '').trim() || (o.evidenceIds || []).length ||
       (o.method === 'direct observation' && String(o.finding || '').trim().length >= 24)));
  }
  function evidenceRating(o) {
    if (!o || o.notApplicable || o.claimBasis === 'assumption') return 'unknown'; // Neither N/A nor assumptions can be Green.
    if (o.evidenceState !== 'reviewed' || o.moderation !== 'accepted' ||
        !RATINGS.includes(o.proposed) || !hasEvidence(o)) return 'unknown';
    if (o.reviewBy && o.reviewBy < new Date().toISOString().slice(0, 10)) return 'unknown';
    return o.proposed;
  }
  function aggregateJourney(segments, options = {}) {
    const relevant = (segments || []).filter(s => !s.notApplicable);
    if (!relevant.length) return { rating: 'unknown', reason: 'No applicable journey segments are documented.' };
    const ratings = relevant.map(evidenceRating);
    // Incomplete critical links cannot be treated as a confirmed green route.
    if (ratings.includes('unknown')) return { rating: 'unknown', reason: 'One or more links have missing, unreviewed, disputed or outdated evidence.' };
    if (ratings.includes('red')) {
      if (options.verifiedAlternative === true) return { rating: 'amber', reason: 'An evidenced barrier exists, with a verified conditional alternative.' };
      if (options.noVerifiedAlternative === true) return { rating: 'red', reason: 'An evidenced critical route barrier has a documented check showing no verified usable alternative.' };
      return { rating: 'unknown', reason: 'A critical barrier is documented, but possible alternatives have not been sufficiently checked.' };
    }
    if (ratings.includes('amber')) return { rating: 'amber', reason: 'At least one link requires a condition, detour, assistance or adjustment.' };
    return { rating: 'green', reason: 'All recorded applicable links were locally reviewed as green within their recorded scope and dates.' };
  }
  function stripPrivate(o) {
    const c = { ...o };
    delete c.contact; delete c.participantName; delete c.privateNotes;
    delete c.evidenceIds; delete c.files; delete c.latitude; delete c.longitude;
    delete c.latitude2; delete c.longitude2;
    return c;
  }
  function countRatings(items) {
    return (items || []).reduce((acc, o) => { if(o.notApplicable)acc.notApplicable++; else acc[evidenceRating(o)]++; return acc; }, {red:0,amber:0,green:0,unknown:0,notApplicable:0});
  }
  function csvCell(v) {
    const s = String(v == null ? '' : v);
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return {RATINGS, EVIDENCE, hasEvidence, evidenceRating, aggregateJourney, stripPrivate, countRatings, csvCell};
});
