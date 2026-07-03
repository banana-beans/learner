import { Snippet } from "./types";

export const pythonFinanceSnippets20260703B1: Snippet[] = [
  {
    id: "pyfin-20260703-b1-merge-asof-nbbo",
    language: "python",
    tag: "finance",
    title: "merge_asof – NBBO Construction from Bid/Ask Streams",
    code: `import pandas as pd
import numpy as np

bids = pd.DataFrame({
    "timestamp": pd.to_datetime(
        ["09:30:00.100", "09:30:00.200", "09:30:00.500"], format="%H:%M:%S.%f"
    ),
    "bid": [99.95, 99.96, 99.94],
    "bid_size": [100, 200, 150],
})
asks = pd.DataFrame({
    "timestamp": pd.to_datetime(
        ["09:30:00.150", "09:30:00.300", "09:30:00.450"], format="%H:%M:%S.%f"
    ),
    "ask": [100.00, 100.01, 99.99],
    "ask_size": [100, 150, 200],
})

bids = bids.sort_values("timestamp")
asks = asks.sort_values("timestamp")

# merge_asof: for each bid, find the last ask with timestamp <= bid timestamp
nbbo = pd.merge_asof(bids, asks, on="timestamp", direction="backward")
nbbo["spread"] = nbbo["ask"] - nbbo["bid"]
nbbo["mid"] = (nbbo["bid"] + nbbo["ask"]) / 2
nbbo["imbalance"] = (nbbo["bid_size"] - nbbo["ask_size"]) / (
    nbbo["bid_size"] + nbbo["ask_size"]
)

print(nbbo[["timestamp", "bid", "ask", "spread", "mid", "imbalance"]])
# spread should be positive; imbalance > 0 means more bid depth (bullish lean)`,
    explanation:
      "pd.merge_asof aligns two tick streams by time without requiring exact timestamp matches. Direction='backward' picks the most recent ask tick at or before each bid tick — the standard way to reconstruct a National Best Bid and Offer (NBBO) snapshot from two separate quote feeds. The order book imbalance (bid_size − ask_size) / total is a common short-term alpha signal.",
  },
  {
    id: "pyfin-20260703-b1-einsum-portfolio-var",
    language: "python",
    tag: "finance",
    title: "np.einsum – Correlated Portfolio VaR",
    code: `import numpy as np

np.random.seed(42)
n_assets, n_sims = 5, 200_000

weights = np.array([0.30, 0.25, 0.20, 0.15, 0.10])

corr = np.array([
    [1.0, 0.6, 0.4, 0.2, 0.1],
    [0.6, 1.0, 0.5, 0.3, 0.2],
    [0.4, 0.5, 1.0, 0.4, 0.3],
    [0.2, 0.3, 0.4, 1.0, 0.5],
    [0.1, 0.2, 0.3, 0.5, 1.0],
])
ann_vols = np.array([0.20, 0.18, 0.22, 0.15, 0.25])
daily_vols = ann_vols / np.sqrt(252)
cov = np.outer(daily_vols, daily_vols) * corr

L = np.linalg.cholesky(cov)               # (n_assets, n_assets)
Z = np.random.standard_normal((n_assets, n_sims))
returns = L @ Z                            # (n_assets, n_sims)

# einsum: w_a * R_a_s → scalar per simulation  (sum over asset axis)
port_returns = np.einsum("a,as->s", weights, returns)

var_95  = np.percentile(port_returns, 5)
cvar_95 = port_returns[port_returns <= var_95].mean()

# Analytical 1-day 95% VaR for comparison
port_var_analytical = weights @ cov @ weights
analytical_var = 1.6449 * np.sqrt(port_var_analytical)

print(f"MC 1-day 95% VaR  : {-var_95:.4%}")
print(f"MC 1-day 95% CVaR : {-cvar_95:.4%}")
print(f"Analytical VaR    : {analytical_var:.4%}")`,
    explanation:
      "np.einsum('a,as->s', w, R) computes the portfolio return for each of the n_sims paths in one vectorised call — equivalent to (w @ R) but semantically explicit about which axis contracts. Correlated returns are generated via Cholesky decomposition: L @ Z ensures the cross-asset covariance structure. CVaR (Expected Shortfall) is the mean loss in the 5% tail, a coherent risk measure preferred by Basel III/FRTB.",
  },
  {
    id: "pyfin-20260703-b1-newton-raphson-iv",
    language: "python",
    tag: "finance",
    title: "Newton-Raphson Implied Volatility (BSM)",
    code: `import numpy as np
from scipy.stats import norm

def bsm_price(S, K, T, r, sigma, kind="call"):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if kind == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

def bsm_vega(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return S * norm.pdf(d1) * np.sqrt(T)

def implied_vol(market_price, S, K, T, r, kind="call", tol=1e-8, max_iter=100):
    sigma = 0.30  # initial guess
    for _ in range(max_iter):
        price = bsm_price(S, K, T, r, sigma, kind)
        vega  = bsm_vega(S, K, T, r, sigma)
        if abs(vega) < 1e-12:
            return None
        sigma -= (price - market_price) / vega
        sigma  = max(1e-6, min(sigma, 10.0))  # clamp to sensible range
        if abs(bsm_price(S, K, T, r, sigma, kind) - market_price) < tol:
            return sigma
    return None  # did not converge

# Example: solve for IV across a strike ladder
S, T, r = 100.0, 1.0, 0.05
true_iv   = 0.25
strikes   = [85, 90, 95, 100, 105, 110, 115]
print("Strike  Market Price  Implied Vol")
for K in strikes:
    mkt = bsm_price(S, K, T, r, true_iv)
    iv  = implied_vol(mkt, S, K, T, r)
    print(f"  {K:3d}     {mkt:8.4f}     {iv:.4%}")`,
    explanation:
      "Newton-Raphson converges quadratically once the initial guess is near the root. The update rule σ_{n+1} = σ_n − (BSM(σ_n) − market) / vega(σ_n) typically converges in 3–5 iterations for liquid options. Vega is positive and smooth so the method is stable; clamping σ to [1e-6, 10] prevents the iteration from wandering to negative or extreme values. Deep in-/out-of-the-money options may need a better initial guess (e.g. Brenner-Subrahmanyam approximation).",
  },
  {
    id: "pyfin-20260703-b1-rolling-ols-beta",
    language: "python",
    tag: "finance",
    title: "Rolling OLS Market Beta",
    code: `import numpy as np
import pandas as pd

np.random.seed(0)
n = 504  # 2 years of daily data
market = pd.Series(np.random.normal(5e-4, 0.010, n), name="market")
true_beta = 1.35
stock  = true_beta * market + pd.Series(np.random.normal(0, 0.007, n), name="stock")

window = 63  # ~1 quarter

betas, alphas = [], []
for i in range(window, n + 1):
    y = stock.values[i - window : i]
    x = market.values[i - window : i]
    X = np.column_stack([np.ones(window), x])
    coef, *_ = np.linalg.lstsq(X, y, rcond=None)
    alphas.append(coef[0])
    betas.append(coef[1])

idx = stock.index[window - 1 :]
rolling_beta  = pd.Series(betas,  index=idx, name="beta")
rolling_alpha = pd.Series(alphas, index=idx, name="alpha_daily")

print(f"True beta:         {true_beta:.4f}")
print(f"Mean rolling beta: {rolling_beta.mean():.4f}")
print(f"Beta std:          {rolling_beta.std():.4f}")
print(f"Beta 5th–95th pct: {rolling_beta.quantile(0.05):.4f} – {rolling_beta.quantile(0.95):.4f}")

# Annualise alpha (Jensen's alpha)
ann_alpha = rolling_alpha.mean() * 252
print(f"Annualised alpha:  {ann_alpha:.4%}")`,
    explanation:
      "Rolling OLS beta measures how a stock's sensitivity to the market changes over time — a static CAPM beta misses regime shifts. Each window solves the 2-parameter OLS [α, β] = (X'X)^{-1}X'y. A 63-day (quarterly) window balances estimation noise vs. staleness. The intercept α is Jensen's alpha: excess return above what CAPM predicts. Hedge funds monitor rolling beta to ensure systematic exposure stays within mandate limits.",
  },
  {
    id: "pyfin-20260703-b1-pca-yield-curve",
    language: "python",
    tag: "finance",
    title: "PCA Yield Curve – Level, Slope, Curvature",
    code: `import numpy as np
import pandas as pd

np.random.seed(42)
tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
n_days = 500

# Simulate yield changes with realistic factor structure
level     = np.random.normal(0, 0.010, n_days)
slope     = np.random.normal(0, 0.005, n_days)
curvature = np.random.normal(0, 0.002, n_days)

factor_loads = np.column_stack([
    np.ones(len(tenors)),                          # level: parallel shift
    np.linspace(-1, 1, len(tenors)),               # slope: short↑ long↓
    np.sin(np.pi * np.linspace(0, 1, len(tenors))),  # curvature: belly
])
changes = np.column_stack([level, slope, curvature]) @ factor_loads.T  # (n_days, n_tenors)
changes += np.random.normal(0, 0.001, changes.shape)  # idiosyncratic noise

cov = np.cov(changes.T)
eigenvalues, eigenvectors = np.linalg.eigh(cov)
# eigh returns ascending order; reverse for descending
idx = np.argsort(eigenvalues)[::-1]
eigenvalues = eigenvalues[idx]
eigenvectors = eigenvectors[:, idx]

explained = eigenvalues / eigenvalues.sum()
labels = ["Level", "Slope", "Curvature"]
print("PC   Explained    Cumulative   Interpretation")
cumul = 0.0
for k in range(3):
    cumul += explained[k]
    print(f"PC{k+1}   {explained[k]:.1%}       {cumul:.1%}        {labels[k]}")

loadings = pd.DataFrame(
    eigenvectors[:, :3], index=tenors, columns=["PC1", "PC2", "PC3"]
)
print("\\nFactor loadings (by tenor):")
print(loadings.round(3).to_string())`,
    explanation:
      "PCA on daily yield changes decomposes curve movements into orthogonal factors. In practice the first three PCs explain ~99% of variance: PC1 is a near-parallel shift (level), PC2 tilts short vs long end (slope/carry), PC3 bends the belly (curvature/butterfly). Fixed-income portfolio managers hedge with DV01s projected onto these three factors — a much smaller hedge set than one instrument per tenor. The loadings matrix tells you how many units of each PC risk you own per dollar of position.",
  },
  {
    id: "pyfin-20260703-b1-swap-bootstrap",
    language: "python",
    tag: "finance",
    title: "Swap Bootstrapping – Par to Zero Curve",
    code: `import numpy as np

def bootstrap_zero_rates(par_rates, tenors):
    """
    Bootstrap continuously compounded zero rates from annual-coupon par swap rates.
    Assumes integer consecutive tenors (1Y, 2Y, 3Y, ...) for simplicity.
    """
    dfs = []      # discount factors at each tenor
    zeros = {}

    for i, (T, par) in enumerate(zip(tenors, par_rates)):
        # Par bond pricing: 1 = par * sum(prev DFs) + (1 + par) * DF(T)
        coupon_pv = par * sum(dfs)
        df_T = (1.0 - coupon_pv) / (1.0 + par)
        dfs.append(df_T)
        zeros[T] = -np.log(df_T) / T  # continuously compounded

    return zeros, dfs

# Example: 1Y–5Y par rates from a hypothetical OIS/swap curve
par_rates = [0.038, 0.041, 0.044, 0.046, 0.047]
tenors    = [1, 2, 3, 4, 5]
zeros, dfs = bootstrap_zero_rates(par_rates, tenors)

print(f"{'Tenor':>6}  {'Par Rate':>9}  {'Zero Rate':>10}  {'Disc Factor':>12}  {'Fwd Rate':>9}")
for i, (T, par) in enumerate(zip(tenors, par_rates)):
    fwd = None
    if i > 0:
        T_prev = tenors[i - 1]
        fwd = (dfs[i - 1] / dfs[i] - 1.0) / (T - T_prev)
    fwd_str = f"{fwd:.3%}" if fwd is not None else "   N/A"
    print(f"{T:>5}Y  {par:>9.3%}  {zeros[T]:>10.3%}  {dfs[i]:>12.6f}  {fwd_str:>9}")`,
    explanation:
      "Bootstrapping inverts the par-swap pricing formula to recover the discount curve. At each maturity T the DF is uniquely pinned because all earlier DFs are already known: DF(T) = (1 − par × Σ prev_DFs) / (1 + par). Once discount factors are known, continuously compounded zero rates follow from DF = exp(−r·T), and the forward rate between consecutive pillars is DF(T_{i-1})/DF(T_i) − 1. This zero curve feeds into derivative pricing (caplets, swaptions, FRAs).",
  },
  {
    id: "pyfin-20260703-b1-vasicek-mc",
    language: "python",
    tag: "finance",
    title: "Vasicek Short-Rate Monte Carlo",
    code: `import numpy as np

def vasicek_mc(r0, kappa, theta, sigma, T, n_steps, n_paths, seed=42):
    """Euler-Maruyama discretisation of Vasicek: dr = kappa(theta-r)dt + sigma dW."""
    np.random.seed(seed)
    dt = T / n_steps
    sqrt_dt = np.sqrt(dt)

    r = np.full(n_paths, r0)
    integral = np.zeros(n_paths)     # running ∫r dt

    for _ in range(n_steps):
        dW = np.random.standard_normal(n_paths)
        dr = kappa * (theta - r) * dt + sigma * sqrt_dt * dW
        r  = r + dr
        integral += r * dt           # trapezoidal approx (good enough at 500 steps)

    # P(0,T) = E[exp(-∫_0^T r_t dt)]
    mc_price = np.exp(-integral).mean()
    mc_se    = np.exp(-integral).std() / np.sqrt(n_paths)

    # Vasicek analytical ZCB price
    B = (1 - np.exp(-kappa * T)) / kappa
    A_exp = np.exp(
        (theta - sigma**2 / (2 * kappa**2)) * (B - T)
        - sigma**2 * B**2 / (4 * kappa)
    )
    analytical = A_exp * np.exp(-B * r0)

    return mc_price, mc_se, analytical

r0, kappa, theta, sigma, T = 0.05, 1.5, 0.04, 0.015, 5.0
mc_p, mc_se, ana_p = vasicek_mc(r0, kappa, theta, sigma, T, 500, 50_000)
print(f"MC bond price:         {mc_p:.6f}  (±{1.96*mc_se:.6f}  95% CI)")
print(f"Analytical bond price: {ana_p:.6f}")
print(f"Difference:            {abs(mc_p - ana_p):.6f}")`,
    explanation:
      "The Vasicek model dr = κ(θ−r)dt + σdW is the simplest mean-reverting short-rate model. κ controls speed of mean reversion, θ is the long-run rate, σ is vol. The zero-coupon bond price has a closed-form: P(0,T) = A·exp(−B·r₀) where B = (1−e^{−κT})/κ — useful for calibration validation. The Euler-Maruyama scheme is exact in distribution for this Gaussian model; the small MC vs analytical gap is purely discretisation and sampling error.",
  },
  {
    id: "pyfin-20260703-b1-gaussian-copula-credit",
    language: "python",
    tag: "finance",
    title: "Gaussian Copula – Credit Basket Loss Distribution",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_basket(
    n_names, rho, hazard_rates, recovery, T, n_sims=100_000, seed=42
):
    """
    One-factor Gaussian copula credit basket.
    Each name shares a common factor M ~ N(0,1) and idiosyncratic noise epsilon.
    X_i = sqrt(rho)*M + sqrt(1-rho)*eps_i
    Name i defaults when X_i < Phi^{-1}(1 - exp(-lambda_i * T)).
    """
    np.random.seed(seed)
    M   = np.random.standard_normal(n_sims)                    # common factor
    eps = np.random.standard_normal((n_names, n_sims))         # idiosyncratic

    X = np.sqrt(rho) * M + np.sqrt(1.0 - rho) * eps           # (n_names, n_sims)

    surv_prob  = np.exp(-hazard_rates[:, None] * T)            # (n_names, 1)
    threshold  = norm.ppf(1.0 - surv_prob)                     # default boundary

    defaults   = (X < threshold).astype(float)                 # 1 = default
    lgd        = 1.0 - recovery
    loss_frac  = defaults.sum(axis=0) * lgd / n_names          # portfolio loss %

    return {
        "expected_loss" : loss_frac.mean(),
        "loss_std"      : loss_frac.std(),
        "var_99"        : np.percentile(loss_frac, 99),
        "var_999"       : np.percentile(loss_frac, 99.9),
        "default_rate"  : defaults.mean(),
    }

n_names      = 125
hazard_rates = np.full(n_names, 0.02)   # 2% flat hazard for each name
result = gaussian_copula_basket(n_names, rho=0.30, hazard_rates=hazard_rates,
                                recovery=0.40, T=5.0)
for k, v in result.items():
    print(f"{k:15s}: {v:.4%}")`,
    explanation:
      "The Gaussian copula underpins CDO/CLO tranche pricing (Li 2000). The common factor ρ drives default correlation: when ρ→0 defaults are independent and the loss distribution is binomial; when ρ→1 all names default together. Typical IG portfolios use ρ≈0.10–0.25; stressed correlations can reach 0.50+. The 99.9% VaR (super-senior tranche threshold) is extremely sensitive to ρ, the model's main weakness — widely acknowledged post-GFC.",
  },
  {
    id: "pyfin-20260703-b1-dv01-key-rates",
    language: "python",
    tag: "finance",
    title: "DV01 and Modified Duration via Finite Difference",
    code: `import numpy as np

def bond_price(ytm, coupon_rate, face, T, freq=2):
    n      = int(T * freq)
    coupon = coupon_rate * face / freq
    t_arr  = np.arange(1, n + 1) / freq
    pv     = np.sum(coupon / (1 + ytm / freq) ** (t_arr * freq))
    pv    += face / (1 + ytm / freq) ** n
    return pv

def duration_convexity(ytm, coupon_rate, face, T, freq=2):
    n      = int(T * freq)
    coupon = coupon_rate * face / freq
    t_arr  = np.arange(1, n + 1) / freq
    df     = (1 + ytm / freq) ** (t_arr * freq)
    cf     = np.full(n, coupon); cf[-1] += face

    price   = (cf / df).sum()
    mac_dur = (t_arr * cf / df).sum() / price  # Macaulay duration
    mod_dur = mac_dur / (1 + ytm / freq)       # Modified duration

    # Convexity (second-order price sensitivity)
    convex  = (t_arr * (t_arr + 1/freq) * cf / df).sum() / (price * (1 + ytm/freq)**2)

    return price, mac_dur, mod_dur, convex

def dv01(ytm, coupon_rate, face, T, freq=2, bump=1e-4):
    p_up   = bond_price(ytm + bump, coupon_rate, face, T, freq)
    p_down = bond_price(ytm - bump, coupon_rate, face, T, freq)
    return (p_down - p_up) / 2.0   # per 1 bp (0.01%)

ytm, coupon, face, T = 0.052, 0.050, 1_000, 10
price, mac_d, mod_d, convex = duration_convexity(ytm, coupon, face, T)
dv01_val = dv01(ytm, coupon, face, T)

print(f"Price             : {price:.4f}")
print(f"Macaulay Duration : {mac_d:.4f} years")
print(f"Modified Duration : {mod_d:.4f}")
print(f"DV01              : {dv01_val:.4f}  (P&L per 1bp yield move)")
print(f"Convexity         : {convex:.4f}")
# 2nd-order price approx: ΔP ≈ -ModDur*P*Δy + 0.5*Convexity*P*(Δy)^2
dy = 0.01  # 100bp shock
dp_approx = -mod_d * price * dy + 0.5 * convex * price * dy**2
dp_exact  = bond_price(ytm + dy, coupon, face, T) - price
print(f"\\n100bp shock — approx: {dp_approx:.4f}  exact: {dp_exact:.4f}")`,
    explanation:
      "Modified duration measures the percentage price change per unit yield move; DV01 (dollar value of a basis point) translates that into dollars. The two-point finite difference DV01 = (P(y−Δy) − P(y+Δy))/2 matches the first derivative exactly as Δy→0. Convexity captures the curvature: bonds with higher convexity gain more when yields fall than they lose when yields rise by the same amount, a property valued in falling-rate environments.",
  },
  {
    id: "pyfin-20260703-b1-performance-analytics",
    language: "python",
    tag: "finance",
    title: "Sharpe, Sortino, Calmar, Max Drawdown",
    code: `import numpy as np
import pandas as pd

def performance_analytics(returns, rf_annual=0.04, periods=252):
    r  = np.asarray(returns, dtype=float)
    rf = rf_annual / periods

    ann_ret  = np.prod(1 + r) ** (periods / len(r)) - 1
    ann_vol  = r.std(ddof=1) * np.sqrt(periods)
    sharpe   = (ann_ret - rf_annual) / ann_vol

    excess   = r - rf
    downside = excess[excess < 0]
    down_vol = np.sqrt((downside ** 2).mean()) * np.sqrt(periods)
    sortino  = (ann_ret - rf_annual) / down_vol if down_vol > 0 else np.inf

    cum   = np.cumprod(1 + r)
    peak  = np.maximum.accumulate(cum)
    dd    = (cum - peak) / peak
    max_dd = dd.min()

    calmar = ann_ret / abs(max_dd) if max_dd != 0 else np.inf

    # Omega ratio: P(return > threshold) / P(return < threshold)
    threshold = rf
    gains   = (r[r > threshold] - threshold).sum()
    losses  = (threshold - r[r < threshold]).sum()
    omega   = gains / losses if losses > 0 else np.inf

    return pd.Series({
        "ann_return"   : ann_ret,
        "ann_vol"      : ann_vol,
        "sharpe"       : sharpe,
        "sortino"      : sortino,
        "max_drawdown" : max_dd,
        "calmar"       : calmar,
        "omega"        : omega,
    })

np.random.seed(42)
returns = np.random.normal(0.0009, 0.011, 252 * 3)  # 3Y of daily returns
metrics = performance_analytics(returns)
for k, v in metrics.items():
    fmt = ".2%" if k in ("ann_return", "ann_vol", "max_drawdown") else ".4f"
    print(f"{k:15s}: {v:{fmt}}")`,
    explanation:
      "Sharpe = (R_ann − r_f) / σ_ann penalises total volatility; Sortino replaces σ_ann with downside deviation, giving credit for upside vol. Calmar = R_ann / max_drawdown is used by trend-following CTA strategies where drawdown is the operational risk measure. The Omega ratio integrates the full return distribution above/below a threshold, making no normality assumptions — more informative for fat-tailed or skewed strategies.",
  },
  {
    id: "pyfin-20260703-b1-ou-mle-pairs",
    language: "python",
    tag: "finance",
    title: "Ornstein-Uhlenbeck MLE for Pairs Trading",
    code: `import numpy as np
from scipy.optimize import minimize

def ou_log_likelihood(params, spread, dt):
    kappa, theta, sigma = params
    if kappa <= 0 or sigma <= 0:
        return 1e10
    x  = spread[:-1]
    y  = spread[1:]
    ek = np.exp(-kappa * dt)
    mu_cond  = theta + (x - theta) * ek
    var_cond = sigma**2 * (1 - ek**2) / (2 * kappa)
    if var_cond <= 0:
        return 1e10
    ll = -0.5 * np.sum(np.log(2 * np.pi * var_cond) + (y - mu_cond)**2 / var_cond)
    return -ll

def fit_ou(spread, dt=1 / 252):
    result = minimize(
        ou_log_likelihood,
        x0=[3.0, 0.0, 0.1],
        args=(spread, dt),
        method="Nelder-Mead",
        options={"xatol": 1e-8, "fatol": 1e-8, "maxiter": 10_000},
    )
    kappa, theta, sigma = result.x
    half_life = np.log(2) / kappa
    ou_vol    = sigma / np.sqrt(2 * kappa)  # equilibrium std dev
    return {"kappa": kappa, "theta": theta, "sigma": sigma,
            "half_life_days": half_life * 252, "ou_vol": ou_vol}

# Simulate an OU spread
np.random.seed(42)
kappa_true, theta_true, sigma_true = 2.5, 0.0, 0.08
dt = 1 / 252
n  = 756  # 3 years
spread = [0.0]
for _ in range(n - 1):
    s = spread[-1]
    spread.append(s + kappa_true * (theta_true - s) * dt
                  + sigma_true * np.sqrt(dt) * np.random.randn())

params = fit_ou(np.array(spread))
print("Parameter   True    Fitted")
print(f"kappa       {kappa_true:.3f}   {params['kappa']:.3f}")
print(f"theta       {theta_true:.3f}   {params['theta']:.3f}")
print(f"sigma       {sigma_true:.3f}   {params['sigma']:.3f}")
print(f"half_life   {np.log(2)/kappa_true*252:.1f}d  {params['half_life_days']:.1f}d")`,
    explanation:
      "The OU process dX = κ(θ−X)dt + σdW is the continuous-time mean-reversion model for spread trading. The exact conditional distribution X_{t+dt}|X_t is Gaussian with computable mean and variance, enabling exact MLE (no Euler approximation needed). κ controls mean-reversion speed; the half-life log(2)/κ tells you how long to expect to hold a trade. Typical equity pairs have half-lives of 5–30 days; longer means more patience needed, shorter means higher turnover.",
  },
  {
    id: "pyfin-20260703-b1-walk-forward-backtest",
    language: "python",
    tag: "finance",
    title: "Walk-Forward Backtest with Expanding Window",
    code: `import numpy as np

np.random.seed(0)
n = 1260  # 5 years daily

# Synthetic features and label
true_coef = np.array([0.6, -0.4, 0.3, 0.1, -0.2])
X = np.random.randn(n, 5)
y = X @ true_coef + np.random.randn(n) * 0.5

def ridge_fit(X_tr, y_tr, lam=1.0):
    """Closed-form Ridge: beta = (X'X + lam*I)^{-1} X'y."""
    p = X_tr.shape[1]
    A = X_tr.T @ X_tr + lam * np.eye(p)
    b = X_tr.T @ y_tr
    return np.linalg.solve(A, b)

train_start = 252    # burn-in: at least 1 year
test_len    = 63     # re-fit quarterly

all_preds, all_actuals = [], []
fold_ics = []

t = train_start
while t + test_len <= n:
    X_tr, y_tr = X[:t], y[:t]            # expanding window
    X_te, y_te = X[t:t+test_len], y[t:t+test_len]

    coef  = ridge_fit(X_tr, y_tr)
    preds = X_te @ coef

    ic = np.corrcoef(preds, y_te)[0, 1]
    fold_ics.append(ic)
    all_preds.extend(preds)
    all_actuals.extend(y_te)
    t += test_len

preds_arr  = np.array(all_preds)
actual_arr = np.array(all_actuals)

overall_ic  = np.corrcoef(preds_arr, actual_arr)[0, 1]
ic_arr      = np.array(fold_ics)
mse         = ((preds_arr - actual_arr)**2).mean()

print(f"Folds:           {len(fold_ics)}")
print(f"Overall IC:      {overall_ic:.4f}")
print(f"Mean fold IC:    {ic_arr.mean():.4f}  ±{ic_arr.std():.4f}")
print(f"IC > 0 rate:     {(ic_arr > 0).mean():.1%}")
print(f"MSE:             {mse:.4f}")`,
    explanation:
      "Walk-forward testing avoids look-ahead bias by training only on past data and testing on the next period. An expanding window retrains on all available history each quarter — computationally heavier than a rolling window but uses more data as the backtest progresses. Information Coefficient (IC = rank correlation of predictions vs actuals) is the standard quant metric: IC > 0.05 is considered economically meaningful for daily signals. The fraction of folds with IC > 0 indicates signal consistency.",
  },
  {
    id: "pyfin-20260703-b1-convexity-adjustment",
    language: "python",
    tag: "finance",
    title: "Futures–FRA Convexity Adjustment",
    code: `import numpy as np

def simple_convexity_adj(r_fut, sigma, T1, T2):
    """
    Simplified convexity adjustment (flat vol, no mean reversion).
    CA = -0.5 * sigma^2 * T1 * T2
    FRA rate = Futures rate + CA  (futures rate is higher)
    """
    ca = -0.5 * sigma**2 * T1 * T2
    return r_fut + ca, ca

def hull_white_convexity_adj(r_fut, sigma, kappa, T1, T2):
    """
    Hull-White (mean-reverting) convexity adjustment.
    More accurate for longer-dated contracts.
    """
    def B(t):
        return (1 - np.exp(-kappa * t)) / kappa

    ca = (-0.5 * sigma**2 / kappa
          * B(T2 - T1) * (1 - np.exp(-2 * kappa * T1))
          / (2 * kappa))
    return r_fut + ca, ca

# Eurodollar / SOFR futures strip
contracts = [
    ("EDM6",  0.25, 0.50, 0.053),
    ("EDU6",  0.50, 0.75, 0.054),
    ("EDZ6",  0.75, 1.00, 0.055),
    ("EDH7",  1.00, 1.25, 0.056),
    ("EDM7",  1.25, 1.50, 0.057),
    ("EDU7",  1.50, 1.75, 0.057),
]
sigma, kappa = 0.012, 0.10

print(f"{'Contract':<8} {'T1':>4} {'T2':>4} {'Fut Rate':>9} {'Simple CA':>10} {'HW CA':>8} {'FRA (HW)':>10}")
for name, T1, T2, r_fut in contracts:
    fra_s, ca_s = simple_convexity_adj(r_fut, sigma, T1, T2)
    fra_hw, ca_hw = hull_white_convexity_adj(r_fut, sigma, kappa, T1, T2)
    print(f"{name:<8} {T1:>4.2f} {T2:>4.2f} {r_fut:>9.3%} {ca_s*1e4:>9.2f}bp {ca_hw*1e4:>7.2f}bp {fra_hw:>10.3%}")`,
    explanation:
      "Eurodollar/SOFR futures are settled daily (mark-to-market) while FRAs are settled at expiry. This creates a convexity difference: futures rates are higher than FRA rates by the convexity adjustment. The simple formula CA ≈ −½σ²T₁T₂ grows with the contract's expiry T₁ and tenor T₂. The Hull-White version accounts for mean reversion (κ): faster mean reversion (higher κ) compresses the adjustment. Adjustments are typically 1–20bp for near-dated contracts but can exceed 50bp for long-dated strip futures.",
  },
  {
    id: "pyfin-20260703-b1-mc-greeks-bump-reprice",
    language: "python",
    tag: "finance",
    title: "Monte Carlo Greeks via Bump-and-Reprice",
    code: `import numpy as np

def mc_call(S, K, T, r, sigma, n_paths=200_000, seed=42):
    """Price a European call with fixed random seed for consistent bumping."""
    np.random.seed(seed)
    Z  = np.random.standard_normal(n_paths)
    ST = S * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * Z)
    return np.exp(-r * T) * np.maximum(ST - K, 0).mean()

def mc_greeks(S, K, T, r, sigma, n_paths=200_000, seed=42):
    """Central-difference Greeks using the same random seed (variance reduction)."""
    eps_S     = S * 0.01       # 1% bump in spot
    eps_sigma = 0.005          # 50bp vol bump
    eps_r     = 0.0001         # 1bp rate bump
    eps_T     = 1 / 365        # 1-day time bump

    base  = mc_call(S,           K, T,       r,       sigma,       n_paths, seed)
    p_su  = mc_call(S + eps_S,   K, T,       r,       sigma,       n_paths, seed)
    p_sd  = mc_call(S - eps_S,   K, T,       r,       sigma,       n_paths, seed)
    p_vu  = mc_call(S,           K, T,       r,       sigma + eps_sigma, n_paths, seed)
    p_vd  = mc_call(S,           K, T,       r,       sigma - eps_sigma, n_paths, seed)
    p_ru  = mc_call(S,           K, T,       r + eps_r, sigma,     n_paths, seed)
    p_td  = mc_call(S,           K, T - eps_T, r,     sigma,       n_paths, seed)

    delta = (p_su - p_sd) / (2 * eps_S)
    gamma = (p_su - 2 * base + p_sd) / eps_S**2
    vega  = (p_vu - p_vd) / (2 * eps_sigma)
    rho   = (p_ru - base) / eps_r
    theta = (p_td - base) / eps_T  # negative for long calls

    return {"price": base, "delta": delta, "gamma": gamma,
            "vega": vega, "rho": rho, "theta": theta}

g = mc_greeks(S=100, K=100, T=1.0, r=0.05, sigma=0.20)
print("Greek     MC Value   BSM Approx")
bsm_map = {"delta": 0.6368, "gamma": 0.0188, "vega": 0.3753,
            "rho": 0.5323, "theta": -0.0141}
for k, v in g.items():
    ref = f"{bsm_map[k]:>10.4f}" if k in bsm_map else ""
    print(f"{k:<8}  {v:>9.4f}  {ref}")`,
    explanation:
      "Using the same random seed for base and bumped prices is critical: without it, MC noise dominates the finite difference and the Greek estimate is unreliable. This is the 'common random numbers' variance-reduction technique. Central differences are second-order accurate (O(ε²) error) vs first-order for one-sided bumps. Gamma is particularly noisy in MC — antithetic variates or pathwise derivatives (AAD) are preferred in production. Theta is computed by moving T forward by one day.",
  },
  {
    id: "pyfin-20260703-b1-heston-char-fn",
    language: "python",
    tag: "finance",
    title: "Heston Model – Characteristic Function Integration",
    code: `import numpy as np
from scipy.integrate import quad

def heston_char_fn(phi, S0, v0, kappa, theta, sigma, rho, r, T, j):
    """Heston (1993) characteristic function, component j=1 or j=2."""
    u = 0.5  if j == 1 else -0.5
    b = (kappa - rho * sigma) if j == 1 else kappa
    a = kappa * theta
    x = np.log(S0)
    i = 1j

    d  = np.sqrt((rho * sigma * i * phi - b)**2 + sigma**2 * (2 * u * i * phi - phi**2))
    g  = (b - rho * sigma * i * phi + d) / (b - rho * sigma * i * phi - d)

    C  = (r * i * phi * T
          + (a / sigma**2) * ((b - rho * sigma * i * phi + d) * T
                               - 2 * np.log((1 - g * np.exp(d * T)) / (1 - g))))
    D  = ((b - rho * sigma * i * phi + d) / sigma**2
          * (1 - np.exp(d * T)) / (1 - g * np.exp(d * T)))

    return np.exp(C + D * v0 + i * phi * x)

def heston_call(S0, K, T, r, v0, kappa, theta, sigma, rho):
    log_K = np.log(K)
    i     = 1j

    def Pj(j):
        def integrand(phi):
            cf = heston_char_fn(phi, S0, v0, kappa, theta, sigma, rho, r, T, j)
            return np.real(np.exp(-i * phi * log_K) * cf / (i * phi))
        val, _ = quad(integrand, 1e-6, 200, limit=200)
        return 0.5 + val / np.pi

    P1 = Pj(1)
    P2 = Pj(2)
    return S0 * P1 - K * np.exp(-r * T) * P2

# Parameters: ATM call, moderate vol-of-vol, negative skew
S0, K, T, r     = 100, 100, 1.0, 0.05
v0, kappa, theta, sigma_v, rho = 0.04, 2.0, 0.04, 0.30, -0.70

price = heston_call(S0, K, T, r, v0, kappa, theta, sigma_v, rho)
print(f"Heston call price: {price:.6f}")

# Sensitivity to correlation (skew control)
for rho_test in [-0.9, -0.7, -0.5, -0.3, 0.0]:
    p = heston_call(S0, K, T, r, v0, kappa, theta, sigma_v, rho_test)
    print(f"  rho={rho_test:+.1f}  call={p:.4f}")`,
    explanation:
      "The Heston model adds stochastic volatility: dv = κ(θ−v)dt + σ√v dW_v, corr(dW_S, dW_v) = ρ. The characteristic function is available in closed form, and the call price is recovered via the Gil-Pelaez inversion formula C = S₀P₁ − Ke^{−rT}P₂. ρ controls skewness: ρ < 0 generates the empirically observed volatility smirk (expensive puts). The model matches both term structure of variance (via θ, κ) and smile shape (via σ_v, ρ), unlike the Black-Scholes flat-vol assumption.",
  },
  {
    id: "pyfin-20260703-b1-variance-swap-replication",
    language: "python",
    tag: "finance",
    title: "Variance Swap – Static Replication Strike",
    code: `import numpy as np
from scipy.stats import norm

def bsm_call(S, K, T, r, sigma):
    if sigma <= 0 or T <= 0: return max(S - K * np.exp(-r*T), 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bsm_put(S, K, T, r, sigma):
    return bsm_call(S, K, T, r, sigma) - S + K*np.exp(-r*T)

def variance_swap_replication(S, r, T, strikes, implied_vols):
    """
    DKDZ static replication:
    K_var = (2/T) * e^{rT} * ∫_0^∞ OTM(K)/K^2 dK
    where OTM = put for K < F, call for K >= F.
    """
    F = S * np.exp(r * T)
    otm = np.array([
        bsm_put(S, K, T, r, iv) if K < F else bsm_call(S, K, T, r, iv)
        for K, iv in zip(strikes, implied_vols)
    ])
    dK = np.gradient(strikes)
    integral = np.sum(otm / strikes**2 * dK)
    return 2 * np.exp(r * T) * integral / T

S, r, T = 100.0, 0.02, 1.0
F = S * np.exp(r * T)
strikes = np.linspace(60, 160, 500)

# Flat vol surface: K_var should recover sigma^2
sigma = 0.20
flat_vols = np.full_like(strikes, sigma)
K_var_flat = variance_swap_replication(S, r, T, strikes, flat_vols)
print(f"Flat vol K_var (should be {sigma**2:.4f}): {K_var_flat:.6f}")

# Skewed surface: more expensive OTM puts → higher K_var
skew_vols  = sigma + 0.05 * np.log(F / strikes) / np.sqrt(T)
K_var_skew = variance_swap_replication(S, r, T, strikes, np.clip(skew_vols, 0.05, 1.0))
print(f"Skewed vol K_var:                         {K_var_skew:.6f}")
print(f"Vol swap strike (approx sqrt(K_var)):      {np.sqrt(K_var_skew):.4%}")`,
    explanation:
      "A variance swap pays realised variance minus a pre-agreed strike K_var, settled at maturity. The Demeterfi-Derman-Kamal-Zou (1999) replication shows K_var = (2/T)·e^{rT}·∫OTM(K)/K² dK — a model-free integral over the full smile. This is why vol surfaces matter: skew makes put-heavy OTM options cheaper/pricier, directly affecting K_var. The vol swap strike ≈ √K_var but they differ when the vol distribution is skewed (Jensen's inequality). Index variance swaps trade actively on the OTC market.",
  },
  {
    id: "pyfin-20260703-b1-breeden-litzenberger",
    language: "python",
    tag: "finance",
    title: "Breeden-Litzenberger – Risk-Neutral Density",
    code: `import numpy as np
from scipy.stats import norm
from scipy.interpolate import CubicSpline

def bsm_call(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def risk_neutral_density(strikes, call_prices, r, T):
    """
    Breeden-Litzenberger (1978):
    q(K) = e^{rT} * d²C/dK²
    """
    cs = CubicSpline(strikes, call_prices)
    d2C_dK2 = cs(strikes, 2)          # second derivative w.r.t. K
    density  = np.exp(r * T) * d2C_dK2
    return density

S, r, T = 100, 0.02, 0.5
strikes  = np.linspace(65, 145, 300)

# Flat vol → lognormal RND
sigma_flat = 0.25
calls_flat = np.array([bsm_call(S, K, T, r, sigma_flat) for K in strikes])
rnd_flat   = risk_neutral_density(strikes, calls_flat, r, T)

# Skewed vol → asymmetric (fatter left tail)
sigma_skew = np.where(strikes < S, 0.32 - 0.001*(strikes - 80), 0.25 - 0.0005*(strikes - 100))
sigma_skew = np.clip(sigma_skew, 0.08, 0.60)
calls_skew = np.array([bsm_call(S, K, T, r, sv) for K, sv in zip(strikes, sigma_skew)])
rnd_skew   = risk_neutral_density(strikes, calls_skew, r, T)

# Normalise (numerical integration)
dx = np.gradient(strikes)
mass_flat = (rnd_flat * dx).sum()
mass_skew = (rnd_skew * dx).sum()

peak_flat  = strikes[np.argmax(rnd_flat)]
peak_skew  = strikes[np.argmax(rnd_skew)]
mean_flat  = (strikes * rnd_flat * dx).sum() / mass_flat
mean_skew  = (strikes * rnd_skew * dx).sum() / mass_skew

print(f"Flat vol RND  — mass={mass_flat:.4f}, mode={peak_flat:.1f}, mean={mean_flat:.1f}")
print(f"Skewed vol RND — mass={mass_skew:.4f}, mode={peak_skew:.1f}, mean={mean_skew:.1f}")
F = S * np.exp(r * T)
print(f"Forward price: {F:.2f}  (RND mean should match forward)")`,
    explanation:
      "Breeden-Litzenberger shows that the risk-neutral density is the second derivative of the call price surface with respect to strike: q(K) = e^{rT}·∂²C/∂K². This is model-free: any smooth call price surface implies a unique RND regardless of the dynamics assumed. The RND mean must equal the forward price (no-arbitrage). Negative skew in the vol surface creates a left-skewed (fat left tail) RND compared to lognormal — the market prices disaster risk. The RND is used to extract market-implied probabilities of price levels.",
  },
  {
    id: "pyfin-20260703-b1-black-swaption",
    language: "python",
    tag: "finance",
    title: "Black's Model for European Swaption Pricing",
    code: `import numpy as np
from scipy.stats import norm

def black_swaption(F_swap, K_strike, T_exp, sigma_black, annuity, payer=True):
    """
    Black's model for European swaption.
    Payer swaption: right to pay fixed K_strike, receive floating.
    Receiver swaption: right to receive fixed K_strike, pay floating.
    """
    d1 = (np.log(F_swap / K_strike) + 0.5 * sigma_black**2 * T_exp) / (
        sigma_black * np.sqrt(T_exp)
    )
    d2 = d1 - sigma_black * np.sqrt(T_exp)

    if payer:
        return annuity * (F_swap * norm.cdf(d1) - K_strike * norm.cdf(d2))
    return annuity * (K_strike * norm.cdf(-d2) - F_swap * norm.cdf(-d1))

def annuity_factor(zero_rates, payment_tenors):
    """Annuity = sum of DF(t) * delta_t over swap payment dates."""
    A = 0.0
    prev_t = 0.0
    for t, r in zip(payment_tenors, zero_rates):
        delta_t = t - prev_t           # day-count fraction
        df_t    = np.exp(-r * t)
        A      += delta_t * df_t
        prev_t  = t
    return A

# 2Y-into-5Y swaption: option expires in 2Y, underlying swap runs 5Y (semi-annual)
T_exp          = 2.0
swap_tenors    = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0]
zero_rates_arr = [0.042, 0.043, 0.044, 0.045, 0.046, 0.046, 0.047, 0.047, 0.048, 0.048]

annuity = annuity_factor(zero_rates_arr, swap_tenors)
F_swap  = 0.046   # forward swap rate (calibrated to market)
K       = 0.046   # ATM strike
sigma_b = 0.25    # Black vol

payer_px    = black_swaption(F_swap, K, T_exp, sigma_b, annuity, payer=True)
receiver_px = black_swaption(F_swap, K, T_exp, sigma_b, annuity, payer=False)

print(f"Annuity factor:    {annuity:.6f}")
print(f"Payer swaption:    {payer_px:.6f}  ({payer_px/annuity:.4%} of notional per unit annuity)")
print(f"Receiver swaption: {receiver_px:.6f}")
print(f"Put-call parity:   {abs(payer_px - receiver_px - annuity*(F_swap - K)):.2e}  (should be ~0)")`,
    explanation:
      "Black's model treats the forward swap rate as lognormal and prices the swaption as an option on that rate. The annuity A = Σ δᵢ·DF(tᵢ) acts as the numeraire — it converts the swap rate option value into dollars. Payer–receiver parity: payer − receiver = A·(F − K), which holds exactly in Black's model. ATM swaptions (F=K) are symmetric and very liquid; they trade on Black vol grids (expiry × tenor). For negative rates, Bachelier (normal vol) or SABR pricing replaces the standard Black formula.",
  },
  {
    id: "pyfin-20260703-b1-pandas-resample-bday",
    language: "python",
    tag: "finance",
    title: "Business-Day Resampling and Rolling Metrics",
    code: `import pandas as pd
import numpy as np

np.random.seed(7)
# Simulate 3 years of daily prices on business days only
bday_idx = pd.bdate_range("2022-01-03", periods=756, freq="B")
prices   = pd.Series(
    100 * np.exp(np.random.normal(3e-4, 0.013, 756).cumsum()),
    index=bday_idx,
    name="price",
)

# Daily log returns
log_ret = np.log(prices / prices.shift(1)).dropna()

# Resample to month-end and quarter-end using business-day conventions
monthly_px  = prices.resample("BME").last()
monthly_ret = monthly_px.pct_change().dropna()

quarterly_px  = prices.resample("BQE").last()
quarterly_ret = quarterly_px.pct_change().dropna()

# Rolling 63-day Sharpe (annualised)
rf_daily = 0.04 / 252
def rolling_sharpe(ret, window=63):
    roll_mean = ret.rolling(window).mean()
    roll_std  = ret.rolling(window).std(ddof=1)
    return (roll_mean - rf_daily) / roll_std * np.sqrt(252)

rs = rolling_sharpe(log_ret)

# EWMA volatility (λ=0.94, RiskMetrics convention)
ewma_var = log_ret.ewm(alpha=1 - 0.94, adjust=False).var()
ewma_vol = np.sqrt(ewma_var * 252)

print("Price stats:")
print(f"  Start: {prices.iloc[0]:.2f}  End: {prices.iloc[-1]:.2f}")
print(f"  Ann return: {(prices.iloc[-1]/prices.iloc[0])**(252/len(prices))-1:.2%}")
print(f"\\nMonthly returns — mean: {monthly_ret.mean():.3%}  std: {monthly_ret.std():.3%}")
print(f"Quarterly returns — mean: {quarterly_ret.mean():.3%}  std: {quarterly_ret.std():.3%}")
print(f"\\nRolling 63d Sharpe — latest: {rs.iloc[-1]:.4f}  mean: {rs.mean():.4f}")
print(f"EWMA ann vol (latest): {ewma_vol.iloc[-1]:.2%}")`,
    explanation:
      "pd.bdate_range and resample('BME') / resample('BQE') handle business-day calendars automatically — no need to manually filter weekends. BME = Business Month End, BQE = Business Quarter End (post-pandas 2.2 aliases). EWMA volatility with λ=0.94 (RiskMetrics) decays older observations exponentially, making it more responsive to recent market moves than a rolling window. Rolling Sharpe > 1.0 annualised is generally considered attractive for systematic strategies.",
  },
  {
    id: "pyfin-20260703-b1-dupire-local-vol",
    language: "python",
    tag: "finance",
    title: "Dupire Local Volatility via Numerical Differentiation",
    code: `import numpy as np
from scipy.stats import norm

def bsm_call(S, K, T, r, sigma):
    if T <= 0 or sigma <= 0: return max(S - K*np.exp(-r*T), 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def dupire_local_vol(S0, r, K, T, sigma_fn, dK=0.5, dT=0.001):
    """
    Dupire (1994): sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) / (0.5*K^2*d2C/dK2)
    sigma_fn(K, T) returns the implied vol at (K, T).
    """
    C      = bsm_call(S0, K,        T,        r, sigma_fn(K,        T))
    C_dT   = bsm_call(S0, K,        T + dT,   r, sigma_fn(K,        T + dT))
    C_Ku   = bsm_call(S0, K + dK,   T,        r, sigma_fn(K + dK,   T))
    C_Kd   = bsm_call(S0, K - dK,   T,        r, sigma_fn(K - dK,   T))

    dC_dT    = (C_dT - C) / dT
    dC_dK    = (C_Ku - C_Kd) / (2 * dK)
    d2C_dK2  = (C_Ku - 2*C + C_Kd) / dK**2

    numer = dC_dT + r * K * dC_dK
    denom = 0.5 * K**2 * d2C_dK2
    if denom <= 1e-10 or numer < 0:
        return sigma_fn(K, T)   # fallback to implied vol

    return np.sqrt(numer / denom)

# SVI-like skewed implied vol surface
S0, r = 100.0, 0.02
def impl_vol(K, T):
    atm_vol = 0.20
    skew    = -0.10 * np.log(K / (S0 * np.exp(r * T))) / np.sqrt(T)
    curv    = 0.05 * (np.log(K / (S0 * np.exp(r * T))))**2 / T
    return max(atm_vol + skew + curv, 0.05)

print(f"{'Strike':>8}  {'T=0.5':>8}  {'T=1.0':>8}  {'T=2.0':>8}")
for K in [80, 90, 100, 110, 120]:
    row = f"{K:>8}"
    for T in [0.5, 1.0, 2.0]:
        lv = dupire_local_vol(S0, r, K, T, impl_vol)
        iv = impl_vol(K, T)
        row += f"  {lv:.3f}({iv:.3f})"
    print(row)
print("Format: local_vol(impl_vol)")`,
    explanation:
      "Dupire's equation extracts a unique local vol surface σ_loc(K,T) consistent with an observed implied vol surface. The denominator ½K²·∂²C/∂K² is the risk-neutral density scaled by K² — it must be positive for no-arbitrage. Local vol models are complete (one source of randomness) and fit the current smile exactly, but produce flat forward skews inconsistent with empirical dynamics. They are widely used for barrier and path-dependent option pricing where the full terminal distribution matters.",
  },
];
