// JuicyJuicy multiplayer: https://juicyjuicy.games/docs/publish#multiplayer
window.juicy = window.juicy || {};
window.juicy.rooms || (function (juicy) {
  var CLOSED = { 4001: "TICKET", 4004: "ROOM_NOT_FOUND", 4009: "ROOM_FULL", 4010: "ROOM_LOCKED",
    4011: "KICKED", 4012: "REPLACED", 4029: "TOO_FAST", 4040: "GAME_GONE", 4503: "OFF" };
  var onSite = window.parent !== window ? null : false;
  var inviteUrl = null;
  var next = 0;
  var waiting = {};
  window.addEventListener("message", function (event) {
    var m = event.data;
    if (event.source !== window.parent || !m || m.type !== "juicyjuicy:room-ticket") return;
    var done = waiting[m.id];
    if (!done) return;
    delete waiting[m.id];
    onSite = true;
    done(m);
  });
  function fail(code, message) {
    var error = new Error(message || code);
    error.code = code;
    return error;
  }
  // The player's answer (with a ticket when asked), or null when not on JuicyJuicy.
  function ask(ticket) {
    return new Promise(function (resolve, reject) {
      if (onSite === false) return resolve(null);
      var id = "juicy-room-" + ++next;
      var timer = setTimeout(function () {
        delete waiting[id];
        if (onSite) return reject(fail("TIMEOUT", "JuicyJuicy didn't answer"));
        onSite = false;
        resolve(null);
      }, onSite ? 30000 : 5000);
      waiting[id] = function (m) {
        clearTimeout(timer);
        if (!m.ok) return reject(fail(m.error.code, m.error.message));
        inviteUrl = m.inviteUrl;
        resolve(m);
      };
      window.parent.postMessage({ type: "juicyjuicy:room", id: id, ticket: ticket }, "*");
    });
  }

  function Room(code) {
    this.code = code;
    this.me = null;
    this.host = null;
    this.max = 0;
    this.locked = false;
    this.players = [];
    this.handlers = {};
    this.link = null;
    this.opened = false;
    this.closed = false;
  }
  // Events: "message" (data, fromId), "join" (player), "leave" (player), "host" (id),
  // "lock" (locked), "error" (error), "close" (reason).
  Room.prototype.on = function (event, handler) {
    (this.handlers[event] = this.handlers[event] || []).push(handler);
    return this;
  };
  Room.prototype.emit = function (event, a, b) {
    (this.handlers[event] || []).slice().forEach(function (handler) {
      try {
        handler(a, b);
      } catch (e) {
        setTimeout(function () { throw e; });
      }
    });
  };
  Room.prototype.isHost = function () {
    return this.me !== null && this.me === this.host;
  };
  Room.prototype.player = function (id) {
    for (var i = 0; i < this.players.length; i++) if (this.players[i].id === id) return this.players[i];
    return null;
  };
  // Sends any JSON value to everyone else in the room, or only to the player whose id is "to".
  Room.prototype.send = function (data, to) {
    if (this.link) this.link.send({ t: "send", d: data, to: to });
  };
  // The host only: stop new players joining (false lets them in again).
  Room.prototype.lock = function (locked) {
    if (this.link) this.link.send({ t: "lock", locked: locked !== false });
  };
  // The host only: remove a player, who can't come back to this room.
  Room.prototype.kick = function (id) {
    if (this.link) this.link.send({ t: "kick", id: id });
  };
  // Shows JuicyJuicy's share sheet for the room's invite link, and returns the link.
  Room.prototype.invite = function () {
    if (onSite) {
      window.parent.postMessage({ type: "juicyjuicy:invite", code: this.code }, "*");
      return inviteUrl + this.code;
    }
    return location.origin + location.pathname + "?room=" + this.code;
  };
  Room.prototype.leave = function () {
    this.end("LEFT");
  };
  Room.prototype.end = function (reason) {
    if (this.closed) return;
    this.closed = true;
    var link = this.link;
    this.link = null;
    if (link) link.close();
    this.emit("close", reason);
  };
  Room.prototype.receive = function (m) {
    var room = this;
    if (m.t === "welcome") {
      var before = room.players;
      var host = room.host;
      room.code = m.room;
      room.me = m.me;
      room.host = m.host;
      room.max = m.max;
      room.locked = m.locked;
      room.players = m.players;
      if (!room.opened) {
        room.opened = true;
        return room.emit("welcomed", room);
      }
      // Back after a dropped connection: who came and went meanwhile.
      before.forEach(function (p) { if (!room.player(p.id)) room.emit("leave", p); });
      m.players.forEach(function (p) {
        if (!before.some(function (q) { return q.id === p.id; })) room.emit("join", p);
      });
      if (host !== m.host) room.emit("host", m.host);
    } else if (m.t === "join") {
      room.players.push(m.player);
      room.emit("join", m.player);
    } else if (m.t === "leave") {
      var gone = room.player(m.id);
      if (!gone) return;
      room.players.splice(room.players.indexOf(gone), 1);
      room.emit("leave", gone);
    } else if (m.t === "host") {
      room.host = m.id;
      room.emit("host", m.id);
    } else if (m.t === "lock") {
      room.locked = m.locked;
      room.emit("lock", m.locked);
    } else if (m.t === "msg") {
      room.emit("message", m.d, m.from);
    } else if (m.t === "error") {
      room.emit("error", fail(m.code, m.message));
    } else if (m.t === "closed") {
      room.end(m.reason);
    }
  };

  // JuicyJuicy's relay: resolves once it has welcomed this player.
  function connect(room, query) {
    return ask(true).then(function (m) {
      return new Promise(function (resolve, reject) {
        var socket = new WebSocket(m.url + "?ticket=" + encodeURIComponent(m.ticket) + query);
        var welcomed = false;
        var link = {
          send: function (message) {
            if (socket.readyState === 1) socket.send(JSON.stringify(message));
          },
          close: function () {
            socket.close(1000);
          }
        };
        socket.onmessage = function (event) {
          var message;
          try {
            message = JSON.parse(event.data);
          } catch (e) {
            return;
          }
          if (message.t === "welcome" && !welcomed) {
            welcomed = true;
            room.link = link;
            room.receive(message);
            return resolve(room);
          }
          if (room.link === link) room.receive(message);
        };
        socket.onclose = function (event) {
          var reason = CLOSED[event.code];
          if (!welcomed) return reject(fail(reason || "DISCONNECTED", "Couldn't join the room"));
          if (room.link !== link) return;
          room.link = null;
          if (reason) room.end(reason);
          else reconnect(room, 0);
        };
      });
    });
  }
  // Phones drop connections when the game is in the background: three tries to come back.
  function reconnect(room, attempt) {
    if (room.closed) return;
    if (attempt === 3) return room.end("DISCONNECTED");
    setTimeout(function () {
      if (room.closed) return;
      connect(room, "&room=" + room.code).catch(function (e) {
        if (e.code === "DISCONNECTED" || e.code === "TIMEOUT" || e.code === "FAILED") {
          reconnect(room, attempt + 1);
        } else {
          room.end(e.code);
        }
      });
    }, 1000 * Math.pow(2, attempt));
  }

  // Outside JuicyJuicy: rooms between this origin's tabs. The tab that creates a room relays it,
  // and the room ends when that tab leaves.
  var tab = Math.random().toString(36).slice(2);
  var channel = null;
  var relays = {};
  var mine = {};
  function bus() {
    if (channel) return channel;
    channel = new BroadcastChannel("juicyjuicy:rooms");
    channel.onmessage = function (event) {
      var e = event.data;
      if (e.to === "relay" && relays[e.code]) relays[e.code].handle(e.from, e.m);
      else if (e.to === tab && mine[e.code]) mine[e.code].receive(e.m);
    };
    window.addEventListener("pagehide", function () {
      Object.keys(mine).forEach(function (code) { mine[code].leave(); });
    });
    return channel;
  }
  function LocalRelay(code, max) {
    this.code = code;
    this.max = max;
    this.locked = false;
    this.players = [];
    this.host = null;
    this.next = 0;
    this.kicked = {};
  }
  LocalRelay.prototype.deliver = function (to, m) {
    var room = to === tab && mine[this.code];
    if (room) setTimeout(function () { room.receive(m); });
    else if (to !== tab) bus().postMessage({ to: to, code: this.code, m: m });
  };
  LocalRelay.prototype.everyone = function (m, except) {
    var relay = this;
    relay.players.forEach(function (p) { if (p !== except) relay.deliver(p.tab, m); });
  };
  LocalRelay.prototype.list = function () {
    return this.players.map(function (p) { return { id: p.id, name: p.name }; });
  };
  LocalRelay.prototype.remove = function (player) {
    this.players.splice(this.players.indexOf(player), 1);
    this.everyone({ t: "leave", id: player.id });
    if (this.host !== player.id || !this.players.length) return;
    this.host = this.players[0].id;
    this.everyone({ t: "host", id: this.host });
  };
  LocalRelay.prototype.handle = function (from, m) {
    var relay = this;
    var player = null;
    relay.players.forEach(function (p) { if (p.tab === from) player = p; });
    if (m.t === "join") {
      if (player) return;
      var refused = relay.kicked[from] ? "KICKED" : relay.locked ? "ROOM_LOCKED"
        : relay.players.length >= relay.max ? "ROOM_FULL" : null;
      if (refused) return relay.deliver(from, { t: "closed", reason: refused });
      player = { id: "p" + ++relay.next, name: "Player " + relay.next, tab: from };
      relay.players.push(player);
      if (!relay.host) relay.host = player.id;
      relay.deliver(from, { t: "welcome", room: relay.code, me: player.id, host: relay.host,
        max: relay.max, locked: relay.locked, players: relay.list() });
      relay.everyone({ t: "join", player: { id: player.id, name: player.name } }, player);
    } else if (!player) {
      return;
    } else if (m.t === "send") {
      relay.players.forEach(function (p) {
        if (p !== player && (m.to == null || m.to === p.id)) {
          relay.deliver(p.tab, { t: "msg", from: player.id, d: m.d });
        }
      });
    } else if (m.t === "leave") {
      relay.remove(player);
    } else if (player.id !== relay.host) {
      relay.deliver(from, { t: "error", code: "NOT_HOST", message: "Only the host can do that" });
    } else if (m.t === "lock") {
      relay.locked = m.locked;
      relay.everyone({ t: "lock", locked: m.locked });
    } else if (m.t === "kick") {
      relay.players.slice().forEach(function (p) {
        if (p.id !== m.id || p === player) return;
        relay.kicked[p.tab] = true;
        relay.deliver(p.tab, { t: "closed", reason: "KICKED" });
        relay.remove(p);
      });
    }
  };
  function joinLocal(room, max) {
    return new Promise(function (resolve, reject) {
      var code = room.code;
      if (max) relays[code] = new LocalRelay(code, max);
      mine[code] = room;
      room.link = {
        send: function (m) {
          var relay = relays[code];
          if (relay) setTimeout(function () { relay.handle(tab, m); });
          else bus().postMessage({ to: "relay", code: code, from: tab, m: m });
        },
        close: function () {
          delete mine[code];
          var relay = relays[code];
          if (!relay) return bus().postMessage({ to: "relay", code: code, from: tab, m: { t: "leave" } });
          delete relays[code];
          relay.players.forEach(function (p) {
            if (p.tab !== tab) relay.deliver(p.tab, { t: "closed", reason: "DISCONNECTED" });
          });
        }
      };
      room.on("close", function (reason) {
        if (!room.opened) reject(fail(reason, "Couldn't join the room"));
      });
      room.on("welcomed", resolve);
      bus();
      room.link.send({ t: "join" });
      setTimeout(function () {
        if (!room.opened) room.end("ROOM_NOT_FOUND");
      }, 2000);
    });
  }
  function newCode() {
    var letters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var code = "";
    for (var i = 0; i < 6; i++) code += letters[Math.floor(Math.random() * letters.length)];
    return code;
  }

  juicy.rooms = {
    // Opens a new room with this player as its host. options.max: most players, 2 to 10.
    create: function (options) {
      var max = Math.max(2, Math.min(10, (options && options.max) || 10));
      return ask(true).then(function (m) {
        var room = new Room(null);
        if (m) return connect(room, "&create=1&max=" + max);
        room.code = newCode();
        return joinLocal(room, max);
      });
    },
    // Joins the room with this code (from invited(), or typed in by the player).
    join: function (code) {
      code = String(code || "").trim().toUpperCase();
      return ask(true).then(function (m) {
        var room = new Room(code);
        return m ? connect(room, "&room=" + encodeURIComponent(code)) : joinLocal(room, 0);
      });
    },
    // The room code of the invite link that opened the game, or null.
    invited: function () {
      return ask(false).then(function (m) {
        if (m) return m.invite;
        var found = /[?&]room=([A-Za-z0-9]{6})/.exec(location.search);
        return found ? found[1].toUpperCase() : null;
      });
    }
  };
})(window.juicy);
