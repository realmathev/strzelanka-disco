// JuicyJuicy highscores: https://juicyjuicy.games/docs/publish#highscores
window.juicy = window.juicy || {};
window.juicy.scores || (function (juicy) {
  var KEY = "juicyjuicy:best";
  var framed = window.parent !== window;
  var onSite = false;
  var next = 0;
  var waiting = {};
  window.addEventListener("message", function (event) {
    var m = event.data;
    if (event.source !== window.parent || !m || typeof m.id !== "string") return;
    if (m.type !== "juicyjuicy:scored" && m.type !== "juicyjuicy:leaderboard") return;
    var done = waiting[m.id];
    if (!done) return;
    delete waiting[m.id];
    onSite = true;
    done(m);
  });
  // The player's answer, or null when nothing answered (not on JuicyJuicy).
  function ask(message) {
    return new Promise(function (resolve) {
      if (!framed) return resolve(null);
      var id = "scores-" + ++next;
      var timer = setTimeout(function () {
        delete waiting[id];
        resolve(null);
      }, onSite ? 30000 : 10000);
      waiting[id] = function (m) {
        clearTimeout(timer);
        resolve(m);
      };
      message.id = id;
      window.parent.postMessage(message, "*");
    });
  }
  function failed(m) {
    var error = new Error(m ? m.error.message : "JuicyJuicy didn't answer");
    error.code = m ? m.error.code : "TIMEOUT";
    return error;
  }
  function readLocal() {
    try {
      var best = JSON.parse(localStorage.getItem(KEY));
      return best && typeof best.score === "number" ? best : null;
    } catch (e) {
      return null;
    }
  }
  function keepLocal(score, order, format) {
    var best = readLocal();
    var improved = !best || (order === "low" ? score < best.score : score > best.score);
    if (improved) {
      best = { score: score, order: order, format: format };
      try {
        localStorage.setItem(KEY, JSON.stringify(best));
      } catch (e) {}
    }
    return { cloud: false, best: best.score, rank: null, improved: improved };
  }
  juicy.scores = {
    // Sends a finished run's score: a whole number, or milliseconds for a time. Options (pass the
    // same ones every time): order "high" (more is better, the default) or "low", format "points"
    // (the default) or "time". Resolves to { cloud: true, best, rank, improved } or
    // { cloud: false, best, rank: null, improved } (signed out: kept in this browser); rejects with
    // an error that has a code.
    submit: function (score, options) {
      var order = (options && options.order) || "high";
      var format = (options && options.format) || "points";
      var message = { type: "juicyjuicy:score", score: score, order: order, format: format };
      return ask(message).then(function (m) {
        if (!m) {
          if (onSite) throw failed(null);
          return keepLocal(score, order, format);
        }
        if (m.ok) return { cloud: true, best: m.best, rank: m.rank, improved: m.improved };
        if (m.error.code === "SIGNED_OUT") return keepLocal(score, order, format);
        throw failed(m);
      });
    },
    // The leaderboard's top "limit" (10 by default, at most 100): { cloud, signedIn, order,
    // format, entries: [{ rank, name, score, me }], me: { rank, score } or null }.
    top: function (limit) {
      return ask({ type: "juicyjuicy:scores", limit: limit || 10 }).then(function (m) {
        if (!m) {
          if (onSite) throw failed(null);
          var best = readLocal();
          return {
            cloud: false,
            signedIn: false,
            order: best ? best.order : null,
            format: best ? best.format : null,
            entries: best ? [{ rank: 1, name: "You", score: best.score, me: true }] : [],
            me: best ? { rank: 1, score: best.score } : null
          };
        }
        if (!m.ok) throw failed(m);
        return {
          cloud: true,
          signedIn: m.signedIn,
          order: m.order,
          format: m.format,
          entries: m.entries,
          me: m.me
        };
      });
    }
  };
})(window.juicy);
