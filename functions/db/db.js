const { Pool, Query } = require("pg");
const dayjs = require("dayjs");
const dotenv = require("dotenv");
dotenv.config();

// load DB Config (user, host, DB name, password)
const dbConfig = require("../config/dbConfig");

// NODE_ENV for local
let localMode = process.env.NODE_ENV === "local";

const sqlDebug = true;

// logging SQL query for debugging
const submit = Query.prototype.submit;
Query.prototype.submit = function () {
  const text = this.text;
  const values = this.values || [];
  const query = text.replace(/\$([0-9]+)/g, (m, v) => JSON.stringify(values[parseInt(v) - 1]));
  // logging when localMode === true && sqlDebug === true
  localMode && sqlDebug && console.log(`\n\n[👻 SQL STATEMENT]\n${query}\n_________\n`);
  submit.apply(this, arguments);
};

// logging NODE_ENV with server running
console.log(`[🔥DB] ${process.env.NODE_ENV}`);

// create connection pool
const pool = new Pool({
  ...dbConfig,
  connectionTimeoutMillis: 60 * 1000,
  idleTimeoutMillis: 60 * 1000,
});

const connect = async (req) => {
  const now = dayjs();
  const string =
    !!req && !!req.method
      ? `[${req.method}] ${!!req.user ? `${req.user.id}` : ``} ${req.originalUrl}\n ${
          !!req.query && `query: ${JSON.stringify(req.query)}`
        } ${!!req.body && `body: ${JSON.stringify(req.body)}`} ${
          !!req.params && `params ${JSON.stringify(req.params)}`
        }`
      : `request 없음`;
  const callStack = new Error().stack;
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  const releaseChecker = setTimeout(() => {
    console.error("[ERROR] client connection이 15초 동안 릴리즈되지 않았습니다.", { callStack });
    console.error(`마지막으로 실행된 쿼리문입니다. ${client.lastQuery}`);
  }, 15 * 1000);

  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  client.release = () => {
    clearTimeout(releaseChecker);
    const time = dayjs().diff(now, "millisecond");
    if (time > 4000) {
      const message = `[RELEASE] in ${time} | ${string}`;
      localMode && console.log(message);
    }
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  return client;
};

module.exports = {
  connect,
};
