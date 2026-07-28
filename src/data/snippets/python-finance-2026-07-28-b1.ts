import type { Snippet } from "./types";

export const pythonFinanceSnippets20260728B1: Snippet[] = [
  {
    id: "pyfin-20260728-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Volatility Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def heston_mc(S0, K, T, r, kappa, theta, xi, rho, v0, n_paths=100_000, n_steps=252):
    """Full-truncation Euler scheme for Heston model."""
    dt = T / n_steps
    sqrt_dt = np.sqrt(dt)

    S = np.full(n_paths, S0, dtype=np.float64)
    v = np.full(n_paths, v0, dtype=np.float64)

    corr = np.array([[1, rho], [rho, 1]])
    L = np.linalg.cholesky(corr)

    for _ in range(n_steps):
        Z = np.random.standard_normal((2, n_paths))
        W = L @ Z  # correlated Brownians
        v_pos = np.maximum(v, 0.0)
        sqrt_v = np.sqrt(v_pos)

        S *= np.exp((r - 0.5 * v_pos) * dt + sqrt_v * sqrt_dt * W[0])
        v += kappa * (theta - v_pos) * dt + xi * sqrt_v * sqrt_dt * W[1]
        # full truncation: reflect negative variance to zero
        v = np.maximum(v, 0.0)

    payoff = np.maximum(S - K, 0.0)
    price = np.exp(-r * T) * payoff.mean()
    se = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)
    return price, se

price, se = heston_mc(S0=100, K=100, T=1.0, r=0.05,
                      kappa=2.0, theta=0.04, xi=0.3, rho=-0.7, v0=0.04)
print(f"Heston call: {price:.4f} ± {1.96*se:.4f}")`,
    explanation:
      "Simulates the Heston (1993) stochastic-volatility model using a full-truncation Euler scheme with Cholesky-correlated Brownians. kappa=mean-reversion speed, theta=long-run variance, xi=vol-of-vol, rho=spot/vol correlation. Full truncation prevents negative variance without reflection bias.",
  },
  {
    id: "pyfin-20260728-b1-garch11",
    language: "python",
    title: "GARCH(1,1) Estimation via MLE",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_loglik(params, returns):
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10
    n = len(returns)
    sigma2 = np.zeros(n)
    sigma2[0] = np.var(returns)
    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
    ll = -0.5 * np.sum(np.log(2 * np.pi * sigma2) + returns**2 / sigma2)
    return -ll  # minimise negative log-likelihood

np.random.seed(42)
# simulate GARCH(1,1) returns
true_omega, true_alpha, true_beta = 1e-6, 0.1, 0.85
n = 2000
eps = np.random.standard_normal(n)
sigma2 = np.zeros(n); sigma2[0] = true_omega / (1 - true_alpha - true_beta)
r = np.zeros(n)
for t in range(1, n):
    sigma2[t] = true_omega + true_alpha * r[t-1]**2 + true_beta * sigma2[t-1]
    r[t] = np.sqrt(sigma2[t]) * eps[t]

res = minimize(garch11_loglik, x0=[1e-6, 0.1, 0.8], args=(r,),
               method="L-BFGS-B",
               bounds=[(1e-9, None), (0, 1), (0, 1)])
omega_hat, alpha_hat, beta_hat = res.x
print(f"omega={omega_hat:.2e}  alpha={alpha_hat:.4f}  beta={beta_hat:.4f}")
print(f"persistence = {alpha_hat + beta_hat:.4f}")`,
    explanation:
      "Fits GARCH(1,1) via maximum likelihood (Gaussian errors). The persistence alpha+beta measures how quickly variance shocks decay; values near 1 imply long-memory volatility. Used widely in risk management to forecast intraday/daily VaR.",
  },
  {
    id: "pyfin-20260728-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Interest Rate Tree",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_tree(market_yields, market_vols, dt=1.0):
    """Build BDT short-rate tree matching yield curve and vol structure."""
    n = len(market_yields)
    # Convert par yields to discount factors
    P = np.zeros(n + 1); P[0] = 1.0
    for i, y in enumerate(market_yields):
        P[i+1] = (1 - y * sum(P[1:i+1] * dt)) / (1 + y * dt)

    r_tree = [None] * n
    # period 0: short rate from 1-period discount factor
    r_tree[0] = np.array([-np.log(P[1]) / dt])

    for m in range(1, n):
        sigma = market_vols[m]

        def price_bond(r0_low):
            r = np.array([r0_low * np.exp(2 * sigma * dt * k) for k in range(m + 1)])
            V = np.ones(m + 2)  # bond value at maturity
            for j in range(m, -1, -1):
                disc = np.exp(-r[j] * dt)
                V_new = 0.5 * disc * (V[j] + V[j+1]) if j < m + 1 else disc * V[j]
                V[j] = 0.5 * disc * (V[j] + V[j+1])
            # recompute properly
            V = np.ones(m + 2)
            for step in range(m, -1, -1):
                V_step = np.zeros(step + 1)
                for j in range(step + 1):
                    rj = r0_low * np.exp(2 * sigma * dt * j)
                    V_step[j] = 0.5 * np.exp(-rj * dt) * (V[j] + V[j+1])
                V = V_step
            return V[0] - P[m+1]

        r0 = brentq(price_bond, 1e-6, 0.5)
        r_tree[m] = np.array([r0 * np.exp(2 * sigma * dt * k) for k in range(m + 1)])

    return r_tree

yields = [0.03, 0.035, 0.04, 0.042, 0.044]
vols   = [0.00, 0.18, 0.17, 0.16, 0.15]
tree = bdt_tree(yields, vols)
for i, nodes in enumerate(tree):
    print(f"t={i}: {np.round(nodes*100, 3)} %")`,
    explanation:
      "Builds a Black-Derman-Toy (1990) binomial short-rate tree calibrated to the observed yield curve and cap volatility structure. At each step, Brent's method finds the base rate r0_low such that the model-implied discount factor matches the market discount factor.",
  },
  {
    id: "pyfin-20260728-b1-merton-structural",
    language: "python",
    title: "Merton Structural Credit Model",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import fsolve

def merton_equity(V, sigma_V, D, T, r):
    """Equity value and sigma_E from Merton model (KMV approach)."""
    d1 = (np.log(V / D) + (r + 0.5 * sigma_V**2) * T) / (sigma_V * np.sqrt(T))
    d2 = d1 - sigma_V * np.sqrt(T)
    E = V * norm.cdf(d1) - D * np.exp(-r * T) * norm.cdf(d2)
    delta = norm.cdf(d1)
    sigma_E = (V * sigma_V * delta) / E
    return E, sigma_E

def solve_merton(E_obs, sigma_E_obs, D, T, r):
    """Recover asset value V and sigma_V from observed equity."""
    def equations(x):
        V, sigma_V = x
        E_hat, sigma_E_hat = merton_equity(V, sigma_V, D, T, r)
        return [E_hat - E_obs, sigma_E_hat - sigma_E_obs]

    V0 = E_obs + D
    sol = fsolve(equations, x0=[V0, sigma_E_obs * E_obs / V0], full_output=True)
    V, sigma_V = sol[0]
    return V, sigma_V

E_obs, sigma_E, D, T, r = 80.0, 0.25, 100.0, 1.0, 0.05
V, sigma_V = solve_merton(E_obs, sigma_E, D, T, r)

d1 = (np.log(V/D) + (r + 0.5*sigma_V**2)*T) / (sigma_V*np.sqrt(T))
d2 = d1 - sigma_V*np.sqrt(T)
pd = norm.cdf(-d2)   # risk-neutral default probability
dd = d2              # distance to default

print(f"Asset value V = {V:.2f}")
print(f"Asset vol sigma_V = {sigma_V:.4f}")
print(f"Distance to default = {dd:.4f}")
print(f"Risk-neutral PD = {pd:.4%}")`,
    explanation:
      "The Merton (1974) model treats equity as a call option on firm assets. Given observed equity value and equity volatility, we jointly solve for implied asset value V and asset volatility sigma_V. Distance-to-default (DD) and risk-neutral PD drive credit ratings and CDS pricing in KMV/Moody's Analytics.",
  },
  {
    id: "pyfin-20260728-b1-bond-duration-convexity",
    language: "python",
    title: "Bond Duration and Convexity",
    tag: "finance",
    code: `import numpy as np

def bond_analytics(face, coupon_rate, ytm, n_periods, freq=2):
    """Compute price, Macaulay duration, modified duration, convexity."""
    c = face * coupon_rate / freq          # coupon per period
    periods = np.arange(1, n_periods + 1)
    disc = (1 + ytm / freq) ** (-periods)
    cash_flows = np.full(n_periods, c)
    cash_flows[-1] += face                 # final principal

    price = np.sum(cash_flows * disc)
    # Macaulay duration in periods
    mac_dur_periods = np.sum(periods * cash_flows * disc) / price
    mac_dur_years = mac_dur_periods / freq
    mod_dur = mac_dur_years / (1 + ytm / freq)

    # Convexity (in years^2)
    convexity = (np.sum(periods * (periods + 1) * cash_flows * disc)
                 / (price * (1 + ytm / freq)**2 * freq**2))

    return price, mac_dur_years, mod_dur, convexity

face, coupon_rate, ytm, n_periods = 1000, 0.06, 0.07, 10

price, mac_dur, mod_dur, conv = bond_analytics(face, coupon_rate, ytm, n_periods)
print(f"Price:              {price:.4f}")
print(f"Macaulay duration:  {mac_dur:.4f} yr")
print(f"Modified duration:  {mod_dur:.4f} yr")
print(f"Convexity:          {conv:.4f} yr^2")

# Price approximation for +100bps shock
dy = 0.01
dp_approx = -mod_dur * dy + 0.5 * conv * dy**2
print(f"Approx dP/P for +100bp: {dp_approx:.4%}")

price_exact, *_ = bond_analytics(face, coupon_rate, ytm + dy, n_periods)
print(f"Exact   dP/P for +100bp: {(price_exact - price)/price:.4%}")`,
    explanation:
      "Computes the full suite of fixed-income analytics. Macaulay duration is the present-value-weighted time to cash flows; modified duration approximates the price-yield sensitivity (-dP/P ≈ ModDur * dy); convexity adds the second-order correction, improving accuracy for large yield moves.",
  },
  {
    id: "pyfin-20260728-b1-swap-dv01",
    language: "python",
    title: "IRS Swap Pricing and DV01",
    tag: "finance",
    code: `import numpy as np

def build_discount_curve(tenors, zero_rates):
    """Piecewise-linear zero rates to discount factors."""
    def df(t):
        r = np.interp(t, tenors, zero_rates)
        return np.exp(-r * t)
    return df

def swap_par_rate_dv01(notional, tenor_yrs, pay_freq, df_func):
    """Fixed rate that makes IRS NPV=0, plus DV01."""
    n = int(tenor_yrs * pay_freq)
    dt = 1.0 / pay_freq
    payment_times = np.array([(i+1) * dt for i in range(n)])
    dfs = np.array([df_func(t) for t in payment_times])

    # par swap rate = (1 - df_N) / annuity
    annuity = dt * np.sum(dfs)
    par_rate = (1.0 - dfs[-1]) / annuity

    # floating leg PV = notional * (1 - df_N)
    # fixed leg PV = notional * par_rate * annuity
    npv = notional * (dfs[-1] - 1 + par_rate * annuity)  # should be ~0

    # DV01: bump all zero rates by 1bp, recompute
    bump = 1e-4
    def df_bumped(t):
        r = np.interp(t, tenors, zero_rates) + bump
        return np.exp(-r * t)

    dfs_b = np.array([df_bumped(t) for t in payment_times])
    annuity_b = dt * np.sum(dfs_b)
    par_rate_b = (1.0 - dfs_b[-1]) / annuity_b
    fixed_pv_b = notional * par_rate * annuity_b
    float_pv_b = notional * (1 - dfs_b[-1])
    npv_b = float_pv_b - fixed_pv_b
    dv01 = npv_b / bump * 1e-4  # per bp

    return par_rate, annuity, npv, dv01

tenors     = [0.25, 0.5, 1, 2, 3, 5, 7, 10]
zero_rates = [0.045, 0.046, 0.048, 0.050, 0.051, 0.052, 0.053, 0.054]
df = build_discount_curve(tenors, zero_rates)

rate, annuity, npv, dv01 = swap_par_rate_dv01(
    notional=10_000_000, tenor_yrs=5, pay_freq=2, df_func=df)
print(f"Par swap rate : {rate:.4%}")
print(f"Annuity       : {annuity:.6f}")
print(f"NPV (should≈0): {npv:.2f}")
print(f"DV01          : \${dv01:,.0f} per bp")`,
    explanation:
      "Prices a vanilla interest-rate swap (IRS) using a discount curve bootstrapped from zero rates. The par rate equates fixed and floating NPV. DV01 (dollar value of 1 basis point) measures parallel interest-rate risk — essential for hedging and limits management.",
  },
  {
    id: "pyfin-20260728-b1-momentum-signal",
    language: "python",
    title: "Cross-Sectional Momentum Factor",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

np.random.seed(7)
n_stocks, n_days = 50, 504  # ~2 years daily

# simulate log-returns
returns = pd.DataFrame(
    np.random.randn(n_days, n_stocks) * 0.01 + 0.0002,
    columns=[f"S{i:02d}" for i in range(n_stocks)]
)

def momentum_signal(returns, lookback=252, skip=21):
    """12-1 momentum: cumulative return over [skip+1, lookback] days back."""
    total = (1 + returns).rolling(lookback).apply(np.prod, raw=True) - 1
    recent = (1 + returns).rolling(skip).apply(np.prod, raw=True) - 1
    signal = (1 + total) / (1 + recent) - 1  # skip last month
    return signal

def long_short_portfolio(signal, n_long=10, n_short=10):
    """Dollar-neutral momentum portfolio returns."""
    port_returns = []
    for date in signal.index[1:]:
        prev_signal = signal.loc[date]
        if prev_signal.isna().all():
            continue
        ranked = prev_signal.rank(ascending=False)
        long_mask  = ranked <= n_long
        short_mask = ranked > (len(ranked) - n_short)
        w = pd.Series(0.0, index=ranked.index)
        w[long_mask]  =  1.0 / n_long
        w[short_mask] = -1.0 / n_short
        ret = (w * returns.loc[date]).sum()
        port_returns.append(ret)
    return pd.Series(port_returns)

sig = momentum_signal(returns)
port_ret = long_short_portfolio(sig.shift(1))  # avoid look-ahead

cum_ret = (1 + port_ret).cumprod()
ann_ret = port_ret.mean() * 252
ann_vol = port_ret.std() * np.sqrt(252)
sharpe  = ann_ret / ann_vol

print(f"Annualised return : {ann_ret:.2%}")
print(f"Annualised vol    : {ann_vol:.2%}")
print(f"Sharpe ratio      : {sharpe:.3f}")
print(f"Final NAV         : {cum_ret.iloc[-1]:.4f}")`,
    explanation:
      "Implements the classic 12-1 cross-sectional momentum factor: rank stocks on their 12-month return excluding the most recent month (skip=21 days), go long top decile, short bottom decile. shift(1) prevents look-ahead bias by using yesterday's signal to form today's positions.",
  },
  {
    id: "pyfin-20260728-b1-risk-parity",
    language: "python",
    title: "Risk Parity Portfolio Allocation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_parity(cov_matrix, target_risk=None):
    """
    Equal risk contribution (ERC) portfolio.
    Each asset contributes equally to total portfolio variance.
    """
    n = len(cov_matrix)
    if target_risk is None:
        target_risk = np.ones(n) / n  # equal risk budget

    def risk_contributions(w):
        port_var = w @ cov_matrix @ w
        mrc = cov_matrix @ w           # marginal risk contributions
        trc = w * mrc / port_var       # total risk contributions (fractional)
        return trc

    def objective(w):
        trc = risk_contributions(w)
        diff = trc - target_risk
        return np.sum(diff**2)

    constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1}
    bounds = [(1e-6, 1.0)] * n
    w0 = np.ones(n) / n

    res = minimize(objective, w0, method="SLSQP",
                   bounds=bounds, constraints=constraints,
                   options={"ftol": 1e-12, "maxiter": 1000})
    w = res.x / res.x.sum()
    return w, risk_contributions(w)

# Example: 4 asset classes with stylized correlations
vols = np.array([0.15, 0.20, 0.08, 0.12])   # equities, EM, bonds, gold
corr = np.array([
    [1.00,  0.75,  -0.30, 0.05],
    [0.75,  1.00,  -0.20, 0.10],
    [-0.30, -0.20,  1.00, 0.15],
    [0.05,  0.10,   0.15, 1.00],
])
cov = np.diag(vols) @ corr @ np.diag(vols)

w, trc = risk_parity(cov)
assets = ["Equity", "EM", "Bonds", "Gold"]
for a, wi, ri in zip(assets, w, trc):
    print(f"{a:8s}: weight={wi:.4f}  risk_contrib={ri:.4f}")

port_vol = np.sqrt(w @ cov @ w)
print(f"\\nPortfolio vol: {port_vol:.4%}")`,
    explanation:
      "Risk Parity (Bridgewater All Weather style) allocates so each asset contributes equally to total portfolio variance. The optimisation minimises squared deviations of fractional risk contributions from 1/N. In practice this heavily overweights bonds due to their lower volatility.",
  },
  {
    id: "pyfin-20260728-b1-kupiec-backtest",
    language: "python",
    title: "Kupiec POF Test for VaR Backtest",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import chi2

def kupiec_pof_test(returns, var_series, confidence=0.99):
    """
    Kupiec (1995) Proportion of Failures (POF) test for VaR model validity.
    H0: actual violation rate == expected (1-confidence).
    """
    # violation: return < -VaR
    violations = returns < -var_series
    T = len(returns)
    N = violations.sum()
    p = 1 - confidence          # expected violation probability
    p_hat = N / T               # observed violation rate

    if N == 0 or N == T:
        return {"N": N, "p_hat": p_hat, "LR_uc": np.inf, "p_value": 0.0,
                "reject": True}

    # Likelihood ratio statistic (unconditional coverage)
    lr_uc = -2 * (N * np.log(p / p_hat) + (T - N) * np.log((1 - p) / (1 - p_hat)))
    p_value = 1 - chi2.cdf(lr_uc, df=1)
    reject = p_value < 0.05

    return {"T": T, "N": int(N), "expected_N": p * T,
            "p_hat": p_hat, "LR_uc": lr_uc,
            "p_value": p_value, "reject": reject}

np.random.seed(0)
T = 500
true_sigma = 0.01
returns = np.random.normal(0, true_sigma, T)

# Correct VaR model (parametric, 99% confidence)
from scipy.stats import norm
var_correct = norm.ppf(0.01) * true_sigma * (-1)  # scalar; positive number
var_correct_series = np.full(T, var_correct)

# Underestimated VaR (too low)
var_bad_series = np.full(T, var_correct * 0.7)

for label, vs in [("Correct VaR", var_correct_series), ("Underestimated VaR", var_bad_series)]:
    res = kupiec_pof_test(returns, vs)
    print(f"\\n{label}")
    print(f"  Violations: {res['N']}/{res['T']} (expected {res['expected_N']:.1f})")
    print(f"  p-hat={res['p_hat']:.3%}  LR={res['LR_uc']:.3f}  p-value={res['p_value']:.4f}  reject={res['reject']}")`,
    explanation:
      "The Kupiec POF test uses a likelihood-ratio statistic to test whether the observed VaR violation rate equals the nominal level (e.g. 1% for 99% VaR). Regulators (Basel) require this: too many violations → capital add-on; too few → model may be too conservative.",
  },
  {
    id: "pyfin-20260728-b1-drawdown-analysis",
    language: "python",
    title: "Drawdown and Calmar Ratio Analysis",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def drawdown_analysis(returns):
    """Compute drawdown series, max drawdown, Calmar, and Ulcer index."""
    cum = (1 + returns).cumprod()
    rolling_max = cum.cummax()
    dd = (cum - rolling_max) / rolling_max   # negative values

    max_dd = dd.min()

    # Duration of worst drawdown
    in_dd = dd < 0
    # find longest consecutive drawdown
    durations = []
    count = 0
    for x in in_dd:
        if x:
            count += 1
        else:
            if count > 0:
                durations.append(count)
            count = 0
    if count > 0:
        durations.append(count)
    max_duration = max(durations) if durations else 0

    ann_ret = returns.mean() * 252
    calmar = ann_ret / abs(max_dd)

    # Ulcer Index: RMS of % drawdown (penalises depth AND duration)
    ulcer = np.sqrt((dd**2).mean())

    return {
        "max_drawdown": max_dd,
        "max_duration_days": max_duration,
        "calmar_ratio": calmar,
        "ulcer_index": ulcer,
        "drawdown_series": dd,
    }

np.random.seed(1)
daily_returns = pd.Series(np.random.normal(0.0004, 0.012, 1260))  # 5 years
res = drawdown_analysis(daily_returns)

print(f"Max Drawdown    : {res['max_drawdown']:.2%}")
print(f"Max DD Duration : {res['max_duration_days']} days")
print(f"Calmar Ratio    : {res['calmar_ratio']:.3f}")
print(f"Ulcer Index     : {res['ulcer_index']:.4f}")`,
    explanation:
      "Calculates the full drawdown profile. Max drawdown is the peak-to-trough loss. Calmar ratio = annualised return / |max drawdown| — preferred over Sharpe for trend-following strategies. Ulcer Index penalises both depth and duration of drawdowns, better capturing investor pain.",
  },
  {
    id: "pyfin-20260728-b1-roll-spread",
    language: "python",
    title: "Roll's Effective Bid-Ask Spread Estimator",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def roll_spread(prices):
    """
    Roll (1984) implicit bid-ask spread from price serial covariance.
    Spread = 2 * sqrt(-Cov(dP_t, dP_{t-1}))
    Assumes transaction prices bounce between bid and ask.
    """
    dp = np.diff(prices)
    cov = np.cov(dp[:-1], dp[1:])[0, 1]
    if cov >= 0:
        # Positive covariance: Roll estimate undefined; return 0
        return 0.0, cov
    spread = 2 * np.sqrt(-cov)
    return spread, cov

def roll_rolling(prices, window=60):
    """Rolling Roll spread estimate."""
    spreads = []
    for i in range(window, len(prices)):
        s, _ = roll_spread(prices[i-window:i])
        spreads.append(s)
    return pd.Series(spreads, index=pd.RangeIndex(window, len(prices)))

np.random.seed(5)
n = 500
# Simulate bid-ask bounce around a midprice random walk
mid = 100 + np.cumsum(np.random.normal(0, 0.1, n))
true_half_spread = 0.05
side = np.random.choice([-1, 1], n)
transaction_prices = mid + true_half_spread * side

spread, cov = roll_spread(transaction_prices)
print(f"True spread      : {2*true_half_spread:.4f}")
print(f"Roll spread est  : {spread:.4f}")
print(f"Serial covariance: {cov:.6f}")

roll_ts = roll_rolling(transaction_prices, window=60)
print(f"\\nRolling mean spread: {roll_ts.mean():.4f}")
print(f"Rolling std spread : {roll_ts.std():.4f}")`,
    explanation:
      "Roll (1984) shows that if prices bounce between bid and ask, the first-order autocovariance of price changes equals -s²/4 where s is the effective spread. This allows implicit spread estimation without order book data — useful for illiquid markets or historical analysis.",
  },
  {
    id: "pyfin-20260728-b1-vasicek-calibration",
    language: "python",
    title: "Vasicek Short Rate Model Calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def vasicek_bond_price(r0, kappa, theta, sigma, T):
    """Analytical Vasicek zero-coupon bond price P(0,T)."""
    B = (1 - np.exp(-kappa * T)) / kappa
    A = np.exp((theta - sigma**2 / (2 * kappa**2)) * (B - T)
               - sigma**2 * B**2 / (4 * kappa))
    return A * np.exp(-B * r0)

def vasicek_yield(r0, kappa, theta, sigma, T):
    """Vasicek model-implied yield R(0,T) = -log P(0,T) / T."""
    P = vasicek_bond_price(r0, kappa, theta, sigma, T)
    return -np.log(P) / T

# Market zero-coupon yields
mkt_tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10])
mkt_yields = np.array([0.045, 0.047, 0.049, 0.051, 0.052, 0.053, 0.054, 0.055])

def objective(params):
    kappa, theta, sigma, r0 = params
    if kappa <= 0 or sigma <= 0 or r0 <= 0:
        return 1e10
    model_yields = np.array([vasicek_yield(r0, kappa, theta, sigma, T)
                              for T in mkt_tenors])
    return np.sum((model_yields - mkt_yields)**2)

res = minimize(objective, x0=[0.3, 0.05, 0.01, 0.045],
               method="Nelder-Mead",
               options={"xatol": 1e-8, "fatol": 1e-10, "maxiter": 10000})
kappa, theta, sigma, r0 = res.x

print(f"kappa (mean reversion) = {kappa:.4f}")
print(f"theta (long-run mean)  = {theta:.4%}")
print(f"sigma (vol)            = {sigma:.4%}")
print(f"r0    (current rate)   = {r0:.4%}")

print("\\nFit quality:")
for T, y_mkt in zip(mkt_tenors, mkt_yields):
    y_mod = vasicek_yield(r0, kappa, theta, sigma, T)
    print(f"  T={T:4.2f}  mkt={y_mkt:.3%}  model={y_mod:.3%}  err={y_mod-y_mkt:.1e}")`,
    explanation:
      "Calibrates the Vasicek (1977) mean-reverting short-rate model to the observed yield curve. The closed-form bond pricing formula makes calibration fast. kappa controls mean reversion speed; theta is the long-run equilibrium rate; sigma drives rate volatility.",
  },
  {
    id: "pyfin-20260728-b1-random-forest-alpha",
    language: "python",
    title: "Random Forest Alpha Signal for Equities",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score

np.random.seed(42)
n, n_feats = 1000, 10
# Simulate features: momentum, value, quality, etc.
X = pd.DataFrame(np.random.randn(n, n_feats),
                 columns=[f"f{i}" for i in range(n_feats)])
# Target: 1 if next-month return > 0 (classification)
y = (np.random.randn(n) + 0.01 * X["f0"] - 0.005 * X["f1"] > 0).astype(int)

tscv = TimeSeriesSplit(n_splits=5)
scores, predictions = [], []

for train_idx, test_idx in tscv.split(X):
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    clf = RandomForestClassifier(
        n_estimators=100, max_depth=4, min_samples_leaf=20,
        max_features="sqrt", random_state=42, n_jobs=-1
    )
    clf.fit(X_train, y_train)
    prob = clf.predict_proba(X_test)[:, 1]  # P(up)

    # Long when P(up) > 0.55, short when < 0.45
    signal = np.where(prob > 0.55, 1, np.where(prob < 0.45, -1, 0))
    predictions.extend(list(zip(y_test, prob, signal)))
    scores.append(accuracy_score(y_test, clf.predict(X_test)))

print(f"Mean OOS accuracy : {np.mean(scores):.3f}")

# Feature importance from last fold
importances = pd.Series(clf.feature_importances_, index=X.columns)
print("\\nTop 5 features:")
print(importances.nlargest(5).round(4).to_string())`,
    explanation:
      "Trains a Random Forest classifier on financial features using TimeSeriesSplit to avoid lookahead bias. Signal generation: high predicted P(up) → long, low → short. Key settings: max_depth=4 prevents overfitting; min_samples_leaf=20 ensures statistical significance; sqrt features for decorrelation.",
  },
  {
    id: "pyfin-20260728-b1-barra-risk",
    language: "python",
    title: "Barra-Style Factor Risk Attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def barra_risk_attribution(weights, factor_exposures, factor_cov, idio_var):
    """
    Decompose portfolio risk into factor and idiosyncratic components.
    weights: (n,) portfolio weights
    factor_exposures: (n, k) exposure matrix B
    factor_cov: (k, k) factor covariance F
    idio_var: (n,) idiosyncratic variances Delta
    """
    # Total covariance: Sigma = B F B' + Delta
    B = factor_exposures
    total_var = weights @ (B @ factor_cov @ B.T + np.diag(idio_var)) @ weights

    # Factor risk
    factor_var = weights @ B @ factor_cov @ B.T @ weights

    # Factor contributions
    factor_port_exp = B.T @ weights             # (k,) portfolio factor exposures
    factor_contributions = factor_port_exp * (factor_cov @ factor_port_exp)

    # Idiosyncratic risk
    idio_var_port = weights**2 @ idio_var

    total_vol = np.sqrt(total_var)
    factor_vol = np.sqrt(factor_var)
    idio_vol   = np.sqrt(idio_var_port)

    return {
        "total_vol": total_vol,
        "factor_vol": factor_vol,
        "idio_vol": idio_vol,
        "factor_pct": factor_var / total_var,
        "factor_contributions": factor_contributions,
    }

n_stocks, n_factors = 20, 5
np.random.seed(3)
B = np.random.randn(n_stocks, n_factors)   # exposures
F = np.eye(n_factors) * np.array([0.04, 0.02, 0.01, 0.015, 0.008])  # factor variances
idio = np.random.uniform(0.0025, 0.01, n_stocks)

w = np.random.dirichlet(np.ones(n_stocks))  # random long-only portfolio

res = barra_risk_attribution(w, B, F, idio)
factor_names = ["Market", "Value", "Momentum", "Quality", "LowVol"]
print(f"Total vol  : {res['total_vol']:.4%}")
print(f"Factor vol : {res['factor_vol']:.4%} ({res['factor_pct']:.1%} of total var)")
print(f"Idio vol   : {res['idio_vol']:.4%}")
print("\\nFactor variance contributions:")
for name, fc in zip(factor_names, res["factor_contributions"]):
    print(f"  {name:10s}: {fc:.6f}")`,
    explanation:
      "Implements Barra-style multi-factor risk decomposition: Sigma = BFB' + Delta. Portfolio variance is split into systematic (factor) and idiosyncratic parts. Factor contributions isolate which systematic exposures dominate risk — critical for risk management, attribution reporting, and hedging.",
  },
  {
    id: "pyfin-20260728-b1-quanto-option",
    language: "python",
    title: "Quanto Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def quanto_call(S, K, T, r_d, r_f, sigma_S, sigma_FX, rho, Q0=1.0):
    """
    Price a quanto call option (payoff in domestic currency).
    S: underlying price in foreign currency
    K: strike in foreign currency
    r_d: domestic risk-free rate
    r_f: foreign risk-free rate
    sigma_S: volatility of underlying
    sigma_FX: volatility of FX (foreign/domestic)
    rho: correlation between S and FX
    Q0: current FX rate (units of domestic per foreign)

    In the quanto measure, the underlying drifts at r_d - q - rho*sigma_S*sigma_FX
    """
    # Quanto drift adjustment
    quanto_drift = r_d - r_f - rho * sigma_S * sigma_FX

    d1 = (np.log(S / K) + (quanto_drift + 0.5 * sigma_S**2) * T) / (sigma_S * np.sqrt(T))
    d2 = d1 - sigma_S * np.sqrt(T)

    # Domestic discount factor; payoff delivered at Q0 regardless of FX move
    call = Q0 * np.exp(-r_d * T) * (S * np.exp(quanto_drift * T) * norm.cdf(d1)
                                     - K * norm.cdf(d2))
    return call

# Example: Nikkei quanto call, payoff in USD
S, K = 38000, 38000  # Nikkei level
T, r_d, r_f = 1.0, 0.05, 0.001  # 1yr, USD rate, JPY rate
sigma_S, sigma_FX, rho = 0.20, 0.08, -0.30  # typical negative Nikkei/USDJPY corr
Q0 = 1.0 / 150  # 1 JPY = 1/150 USD; quote per unit

price_quanto = quanto_call(S, K, T, r_d, r_f, sigma_S, sigma_FX, rho, Q0)

# Vanilla (ignoring FX risk) for comparison
from scipy.stats import norm as _norm
d1 = (np.log(S/K) + (r_f + 0.5*sigma_S**2)*T) / (sigma_S*np.sqrt(T))
d2 = d1 - sigma_S*np.sqrt(T)
price_vanilla_jpy = np.exp(-r_f*T) * (S*norm.cdf(d1) - K*norm.cdf(d2))
price_vanilla_usd = price_vanilla_jpy * Q0

print(f"Quanto call (USD)        : \${price_quanto:,.2f}")
print(f"Vanilla call (USD equiv) : \${price_vanilla_usd:,.2f}")
print(f"Quanto adjustment        : \${price_quanto - price_vanilla_usd:+,.2f}")`,
    explanation:
      "A quanto option pays in domestic currency regardless of FX moves. The FX risk is borne by the seller. Pricing uses a drift adjustment: r_d - r_f - rho*sigma_S*sigma_FX. Negative rho (Nikkei/USDJPY) makes quant calls cheaper than vanilla since falling equities tend to come with rising JPY.",
  },
  {
    id: "pyfin-20260728-b1-floating-lookback-mc",
    language: "python",
    title: "Floating Lookback Option Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def lookback_put_mc(S0, T, r, sigma, n_paths=200_000, n_steps=252):
    """MC price for floating-strike lookback put: payoff = max(S_t) - S_T."""
    dt = T / n_steps
    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = S0

    Z = np.random.standard_normal((n_paths, n_steps))
    for t in range(n_steps):
        paths[:, t+1] = paths[:, t] * np.exp(
            (r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z[:, t]
        )

    S_max = paths.max(axis=1)
    S_T   = paths[:, -1]
    payoff = S_max - S_T
    price  = np.exp(-r * T) * payoff.mean()
    se     = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)
    return price, se

def lookback_put_closed_form(S0, T, r, sigma):
    """Goldman-Sosin-Gatto (1979) closed-form for floating lookback put."""
    a1 = (np.log(S0/S0) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    a2 = a1 - sigma*np.sqrt(T)
    a3 = (np.log(S0/S0) + (-r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))  # m0=S0

    price = (S0 * norm.cdf(a1)
             - S0 * norm.cdf(a2)
             - S0 * sigma**2 / (2*r) * (norm.cdf(a1) - np.exp(-r*T) * norm.cdf(a3))
             + S0 * np.exp(-r*T) * norm.cdf(-a3)
             - S0 * np.exp(-r*T))
    # Simplified: at inception m0 = S0, formula collapses
    d1 = (r/sigma + sigma/2) * np.sqrt(T)
    d2 = d1 - sigma * np.sqrt(T)
    d3 = (r/sigma - sigma/2) * np.sqrt(T)
    price_cf = (S0 * norm.cdf(d1)
                - S0 * np.exp(-r*T) * norm.cdf(d2)
                - S0 * sigma**2/(2*r) * (norm.cdf(d1) - np.exp(-r*T) * norm.cdf(d3)))
    return price_cf

np.random.seed(0)
S0, T, r, sigma = 100.0, 1.0, 0.05, 0.20
mc_price, mc_se = lookback_put_mc(S0, T, r, sigma)
cf_price = lookback_put_closed_form(S0, T, r, sigma)
print(f"MC price         : {mc_price:.4f} ± {1.96*mc_se:.4f}")
print(f"Closed-form price: {cf_price:.4f}")`,
    explanation:
      "A floating-strike lookback put pays the difference between the realised maximum and final stock price — it 'looks back' to let you sell at the peak. MC simulation is straightforward; the Goldman-Sosin-Gatto (1979) closed-form provides a fast and exact benchmark.",
  },
  {
    id: "pyfin-20260728-b1-ois-bootstrap",
    language: "python",
    title: "OIS Curve Bootstrapping",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_ois(tenors, rates, compounding="continuous"):
    """
    Bootstrap OIS zero rates from OIS swap quotes.
    Short end: rates are overnight compounded (simple approximation).
    Long end: each tenor gives par OIS rate; solve for zero rate iteratively.
    Returns: (tenors, zero_rates) arrays
    """
    zero_rates = np.zeros(len(tenors))
    discount_factors = np.zeros(len(tenors))

    for i, (T, par) in enumerate(zip(tenors, rates)):
        if T <= 1.0 / 12:  # very short end: direct
            zero_rates[i] = par
            discount_factors[i] = np.exp(-par * T)
            continue

        prev_tenors = tenors[:i]
        prev_dfs = discount_factors[:i]

        def ois_npv(z):
            df_T = np.exp(-z * T)
            # annual fixed payments (OIS convention: annual for > 1yr)
            dt = 1.0  # simplified: annual fixed payments
            payment_times = np.arange(dt, T + 1e-9, dt)
            pv_fixed = 0.0
            for pt in payment_times:
                if pt < tenors[i]:
                    # interpolate
                    r_interp = np.interp(pt, prev_tenors, zero_rates[:i])
                    pv_fixed += par * dt * np.exp(-r_interp * pt)
                else:
                    pv_fixed += par * dt * np.exp(-z * pt)
            # floating leg = 1 - df_T (assuming no spread)
            return (1 - df_T) - pv_fixed

        z0 = np.interp(T, prev_tenors, zero_rates[:i]) if i > 0 else par
        z_sol = brentq(ois_npv, 1e-6, 0.3, xtol=1e-12)
        zero_rates[i] = z_sol
        discount_factors[i] = np.exp(-z_sol * T)

    return zero_rates, discount_factors

tenors = np.array([1/12, 3/12, 6/12, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0])
ois_quotes = np.array([0.0440, 0.0445, 0.0448, 0.0452, 0.0455, 0.0458, 0.0462, 0.0465, 0.0468])

zeros, dfs = bootstrap_ois(tenors, ois_quotes)
print("Tenor  OIS Par  Zero Rate  DF")
for T, par, z, df in zip(tenors, ois_quotes, zeros, dfs):
    print(f"{T:5.2f}  {par:.4%}   {z:.4%}   {df:.6f}")`,
    explanation:
      "Bootstraps an OIS (Overnight Index Swap) discount curve from quoted par rates. Since the 2008 crisis, OIS rates replaced LIBOR as the risk-free discounting curve. Each point solves for the zero rate z such that the OIS swap NPV = 0, using previously bootstrapped discount factors for earlier coupon payments.",
  },
  {
    id: "pyfin-20260728-b1-variance-swap",
    language: "python",
    title: "Variance Swap Replication and Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.integrate import quad
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    if K <= 0 or sigma <= 0:
        return max(S - K * np.exp(-r*T), 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, T, r, sigma):
    call = bs_call(S, K, T, r, sigma)
    return call - S + K*np.exp(-r*T)

def fair_variance_strike(S0, T, r, sigma_func, K_min=None, K_max=None, n=500):
    """
    Britten-Jones & Neuberger replication:
    K_var = (2/T) * [integral of puts (K<F) + calls (K>=F)] / K^2 dK
    where F = S0 * exp(r*T) is the forward.
    sigma_func: implied vol as a function of K (can be flat for BS).
    """
    F = S0 * np.exp(r * T)
    if K_min is None:
        K_min = F * 0.5
    if K_max is None:
        K_max = F * 2.0

    Ks = np.linspace(K_min, K_max, n)
    integral = 0.0
    dK = Ks[1] - Ks[0]
    for K in Ks:
        iv = sigma_func(K)
        if K < F:
            price = bs_put(S0, K, T, r, iv)
        else:
            price = bs_call(S0, K, T, r, iv)
        integral += price / K**2 * dK

    K_var = (2 / T) * np.exp(r * T) * integral
    return K_var, np.sqrt(K_var)  # fair variance strike, fair vol strike

S0, T, r, flat_vol = 100.0, 1.0, 0.05, 0.20
sigma_func_flat = lambda K: flat_vol

K_var, K_vol = fair_variance_strike(S0, T, r, sigma_func_flat)
print(f"Fair variance strike K_var : {K_var:.6f}")
print(f"Fair vol strike sqrt(K_var): {K_vol:.4%}")
print(f"Flat vol (should match)     : {flat_vol:.4%}")

# Under skew: downward sloping smile increases variance strike
def skew_vol(K, atm=0.20, skew=-0.05):
    return atm + skew * np.log(S0 / K)

K_var_skew, K_vol_skew = fair_variance_strike(S0, T, r, skew_vol)
print(f"\\nWith -5% skew:")
print(f"Fair variance strike: {K_var_skew:.6f}")
print(f"Fair vol strike     : {K_vol_skew:.4%}")`,
    explanation:
      "Prices a variance swap using the Britten-Jones & Neuberger (2000) model-free replication: K_var = (2/T) * ∫ options/K² dK. Under a flat smile this recovers ATM vol. Under negative skew, the fair variance strike exceeds ATM vol² because OTM puts have elevated implied vols — explaining the variance risk premium.",
  },
  {
    id: "pyfin-20260728-b1-factor-attribution",
    language: "python",
    title: "Multi-Factor Return Attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def factor_attribution(portfolio_returns, factor_returns, factor_names=None):
    """
    Ordinary least squares factor attribution.
    Decomposes portfolio returns into factor exposures + alpha + residual.
    """
    n, k = factor_returns.shape
    if factor_names is None:
        factor_names = [f"F{i}" for i in range(k)]

    # Add intercept (alpha)
    X = np.column_stack([np.ones(n), factor_returns])
    beta, res, rank, sv = np.linalg.lstsq(X, portfolio_returns, rcond=None)
    alpha = beta[0]
    factor_betas = beta[1:]

    # Predicted returns and residuals
    y_hat = X @ beta
    residuals = portfolio_returns - y_hat

    # Attribution: how much did each factor contribute to avg return?
    avg_factor_returns = factor_returns.mean(axis=0)
    factor_contrib = factor_betas * avg_factor_returns  # (k,)

    ann = 252
    r2 = 1 - np.var(residuals) / np.var(portfolio_returns)
    t_stats = beta / (np.std(residuals) / np.sqrt(n) / np.sqrt(
        np.diag(np.linalg.inv(X.T @ X))))

    result = pd.DataFrame({
        "beta": np.append(alpha, factor_betas),
        "t_stat": t_stats,
        "avg_contrib (daily)": np.append(alpha, factor_contrib),
    }, index=["Alpha"] + factor_names)

    return result, r2, residuals

np.random.seed(99)
n_days = 500
mkt   = np.random.normal(0.0005, 0.010, n_days)
value = np.random.normal(0.0002, 0.005, n_days)
mom   = np.random.normal(0.0003, 0.006, n_days)

# Portfolio = 1.1*mkt + 0.3*value - 0.1*mom + alpha + noise
port = 0.0001 + 1.1*mkt + 0.3*value - 0.1*mom + np.random.normal(0, 0.003, n_days)

factors = np.column_stack([mkt, value, mom])
result, r2, resid = factor_attribution(port, factors, ["Market", "Value", "Momentum"])

print(f"R^2: {r2:.4f}")
print("\\nAttribution table (daily):")
print(result.round(6).to_string())
print(f"\\nAnnualised alpha: {result.loc['Alpha', 'beta'] * 252:.4%}")`,
    explanation:
      "Runs OLS factor attribution to decompose portfolio returns into alpha, factor betas, and residual. Contribution = beta × average factor return shows how much each factor historically explained. t-statistics measure statistical significance. R² shows how much variance factors explain.",
  },
  {
    id: "pyfin-20260728-b1-hmm-regime",
    language: "python",
    title: "HMM Regime Detection on Returns",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def hmm_em(returns, n_states=2, n_iter=100):
    """
    EM algorithm for Gaussian HMM (Hidden Markov Model).
    Learns transition matrix A, emission means mu and sigmas.
    """
    n = len(returns)
    k = n_states

    # Initialise parameters
    np.random.seed(0)
    mu = np.array([-0.005, 0.005]) if k == 2 else np.random.randn(k) * 0.005
    sigma = np.full(k, 0.015)
    A = np.full((k, k), 1/k)
    pi = np.full(k, 1/k)

    for _ in range(n_iter):
        # E-step: forward-backward
        log_b = np.column_stack([norm.logpdf(returns, mu[j], sigma[j]) for j in range(k)])
        b = np.exp(log_b - log_b.max(axis=1, keepdims=True))  # scaled

        # Forward pass
        alpha = np.zeros((n, k))
        alpha[0] = pi * b[0]
        alpha[0] /= alpha[0].sum()
        scale = np.zeros(n)
        for t in range(1, n):
            alpha[t] = (alpha[t-1] @ A) * b[t]
            scale[t] = alpha[t].sum()
            alpha[t] /= scale[t] + 1e-300

        # Backward pass
        beta = np.ones((n, k))
        for t in range(n-2, -1, -1):
            beta[t] = (A * b[t+1] * beta[t+1]).sum(axis=1)
            beta[t] /= beta[t].sum() + 1e-300

        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)

        xi = np.zeros((n-1, k, k))
        for t in range(n-1):
            xi[t] = alpha[t:t+1].T * A * b[t+1] * beta[t+1]
            xi[t] /= xi[t].sum() + 1e-300

        # M-step
        pi = gamma[0]
        A = xi.sum(axis=0)
        A /= A.sum(axis=1, keepdims=True) + 1e-300
        for j in range(k):
            w = gamma[:, j]
            mu[j] = (w * returns).sum() / w.sum()
            sigma[j] = np.sqrt((w * (returns - mu[j])**2).sum() / w.sum())

    return gamma, mu, sigma, A

np.random.seed(7)
# Two-regime market: bull (low vol) and bear (high vol)
n = 500
state = np.random.choice([0, 1], n, p=[0.7, 0.3])
rets = np.where(state == 0,
                np.random.normal(0.0008, 0.008, n),   # bull
                np.random.normal(-0.001, 0.020, n))    # bear

gamma, mu, sigma, A = hmm_em(rets)
regime = gamma.argmax(axis=1)

# Sort by mean (state 0 = lower-return regime)
order = np.argsort(mu)
print("Regime parameters:")
for i, s in enumerate(order):
    print(f"  Regime {i}: mu={mu[s]:.4%}  sigma={sigma[s]:.4%}  "
          f"persistence={A[s,s]:.3f}")

print(f"\\nEstimated fraction in low-return regime: {(regime==order[0]).mean():.1%}")
print(f"True     fraction in bear regime:          {(state==1).mean():.1%}")`,
    explanation:
      "Fits a 2-state Gaussian Hidden Markov Model to detect market regimes (bull/bear) via the Baum-Welch (EM) algorithm. gamma[:,j] gives the posterior probability of being in state j at each time step. Regime-switching models underpin volatility forecasting, risk-on/risk-off signals, and tactical asset allocation.",
  },
];
