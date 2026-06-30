import type { Snippet } from "./types";

export const pythonFinanceSnippets20260630B1: Snippet[] = [
  {
    id: "pyfin-20260630-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Yield Curve Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def ns_yield(tau: float, beta0: float, beta1: float,
             beta2: float, lam: float) -> float:
    """Nelson-Siegel yield for a single maturity tau (years)."""
    x = lam * tau
    # loading factors: level, slope, curvature
    l1 = 1.0
    l2 = (1 - np.exp(-x)) / x          # slope factor
    l3 = l2 - np.exp(-x)               # curvature factor (hump)
    return beta0 + beta1 * l2 + beta2 * l3

def fit_nelson_siegel(maturities: np.ndarray,
                      observed_yields: np.ndarray) -> dict:
    def loss(params):
        b0, b1, b2, lam = params
        if lam <= 0:
            return 1e9
        fitted = np.array([ns_yield(t, b0, b1, b2, lam)
                           for t in maturities])
        return np.sum((fitted - observed_yields) ** 2)

    # initial guess: flat curve near long-end yield
    x0 = [observed_yields[-1], -0.01, 0.01, 1.0]
    res = minimize(loss, x0, method="Nelder-Mead",
                   options={"xatol": 1e-8, "fatol": 1e-10, "maxiter": 5000})
    b0, b1, b2, lam = res.x
    return {"beta0": b0, "beta1": b1, "beta2": b2, "lambda": lam,
            "rmse": np.sqrt(res.fun / len(maturities))}

# Example US Treasury par yields (years, yield)
mats = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([5.30, 5.25, 5.10, 4.85, 4.70, 4.55, 4.50, 4.48, 4.60, 4.65]) / 100
params = fit_nelson_siegel(mats, yields)
print(params)`,
    explanation: "Nelson-Siegel decomposes the yield curve into level, slope, and curvature factors; fitting it via least squares gives a compact, arbitrage-free representation used daily by central banks and risk systems.",
  },
  {
    id: "pyfin-20260630-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading (Dynamic Hedge Ratio)",
    tag: "finance",
    code: `import numpy as np

class KalmanPairsFilter:
    """Online Kalman estimator for dynamic hedge ratio beta in y = beta*x + alpha."""

    def __init__(self, delta: float = 1e-4, obs_noise: float = 1e-3):
        self.delta = delta                  # state diffusion (controls beta drift speed)
        self.obs_noise = obs_noise          # observation noise variance
        # state: [alpha, beta]; covariance P
        self.theta = np.zeros(2)
        self.P = np.eye(2) * 1.0
        self.R = obs_noise                  # scalar measurement noise

    def update(self, y: float, x: float) -> tuple[float, float]:
        """Return (spread, beta) after absorbing observation (y, x)."""
        H = np.array([1.0, x])             # observation matrix row

        # predict step: add process noise Q = delta * I
        self.P += self.delta * np.eye(2)

        # innovation
        y_hat = H @ self.theta
        S = H @ self.P @ H + self.R        # innovation variance
        K = self.P @ H / S                  # Kalman gain

        # update state and covariance
        self.theta += K * (y - y_hat)
        self.P -= np.outer(K, H @ self.P)

        spread = y - H @ self.theta         # residual after update
        return spread, self.theta[1]        # (spread, beta)

# Simulate two cointegrated price series
np.random.seed(42)
n = 500
x = np.cumsum(np.random.randn(n))
y = 1.5 * x + 2.0 + np.random.randn(n) * 0.5

kf = KalmanPairsFilter(delta=1e-4, obs_noise=0.5)
spreads, betas = [], []
for yi, xi in zip(y, x):
    sp, beta = kf.update(yi, xi)
    spreads.append(sp); betas.append(beta)

# z-score the spread for entry/exit signals
spreads = np.array(spreads)
z = (spreads - spreads.mean()) / (spreads.std() + 1e-9)
entries = np.where(np.abs(z) > 2)[0]
print(f"Hedge ratio final beta={betas[-1]:.3f}, entry count={len(entries)}")`,
    explanation: "A Kalman filter estimates a time-varying hedge ratio between two co-integrated assets online, adapting to structural breaks far better than a static OLS regression.",
  },
  {
    id: "pyfin-20260630-b1-garch11",
    language: "python",
    title: "GARCH(1,1) Manual MLE Implementation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_loglik(params: np.ndarray, returns: np.ndarray) -> float:
    """Negative log-likelihood for GARCH(1,1): sigma^2_t = omega + alpha*eps^2_{t-1} + beta*sigma^2_{t-1}."""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e9  # enforce covariance-stationarity
    n = len(returns)
    sigma2 = np.empty(n)
    sigma2[0] = np.var(returns)         # initialise with sample variance
    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
    # Gaussian log-likelihood
    ll = -0.5 * np.sum(np.log(2 * np.pi * sigma2) + returns**2 / sigma2)
    return -ll                          # minimise negative log-lik

def fit_garch11(returns: np.ndarray) -> dict:
    var0 = np.var(returns)
    # initial guess: omega small, alpha=0.05, beta=0.90
    x0 = [var0 * 0.05, 0.05, 0.90]
    bounds = [(1e-8, None), (1e-6, 0.999), (1e-6, 0.999)]
    res = minimize(garch11_loglik, x0, args=(returns,),
                   method="L-BFGS-B", bounds=bounds)
    omega, alpha, beta = res.x
    return {"omega": omega, "alpha": alpha, "beta": beta,
            "persistence": alpha + beta,
            "long_run_var": omega / (1 - alpha - beta)}

# Simulate GBM log-returns then fit
np.random.seed(7)
r = np.random.randn(1000) * 0.01
r[300:320] *= 5                         # inject a volatility cluster
params = fit_garch11(r)
print(params)`,
    explanation: "GARCH(1,1) models volatility clustering — a defining feature of financial returns — by recursively linking today's variance to yesterday's squared shock and yesterday's variance; MLE fitting requires enforcing the stationarity constraint alpha+beta<1.",
  },
  {
    id: "pyfin-20260630-b1-heston-char-fn",
    language: "python",
    title: "Heston Model: Characteristic Function Pricer",
    tag: "finance",
    code: `import numpy as np
from scipy.integrate import quad

def heston_char_fn(phi: complex, S: float, K: float, T: float,
                   r: float, kappa: float, theta: float,
                   xi: float, rho: float, v0: float,
                   j: int) -> complex:
    """Heston characteristic function (Gil-Pelaez inversion), j=1 or 2."""
    i = complex(0, 1)
    b = kappa - rho * xi * j            # j=1: risk-neutral Q; j=2: stock measure
    u = 0.5 - j + 1                     # u_j
    a = kappa * theta

    d = np.sqrt((rho * xi * phi * i - b)**2 - xi**2 * (2 * u * phi * i - phi**2))
    g = (b - rho * xi * phi * i + d) / (b - rho * xi * phi * i - d)
    C = (r * phi * i * T
         + (a / xi**2) * ((b - rho * xi * phi * i + d) * T
                           - 2 * np.log((1 - g * np.exp(d * T)) / (1 - g))))
    D = ((b - rho * xi * phi * i + d) / xi**2
         * (1 - np.exp(d * T)) / (1 - g * np.exp(d * T)))
    return np.exp(C + D * v0 + i * phi * np.log(S))

def heston_call(S: float, K: float, T: float, r: float,
                kappa: float, theta: float, xi: float,
                rho: float, v0: float) -> float:
    """European call via Gil-Pelaez Fourier inversion."""
    def integrand(phi: float, j: int) -> float:
        cf = heston_char_fn(phi, S, K, T, r, kappa, theta, xi, rho, v0, j)
        return np.real(np.exp(-complex(0,1) * phi * np.log(K)) * cf / (complex(0,1) * phi))

    P1 = 0.5 + (1/np.pi) * quad(integrand, 0, 500, args=(1,), limit=200)[0]
    P2 = 0.5 + (1/np.pi) * quad(integrand, 0, 500, args=(2,), limit=200)[0]
    return S * P1 - K * np.exp(-r * T) * P2

price = heston_call(S=100, K=100, T=1, r=0.05,
                    kappa=2.0, theta=0.04, xi=0.3, rho=-0.7, v0=0.04)
print(f"Heston call: {price:.4f}")`,
    explanation: "The Heston model captures the vol smile by making variance stochastic and mean-reverting; the characteristic function allows semi-analytic pricing via a single quadrature integral, far faster than Monte Carlo.",
  },
  {
    id: "pyfin-20260630-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion & Fractional Kelly Position Sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(mu: float, sigma: float, r: float = 0.0) -> float:
    """Continuous Kelly fraction f* = (mu - r) / sigma^2 (log-utility)."""
    return (mu - r) / sigma**2

def growth_rate(f: float, mu: float, sigma: float, r: float = 0.0) -> float:
    """Expected log-growth rate g(f) = r + f*(mu-r) - 0.5*(f*sigma)^2."""
    return r + f * (mu - r) - 0.5 * (f * sigma)**2

def fractional_kelly(mu: float, sigma: float, r: float = 0.0,
                     fraction: float = 0.5) -> dict:
    """Half-Kelly (or any fraction) reduces drawdowns at modest growth cost."""
    fk = kelly_fraction(mu, sigma, r)
    f_actual = fraction * fk
    return {
        "kelly_full": fk,
        "kelly_fractional": f_actual,
        "growth_full": growth_rate(fk, mu, sigma, r),
        "growth_fractional": growth_rate(f_actual, mu, sigma, r),
    }

def multiasset_kelly(mu: np.ndarray, Sigma: np.ndarray,
                     r: float = 0.0) -> np.ndarray:
    """
    Multi-asset Kelly: maximise E[log W].
    f* = Sigma^{-1} (mu - r) (unconstrained, can exceed 1 — apply fractional).
    """
    excess = mu - r
    return np.linalg.solve(Sigma, excess)   # avoids explicit matrix inversion

# Single-asset example
result = fractional_kelly(mu=0.12, sigma=0.20, r=0.04, fraction=0.5)
print(result)

# Multi-asset
mu_vec = np.array([0.12, 0.09, 0.07])
cov = np.array([[0.04, 0.01, 0.005],
                [0.01, 0.025, 0.003],
                [0.005, 0.003, 0.01]])
f_star = multiasset_kelly(mu_vec, cov, r=0.04)
print(f"Multi-asset Kelly fractions: {f_star}")`,
    explanation: "Kelly sizing maximises long-run geometric growth but produces large drawdowns; half-Kelly is the standard practitioner compromise, sacrificing ~25% of growth for a much smoother equity curve.",
  },
  {
    id: "pyfin-20260630-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Model (OLS Attribution)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def fama_french_regression(portfolio_returns: pd.Series,
                           mkt_rf: pd.Series,
                           smb: pd.Series,
                           hml: pd.Series,
                           rf: pd.Series) -> dict:
    """
    Run FF3 regression: R_p - Rf = alpha + beta_mkt*(Rm-Rf) + beta_smb*SMB + beta_hml*HML + eps.
    Returns coefficients, t-stats, R^2.
    """
    excess = portfolio_returns.values - rf.values
    X = np.column_stack([np.ones(len(mkt_rf)),
                         mkt_rf.values,
                         smb.values,
                         hml.values])
    # OLS: beta = (X'X)^{-1} X'y
    XtX = X.T @ X
    Xty = X.T @ excess
    beta = np.linalg.solve(XtX, Xty)

    y_hat = X @ beta
    resid = excess - y_hat
    n, k = X.shape
    sigma2 = np.dot(resid, resid) / (n - k)         # unbiased
    var_beta = sigma2 * np.linalg.inv(XtX)           # covariance of beta
    se = np.sqrt(np.diag(var_beta))
    t_stats = beta / se

    ss_tot = np.sum((excess - excess.mean())**2)
    ss_res = np.dot(resid, resid)
    r2 = 1 - ss_res / ss_tot

    labels = ["alpha", "beta_mkt", "beta_smb", "beta_hml"]
    return {lbl: {"coef": b, "t": t}
            for lbl, b, t in zip(labels, beta, t_stats)} | {"R2": r2}

# Synthetic demo data
np.random.seed(0)
n = 120
rf = pd.Series(np.full(n, 0.04/12))
mkt_rf = pd.Series(np.random.randn(n) * 0.04 + 0.005)
smb    = pd.Series(np.random.randn(n) * 0.02)
hml    = pd.Series(np.random.randn(n) * 0.02)
# portfolio: 1.1*mkt + 0.3*smb - 0.2*hml + small alpha
port = rf + 1.1*mkt_rf + 0.3*smb - 0.2*hml + np.random.randn(n)*0.01 + 0.001/12

result = fama_french_regression(port, mkt_rf, smb, hml, rf)
for k, v in result.items():
    print(k, v)`,
    explanation: "The Fama-French 3-factor model decomposes portfolio alpha from market, size (SMB), and value (HML) exposures; the OLS t-stats reveal whether any apparent alpha is statistically distinct from systematic factor loading.",
  },
  {
    id: "pyfin-20260630-b1-cds-hazard",
    language: "python",
    title: "CDS Pricing via Piecewise-Constant Hazard Rates",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def survival_prob(t: float, hazard_rates: list[tuple[float,float]]) -> float:
    """P(tau > t) for piecewise-constant hazard lambda(s) defined by (breakpoint, lambda) list."""
    prob = 1.0
    prev_t = 0.0
    for t_end, lam in hazard_rates:
        dt = min(t, t_end) - prev_t
        if dt <= 0:
            break
        prob *= np.exp(-lam * dt)
        prev_t = t_end
        if t <= t_end:
            break
    return prob

def cds_spread(maturities: np.ndarray, notional: float,
               recovery: float, hazard_rates: list[tuple[float,float]],
               discount_fn) -> float:
    """
    Fair CDS spread s such that PV(protection leg) = PV(premium leg).
    Premium leg pays s * notional * dt quarterly.
    """
    # Protection leg: integral of (1-R) * discount * hazard * survival
    protection_pv = 0.0
    dt = 0.01
    ts = np.arange(dt, maturities[-1] + dt, dt)
    for t in ts:
        q = survival_prob(t, hazard_rates)
        d = discount_fn(t)
        # lambda(t) from piecewise list
        lam = next((l for (te, l) in hazard_rates if t <= te), hazard_rates[-1][1])
        protection_pv += (1 - recovery) * lam * q * d * dt

    # Premium leg: quarterly coupon payments weighted by survival
    premium_annuity = 0.0
    for t in np.arange(0.25, maturities[-1] + 0.001, 0.25):
        q = survival_prob(t, hazard_rates)
        premium_annuity += q * discount_fn(t) * 0.25   # 0.25 yr accrual

    return (protection_pv / premium_annuity) * notional

# Flat 3% hazard rate, flat 5% IR discount, 40% recovery
hazards = [(100.0, 0.03)]
def disc(t): return np.exp(-0.05 * t)

spread_bps = cds_spread(np.array([5.0]), 1.0, 0.40, hazards, disc) * 10000
print(f"Fair CDS spread: {spread_bps:.1f} bps")`,
    explanation: "CDS pricing equates the PV of the protection leg (pays 1-R on default) to the PV of the premium leg (quarterly spread); calibrating hazard rates to quoted CDS spreads gives a credit term structure used for CVA and bond pricing.",
  },
  {
    id: "pyfin-20260630-b1-pca-yield-curve",
    language: "python",
    title: "PCA on Yield Curve (Level / Slope / Curvature)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def pca_yield_curve(yield_matrix: np.ndarray,
                    tenors: list[float],
                    n_components: int = 3) -> dict:
    """
    Decompose a T x N yield curve panel (T dates, N tenors) into PCs.
    Returns loadings, explained variance, and daily factor returns.
    """
    # demean each column (each tenor)
    Y = yield_matrix - yield_matrix.mean(axis=0)

    # covariance matrix and eigen-decomposition
    cov = Y.T @ Y / (Y.shape[0] - 1)               # N x N covariance
    eigenvalues, eigenvectors = np.linalg.eigh(cov) # ascending order

    # reverse to descending
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues  = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    loadings = eigenvectors[:, :n_components]        # N x k
    scores   = Y @ loadings                          # T x k — daily factor returns

    explained = eigenvalues[:n_components] / eigenvalues.sum()
    labels = ["level", "slope", "curvature"][:n_components]

    return {
        "loadings": pd.DataFrame(loadings, index=tenors,
                                 columns=labels),
        "scores": pd.DataFrame(scores, columns=labels),
        "explained_variance": dict(zip(labels, explained)),
    }

# Simulate 500 days of yield curve data (7 tenors)
np.random.seed(1)
tenors = [0.25, 0.5, 1, 2, 5, 10, 30]
n_days, n_tenors = 500, len(tenors)
# level factor drives most variance; slope secondary
level_shocks  = np.cumsum(np.random.randn(n_days, 1) * 0.005, axis=0)
slope_shocks  = np.cumsum(np.random.randn(n_days, 1) * 0.002, axis=0)
loading_level = np.ones(n_tenors)
loading_slope = np.linspace(-1, 1, n_tenors)
yields = level_shocks * loading_level + slope_shocks * loading_slope + np.random.randn(n_days, n_tenors) * 0.0005

result = pca_yield_curve(yields, tenors)
print(result["explained_variance"])
print(result["loadings"])`,
    explanation: "Empirically, three PCs explain >99% of yield curve variance; the first three factors correspond to parallel shifts (level), tilts (slope), and humps (curvature) — the foundation of yield curve risk management and hedging.",
  },
  {
    id: "pyfin-20260630-b1-evt-tail",
    language: "python",
    title: "Extreme Value Theory: GPD Tail Risk (POT Method)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_pot(returns: np.ndarray,
                threshold_pct: float = 0.95) -> dict:
    """
    Peaks-over-threshold EVT: fit Generalized Pareto Distribution to tail losses.
    Returns shape xi, scale sigma, VaR and ES at 99.9%.
    """
    losses = -returns                               # work with positive losses
    u = np.quantile(losses, threshold_pct)          # threshold
    exceedances = losses[losses > u] - u            # excess losses over threshold

    # MLE fit of GPD
    shape, loc, scale = genpareto.fit(exceedances, floc=0)  # fix loc=0 (POT)

    n = len(losses)
    Nu = len(exceedances)                           # number of exceedances

    # GPD VaR at level p (e.g. 0.999)
    def var_gpd(p: float) -> float:
        return u + (scale / shape) * ((n / Nu * (1 - p))**(-shape) - 1)

    # GPD ES: E[L | L > VaR_p]
    def es_gpd(p: float) -> float:
        v = var_gpd(p)
        return (v + scale - shape * u) / (1 - shape)   # GPD excess ES formula

    var_999 = var_gpd(0.999)
    es_999  = es_gpd(0.999)

    return {
        "threshold": u,
        "n_exceedances": Nu,
        "GPD_shape": shape,
        "GPD_scale": scale,
        "VaR_99.9%": var_999,
        "ES_99.9%":  es_999,
    }

np.random.seed(42)
# fat-tailed returns: student-t with 4 df
from scipy.stats import t as student_t
returns = student_t.rvs(df=4, size=2000) * 0.01

result = fit_gpd_pot(returns, threshold_pct=0.95)
for k, v in result.items():
    print(f"{k}: {v:.6f}" if isinstance(v, float) else f"{k}: {v}")`,
    explanation: "EVT's Peaks-over-Threshold method fits a Generalized Pareto Distribution to tail exceedances, giving model-based VaR and Expected Shortfall estimates far into the tail where historical data is sparse.",
  },
  {
    id: "pyfin-20260630-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula Credit Portfolio Loss Distribution",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_loss(
    pd_vec: np.ndarray,          # per-name default probabilities
    lgd_vec: np.ndarray,         # loss given default (fraction)
    notional_vec: np.ndarray,    # notional per name
    rho: float,                  # uniform pairwise correlation
    n_sims: int = 50_000,
    seed: int = 0,
) -> np.ndarray:
    """
    One-factor Gaussian copula simulation for portfolio credit loss.
    Returns array of simulated portfolio losses.
    """
    rng = np.random.default_rng(seed)
    n = len(pd_vec)
    default_thresholds = norm.ppf(pd_vec)           # Phi^{-1}(PD_i)

    # One-factor model: X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i
    M = rng.standard_normal(n_sims)                 # systematic factor
    Z = rng.standard_normal((n_sims, n))            # idiosyncratic
    X = np.sqrt(rho) * M[:, None] + np.sqrt(1 - rho) * Z  # n_sims x n

    # Default indicator
    defaults = X < default_thresholds[None, :]      # True where name defaults
    losses = (defaults * lgd_vec * notional_vec).sum(axis=1)
    return losses

# 100 equally-weighted names, 1% PD each, 60% LGD, 30% correlation
n = 100
pd_vec  = np.full(n, 0.01)
lgd_vec = np.full(n, 0.60)
notional_vec = np.full(n, 1_000_000.0)
rho = 0.30

losses = gaussian_copula_loss(pd_vec, lgd_vec, notional_vec, rho)
print(f"EL  = \${losses.mean()/1e6:.2f}M")
print(f"VaR 99% = \${np.quantile(losses, 0.99)/1e6:.2f}M")
print(f"ES  99% = \${losses[losses >= np.quantile(losses, 0.99)].mean()/1e6:.2f}M")`,
    explanation: "The one-factor Gaussian copula links individual default events through a common market factor; despite its well-known limitations (it underestimates tail correlation), it remains the industry standard for CDO/CLO tranche pricing and Basel credit capital.",
  },
  {
    id: "pyfin-20260630-b1-central-diff-greeks",
    language: "python",
    title: "Numerical Greeks via Central Differences (Model-Free)",
    tag: "finance",
    code: `import numpy as np
from typing import Callable

def central_diff_greeks(
    price_fn: Callable[..., float],
    S: float, K: float, T: float, r: float, sigma: float,
    eps_S: float = 0.01,       # bump size for spot (fraction)
    eps_r: float = 1e-4,       # bump size for rate (absolute)
    eps_sigma: float = 1e-4,   # bump size for vol (absolute)
    eps_T: float = 1.0/252,    # theta: one calendar day
) -> dict:
    """Finite-difference Greeks — works with any price_fn signature (S,K,T,r,sigma)."""
    dS = S * eps_S

    p0      = price_fn(S, K, T, r, sigma)
    p_Su    = price_fn(S + dS, K, T, r, sigma)
    p_Sd    = price_fn(S - dS, K, T, r, sigma)
    p_ru    = price_fn(S, K, T, r + eps_r, sigma)
    p_rd    = price_fn(S, K, T, r - eps_r, sigma)
    p_vu    = price_fn(S, K, T, r, sigma + eps_sigma)
    p_vd    = price_fn(S, K, T, r, sigma - eps_sigma)
    p_Tm1   = price_fn(S, K, T - eps_T, r, sigma)  # theta: shorter maturity

    delta  = (p_Su - p_Sd) / (2 * dS)
    gamma  = (p_Su - 2*p0 + p_Sd) / (dS**2)
    theta  = (p_Tm1 - p0) / eps_T          # negative for long options
    rho    = (p_ru - p_rd) / (2 * eps_r)
    vega   = (p_vu - p_vd) / (2 * eps_sigma)

    return {"delta": delta, "gamma": gamma,
            "theta": theta, "rho": rho, "vega": vega}

# Test against Black-Scholes analytical
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

greeks = central_diff_greeks(bs_call, S=100, K=100, T=1, r=0.05, sigma=0.20)
print(greeks)`,
    explanation: "Model-free finite differences compute Greeks for any pricing function — useful when switching between BSM, Heston, or local-vol models without re-deriving closed-form Greeks each time.",
  },
  {
    id: "pyfin-20260630-b1-engle-granger",
    language: "python",
    title: "Engle-Granger Cointegration Test",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as student_t

# Critical values for ADF tau (MacKinnon 1994 approximation, n=large, no constant)
ADF_CRITICAL = {0.01: -3.43, 0.05: -2.86, 0.10: -2.57}

def adf_test(series: np.ndarray, max_lag: int = 1) -> dict:
    """Augmented Dickey-Fuller test: H0 = unit root (non-stationary)."""
    dy = np.diff(series)
    n = len(dy)
    # Lagged level (t-1) and lagged differences for ADF augmentation
    y_lag = series[:-1][max_lag:]          # y_{t-1}
    X = [y_lag]
    for lag in range(1, max_lag + 1):
        X.append(dy[max_lag-lag:-lag if lag else None])
    X = np.column_stack(X + [np.ones(len(y_lag))])
    dy_trimmed = dy[max_lag:]

    beta = np.linalg.lstsq(X, dy_trimmed, rcond=None)[0]
    resid = dy_trimmed - X @ beta
    sigma2 = np.dot(resid, resid) / (len(resid) - X.shape[1])
    var_beta = sigma2 * np.linalg.pinv(X.T @ X)
    tau = beta[0] / np.sqrt(var_beta[0, 0])   # ADF tau statistic

    return {"tau": tau,
            "reject_H0_5pct": tau < ADF_CRITICAL[0.05]}

def engle_granger(x: np.ndarray, y: np.ndarray) -> dict:
    """Stage 1: OLS regression. Stage 2: ADF on residuals."""
    X = np.column_stack([np.ones(len(x)), x])
    beta = np.linalg.lstsq(X, y, rcond=None)[0]
    resid = y - X @ beta
    adf = adf_test(resid)
    return {"alpha": beta[0], "beta": beta[1],
            "ADF_tau": adf["tau"],
            "cointegrated_at_5pct": adf["reject_H0_5pct"]}

np.random.seed(0)
n = 500
x = np.cumsum(np.random.randn(n))
y = 1.8 * x + 3.0 + np.random.randn(n) * 0.5  # cointegrated pair

result = engle_granger(x, y)
print(result)`,
    explanation: "Engle-Granger tests cointegration in two stages: first fit the OLS long-run relationship, then check if residuals are stationary via ADF; a rejection of the ADF unit root means the pair is cointegrated and the spread is mean-reverting.",
  },
  {
    id: "pyfin-20260630-b1-momentum-backtest",
    language: "python",
    title: "Cross-Sectional Momentum Backtest with Transaction Costs",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def momentum_backtest(
    prices: pd.DataFrame,          # T x N price panel
    lookback: int = 252,           # momentum window (days)
    hold: int = 21,                # rebalance frequency (days)
    n_long: int = 10,              # longs per leg
    n_short: int = 10,             # shorts per leg
    tc_bps: float = 5.0,           # one-way transaction cost in bps
) -> pd.Series:
    """
    Monthly-rebalanced long-short cross-sectional momentum.
    Returns daily portfolio returns net of transaction costs.
    """
    returns = prices.pct_change().fillna(0.0)
    n_assets = prices.shape[1]
    port_returns = []
    weights_prev = np.zeros(n_assets)

    for t in range(lookback, len(prices), hold):
        # Score = cumulative return over lookback window (skip last month to avoid reversal)
        score = prices.iloc[t - 21] / prices.iloc[t - lookback] - 1

        rank = score.rank(ascending=False)
        long_mask  = (rank <= n_long).astype(float)
        short_mask = (rank >  n_assets - n_short).astype(float)

        weights = (long_mask / n_long - short_mask / n_short)  # zero net exposure
        tc = np.sum(np.abs(weights - weights_prev)) * tc_bps * 1e-4

        # Hold for 'hold' days
        period_ret = returns.iloc[t:t+hold].values @ weights   # T_hold vector
        period_ret[0] -= tc                                     # deduct TC on rebalance day
        port_returns.extend(period_ret.tolist())
        weights_prev = weights.values

    idx = prices.index[lookback:lookback + len(port_returns)]
    series = pd.Series(port_returns[:len(idx)], index=idx)
    annual_ret = (1 + series).prod() ** (252 / len(series)) - 1
    sharpe = series.mean() / (series.std() + 1e-9) * np.sqrt(252)
    print(f"Ann. return: {annual_ret:.2%}, Sharpe: {sharpe:.2f}")
    return series

# Synthetic 50-asset price panel
np.random.seed(1)
T, N = 1500, 50
prices = pd.DataFrame(
    np.cumprod(1 + np.random.randn(T, N) * 0.01 + 0.0003, axis=0),
    columns=[f"A{i}" for i in range(N)]
)
pnl = momentum_backtest(prices, tc_bps=5.0)`,
    explanation: "Cross-sectional momentum buys recent winners and shorts recent losers; realistic backtesting must deduct proportional transaction costs on every rebalance, since momentum strategies can be high-turnover and cost-sensitive.",
  },
  {
    id: "pyfin-20260630-b1-fx-carry",
    language: "python",
    title: "FX Carry Trade Simulation (Interest Rate Parity)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def simulate_fx_carry(
    spot_rates: pd.DataFrame,          # T x N spot rates vs USD (e.g. EUR/USD)
    rate_differentials: pd.DataFrame,  # T x N annualised rate differential (foreign - USD)
    n_long: int = 3,                   # buy high-yielders
    n_short: int = 3,                  # sell low-yielders
    tc_bps: float = 3.0,               # one-way cost
    rebal_freq: int = 21,              # monthly
) -> pd.Series:
    """
    Long high-carry currencies, short low-carry currencies.
    FX return = spot return + carry accrual.
    """
    spot_ret = spot_rates.pct_change().fillna(0.0)          # daily spot return
    carry    = rate_differentials / 252                      # daily carry
    total_ret = spot_ret + carry                             # total daily return per currency

    port_rets = []
    prev_w = np.zeros(spot_rates.shape[1])

    for t in range(rebal_freq, len(spot_rates), rebal_freq):
        # rank by trailing average carry (use lagged to avoid look-ahead)
        avg_carry = rate_differentials.iloc[t - rebal_freq:t].mean()
        rank = avg_carry.rank(ascending=False)
        N = spot_rates.shape[1]

        long_w  =  (rank <= n_long).astype(float)  / n_long
        short_w = -(rank >  N - n_short).astype(float) / n_short
        w = (long_w + short_w).values

        tc = np.abs(w - prev_w).sum() * tc_bps * 1e-4
        period = total_ret.iloc[t:t+rebal_freq].values @ w
        period[0] -= tc
        port_rets.extend(period.tolist())
        prev_w = w

    idx = spot_rates.index[rebal_freq:rebal_freq + len(port_rets)]
    series = pd.Series(port_rets[:len(idx)], index=idx)
    sr = series.mean() / (series.std() + 1e-9) * np.sqrt(252)
    print(f"Carry Sharpe: {sr:.2f}")
    return series

# Synthetic 8-currency universe
np.random.seed(5)
T, N = 1200, 8
spots = pd.DataFrame(
    np.cumprod(1 + np.random.randn(T, N)*0.004, axis=0),
    columns=[f"CCY{i}" for i in range(N)]
)
carry_diff = pd.DataFrame(
    np.tile(np.linspace(-0.03, 0.06, N), (T, 1)) + np.random.randn(T, N)*0.005,
    columns=spots.columns
)
pnl = simulate_fx_carry(spots, carry_diff)`,
    explanation: "FX carry exploits uncovered interest parity failure — high-yield currencies don't depreciate as fast as UIP predicts — but is subject to sudden 'carry unwind' crashes when risk appetite reverses.",
  },
  {
    id: "pyfin-20260630-b1-short-rate-hw",
    language: "python",
    title: "Hull-White Short Rate MC (Python)",
    tag: "finance",
    code: `import numpy as np

def hull_white_mc(
    kappa: float, theta: float, sigma: float,
    r0: float, T: float,
    n_steps: int = 252, n_paths: int = 10_000,
    seed: int = 42,
) -> dict:
    """
    Simulate Hull-White r(t) = theta + e^{-kappa*t}*(r0 - theta) + sigma * noise.
    Exact discretisation: r_{t+dt} = r_t e^{-kappa dt} + theta(1 - e^{-kappa dt})
                                     + sigma*sqrt((1-e^{-2kappa dt})/(2kappa)) * Z.
    Returns ZCB prices P(0,T) and cap payoffs for a 5% strike.
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    e_kdt = np.exp(-kappa * dt)
    mean_adj = theta * (1 - e_kdt)
    vol = sigma * np.sqrt((1 - np.exp(-2*kappa*dt)) / (2*kappa))

    r = np.full(n_paths, r0)
    disc = np.ones(n_paths)             # accumulated discount factor

    for _ in range(n_steps):
        Z = rng.standard_normal(n_paths)
        r = e_kdt * r + mean_adj + vol * Z
        disc *= np.exp(-r * dt)         # integral(r dt) ≈ r * dt per step

    zcb_price = disc.mean()

    # Cap payoff: max(r_T - K, 0) * notional (simplified caplet at T)
    cap_payoff = np.maximum(r - 0.05, 0.0) * disc
    cap_price  = cap_payoff.mean()

    # Analytic ZCB for comparison: P(0,T) = exp(A(T) - B(T)*r0)
    B = (1 - np.exp(-kappa * T)) / kappa
    A = (theta - sigma**2 / (2*kappa**2)) * (B - T) - sigma**2 * B**2 / (4*kappa)
    zcb_analytic = np.exp(A - B * r0)

    return {"ZCB_MC": zcb_price, "ZCB_analytic": zcb_analytic,
            "cap_price": cap_price}

result = hull_white_mc(kappa=0.5, theta=0.04, sigma=0.01,
                       r0=0.03, T=5.0)
print(result)`,
    explanation: "Hull-White is the go-to model for interest rate derivatives because it fits the initial yield curve exactly and allows analytic pricing of ZCBs, caps, and swaptions; Monte Carlo extends it to path-dependent products like Bermudan swaptions.",
  },
  {
    id: "pyfin-20260630-b1-markov-regime",
    language: "python",
    title: "Markov Regime-Switching Model (Hamilton EM)",
    tag: "finance",
    code: `import numpy as np

def hamilton_em(returns: np.ndarray, n_regimes: int = 2,
                max_iter: int = 200, tol: float = 1e-6) -> dict:
    """
    Hamilton (1989) two-state Markov switching: y_t | s_t ~ N(mu_s, sigma_s^2).
    Estimates via Baum-Welch (EM): forward-backward + M-step.
    """
    T = len(returns)
    K = n_regimes

    # Initialise
    mu    = np.array([returns.mean() - returns.std(), returns.mean() + returns.std()])
    sigma = np.array([returns.std() * 0.8, returns.std() * 1.2])
    P     = np.full((K, K), 1/K)          # transition matrix
    pi    = np.full(K, 1/K)               # initial distribution

    def emission(t):
        return np.array([1/(np.sqrt(2*np.pi)*sigma[k]) *
                         np.exp(-0.5*((returns[t]-mu[k])/sigma[k])**2)
                         for k in range(K)])

    prev_ll = -np.inf
    for iteration in range(max_iter):
        # Forward pass
        alpha = np.zeros((T, K))
        alpha[0] = pi * emission(0)
        scale = np.empty(T)
        scale[0] = alpha[0].sum(); alpha[0] /= scale[0]
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ P) * emission(t)
            scale[t] = alpha[t].sum(); alpha[t] /= scale[t]

        # Backward pass
        beta = np.ones((T, K))
        for t in range(T-2, -1, -1):
            beta[t] = (P * emission(t+1) * beta[t+1]).sum(axis=1)
            beta[t] /= scale[t+1]

        # Smoothed state probabilities
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)

        # M-step
        mu    = (gamma * returns[:, None]).sum(axis=0) / gamma.sum(axis=0)
        sigma = np.sqrt((gamma * (returns[:, None] - mu)**2).sum(axis=0)
                        / gamma.sum(axis=0))
        pi = gamma[0]
        for i in range(K):
            for j in range(K):
                xi_ij = sum(alpha[t,i] * P[i,j] * emission(t+1)[j] * beta[t+1,j]
                            for t in range(T-1))
                P[i,j] = xi_ij
            P[i] /= P[i].sum()

        ll = np.log(scale).sum()
        if abs(ll - prev_ll) < tol:
            break
        prev_ll = ll

    return {"mu": mu, "sigma": sigma, "transition_P": P,
            "smoothed_probs": gamma, "log_likelihood": ll}

np.random.seed(3)
# Low-vol regime then high-vol regime
r = np.concatenate([np.random.randn(300)*0.005, np.random.randn(200)*0.02])
result = hamilton_em(r)
print("Regime means:", result["mu"])
print("Sigma:", result["sigma"])`,
    explanation: "Hamilton's regime-switching model captures alternating bull/bear or low/high-volatility regimes; the Baum-Welch EM algorithm infers latent state probabilities and parameters simultaneously from unlabeled return data.",
  },
  {
    id: "pyfin-20260630-b1-statsmodels-garch",
    language: "python",
    title: "ARCH/GARCH via statsmodels (arch library)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Use arch library (statsmodels-compatible API)
# pip install arch
try:
    from arch import arch_model
    HAS_ARCH = True
except ImportError:
    HAS_ARCH = False

def fit_garch_arch_lib(returns: pd.Series, p: int = 1, q: int = 1,
                       dist: str = "t") -> dict:
    """
    Fit GARCH(p,q) with Student-t innovations using the arch library.
    Returns summary dict with omega, alpha, beta, nu (df), AIC.
    """
    if not HAS_ARCH:
        return {"error": "arch library not installed; run pip install arch"}

    # Scale returns to % for numerical stability
    model = arch_model(returns * 100, vol="Garch", p=p, q=q, dist=dist)
    res = model.fit(disp="off")

    params = res.params
    out = {
        "omega": params.get("omega", None),
        "alpha[1]": params.get("alpha[1]", None),
        "beta[1]":  params.get("beta[1]", None),
        "nu_df":    params.get("nu", None),          # t-dist degrees of freedom
        "AIC": res.aic,
        "persistence": (params.get("alpha[1]", 0) +
                        params.get("beta[1]", 0)),
    }
    return out

# Fall-through manual GARCH(1,1) if arch not available
def garch11_variance_path(returns: np.ndarray, omega: float,
                           alpha: float, beta: float) -> np.ndarray:
    """Compute GARCH(1,1) variance path given fitted parameters."""
    n = len(returns)
    h = np.empty(n)
    h[0] = np.var(returns)
    for t in range(1, n):
        h[t] = omega + alpha * returns[t-1]**2 + beta * h[t-1]
    return h

np.random.seed(9)
r = pd.Series(np.random.randn(1000) * 0.01)
result = fit_garch_arch_lib(r, p=1, q=1, dist="t")
print(result)

# Manual path (always available)
h = garch11_variance_path(r.values, omega=1e-5, alpha=0.08, beta=0.90)
print(f"Final conditional std: {np.sqrt(h[-1]):.6f}")`,
    explanation: "Student-t GARCH captures both volatility clustering and fat tails simultaneously; the arch library's MLE is numerically robust and produces standard errors for inference, while the manual path function is useful for simulation.",
  },
  {
    id: "pyfin-20260630-b1-multiindex-risk",
    language: "python",
    title: "pandas MultiIndex Risk Report (Factor Attribution)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def build_factor_risk_report(
    positions: pd.DataFrame,       # columns: asset, quantity, price
    returns: pd.DataFrame,         # T x N asset returns
    factor_loadings: pd.DataFrame, # N x K factor exposure matrix
    factor_cov: np.ndarray,        # K x K factor covariance
    idio_var: np.ndarray,          # N idiosyncratic variances
) -> pd.DataFrame:
    """
    Build a MultiIndex risk report: (region, sector) x (total_var, factor_var, idio_var, VaR_1d).
    """
    # Portfolio weights
    mv = positions["quantity"] * positions["price"]
    w  = mv.values / mv.sum()                          # N-vector of weights

    B  = factor_loadings.values                        # N x K
    Bf = B.T @ w                                       # K portfolio factor betas

    # Factor and idio variance
    port_factor_var = Bf @ factor_cov @ Bf
    port_idio_var   = w @ idio_var @ w if idio_var.ndim == 2 else (w**2 @ idio_var)
    port_total_var  = port_factor_var + port_idio_var
    port_vol = np.sqrt(port_total_var)
    var_1d = 1.645 * port_vol                          # 95% parametric VaR

    # Marginal contribution to risk (MCR) per asset
    cov_matrix = B @ factor_cov @ B.T + np.diag(idio_var)
    mcr = cov_matrix @ w / port_vol                    # N-vector

    positions = positions.copy()
    positions["weight"] = w
    positions["MCR"] = mcr
    positions["MCTR"] = w * mcr                        # marginal contribution to total risk

    # Group by (region, sector) if those columns exist; else by asset
    if "region" in positions.columns and "sector" in positions.columns:
        grp = positions.groupby(["region", "sector"])
        report = grp[["weight", "MCTR"]].sum()
    else:
        report = positions[["asset", "weight", "MCTR"]].set_index("asset")

    report["pct_risk"] = report["MCTR"] / report["MCTR"].sum()
    report.attrs["port_vol"] = port_vol
    report.attrs["VaR_1d_95pct"] = var_1d
    return report

# Minimal demo
n = 5
pos = pd.DataFrame({
    "asset": [f"S{i}" for i in range(n)],
    "quantity": [100, 200, 150, 300, 250],
    "price": [50.0, 30.0, 80.0, 20.0, 60.0],
    "region": ["US","EU","US","APAC","EU"],
    "sector": ["Tech","Fin","Health","Energy","Tech"],
})
K = 3
B = np.random.randn(n, K) * 0.5
Fcov = np.eye(K) * 0.0004
idio = np.full(n, 0.0001)
print(build_factor_risk_report(pos, None, pd.DataFrame(B), Fcov, idio))`,
    explanation: "A MultiIndex risk report aggregates marginal contribution to risk by region and sector, immediately showing which groupings consume the most portfolio variance — the format used daily in systematic risk management systems.",
  },
  {
    id: "pyfin-20260630-b1-svensson",
    language: "python",
    title: "Svensson Yield Curve (Extended Nelson-Siegel)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import differential_evolution

def svensson_yield(tau: float, b0: float, b1: float,
                   b2: float, b3: float,
                   lam1: float, lam2: float) -> float:
    """Svensson (1994) six-parameter yield curve with two hump terms."""
    x1 = lam1 * tau
    x2 = lam2 * tau
    l1 = 1.0
    l2 = (1 - np.exp(-x1)) / x1
    l3 = l2 - np.exp(-x1)              # first curvature
    l4 = (1 - np.exp(-x2)) / x2 - np.exp(-x2)  # second curvature
    return b0 + b1*l2 + b2*l3 + b3*l4

def fit_svensson(maturities: np.ndarray,
                 observed_yields: np.ndarray) -> dict:
    def loss(params):
        b0, b1, b2, b3, lam1, lam2 = params
        if lam1 <= 0.01 or lam2 <= 0.01 or lam1 == lam2:
            return 1e9
        fitted = np.array([svensson_yield(t, b0, b1, b2, b3, lam1, lam2)
                           for t in maturities])
        return np.sum((fitted - observed_yields)**2)

    # Differential evolution avoids local minima from multi-modal landscape
    bounds = [
        (0.0, 0.15), (-0.15, 0.15), (-0.15, 0.15), (-0.15, 0.15),  # betas
        (0.05, 5.0), (0.05, 5.0),                                     # lambdas
    ]
    res = differential_evolution(loss, bounds, seed=0,
                                 maxiter=2000, tol=1e-10,
                                 popsize=15, mutation=(0.5, 1.5))
    b0, b1, b2, b3, lam1, lam2 = res.x
    rmse = np.sqrt(res.fun / len(maturities)) * 10000
    return {"beta0": b0, "beta1": b1, "beta2": b2, "beta3": b3,
            "lambda1": lam1, "lambda2": lam2, "RMSE_bps": rmse}

mats = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([5.30, 5.25, 5.10, 4.85, 4.70, 4.55, 4.50, 4.48, 4.60, 4.65]) / 100
print(fit_svensson(mats, yields))`,
    explanation: "Svensson extends Nelson-Siegel with a second hump term, achieving a better fit to yield curves that have two humps (common in some rate environments); differential evolution handles the non-convex landscape more robustly than gradient methods.",
  },
  {
    id: "pyfin-20260630-b1-parametric-var",
    language: "python",
    title: "Parametric (Delta-Normal) Portfolio VaR",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import norm, t as student_t

def parametric_var(
    weights: np.ndarray,               # portfolio weights (sum=1)
    cov_matrix: np.ndarray,            # N x N annualised covariance
    confidence: float = 0.99,
    holding_period: int = 1,           # days
    dist: str = "normal",              # "normal" or "t"
    df: float = 5.0,                   # t-dist degrees of freedom
) -> dict:
    """
    Delta-normal VaR and CVaR (Expected Shortfall) for a linear portfolio.
    Scales from annual covariance to daily by dividing by 252.
    """
    daily_cov = cov_matrix / 252
    port_var_daily = weights @ daily_cov @ weights
    port_vol_daily = np.sqrt(port_var_daily)
    port_vol_hp    = port_vol_daily * np.sqrt(holding_period)

    if dist == "normal":
        z = norm.ppf(confidence)
        es_ratio = norm.pdf(z) / (1 - confidence)   # E[Z|Z>z] for std normal
    else:  # Student-t
        z = student_t.ppf(confidence, df=df)
        # CVaR for t-dist: E[X|X>VaR] = pdf(z,df)/(1-p) * (df + z^2)/(df - 1)
        es_ratio = (student_t.pdf(z, df=df) / (1 - confidence)
                    * (df + z**2) / (df - 1))

    var  = z * port_vol_hp
    cvar = es_ratio * port_vol_hp     # Conditional VaR (ES)

    return {
        "port_vol_daily": port_vol_daily,
        "VaR": var,
        "CVaR_ES": cvar,
        "confidence": confidence,
        "holding_period_days": holding_period,
        "distribution": dist,
    }

# Example: equal-weight 3-asset portfolio
w = np.array([1/3, 1/3, 1/3])
annual_vol = np.array([0.15, 0.20, 0.25])
corr = np.array([[1.0, 0.4, 0.2],
                 [0.4, 1.0, 0.5],
                 [0.2, 0.5, 1.0]])
cov = np.diag(annual_vol) @ corr @ np.diag(annual_vol)

print(parametric_var(w, cov, confidence=0.99, holding_period=1, dist="normal"))
print(parametric_var(w, cov, confidence=0.99, holding_period=10, dist="t", df=5))`,
    explanation: "Delta-normal VaR assumes portfolio P&L is normally distributed; switching to Student-t captures fat tails and dramatically increases VaR and ES estimates — a critical regulatory and internal risk distinction.",
  },
  {
    id: "pyfin-20260630-b1-cvxpy-portfolio",
    language: "python",
    title: "Mean-Variance Portfolio Optimisation with cvxpy",
    tag: "finance",
    code: `import numpy as np

# pip install cvxpy
try:
    import cvxpy as cp
    HAS_CVXPY = True
except ImportError:
    HAS_CVXPY = False

def mv_optimise(mu: np.ndarray, Sigma: np.ndarray,
                target_return: float,
                long_only: bool = True,
                max_weight: float = 0.30) -> dict:
    """
    Minimum variance portfolio for a target return using CVXPY.
    Constraints: weights sum to 1, optional long-only + max position.
    """
    if not HAS_CVXPY:
        return {"error": "cvxpy not installed"}
    n = len(mu)
    w = cp.Variable(n)
    risk = cp.quad_form(w, Sigma)               # w' Sigma w (portfolio variance)
    constraints = [
        cp.sum(w) == 1,                         # fully invested
        w @ mu >= target_return,                # target return constraint
    ]
    if long_only:
        constraints.append(w >= 0)
    constraints.append(w <= max_weight)

    prob = cp.Problem(cp.Minimize(risk), constraints)
    prob.solve(solver=cp.CLARABEL)

    if prob.status not in ("optimal", "optimal_inaccurate"):
        return {"status": prob.status}

    w_opt = w.value
    ret   = float(mu @ w_opt)
    vol   = float(np.sqrt(w_opt @ Sigma @ w_opt))
    return {"weights": w_opt, "return": ret, "vol": vol,
            "sharpe": (ret - 0.04) / vol, "status": prob.status}

# Efficient frontier sweep
np.random.seed(7)
n = 10
mu  = np.random.uniform(0.05, 0.15, n)
std = np.random.uniform(0.10, 0.30, n)
corr = np.eye(n)
corr[0,1] = corr[1,0] = 0.4
Sigma = np.diag(std) @ corr @ np.diag(std)

for target in np.linspace(mu.min(), mu.max(), 5):
    res = mv_optimise(mu, Sigma, target)
    if "vol" in res:
        print(f"target={target:.3f} vol={res['vol']:.3f} sharpe={res['sharpe']:.2f}")`,
    explanation: "CVXPY solves mean-variance optimisation as a convex QP with arbitrary linear constraints; it separates problem formulation from the solver, making it trivial to add turnover limits, sector caps, or ESG score constraints.",
  },
  {
    id: "pyfin-20260630-b1-mc-antithetic",
    language: "python",
    title: "Monte Carlo Variance Reduction: Antithetic Variates",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_price(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_antithetic(S: float, K: float, T: float, r: float,
                  sigma: float, n_paths: int = 50_000,
                  seed: int = 0) -> dict:
    """
    Antithetic variates: pair each path Z with -Z to reduce variance.
    Uses half the normal random draws -> same cost, ~50-70% variance reduction.
    """
    rng = np.random.default_rng(seed)
    Z = rng.standard_normal(n_paths // 2)   # half the draws

    # Two paired paths
    ST_pos = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    ST_neg = S * np.exp((r - 0.5*sigma**2)*T - sigma*np.sqrt(T)*Z)  # antithetic

    payoff_pos = np.maximum(ST_pos - K, 0)
    payoff_neg = np.maximum(ST_neg - K, 0)
    payoff_avg = 0.5 * (payoff_pos + payoff_neg)   # average antithetic pair

    price = np.exp(-r*T) * payoff_avg.mean()
    se    = np.exp(-r*T) * payoff_avg.std() / np.sqrt(len(payoff_avg))

    # Crude MC for comparison (same total paths)
    Z2 = rng.standard_normal(n_paths)
    ST2 = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z2)
    price_crude = np.exp(-r*T) * np.maximum(ST2 - K, 0).mean()
    se_crude    = np.exp(-r*T) * np.maximum(ST2-K, 0).std() / np.sqrt(n_paths)

    analytic = bs_call_price(S, K, T, r, sigma)
    return {"analytic": analytic,
            "antithetic_price": price, "antithetic_SE": se,
            "crude_price": price_crude, "crude_SE": se_crude,
            "variance_reduction": (se_crude/se)**2}

result = mc_antithetic(S=100, K=100, T=1, r=0.05, sigma=0.20)
print(result)`,
    explanation: "Antithetic variates exploit negative correlation between paired paths (Z and -Z) to cancel variance; when payoff is convex (like a call), the reduction is only partial but typically delivers 40-60% fewer paths needed for the same accuracy.",
  },
  {
    id: "pyfin-20260630-b1-control-variate",
    language: "python",
    title: "Monte Carlo Variance Reduction: Control Variates",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_price(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_control_variate_asian(
    S: float, K: float, T: float, r: float, sigma: float,
    n_steps: int = 52,      # weekly monitoring
    n_paths: int = 50_000,
    seed: int = 1,
) -> dict:
    """
    Price arithmetic-average Asian call using geometric-average call as control variate.
    Geometric average has analytic price; arithmetic average does not.
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    disc_factor = np.exp(-r * T)

    # Simulate full paths: n_paths x n_steps increments
    Z = rng.standard_normal((n_paths, n_steps))
    log_dS = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    log_S = np.log(S) + np.cumsum(log_dS, axis=1)
    S_paths = np.exp(log_S)                             # n_paths x n_steps

    # Arithmetic mean
    arith_mean = S_paths.mean(axis=1)
    arith_payoff = np.maximum(arith_mean - K, 0)

    # Geometric mean (control variate)
    geom_mean = np.exp(np.log(S_paths).mean(axis=1))
    geom_payoff = np.maximum(geom_mean - K, 0)

    # Analytic geometric average call price (Kemna-Vorst 1990)
    sigma_g = sigma * np.sqrt((2*n_steps + 1) / (6*(n_steps + 1)))
    mu_g    = (r - 0.5*sigma**2) * (n_steps + 1) / (2*n_steps) + 0.5*sigma_g**2
    d1g = (np.log(S/K) + (mu_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2g = d1g - sigma_g*np.sqrt(T)
    geom_analytic = disc_factor * (S*np.exp((mu_g - r)*T)*norm.cdf(d1g)
                                   - K*norm.cdf(d2g))

    # OLS control variate coefficient beta_cv
    cov_mat = np.cov(arith_payoff, geom_payoff)
    beta_cv = cov_mat[0, 1] / cov_mat[1, 1]

    adjusted = arith_payoff - beta_cv * (geom_payoff - geom_analytic)
    price_cv = disc_factor * adjusted.mean()
    se_cv    = disc_factor * adjusted.std() / np.sqrt(n_paths)
    price_crude = disc_factor * arith_payoff.mean()
    se_crude    = disc_factor * arith_payoff.std() / np.sqrt(n_paths)

    return {"asian_cv_price": price_cv, "SE_cv": se_cv,
            "asian_crude_price": price_crude, "SE_crude": se_crude,
            "variance_reduction": (se_crude/se_cv)**2,
            "beta_cv": beta_cv}

result = mc_control_variate_asian(S=100, K=100, T=1, r=0.05, sigma=0.20)
print(result)`,
    explanation: "The control variate technique uses a correlated variable with known expectation (geometric-average call, analytic via Kemna-Vorst) to correct Monte Carlo bias and dramatically reduce variance — often achieving 10-100× variance reduction for path-dependent options.",
  },
];
