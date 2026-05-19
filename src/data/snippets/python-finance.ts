import type { Snippet } from "./types";

// ============================================================
// Python for Quantitative Finance
// ============================================================
// Numpy / pandas / scipy / statsmodels — the actual day-to-day
// toolkit. Code is illustrative; assume `import numpy as np`,
// `import pandas as pd` unless shown.
// ============================================================

export const pythonFinanceSnippets: Snippet[] = [
  // ─────────── NUMPY / PANDAS CORE ───────────
  {
    id: "pyfin-numpy-vectorized",
    language: "python",
    title: "Vectorised numpy vs Python loop",
    tag: "finance",
    code: `import numpy as np
import time

n = 10_000_000
xs = np.random.standard_normal(n)

# Pure python — slow because every op is an interpreted bytecode step.
t0 = time.perf_counter()
total = 0.0
for x in xs.tolist():
    total += x * x
slow = time.perf_counter() - t0

# Vectorised — runs in C, releases the GIL, uses SIMD.
t0 = time.perf_counter()
total2 = float(np.sum(xs * xs))
fast = time.perf_counter() - t0

print(f"loop {slow:.3f}s  vec {fast:.3f}s  speedup x{slow / fast:.0f}")`,
    explanation:
      "Vectorised numpy is typically 50–200x faster than a Python loop. Quant code should be expressed as array operations end-to-end — once a value enters numpy it should not return to Python scalar-land until the final report.",
  },
  {
    id: "pyfin-log-vs-simple-returns",
    language: "python",
    title: "Log returns vs simple returns",
    tag: "finance",
    code: `import numpy as np

prices = np.array([100.0, 101.0, 99.5, 102.3, 103.1])

# Simple returns: (P_t / P_{t-1}) - 1
simple = prices[1:] / prices[:-1] - 1

# Log returns: ln(P_t / P_{t-1}). Time-additive (sum-able).
log_r = np.log(prices[1:] / prices[:-1])

# Compounded simple return vs sum of log returns
end = np.prod(1 + simple) - 1
end_log = np.exp(np.sum(log_r)) - 1
print(end, end_log)   # equal up to float precision`,
    explanation:
      "Log returns sum across time (sum of log returns = log of total return), which makes statistical models cleaner. Simple returns aggregate cross-sectionally (portfolio return = weighted sum of asset returns). Use both; know which is which.",
  },
  {
    id: "pyfin-pandas-dataframe",
    language: "python",
    title: "pandas DataFrame from CSV",
    tag: "finance",
    code: `import pandas as pd

# parse_dates makes the index a real DatetimeIndex (enables resample, asfreq).
df = pd.read_csv(
    "prices.csv",
    parse_dates=["date"],
    index_col="date",
)

print(df.head())
print(df.dtypes)

# Column-oriented selection — fast and idiomatic.
close = df["close"]
hl = df[["high", "low"]]
print(close.describe())`,
    explanation:
      "pandas is a numpy-backed table with labelled axes. The labelled axis is the actual feature — alignment by date index removes 90% of the boilerplate you'd write in raw numpy.",
  },
  {
    id: "pyfin-resample",
    language: "python",
    title: "Resample / asfreq for time series",
    tag: "finance",
    code: `import pandas as pd

# Assume df indexed by minute-bar timestamps with columns: open/high/low/close/volume.
ohlc = df["close"].resample("1D").ohlc()     # daily OHLC bars
vol_d = df["volume"].resample("1D").sum()    # daily volume

# Forward-fill missing trading minutes if needed.
filled = df["close"].asfreq("1min").ffill()`,
    explanation:
      "resample is the time-aware groupby — buckets rows by a calendar rule (1D, 1H, 5min, W-FRI, M, Q). asfreq doesn't aggregate, it just changes the index frequency, which is what you want for clean alignment before ffill.",
  },
  {
    id: "pyfin-rolling",
    language: "python",
    title: "Rolling windows (mean, std, vol)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

px = df["close"]
log_r = np.log(px / px.shift(1))

# 20-day rolling stats. min_periods drops the warm-up window.
ma20 = px.rolling(20, min_periods=20).mean()
vol20 = log_r.rolling(20, min_periods=20).std()

# Annualised vol from daily log returns
annual_vol = vol20 * np.sqrt(252)
print(annual_vol.tail())`,
    explanation:
      "Rolling stats are the bread and butter of signal generation. Multiply daily vol by sqrt(252) for annualised; sqrt(252*78) for 5-minute bars (78 five-minute periods in a 6.5h day). The sqrt-of-time rule assumes IID returns, which is wrong but pragmatic.",
  },
  {
    id: "pyfin-groupby-cross-section",
    language: "python",
    title: "Cross-sectional groupby",
    tag: "finance",
    code: `import pandas as pd

# long-format dataframe: columns ['date', 'symbol', 'return']
ranks = (
    df.groupby("date")["return"]
      .rank(pct=True)               # percentile rank within each day
      .rename("daily_rank")
)
df = df.join(ranks, on=None)        # or align however your data needs

# Top quintile portfolio return per day
top = df[df["daily_rank"] >= 0.8].groupby("date")["return"].mean()
print(top.tail())`,
    explanation:
      "Cross-sectional ranking turns raw values into market-neutral signals — top vs bottom buckets ('long short') average out broad market moves. Equity factor research is mostly variations on this pattern.",
  },
  {
    id: "pyfin-merge-asof",
    language: "python",
    title: "merge_asof — point-in-time joins",
    tag: "finance",
    code: `import pandas as pd

# trades: tick-level; quotes: NBBO updates. Both indexed by time.
trades = pd.DataFrame({"time": [...], "price": [...]})
quotes = pd.DataFrame({"time": [...], "bid": [...], "ask": [...]})

# For each trade, look up the LAST quote at or before its timestamp.
merged = pd.merge_asof(
    trades.sort_values("time"),
    quotes.sort_values("time"),
    on="time",
    direction="backward",        # never peek at the future
    tolerance=pd.Timedelta("1s"),
)`,
    explanation:
      "merge_asof is the right tool for joining time series of different cadence without leaking future data. Slippage / mid-quote analysis lives or dies by getting these joins point-in-time correct.",
  },
  {
    id: "pyfin-numpy-broadcasting",
    language: "python",
    title: "Broadcasting and matrix ops",
    tag: "finance",
    code: `import numpy as np

returns = np.random.standard_normal((1000, 5))   # 1000 days, 5 assets
weights = np.array([0.2, 0.3, 0.1, 0.25, 0.15])

# Portfolio return per day = weighted sum of asset returns.
pnl = returns @ weights                          # (1000,) shape

# Covariance matrix (annualised, assuming daily returns).
cov = np.cov(returns, rowvar=False) * 252        # (5, 5)

# Portfolio variance = w^T Σ w
port_var = weights @ cov @ weights
port_vol = np.sqrt(port_var)
print(port_vol)`,
    explanation:
      "The matrix shape of portfolio math (returns @ w, w.T @ Σ @ w) is exactly what an interviewer wants to see you compute in numpy. Always sanity-check dimensions: (T,N) @ (N,) -> (T,).",
  },

  // ─────────── PRICING / RISK CORE ───────────
  {
    id: "pyfin-black-scholes",
    language: "python",
    title: "Black–Scholes call and put",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_price(S, K, r, q, sigma, T, kind="call"):
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / sT
    d2 = d1 - sT
    if kind == "call":
        return S * np.exp(-q * T) * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * np.exp(-q * T) * norm.cdf(-d1)

print(bs_price(100, 100, 0.05, 0.0, 0.2, 1.0))   # ~10.45`,
    explanation:
      "European option closed-form. Inputs: spot, strike, risk-free, dividend yield, vol, time-to-expiry. Vectorises over arrays of S/K/T for instant pricing of a whole grid.",
  },
  {
    id: "pyfin-greeks",
    language: "python",
    title: "Option Greeks (analytic)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def greeks(S, K, r, q, sigma, T):
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / sT
    d2 = d1 - sT
    pdf = norm.pdf(d1)

    delta_call = np.exp(-q * T) * norm.cdf(d1)
    gamma = np.exp(-q * T) * pdf / (S * sT)
    vega = S * np.exp(-q * T) * pdf * np.sqrt(T)
    theta_call = (-S * np.exp(-q * T) * pdf * sigma / (2 * np.sqrt(T))
                  - r * K * np.exp(-r * T) * norm.cdf(d2)
                  + q * S * np.exp(-q * T) * norm.cdf(d1))
    rho_call = K * T * np.exp(-r * T) * norm.cdf(d2)
    return delta_call, gamma, vega, theta_call, rho_call`,
    explanation:
      "Greeks are sensitivities of the option price to inputs. Delta hedges spot exposure; gamma is the curvature of delta; vega is your vol exposure; theta is time decay; rho is interest-rate sensitivity. Vega and gamma are highest for at-the-money options.",
  },
  {
    id: "pyfin-implied-vol",
    language: "python",
    title: "Implied volatility (Newton's method)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def implied_vol(target, S, K, r, q, T, kind="call", tol=1e-8, max_iter=80):
    sigma = 0.3   # initial guess
    for _ in range(max_iter):
        sT = sigma * np.sqrt(T)
        d1 = (np.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / sT
        d2 = d1 - sT
        if kind == "call":
            price = S * np.exp(-q * T) * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        else:
            price = K * np.exp(-r * T) * norm.cdf(-d2) - S * np.exp(-q * T) * norm.cdf(-d1)
        vega = S * np.exp(-q * T) * norm.pdf(d1) * np.sqrt(T)
        diff = price - target
        if abs(diff) < tol:
            return sigma
        sigma -= diff / max(vega, 1e-12)   # guard vega ~ 0
    return sigma`,
    explanation:
      "IV is the sigma that makes BS price the observed market price. Newton converges in ~5–10 iterations for liquid options. For deep ITM/OTM or near expiry, vega goes to zero — fall back to Brent's method bracketed in [1e-4, 5.0].",
  },
  {
    id: "pyfin-monte-carlo",
    language: "python",
    title: "Monte Carlo option pricer",
    tag: "finance",
    code: `import numpy as np

def mc_call(S, K, r, sigma, T, n=200_000, seed=42):
    rng = np.random.default_rng(seed)
    z = rng.standard_normal(n)
    # Antithetic variates: pair z with -z, halves variance for free.
    z = np.concatenate([z, -z])
    ST = S * np.exp((r - 0.5 * sigma ** 2) * T + sigma * np.sqrt(T) * z)
    payoff = np.maximum(ST - K, 0.0)
    return np.exp(-r * T) * payoff.mean()

print(mc_call(100, 100, 0.05, 0.2, 1.0))   # ~10.45 (should match BS)`,
    explanation:
      "MC error shrinks as O(1/sqrt(n)). Antithetic variates and control variates (price an easier-to-price derivative analytically and subtract) are the standard variance-reduction toolkit. For Asian/barrier options, simulate the full path.",
  },
  {
    id: "pyfin-binomial-tree",
    language: "python",
    title: "Binomial tree (CRR) — American option",
    tag: "finance",
    code: `import numpy as np

def crr_american_put(S, K, r, sigma, T, N=200):
    dt = T / N
    u = np.exp(sigma * np.sqrt(dt))
    d = 1 / u
    p = (np.exp(r * dt) - d) / (u - d)
    disc = np.exp(-r * dt)

    # Terminal stock prices and payoffs
    j = np.arange(N + 1)
    S_T = S * u ** (N - j) * d ** j
    V = np.maximum(K - S_T, 0.0)

    # Walk back, allowing early exercise
    for step in range(N - 1, -1, -1):
        S_T = S * u ** (step - np.arange(step + 1)) * d ** np.arange(step + 1)
        V = disc * (p * V[:-1] + (1 - p) * V[1:])
        V = np.maximum(V, K - S_T)    # exercise if intrinsic > continuation
    return V[0]`,
    explanation:
      "CRR binomial handles early exercise naturally — at each node compare continuation value to intrinsic. American calls on non-dividend stocks are never optimally exercised early (= European), but American puts can be.",
  },
  {
    id: "pyfin-sharpe-sortino",
    language: "python",
    title: "Sharpe and Sortino ratios",
    tag: "finance",
    code: `import numpy as np

def sharpe(returns, rf=0.0, periods_per_year=252):
    excess = returns - rf / periods_per_year
    return np.sqrt(periods_per_year) * excess.mean() / excess.std(ddof=1)

def sortino(returns, rf=0.0, periods_per_year=252):
    excess = returns - rf / periods_per_year
    downside = excess[excess < 0]
    dd_std = np.sqrt((downside ** 2).mean())
    return np.sqrt(periods_per_year) * excess.mean() / dd_std`,
    explanation:
      "Sharpe penalises all volatility; Sortino only penalises downside. A strategy with positive skew (rare big wins) looks bad in Sharpe but good in Sortino. Always report both — they tell different stories about the same equity curve.",
  },
  {
    id: "pyfin-max-drawdown",
    language: "python",
    title: "Max drawdown",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def max_drawdown(equity: pd.Series) -> tuple[float, pd.Timestamp, pd.Timestamp]:
    rolling_max = equity.cummax()
    drawdown = equity / rolling_max - 1.0
    trough_idx = drawdown.idxmin()
    peak_idx = equity.loc[:trough_idx].idxmax()
    return drawdown.min(), peak_idx, trough_idx

# Calmar ratio = annual return / |max drawdown|
def calmar(returns: pd.Series, periods_per_year: int = 252) -> float:
    eq = (1 + returns).cumprod()
    mdd, _, _ = max_drawdown(eq)
    ann_ret = (1 + returns).prod() ** (periods_per_year / len(returns)) - 1
    return ann_ret / abs(mdd) if mdd != 0 else float("inf")`,
    explanation:
      "Max drawdown is what your investors actually feel — peak-to-trough drop on the equity curve. Calmar (annual return / |MDD|) is a more honest reward/risk ratio than Sharpe for strategies with fat tails.",
  },
  {
    id: "pyfin-var-historical",
    language: "python",
    title: "Value at Risk — historical and parametric",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

returns = np.random.standard_normal(2520) * 0.01   # 10y of fake daily returns

# Historical VaR — empirical quantile. 95% VaR over 1 day.
hist_var_95 = -np.quantile(returns, 0.05)

# Parametric (Gaussian) VaR — assumes normality (it isn't, but useful baseline).
mu, sigma = returns.mean(), returns.std(ddof=1)
param_var_95 = -(mu + sigma * norm.ppf(0.05))

# Expected Shortfall (Conditional VaR) — average loss given you're past VaR.
es_95 = -returns[returns <= np.quantile(returns, 0.05)].mean()

print(hist_var_95, param_var_95, es_95)`,
    explanation:
      "VaR answers 'how bad can a normal-ish day get'. ES (CVaR) answers 'when it goes bad, how bad'. Parametric VaR understates tail risk because real returns have fat tails — pair with stress tests or use Student's t.",
  },
  {
    id: "pyfin-corr-cov",
    language: "python",
    title: "Correlation and covariance matrices",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

returns = pd.DataFrame({
    "AAPL": np.random.standard_normal(1000) * 0.015,
    "MSFT": np.random.standard_normal(1000) * 0.015,
    "GLD":  np.random.standard_normal(1000) * 0.008,
})
returns["MSFT"] = 0.6 * returns["AAPL"] + 0.8 * returns["MSFT"]

corr = returns.corr()
cov = returns.cov() * 252        # annualised

# Eigen-decomposition reveals dominant factors (PCA in disguise).
vals, vecs = np.linalg.eigh(cov.values)
print(vals[::-1])                # largest first
print(corr)`,
    explanation:
      "Covariance is the foundation of portfolio optimisation. The largest eigenvalue of the equity covariance matrix is almost always 'the market factor'. Shrinkage estimators (Ledoit-Wolf) are the practical fix for noisy sample covariance with few observations.",
  },

  // ─────────── STATS / TIME SERIES ───────────
  {
    id: "pyfin-ols-regression",
    language: "python",
    title: "OLS regression with statsmodels",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm

# Returns of asset and benchmark
ra = np.random.standard_normal(500) * 0.01
rb = np.random.standard_normal(500) * 0.01

# Add an intercept column for alpha
X = sm.add_constant(rb)
model = sm.OLS(ra, X).fit()
alpha, beta = model.params
print(model.summary())
# t-stats > 2 means roughly 95% significance; check Durbin-Watson for autocorr`,
    explanation:
      "OLS gives you beta (sensitivity to benchmark) and alpha (excess return after explaining away benchmark exposure). Always read the t-stats — a beta of 1.2 with t=0.5 is statistically indistinguishable from 0.",
  },
  {
    id: "pyfin-arima",
    language: "python",
    title: "ARIMA / autocorrelation",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm

# Daily returns rarely have meaningful autocorrelation; volatility does.
ret = np.random.standard_normal(500) * 0.01

# Ljung-Box: is the series autocorrelated?
lb = sm.stats.acorr_ljungbox(ret, lags=[10], return_df=True)
print(lb)

# Fit ARIMA(1, 0, 1) — for stationary series like returns
fit = sm.tsa.ARIMA(ret, order=(1, 0, 1)).fit()
print(fit.summary())`,
    explanation:
      "Use ACF/PACF plots to choose p and q. Returns are usually 'white noise' at the daily level — most of the structure is in volatility (use GARCH) or cross-sectional (use factor models).",
  },
  {
    id: "pyfin-garch",
    language: "python",
    title: "GARCH(1,1) volatility clustering",
    tag: "finance",
    code: `# pip install arch
from arch import arch_model
import numpy as np

ret = np.random.standard_normal(1000) * 0.01

# Returns scale matters for the optimiser — multiply by 100.
am = arch_model(ret * 100, mean="Constant", vol="GARCH", p=1, q=1)
res = am.fit(disp="off")
print(res.summary())

# Forecast next-period conditional variance
forecast = res.forecast(horizon=1)
next_var = forecast.variance.values[-1, 0]
print("next-day var:", next_var)`,
    explanation:
      "Markets cluster volatility — big moves follow big moves. GARCH(1,1) parameters omega, alpha, beta capture mean reversion to long-run vol, sensitivity to shocks, and persistence. Used everywhere for VaR and option pricing.",
  },
  {
    id: "pyfin-cointegration",
    language: "python",
    title: "Cointegration (Engle–Granger)",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import coint, adfuller

x = np.cumsum(np.random.standard_normal(500))
y = 0.7 * x + np.random.standard_normal(500)

# Engle-Granger test on the pair
t_stat, p_value, crit = coint(x, y)
print(p_value)     # < 0.05 -> cointegrated

# Residual stationarity (manual): regress y on x, ADF on the residuals.
X = sm.add_constant(x)
beta = sm.OLS(y, X).fit().params
spread = y - (beta[0] + beta[1] * x)
print(adfuller(spread)[1])      # ADF p-value`,
    explanation:
      "Cointegration is the formal version of 'pairs trade'. Each series can be a random walk, but a linear combination is stationary — meaning it mean-reverts. Trade the spread when it's far from zero; size by spread vol.",
  },

  // ─────────── STRATEGIES / BACKTESTING ───────────
  {
    id: "pyfin-sma-crossover",
    language: "python",
    title: "SMA crossover signal",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

px = df["close"]
fast = px.rolling(20, min_periods=20).mean()
slow = px.rolling(60, min_periods=60).mean()

# Position: long when fast > slow, flat otherwise. Shift by 1 — you can only
# act on the signal AFTER the bar closes.
position = (fast > slow).astype(int).shift(1).fillna(0)

# Daily strategy return
ret = px.pct_change()
strat_ret = position * ret
equity = (1 + strat_ret).cumprod()`,
    explanation:
      "The simplest momentum strategy. The .shift(1) is the most-forgotten line in a backtest — without it you're using the close to predict the same close (look-ahead bias). Add transaction costs by subtracting `position.diff().abs() * cost`.",
  },
  {
    id: "pyfin-mean-reversion",
    language: "python",
    title: "Z-score mean reversion (pairs)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# spread = y - beta * x  (compute beta once via OLS on training window)
spread = pd.Series(...)        # placeholder

# Rolling z-score: how far is the spread from its recent mean, in stdevs?
window = 60
z = (spread - spread.rolling(window).mean()) / spread.rolling(window).std()

# Position: enter at |z| > 2, exit at |z| < 0.5
pos = pd.Series(0, index=z.index)
pos[z > 2.0] = -1     # spread is rich -> short y, long x
pos[z < -2.0] = 1     # spread is cheap -> long y, short x
pos = pos.replace(0, np.nan).ffill().fillna(0)
pos[z.abs() < 0.5] = 0

pos = pos.shift(1).fillna(0)   # act on next bar`,
    explanation:
      "Classic statistical arbitrage. You're betting the spread will revert to its mean. Risk: the cointegration relationship breaks (structural change) and you average down into a losing position — always have a stop based on time or |z| extreme.",
  },
  {
    id: "pyfin-backtest-skeleton",
    language: "python",
    title: "Backtest skeleton (vectorised)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def backtest(px: pd.Series, signal: pd.Series, cost_bps: float = 1.0) -> dict:
    # Position from -1..1, shifted to avoid look-ahead.
    pos = signal.shift(1).fillna(0).clip(-1, 1)
    ret = np.log(px / px.shift(1))
    turnover = pos.diff().abs().fillna(0)
    costs = turnover * cost_bps * 1e-4
    pnl = pos * ret - costs

    eq = pnl.cumsum().pipe(np.exp)
    mdd = (eq / eq.cummax() - 1).min()
    sharpe = np.sqrt(252) * pnl.mean() / pnl.std(ddof=1)
    return {"equity": eq, "sharpe": sharpe, "max_dd": mdd, "turnover": turnover.mean()}`,
    explanation:
      "A vectorised backtest runs in milliseconds — enabling parameter sweeps and walk-forward validation. Always model transaction costs (turnover * cost) and slippage; a 'Sharpe 3' that turns to 'Sharpe 0.5' after costs is a real strategy and you should know which side of the line you're on.",
  },
  {
    id: "pyfin-walk-forward",
    language: "python",
    title: "Walk-forward validation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def walk_forward(data: pd.DataFrame, train_days: int, test_days: int, fit_fn, predict_fn):
    n = len(data)
    out = []
    start = 0
    while start + train_days + test_days <= n:
        train = data.iloc[start:start + train_days]
        test = data.iloc[start + train_days:start + train_days + test_days]
        model = fit_fn(train)
        preds = predict_fn(model, test)
        out.append(preds)
        start += test_days       # slide forward; non-overlapping test windows
    return pd.concat(out)`,
    explanation:
      "Walk-forward is the honest way to backtest. You re-fit periodically using only past data and evaluate on the next window. Single train/test splits or full-sample optimisation overfit catastrophically on finance data because of regime changes.",
  },

  // ─────────── QUANT INTERVIEW PROBABILITY ───────────
  {
    id: "pyfin-coin-prob",
    language: "python",
    title: "Probability brainteaser — biased coin from fair",
    tag: "finance",
    code: `import random

def fair_from_biased(biased_flip):
    """Von Neumann trick: flip the biased coin twice.
    HT -> return 0, TH -> return 1, HH/TT -> retry.
    Works for any bias 0 < p < 1."""
    while True:
        a = biased_flip()
        b = biased_flip()
        if a != b:
            return 0 if a == 1 else 1

# Example: a coin that lands heads 70% of the time.
def biased():
    return 1 if random.random() < 0.7 else 0

counts = [0, 0]
for _ in range(100_000):
    counts[fair_from_biased(biased)] += 1
print(counts)   # ~50/50`,
    explanation:
      "Classic quant phone-screen problem. The key insight: P(HT) = p(1-p) = P(TH), regardless of p. Discard the symmetric cases and you've extracted a fair bit. Generalises to extracting many bits efficiently via interval encoding.",
  },
  {
    id: "pyfin-st-petersburg",
    language: "python",
    title: "Monte Carlo expected value (St. Petersburg)",
    tag: "finance",
    code: `import random

def play():
    """Pay $2^n if first tails appears on flip n. Expected value is infinite,
    but real humans wouldn't pay $20 for it — a paradox about utility theory."""
    n = 1
    while random.random() < 0.5:    # heads -> keep flipping
        n += 1
    return 2 ** n

trials = 200_000
total = sum(play() for _ in range(trials))
print("empirical EV:", total / trials)   # grows without bound as trials increase`,
    explanation:
      "Don't conflate expected value with rational price. Markets exhibit similar utility-curvature effects — investors require risk premium far beyond what a linear EV model implies, especially for fat-tailed and unbounded payoffs.",
  },
];
