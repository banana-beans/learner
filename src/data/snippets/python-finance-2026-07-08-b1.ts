import type { Snippet } from "./types";

export const pythonFinanceSnippets20260708B1: Snippet[] = [
  {
    id: "pyfin-20260708-b1-pandas-multi-attribution",
    language: "python",
    title: "MultiIndex Factor Attribution with pandas",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

# Returns indexed by (date, asset); factors: Mkt, SMB, HML
idx = pd.MultiIndex.from_product(
    [pd.date_range("2024-01-01", periods=3), ["AAPL", "MSFT", "GOOG"]],
    names=["date", "asset"],
)
returns = pd.Series(np.random.randn(9) * 0.01, index=idx, name="ret")
betas = pd.DataFrame(
    {"Mkt": [1.1, 0.9, 1.0, 1.1, 0.9, 1.0, 1.1, 0.9, 1.0],
     "SMB": [-0.2, 0.3, 0.0, -0.2, 0.3, 0.0, -0.2, 0.3, 0.0],
     "HML": [0.1, -0.1, 0.2, 0.1, -0.1, 0.2, 0.1, -0.1, 0.2]},
    index=idx,
)
factor_returns = pd.DataFrame(
    {"Mkt": [0.005, 0.003, -0.002],
     "SMB": [0.001, -0.001, 0.002],
     "HML": [-0.001, 0.002, 0.001]},
    index=pd.date_range("2024-01-01", periods=3),
)

# Broadcast factor returns onto (date, asset) index
fr_expanded = factor_returns.loc[returns.index.get_level_values("date")].values
factor_contrib = pd.DataFrame(
    betas.values * fr_expanded,   # element-wise: beta_i,f * f_return_t
    index=idx,
    columns=betas.columns,
)
factor_contrib["alpha"] = returns.values - factor_contrib.sum(axis=1).values

# Aggregate by date to see daily attribution
daily = factor_contrib.groupby(level="date").mean()
print(daily.to_string(float_format="{:.5f}".format))`,
    explanation:
      "MultiIndex DataFrames let you store a panel (dates × assets) and broadcast factor returns with simple loc indexing, producing a tidy attribution table without a loop over dates.",
  },
  {
    id: "pyfin-20260708-b1-scipy-efficient-frontier",
    language: "python",
    title: "Mean-Variance Efficient Frontier via scipy.optimize",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

np.random.seed(42)
n = 5
mu = np.array([0.10, 0.12, 0.09, 0.15, 0.11])       # annual expected returns
cov = (lambda A: A @ A.T / n)(np.random.randn(n, n))  # random PSD cov

def port_stats(w):
    ret = w @ mu
    vol = np.sqrt(w @ cov @ w)
    return ret, vol

def min_vol_for_target(target_ret):
    result = minimize(
        lambda w: w @ cov @ w,          # minimise variance
        x0=np.ones(n) / n,
        method="SLSQP",
        bounds=[(0, 1)] * n,            # long-only
        constraints=[
            {"type": "eq", "fun": lambda w: w.sum() - 1},       # full investment
            {"type": "eq", "fun": lambda w: w @ mu - target_ret}, # return target
        ],
    )
    return result

targets = np.linspace(mu.min(), mu.max(), 20)
frontier = []
for t in targets:
    res = min_vol_for_target(t)
    if res.success:
        r, v = port_stats(res.x)
        frontier.append((r, v))

for r, v in frontier:
    print(f"ret={r:.4f}  vol={v:.4f}  sharpe={r/v:.3f}")`,
    explanation:
      "The efficient frontier is traced by minimising portfolio variance subject to a return target; scipy SLSQP handles the quadratic programme with linear equality constraints in a few milliseconds even for 100-asset universes.",
  },
  {
    id: "pyfin-20260708-b1-fama-french-3f",
    language: "python",
    title: "Fama-French 3-Factor OLS Regression",
    tag: "finance",
    code: `import numpy as np

# Synthetic daily excess returns and factor series (T=252 days)
np.random.seed(0)
T = 252
Mkt = np.random.randn(T) * 0.01
SMB = np.random.randn(T) * 0.005
HML = np.random.randn(T) * 0.005
# True betas: 1.1, 0.3, -0.2; alpha 0.0002
R_excess = 0.0002 + 1.1 * Mkt + 0.3 * SMB - 0.2 * HML + np.random.randn(T) * 0.005

X = np.column_stack([np.ones(T), Mkt, SMB, HML])   # design matrix (T x 4)
# OLS closed-form: beta = (X'X)^{-1} X'y
XtX = X.T @ X
Xty = X.T @ R_excess
beta = np.linalg.solve(XtX, Xty)                   # solve is faster than explicit inverse

residuals = R_excess - X @ beta
sigma2 = residuals @ residuals / (T - 4)           # unbiased variance estimate
var_beta = sigma2 * np.linalg.inv(XtX)             # covariance of estimates
t_stats = beta / np.sqrt(np.diag(var_beta))        # t-ratios

labels = ["alpha", "beta_Mkt", "beta_SMB", "beta_HML"]
for name, b, t in zip(labels, beta, t_stats):
    print(f"{name:12s}  coef={b:+.5f}  t={t:+.2f}")`,
    explanation:
      "Fama-French regression is pure OLS — no loop, no sklearn needed. `np.linalg.solve` is numerically safer than inverting X'X directly, and residual variance gives exact standard errors for t-tests.",
  },
  {
    id: "pyfin-20260708-b1-black-litterman",
    language: "python",
    title: "Black-Litterman Posterior Returns",
    tag: "finance",
    code: `import numpy as np

# Market equilibrium inputs
n = 4
mkt_weights = np.array([0.30, 0.25, 0.25, 0.20])   # cap-weight
cov = np.array([[0.04, 0.01, 0.01, 0.00],
                [0.01, 0.05, 0.02, 0.01],
                [0.01, 0.02, 0.06, 0.01],
                [0.00, 0.01, 0.01, 0.03]])
delta = 2.5                                          # risk-aversion coefficient
tau   = 0.05                                         # scaling factor on prior uncertainty

# Implied equilibrium excess returns: pi = delta * Sigma * w
pi = delta * cov @ mkt_weights

# One absolute view: asset 0 will return 8% (uncertainty 2%)
P = np.array([[1, 0, 0, 0]])                         # pick matrix (K x N)
Q = np.array([0.08])                                 # view returns
Omega = np.diag([0.0004])                            # view uncertainty (variance)

# Black-Litterman master formula
# mu_BL = [(tau*Sigma)^-1 + P' Omega^-1 P]^-1 [(tau*Sigma)^-1 pi + P' Omega^-1 Q]
tau_cov = tau * cov
A = np.linalg.inv(tau_cov) + P.T @ np.linalg.inv(Omega) @ P
b = np.linalg.inv(tau_cov) @ pi + P.T @ np.linalg.inv(Omega) @ Q
mu_bl = np.linalg.solve(A, b)

print("Equilibrium pi:", np.round(pi, 4))
print("BL posterior:  ", np.round(mu_bl, 4))`,
    explanation:
      "Black-Litterman blends CAPM equilibrium returns (implied by market weights) with analyst views via a Bayesian update. The posterior pulls expected returns toward views in proportion to view confidence vs. prior uncertainty.",
  },
  {
    id: "pyfin-20260708-b1-vasicek-bond",
    language: "python",
    title: "Vasicek Model Bond Pricing",
    tag: "finance",
    code: `import numpy as np

def vasicek_zcb(r0: float, kappa: float, theta: float, sigma: float, T: float) -> float:
    """Zero-coupon bond price P(0,T) under Vasicek dr = kappa(theta-r)dt + sigma dW."""
    B = (1 - np.exp(-kappa * T)) / kappa
    # A is the log(P)/T affine term — closed-form integral of risk-neutral dynamics
    A = np.exp(
        (theta - sigma**2 / (2 * kappa**2)) * (B - T)
        - sigma**2 * B**2 / (4 * kappa)
    )
    return A * np.exp(-B * r0)

def vasicek_yield_curve(r0, kappa, theta, sigma, maturities):
    """Zero rates from Vasicek bond prices."""
    prices = [vasicek_zcb(r0, kappa, theta, sigma, T) for T in maturities]
    return [-np.log(P) / T for P, T in zip(prices, maturities)]

kappa, theta, sigma, r0 = 0.3, 0.04, 0.01, 0.02
maturities = [0.25, 0.5, 1, 2, 5, 10, 30]
yields = vasicek_yield_curve(r0, kappa, theta, sigma, maturities)

for T, y in zip(maturities, yields):
    print(f"T={T:5.2f}y  zero_rate={y:.4f}")`,
    explanation:
      "Vasicek has an affine-yield closed form: P(0,T) = A(T) exp(-B(T) r₀). This lets you instantly build the full yield curve without Monte Carlo — key for bond pricing, duration hedging, and rate sensitivity analysis.",
  },
  {
    id: "pyfin-20260708-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Binomial Short-Rate Tree",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_calibrate(market_yields: list, dt: float = 1.0):
    """
    Calibrate a BDT tree to market zero rates.
    Returns list of (r_down, r_up) pairs at each time step.
    """
    n = len(market_yields)
    tree_nodes = []   # r[t] = [r_d, r_u] for each step

    def zcb_price_from_tree(nodes, step, dt):
        """Backward induction on BDT tree to get ZCB price."""
        # Terminal payoff = 1
        vals = np.ones(step + 1)
        for t in range(step - 1, -1, -1):
            r_d, r_u = nodes[t]
            # Short rates at each node: r_d * u^j where u = r_u/r_d
            sigma_mult = (r_u / r_d) ** 0.5 if r_d > 0 else 1.0
            r_nodes = [r_d * sigma_mult ** j for j in range(t + 1)]
            disc = [np.exp(-r * dt) for r in r_nodes]
            vals = [0.5 * (vals[j] + vals[j + 1]) * disc[j] for j in range(t + 1)]
        return vals[0]

    # Step 0: r_0 implied directly from 1-period yield
    r0 = np.exp(market_yields[0] * dt) - 1
    tree_nodes.append((r0, r0))   # single node, r_up = r_down

    for step in range(1, n):
        target_price = np.exp(-market_yields[step] * dt * (step + 1))

        def objective(r_d):
            nodes = tree_nodes + [(r_d, r_d * 1.1)]  # assume 10% vol spread
            return zcb_price_from_tree(nodes, step + 1, dt) - target_price

        r_d_sol = brentq(objective, 0.001, 0.30)
        tree_nodes.append((r_d_sol, r_d_sol * 1.1))

    return tree_nodes

yields = [0.03, 0.035, 0.04, 0.042, 0.045]
nodes = bdt_calibrate(yields, dt=1.0)
for i, (rd, ru) in enumerate(nodes):
    print(f"t={i}  r_down={rd:.4f}  r_up={ru:.4f}")`,
    explanation:
      "BDT fits a recombining binomial tree to the observed term structure by bootstrapping one period at a time. Backward induction prices ZCBs on the tree; Brent's method solves the root at each step for the down-node short rate.",
  },
  {
    id: "pyfin-20260708-b1-sabr-implied-vol",
    language: "python",
    title: "SABR Hagan 2002 Implied Volatility Approximation",
    tag: "finance",
    code: `import numpy as np

def sabr_implied_vol(
    F: float, K: float, T: float,
    alpha: float, beta: float, rho: float, nu: float,
) -> float:
    """
    Hagan et al. (2002) SABR normal-vol approximation.
    F: forward, K: strike, T: expiry, alpha: initial vol,
    beta: CEV exponent [0,1], rho: correlation, nu: vol-of-vol.
    """
    if abs(F - K) < 1e-8:   # ATM formula
        FK_mid = F ** (1 - beta)
        term1 = alpha / FK_mid
        term2 = 1 + T * (
            (1 - beta) ** 2 * alpha ** 2 / (24 * FK_mid ** 2)
            + rho * beta * nu * alpha / (4 * FK_mid)
            + (2 - 3 * rho ** 2) * nu ** 2 / 24
        )
        return term1 * term2

    FK = F * K
    x  = np.log(F / K)
    # z factor and chi
    z   = (nu / alpha) * FK ** ((1 - beta) / 2) * x
    chi = np.log((np.sqrt(1 - 2 * rho * z + z**2) + z - rho) / (1 - rho))

    A = alpha / (
        FK ** ((1 - beta) / 2)
        * (1 + (1 - beta) ** 2 * x ** 2 / 24 + (1 - beta) ** 4 * x ** 4 / 1920)
    )
    B = z / chi
    C = 1 + T * (
        (1 - beta) ** 2 * alpha ** 2 / (24 * FK ** (1 - beta))
        + rho * beta * nu * alpha / (4 * FK ** ((1 - beta) / 2))
        + (2 - 3 * rho ** 2) * nu ** 2 / 24
    )
    return A * B * C

# Example: ATM and wing vols
F, T = 100.0, 1.0
params = dict(alpha=0.2, beta=0.5, rho=-0.3, nu=0.4)
for K in [80, 90, 100, 110, 120]:
    iv = sabr_implied_vol(F, K, T, **params)
    print(f"K={K}  SABR_vol={iv:.4f}")`,
    explanation:
      "SABR is the market-standard stochastic vol model for interest-rate options and equity smiles. Hagan's closed-form approximation converts model parameters (alpha, beta, rho, nu) to Black implied vol in microseconds — used daily by derivatives desks for smile interpolation and risk.",
  },
  {
    id: "pyfin-20260708-b1-dupire-local-vol",
    language: "python",
    title: "Dupire Local Volatility from Call Price Grid",
    tag: "finance",
    code: `import numpy as np

# Synthetic call price surface C[i,j] over (T_i, K_j)
Ts = np.array([0.25, 0.5, 1.0, 2.0])
Ks = np.linspace(80, 120, 9)
S0, r = 100.0, 0.02

# Pretend we have market call prices (here: flat 20% BSM vol surface)
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

C = np.array([[bs_call(S0, K, T, r, 0.20) for K in Ks] for T in Ts])

def dupire_local_vol(C, Ts, Ks, r):
    """Numerator: dC/dT; denominator: 0.5 K^2 d^2C/dK^2 (Dupire 1994)."""
    sigma_local = np.zeros((len(Ts) - 1, len(Ks)))
    for i in range(len(Ts) - 1):
        dT = Ts[i + 1] - Ts[i]
        dC_dT = (C[i + 1] - C[i]) / dT                          # finite diff in T
        for j, K in enumerate(Ks):
            if j == 0 or j == len(Ks) - 1:
                sigma_local[i, j] = np.nan
                continue
            dK = Ks[j + 1] - Ks[j - 1]
            d2C_dK2 = (C[i, j + 1] - 2 * C[i, j] + C[i, j - 1]) / ((Ks[j+1]-Ks[j])**2)
            numer = dC_dT[j] + r * K * (C[i, j + 1] - C[i, j - 1]) / dK
            denom = 0.5 * K**2 * d2C_dK2
            sigma_local[i, j] = np.sqrt(abs(numer / denom)) if abs(denom) > 1e-10 else np.nan
    return sigma_local

lv = dupire_local_vol(C, Ts, Ks, r)
print("Local vol surface (rows=T-slices, cols=strikes):")
print(np.round(lv, 4))`,
    explanation:
      "Dupire's formula extracts the unique local vol surface consistent with all observed call prices via finite differences in strike and maturity. It's the foundation for local-vol Monte Carlo pricers used to hedge exotic path-dependent options.",
  },
  {
    id: "pyfin-20260708-b1-control-variate-mc",
    language: "python",
    title: "Control Variate Monte Carlo with Black-Scholes Control",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

np.random.seed(1)
S0, K, T, r, sigma = 100, 105, 1.0, 0.05, 0.20
N = 50_000

Z  = np.random.randn(N)
ST = S0 * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * Z)

# Target payoff: Asian geometric average call
# (geometric average has a BS closed form -- perfect control variate)
payoff_target = np.maximum(np.sqrt(S0 * ST) - K, 0) * np.exp(-r * T)

# Control variate: European call (known BS price)
payoff_control = np.maximum(ST - K, 0) * np.exp(-r * T)
bs_price = bs_call(S0, K, T, r, sigma)

# Optimal covariance adjustment
cov_mat  = np.cov(payoff_target, payoff_control)
c_star   = -cov_mat[0, 1] / cov_mat[1, 1]          # optimal control coefficient

Y_cv     = payoff_target + c_star * (payoff_control - bs_price)

plain_est = payoff_target.mean()
cv_est    = Y_cv.mean()
plain_se  = payoff_target.std() / np.sqrt(N)
cv_se     = Y_cv.std() / np.sqrt(N)

print(f"Plain MC:    {plain_est:.4f}  SE={plain_se:.6f}")
print(f"Control var: {cv_est:.4f}  SE={cv_se:.6f}")
print(f"Variance reduction: {(plain_se/cv_se)**2:.1f}x")`,
    explanation:
      "Control variates exploit correlation between the target payoff and a related payoff with a known price to slash estimator variance. For geometric-average Asian options the BS European call is a near-perfect control, often achieving 10–100× variance reduction.",
  },
  {
    id: "pyfin-20260708-b1-variance-swap",
    language: "python",
    title: "Variance Swap Fair Value from Options Strip",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def bs_put(S, K, T, r, sigma):
    return bs_call(S, K, T, r, sigma) - S + K * np.exp(-r * T)

def variance_swap_strike(S0: float, r: float, T: float,
                          strikes: np.ndarray, sigma_surface: np.ndarray) -> float:
    """
    Carr-Madan replication: K_var = (2/T) * integral[dK/K^2 * OTM_option]
    Approximate with trapezoidal rule over supplied strike grid.
    """
    F = S0 * np.exp(r * T)          # forward price
    dK = np.diff(strikes)

    integ = 0.0
    for i in range(len(strikes)):
        K  = strikes[i]
        iv = sigma_surface[i]
        # OTM: use put below forward, call above
        if K <= F:
            price = bs_put(S0, K, T, r, iv)
        else:
            price = bs_call(S0, K, T, r, iv)
        # Trapezoidal weight (simple: uniform dK)
        dki = dK[i] if i < len(dK) else dK[-1]
        integ += (price / K**2) * dki

    return (2 / T) * integ   # annualised variance (not vol)

S0, r, T = 100.0, 0.02, 1.0
strikes = np.linspace(70, 140, 30)
# Slight smile: ATM vol 0.20, wings higher
sigma_surface = 0.20 + 0.003 * ((strikes - S0) / S0) ** 2

K_var = variance_swap_strike(S0, r, T, strikes, sigma_surface)
print(f"Fair variance strike: {K_var:.6f}")
print(f"Implied vol equiv:    {np.sqrt(K_var):.4f}")`,
    explanation:
      "A variance swap pays realised variance minus a fixed strike K_var, replicated by a log-contract approximated with a strip of OTM options. The integral weights each option inversely by K² — far OTM options carry higher weight.",
  },
  {
    id: "pyfin-20260708-b1-swap-curve-bootstrap",
    language: "python",
    title: "Zero-Coupon Curve Bootstrap from Par Swap Rates",
    tag: "finance",
    code: `import numpy as np

def bootstrap_zero_curve(swap_rates: dict) -> dict:
    """
    Bootstrap zero rates from par swap rates.
    swap_rates: {maturity_years: par_rate}
    Assumes annual payments, Act/Act daycount.
    """
    zeros = {}   # maturity -> zero rate

    for T, par_rate in sorted(swap_rates.items()):
        # PV of coupons on already-known tenors
        coupon_pv = 0.0
        for t in range(1, T):
            if t in zeros:
                coupon_pv += par_rate * np.exp(-zeros[t] * t)
            # Skip tenors without a zero rate (gap filling not handled here)

        # Solve for T-year zero rate:
        # par_rate * sum(df_t) + 1 * df_T = 1  =>  df_T = (1 - coupon_pv) / (1 + par_rate)
        df_T = (1.0 - coupon_pv) / (1.0 + par_rate)
        z_T  = -np.log(df_T) / T
        zeros[T] = z_T

    return zeros

swap_rates = {1: 0.030, 2: 0.035, 3: 0.038, 4: 0.040, 5: 0.042,
              7: 0.045, 10: 0.047, 15: 0.049, 20: 0.050, 30: 0.051}

zeros = bootstrap_zero_curve(swap_rates)
print(f"{'Tenor':>6}  {'Par rate':>9}  {'Zero rate':>10}  {'Disc factor':>12}")
for T in sorted(zeros):
    z = zeros[T]
    s = swap_rates.get(T, float("nan"))
    df = np.exp(-z * T)
    print(f"{T:6d}  {s:9.4f}  {z:10.4f}  {df:12.6f}")`,
    explanation:
      "Bootstrapping strips zero rates one maturity at a time: the T-year zero is the single unknown once all shorter zeros are known, because the par swap price must equal par. This is the first step in any rates desk's curve construction pipeline.",
  },
  {
    id: "pyfin-20260708-b1-merton-jump",
    language: "python",
    title: "Merton Jump-Diffusion Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, poisson

def merton_call(S: float, K: float, T: float, r: float,
                sigma: float, lam: float, mu_j: float, sigma_j: float,
                max_terms: int = 50) -> float:
    """
    Merton (1976) jump-diffusion call price as sum over Poisson jump counts.
    lam: jump intensity (jumps/year)
    mu_j, sigma_j: log-jump mean and std
    """
    k  = np.exp(mu_j + 0.5 * sigma_j**2) - 1   # expected jump size - 1
    lam_p = lam * (1 + k)                        # risk-neutral intensity
    price = 0.0
    for n in range(max_terms):
        # nth term uses adjusted vol and drift
        sigma_n = np.sqrt(sigma**2 + n * sigma_j**2 / T)
        r_n     = r - lam * k + n * (mu_j + 0.5 * sigma_j**2) / T
        w_n     = np.exp(-lam_p * T) * (lam_p * T) ** n / np.math.factorial(n)
        d1 = (np.log(S / K) + (r_n + 0.5 * sigma_n**2) * T) / (sigma_n * np.sqrt(T))
        d2 = d1 - sigma_n * np.sqrt(T)
        bs_n = S * norm.cdf(d1) - K * np.exp(-r_n * T) * norm.cdf(d2)
        price += w_n * bs_n
    return price

S, K, T, r = 100, 100, 1.0, 0.05
sigma = 0.15         # diffusion vol
lam   = 1.0          # on average 1 jump/year
mu_j  = -0.05        # mean log-jump (negative = crash bias)
sigma_j = 0.10       # jump vol

price = merton_call(S, K, T, r, sigma, lam, mu_j, sigma_j)
print(f"Merton call price: {price:.4f}")`,
    explanation:
      "Merton's jump-diffusion adds a Poisson-distributed jump component to GBM, capturing crash risk absent in Black-Scholes. The price is a Poisson-weighted sum of BS prices with adjusted drift and vol — convergent in ~20 terms for typical parameters.",
  },
  {
    id: "pyfin-20260708-b1-hrp",
    language: "python",
    title: "Hierarchical Risk Parity (HRP) Portfolio Construction",
    tag: "finance",
    code: `import numpy as np

np.random.seed(7)
n = 6
# Random corr matrix: positive definite
A = np.random.randn(n, n)
corr = (A @ A.T); np.fill_diagonal(corr, 1.0)
corr /= np.outer(np.sqrt(np.diag(corr)), np.sqrt(np.diag(corr)))
vols = np.array([0.15, 0.20, 0.12, 0.25, 0.18, 0.10])
cov  = np.outer(vols, vols) * corr

def hrp_weights(cov: np.ndarray) -> np.ndarray:
    """Lopez de Prado (2016) Hierarchical Risk Parity."""
    n = cov.shape[0]
    dist = np.sqrt(0.5 * (1 - corr))   # distance matrix from correlation
    np.fill_diagonal(dist, 0)

    # Step 1: hierarchical clustering (single linkage, naive implementation)
    from scipy.cluster.hierarchy import linkage, leaves_list
    Z = linkage(dist[np.triu_indices(n, 1)], method="single")
    order = leaves_list(Z)              # reordered asset indices

    # Step 2: recursive bisection
    weights = np.ones(n)
    clusters = [list(order)]
    while clusters:
        cluster = clusters.pop()
        if len(cluster) <= 1:
            continue
        mid = len(cluster) // 2
        left, right = cluster[:mid], cluster[mid:]
        # Cluster variance = w' Sigma w for equal-weight cluster
        def cluster_var(c):
            w = np.zeros(n); w[c] = 1.0 / len(c)
            return w @ cov @ w
        alpha = 1 - cluster_var(left) / (cluster_var(left) + cluster_var(right))
        weights[left]  *= alpha
        weights[right] *= (1 - alpha)
        clusters.extend([left, right])

    return weights / weights.sum()

w = hrp_weights(cov)
for i, wi in enumerate(w):
    print(f"Asset {i}: weight={wi:.4f}  vol={vols[i]:.2f}")`,
    explanation:
      "HRP builds a hierarchically-clustered dendrogram from the correlation matrix, then allocates risk by recursive bisection — each split assigns weight proportional to inverse cluster variance. It outperforms Markowitz out-of-sample when the covariance matrix is noisy.",
  },
  {
    id: "pyfin-20260708-b1-risk-contribution",
    language: "python",
    title: "Component VaR and Marginal VaR Decomposition",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def risk_decomposition(weights: np.ndarray, cov: np.ndarray,
                        confidence: float = 0.99) -> dict:
    """
    Parametric component VaR for a long-only portfolio.
    Returns marginal VaR, component VaR, and % contribution.
    """
    port_var = weights @ cov @ weights
    port_vol = np.sqrt(port_var)
    z = norm.ppf(confidence)              # e.g., 2.326 for 99%

    port_VaR = z * port_vol

    # Marginal VaR: dVaR/dw_i = z * (Sigma w)_i / sigma_p
    marginal_VaR = z * (cov @ weights) / port_vol

    # Component VaR: w_i * marginal_VaR_i  (sums to portfolio VaR)
    component_VaR = weights * marginal_VaR

    pct_contrib = component_VaR / port_VaR * 100

    return {
        "port_vol":      port_vol,
        "port_VaR":      port_VaR,
        "marginal_VaR":  marginal_VaR,
        "component_VaR": component_VaR,
        "pct_contrib":   pct_contrib,
    }

n = 4
np.random.seed(3)
A = np.random.randn(n, n) * 0.1
cov = A @ A.T + np.eye(n) * 0.01
weights = np.array([0.4, 0.3, 0.2, 0.1])

res = risk_decomposition(weights, cov)
print(f"Portfolio VaR (99%): {res['port_VaR']:.4f}")
for i in range(n):
    print(f"  Asset {i}: mVaR={res['marginal_VaR'][i]:.4f}  "
          f"cVaR={res['component_VaR'][i]:.4f}  "
          f"contrib={res['pct_contrib'][i]:.1f}%")`,
    explanation:
      "Component VaR decomposes portfolio risk into additive per-asset contributions (w_i × ∂VaR/∂w_i). Risk managers use this to spot dominant risk concentrations and enforce diversification rules — a standard output of any risk reporting system.",
  },
  {
    id: "pyfin-20260708-b1-acf-pacf",
    language: "python",
    title: "ACF and PACF for AR Order Selection",
    tag: "finance",
    code: `import numpy as np

def acf(x: np.ndarray, max_lag: int) -> np.ndarray:
    """Sample autocorrelation at lags 0..max_lag."""
    n = len(x)
    xc = x - x.mean()
    var = xc @ xc
    result = []
    for h in range(max_lag + 1):
        result.append(np.dot(xc[:n - h], xc[h:]) / var)
    return np.array(result)

def pacf_yw(x: np.ndarray, max_lag: int) -> np.ndarray:
    """Partial ACF via Yule-Walker equations (Levinson-Durbin)."""
    rho = acf(x, max_lag)
    pacf_vals = [1.0]
    phi = np.zeros(max_lag)
    for m in range(1, max_lag + 1):
        # Build Toeplitz from rho[0..m-1]
        R = np.array([[rho[abs(i - j)] for j in range(m)] for i in range(m)])
        r = rho[1:m + 1]
        try:
            phi_m = np.linalg.solve(R, r)
        except np.linalg.LinAlgError:
            phi_m = np.zeros(m)
        pacf_vals.append(phi_m[-1])     # last element is the partial correlation at lag m
    return np.array(pacf_vals)

# Simulate AR(2): x_t = 0.5 x_{t-1} - 0.3 x_{t-2} + eps
np.random.seed(9)
n = 500
x = np.zeros(n)
for t in range(2, n):
    x[t] = 0.5 * x[t - 1] - 0.3 * x[t - 2] + np.random.randn()

a = acf(x, 10)
p = pacf_yw(x, 10)
conf = 1.96 / np.sqrt(n)    # 95% confidence band

print(f"Lag   ACF     PACF    [+/-{conf:.3f} is significant]")
for h in range(11):
    sig_a = "*" if abs(a[h]) > conf else " "
    sig_p = "*" if abs(p[h]) > conf else " "
    print(f"  {h:2d}  {a[h]:+.4f}{sig_a}  {p[h]:+.4f}{sig_p}")`,
    explanation:
      "ACF identifies MA order (cuts off at lag q); PACF identifies AR order (cuts off at lag p). Together they implement the Box-Jenkins model identification step — a daily tool for regime filtering and alpha signal autocorrelation analysis.",
  },
  {
    id: "pyfin-20260708-b1-student-t-var",
    language: "python",
    title: "Parametric VaR with Student-t Fat Tails",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as student_t, norm

def fit_student_t_mle(returns: np.ndarray):
    """MLE for location, scale, df of a Student-t fit to returns."""
    from scipy.optimize import minimize
    from scipy.special import gammaln

    def neg_log_lik(params):
        mu, scale, nu = params
        if scale <= 0 or nu <= 2:
            return 1e10
        log_lik = (
            gammaln((nu + 1) / 2)
            - gammaln(nu / 2)
            - 0.5 * np.log(np.pi * nu)
            - np.log(scale)
            - (nu + 1) / 2 * np.log(1 + ((returns - mu) / scale)**2 / nu)
        )
        return -log_lik.sum()

    x0 = [returns.mean(), returns.std(), 5.0]
    res = minimize(neg_log_lik, x0, method="Nelder-Mead",
                   options={"xatol": 1e-8, "fatol": 1e-8, "maxiter": 10000})
    return res.x   # mu, scale, nu

np.random.seed(42)
returns = np.concatenate([
    np.random.randn(480) * 0.01,
    np.random.randn(20) * 0.05,    # fat-tail crash days
])

mu, scale, nu = fit_student_t_mle(returns)
print(f"Fitted: mu={mu:.5f}  scale={scale:.5f}  df={nu:.2f}")

confidence = 0.99
# Student-t VaR: mu + scale * t_{1-alpha}(nu)
t_var_1d = -(mu + scale * student_t.ppf(1 - confidence, df=nu))
n_var_1d  = -(returns.mean() + returns.std() * norm.ppf(1 - confidence))
print(f"Student-t VaR (1d, 99%): {t_var_1d:.4f}")
print(f"Normal VaR    (1d, 99%): {n_var_1d:.4f}  (underestimates tail risk)")`,
    explanation:
      "Normal VaR underestimates tail risk because financial returns have fat tails (excess kurtosis). Fitting a Student-t distribution via MLE and using its quantile function captures these tails — especially important for stress testing and regulatory capital.",
  },
  {
    id: "pyfin-20260708-b1-pairs-sizing",
    language: "python",
    title: "Dollar-Neutral Pairs Trade Sizing",
    tag: "finance",
    code: `import numpy as np

def pairs_sizing(
    price_A: float, price_B: float,
    beta: float,          # hedge ratio: A = beta * B + alpha
    z_score: float,       # current spread z-score
    notional: float,      # total gross notional in dollars
    entry_z: float = 2.0, # open at |z| > entry_z
    vol_B: float = 0.20,  # annualised vol of B (for stop-loss sizing)
) -> dict:
    """
    Dollar-neutral pairs sizing with constant-notional allocation.
    Long spread (A outperforms): long A, short B.
    Short spread (A underperforms): short A, long B.
    """
    if abs(z_score) < entry_z:
        return {"action": "no_trade", "qty_A": 0, "qty_B": 0}

    # Total notional split 50-50 between the two legs
    notional_per_leg = notional / 2

    qty_A = int(notional_per_leg / price_A)    # number of shares
    qty_B = int(notional_per_leg / (price_B * beta))   # beta-adjusted

    sign = 1 if z_score > 0 else -1   # positive z => A expensive => short A

    return {
        "action": "spread_short" if sign > 0 else "spread_long",
        "qty_A":  -sign * qty_A,      # short A if spread stretched high
        "qty_B":   sign * qty_B,      # long B simultaneously
        "dollar_A": -sign * qty_A * price_A,
        "dollar_B":  sign * qty_B * price_B * beta,
        "beta": beta,
        "z_score": z_score,
    }

result = pairs_sizing(
    price_A=52.0, price_B=48.0, beta=1.05,
    z_score=2.4, notional=1_000_000,
)
for k, v in result.items():
    print(f"  {k}: {v}")`,
    explanation:
      "Dollar-neutral pair sizing ensures the long and short legs have equal notional exposure, making the book market-neutral. The beta adjustment scales the B leg so the portfolio is also beta-neutral — eliminating linear market-factor risk.",
  },
  {
    id: "pyfin-20260708-b1-rolling-metrics",
    language: "python",
    title: "Rolling Sharpe, Sortino, and Calmar Ratios",
    tag: "finance",
    code: `import numpy as np

def rolling_metrics(returns: np.ndarray, window: int = 252,
                     rf: float = 0.0) -> dict:
    """
    Rolling risk-adjusted performance metrics.
    returns: daily return series
    window: look-back in trading days (252 = 1 year)
    """
    n = len(returns)
    sharpe = np.full(n, np.nan)
    sortino = np.full(n, np.nan)
    calmar  = np.full(n, np.nan)

    for i in range(window - 1, n):
        r = returns[i - window + 1 : i + 1]
        excess = r - rf / 252             # daily excess returns

        ann_ret = excess.mean() * 252
        ann_vol = excess.std(ddof=1) * np.sqrt(252)

        # Sortino: downside deviation only
        downside = excess[excess < 0]
        ann_down = downside.std(ddof=1) * np.sqrt(252) if len(downside) > 1 else np.nan

        # Calmar: ann return / max drawdown
        cum = np.cumprod(1 + r)
        peak = np.maximum.accumulate(cum)
        dd = (cum - peak) / peak
        max_dd = abs(dd.min())

        sharpe[i]  = ann_ret / ann_vol if ann_vol > 0 else np.nan
        sortino[i] = ann_ret / ann_down if ann_down and ann_down > 0 else np.nan
        calmar[i]  = ann_ret / max_dd if max_dd > 0 else np.nan

    return {"sharpe": sharpe, "sortino": sortino, "calmar": calmar}

np.random.seed(5)
daily_ret = np.random.randn(500) * 0.01 + 0.0003   # ~7.5% ann drift
metrics   = rolling_metrics(daily_ret, window=252)

# Report last value
for name, arr in metrics.items():
    val = arr[~np.isnan(arr)][-1]
    print(f"{name:8s}: {val:.3f}")`,
    explanation:
      "Rolling risk-adjusted metrics reveal how consistently a strategy generates alpha over time rather than just at year-end. Sortino penalises only downside deviation; Calmar captures drawdown risk — both are standard in CTA and quant fund reporting.",
  },
  {
    id: "pyfin-20260708-b1-dcc-garch",
    language: "python",
    title: "Simplified DCC-GARCH Dynamic Correlations",
    tag: "finance",
    code: `import numpy as np

def dcc_garch(returns: np.ndarray,
              omega: float = 0.01, alpha: float = 0.05, beta: float = 0.90,
              a: float = 0.04, b: float = 0.92) -> np.ndarray:
    """
    Simplified DCC(1,1)-GARCH(1,1) dynamic correlation for a pair of return series.
    returns: (T, 2) array of daily returns
    omega, alpha, beta: GARCH parameters (same for both series)
    a, b: DCC parameters
    """
    T, N = returns.shape
    h    = np.ones((T, N)) * returns.var(axis=0)   # conditional variance
    eps  = np.zeros_like(returns)

    # Step 1: fit univariate GARCH(1,1) for each series
    for t in range(1, T):
        h[t] = omega + alpha * returns[t - 1] ** 2 + beta * h[t - 1]
    eps = returns / np.sqrt(h)                      # standardised residuals

    # Step 2: DCC correlation update
    Q_bar = np.cov(eps.T)                           # unconditional corr matrix
    Q = Q_bar.copy()
    rho = np.zeros(T)
    rho[0] = Q[0, 1] / np.sqrt(Q[0, 0] * Q[1, 1])

    for t in range(1, T):
        e = eps[t - 1]
        Q = (1 - a - b) * Q_bar + a * np.outer(e, e) + b * Q
        # Correlation from Q
        rho[t] = Q[0, 1] / np.sqrt(Q[0, 0] * Q[1, 1])

    return rho

np.random.seed(11)
T = 500
# Correlated returns: rho shifts from 0.2 to 0.8 mid-sample
Z = np.random.randn(T, 2)
Z[T // 2:, 1] = 0.9 * Z[T // 2:, 0] + 0.44 * Z[T // 2:, 1]
returns = Z * 0.01

rho = dcc_garch(returns)
print(f"Dynamic correlation: first 10 days avg={rho[:10].mean():.3f}, "
      f"last 10 days avg={rho[-10:].mean():.3f}")`,
    explanation:
      "DCC-GARCH tracks time-varying correlations by standardising GARCH residuals, then updating a covariance matrix Q with an EWMA-like rule. Essential for dynamic hedging, correlation trading, and copula-based risk models where static correlations mislead.",
  },
  {
    id: "pyfin-20260708-b1-carr-madan-fft",
    language: "python",
    title: "Carr-Madan FFT Option Pricing",
    tag: "finance",
    code: `import numpy as np

def heston_char_fn(u: np.ndarray, S0: float, r: float, T: float,
                    v0: float, kappa: float, theta: float, sigma: float, rho: float):
    """Heston (1993) characteristic function of log(S_T)."""
    i = 1j
    lam = np.sqrt(sigma**2 * (u**2 + i * u) + (kappa - i * rho * sigma * u)**2)
    d   = (kappa - i * rho * sigma * u - lam) / (kappa - i * rho * sigma * u + lam)
    g   = (1 - d * np.exp(-lam * T)) / (1 - d)
    C   = r * i * u * T + kappa * theta / sigma**2 * (
          (kappa - i * rho * sigma * u - lam) * T - 2 * np.log(g))
    D   = (kappa - i * rho * sigma * u - lam) / sigma**2 * (1 - np.exp(-lam * T)) / (1 - d * np.exp(-lam * T))
    return np.exp(C + D * v0 + i * u * np.log(S0))

def carr_madan_call(S0, K_arr, r, T, v0, kappa, theta, sigma, rho,
                    N=4096, alpha=1.5, eta=0.25):
    """
    Carr-Madan (1999) FFT call pricing for a vector of strikes K_arr.
    Uses dampened integrand to ensure integrability.
    """
    lam = 2 * np.pi / (N * eta)   # strike spacing in log-strike domain
    b   = np.pi / eta             # upper limit of log-strike grid

    # Frequency grid
    v = np.arange(N) * eta
    k = -b + lam * np.arange(N)   # log-strike grid

    # Dampened characteristic function
    psi = np.exp(-r * T) * heston_char_fn(v - (alpha + 1) * 1j, S0, r, T,
                                           v0, kappa, theta, sigma, rho)
    psi /= (alpha**2 + alpha - v**2 + 1j * (2 * alpha + 1) * v)

    # Simpson weights
    w = eta * (3 + (-1) ** np.arange(N) - (np.arange(N) == 0).astype(float)) / 3
    x = w * psi * np.exp(1j * v * b)   # phase shift

    fft_vals = np.fft.fft(x)
    C_k = np.exp(-alpha * k) / np.pi * np.real(fft_vals)

    # Interpolate to requested strikes
    from scipy.interpolate import interp1d
    log_K = np.log(K_arr)
    interp = interp1d(k, C_k, kind="cubic", bounds_error=False, fill_value="extrapolate")
    return np.maximum(interp(log_K), 0.0)

S0, r, T = 100.0, 0.02, 1.0
K_arr = np.array([80., 90., 100., 110., 120.])
v0, kappa, theta, sigma, rho = 0.04, 2.0, 0.04, 0.5, -0.7

prices = carr_madan_call(S0, K_arr, r, T, v0, kappa, theta, sigma, rho)
for K, p in zip(K_arr, prices):
    print(f"K={K:6.1f}  Heston_call={p:.4f}")`,
    explanation:
      "Carr-Madan FFT prices a full options strip in O(N log N) by evaluating the characteristic function on a frequency grid and applying a single FFT — orders of magnitude faster than direct numerical integration per strike. Standard on structured products desks.",
  },
];
