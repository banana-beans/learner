import { Snippet } from "./types";

export const pythonFinanceSnippets20260718B1: Snippet[] = [
  {
    id: "pyfin-20260718-b1-kelly-multiasset",
    language: "python",
    tag: "finance",
    title: "Multi-Asset Kelly Criterion",
    code: `import numpy as np

def kelly_multiasset(mu: np.ndarray, sigma: np.ndarray) -> np.ndarray:
    """
    Continuous-time Kelly fractions: f* = Sigma^{-1} * mu
    mu: excess returns (annualised), sigma: covariance matrix.
    Returns unconstrained fractions; clip to [0,1] for long-only.
    """
    f_star = np.linalg.solve(sigma, mu)
    return f_star

# Example
np.random.seed(0)
n = 4
mu = np.array([0.10, 0.08, 0.12, 0.06])
cov = np.diag([0.04, 0.03, 0.05, 0.02])
fracs = kelly_multiasset(mu, cov)
print("Kelly fractions:", np.round(fracs, 4))
# Fractional Kelly (half-Kelly) is common in practice
half_kelly = np.clip(fracs / 2, 0, 1)
print("Half-Kelly (long-only):", np.round(half_kelly, 4))`,
    explanation:
      "The multi-asset Kelly formula maximises the expected log of wealth. Full Kelly maximises long-run growth but with extreme drawdowns; half-Kelly or quarter-Kelly are typical in practice. The formula is the solution to max_f E[log(1 + f'r)] which under Gaussian returns reduces to f* = Sigma^{-1} mu.",
  },
  {
    id: "pyfin-20260718-b1-gaussian-copula",
    language: "python",
    tag: "finance",
    title: "Gaussian Copula Credit Basket",
    code: `import numpy as np
from scipy import stats

def gaussian_copula_basket(
    n_names: int,
    pd_vec: np.ndarray,
    rho: float,
    n_sims: int = 100_000,
    seed: int = 42,
) -> np.ndarray:
    """
    Single-factor Gaussian copula (Li 2000).
    Returns simulated loss counts across n_sims scenarios.
    """
    rng = np.random.default_rng(seed)
    M = rng.standard_normal(n_sims)          # common factor
    Z = rng.standard_normal((n_sims, n_names))
    # Asset-return proxies
    X = np.sqrt(rho) * M[:, None] + np.sqrt(1 - rho) * Z
    # Default thresholds from PDs via inverse normal
    thresholds = stats.norm.ppf(pd_vec)
    defaults = X < thresholds[None, :]       # shape (n_sims, n_names)
    losses = defaults.sum(axis=1)
    return losses

pd_vec = np.full(125, 0.01)   # CDX IG-like: 125 names, 1% PD each
losses = gaussian_copula_basket(125, pd_vec, rho=0.30)
for k in [0, 5, 10, 20]:
    print(f"P(losses > {k}) = {(losses > k).mean():.4f}")`,
    explanation:
      "The Gaussian copula became famous (and infamous) for pricing CDOs. A single common factor M drives correlation; rho is the asset-return correlation. Default occurs when the latent variable X falls below the PD-implied normal quantile. This single-factor model is the industry standard despite its well-known shortcomings revealed in 2007-2009.",
  },
  {
    id: "pyfin-20260718-b1-sabr-hagan",
    language: "python",
    tag: "finance",
    title: "SABR Implied Vol (Hagan 2002)",
    code: `import numpy as np

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan et al. (2002) analytic approximation for SABR implied vol.
    F: forward, K: strike, T: expiry, alpha: initial vol,
    beta: CEV exponent, rho: vol-spot corr, nu: vol-of-vol.
    """
    if abs(F - K) < 1e-10:  # ATM
        FK_b = F ** (1 - beta)
        term1 = alpha / FK_b
        term2 = (((1 - beta) ** 2 / 24) * alpha**2 / FK_b**2
                 + rho * beta * nu * alpha / (4 * FK_b)
                 + (2 - 3 * rho**2) * nu**2 / 24)
        return term1 * (1 + term2 * T)

    log_FK = np.log(F / K)
    FK_mid = (F * K) ** ((1 - beta) / 2)
    z = nu / alpha * FK_mid * log_FK
    chi = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    A = alpha / (FK_mid * (1 + ((1-beta)**2/24)*log_FK**2
                           + ((1-beta)**4/1920)*log_FK**4))
    B = z / chi
    C = (((1-beta)**2/24)*alpha**2/FK_mid**2
         + rho*beta*nu*alpha/(4*FK_mid)
         + (2 - 3*rho**2)*nu**2/24)
    return A * B * (1 + C * T)

# Typical EURUSD swaption parameters
vols = [sabr_vol(0.03, K, 1.0, 0.02, 0.5, -0.25, 0.40)
        for K in [0.02, 0.025, 0.03, 0.035, 0.04]]
print("Strike smile (bp):", [round(v*1e4, 1) for v in vols])`,
    explanation:
      "SABR (Stochastic Alpha Beta Rho) is the market-standard smile model for interest rate options. The Hagan approximation gives a closed-form implied vol, enabling fast calibration. beta=0 is normal (Bachelier) dynamics; beta=1 is log-normal. The model naturally produces skew via rho and smile curvature via nu.",
  },
  {
    id: "pyfin-20260718-b1-hmm-regime",
    language: "python",
    tag: "finance",
    title: "HMM 2-State Regime Detection (Baum-Welch)",
    code: `import numpy as np
from scipy.stats import norm

def hmm_em(returns: np.ndarray, n_iter: int = 50):
    """
    Baum-Welch EM for a 2-state Gaussian HMM (bull/bear regimes).
    Returns (mu, sigma, A, pi) — emission params, transition matrix, init dist.
    """
    T = len(returns)
    # Initialise: low-vol bull, high-vol bear
    mu = np.array([returns.mean() + returns.std(), returns.mean() - returns.std()])
    sigma = np.array([returns.std() * 0.7, returns.std() * 1.4])
    A = np.array([[0.95, 0.05], [0.10, 0.90]])
    pi = np.array([0.6, 0.4])

    for _ in range(n_iter):
        # E-step: forward-backward
        B = np.column_stack([norm.pdf(returns, mu[j], sigma[j]) for j in range(2)])
        alpha = np.zeros((T, 2))
        alpha[0] = pi * B[0]
        alpha[0] /= alpha[0].sum()
        scale = np.zeros(T)
        scale[0] = 1.0
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            scale[t] = alpha[t].sum()
            alpha[t] /= scale[t]

        beta = np.ones((T, 2))
        for t in range(T-2, -1, -1):
            beta[t] = A @ (B[t+1] * beta[t+1])
            beta[t] /= beta[t].sum()

        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)
        xi_num = np.einsum('ti,ij,tj->tij', alpha[:-1], A, B[1:] * beta[1:])
        xi = xi_num / xi_num.sum(axis=(1, 2), keepdims=True)

        # M-step
        pi = gamma[0]
        A = xi.sum(axis=0) / gamma[:-1].sum(axis=0, keepdims=True).T
        mu = (gamma * returns[:, None]).sum(axis=0) / gamma.sum(axis=0)
        sigma = np.sqrt((gamma * (returns[:, None] - mu)**2).sum(axis=0) / gamma.sum(axis=0))

    return mu, sigma, A, gamma

rng = np.random.default_rng(1)
bull = rng.normal(0.0005, 0.008, 400)
bear = rng.normal(-0.001, 0.018, 100)
rets = np.concatenate([bull, bear, bull[:100]])
mu, sigma, A, gamma = hmm_em(rets)
print(f"State 0: mu={mu[0]:.4f} sigma={sigma[0]:.4f}")
print(f"State 1: mu={mu[1]:.4f} sigma={sigma[1]:.4f}")
print("Transition matrix:\\n", np.round(A, 3))`,
    explanation:
      "Hidden Markov Models detect latent market regimes (bull/bear) from observed returns. Baum-Welch (EM) estimates parameters: emission distributions (mu, sigma per state) and transition matrix A. The posterior state probabilities gamma tell you the current regime probability. Widely used in momentum strategies and risk management to switch regime-dependent parameters.",
  },
  {
    id: "pyfin-20260718-b1-evt-gev",
    language: "python",
    tag: "finance",
    title: "Extreme Value Theory (GEV) Tail Risk",
    code: `import numpy as np
from scipy.stats import genextreme
from scipy.optimize import minimize

def fit_gev_block_maxima(losses: np.ndarray, block_size: int = 21) -> dict:
    """
    Fit GEV to monthly block maxima of daily losses (Fréchet/Gumbel/Weibull).
    Returns GEV params and 99.9% VaR estimate.
    """
    n_blocks = len(losses) // block_size
    blocks = losses[:n_blocks * block_size].reshape(n_blocks, block_size)
    maxima = blocks.max(axis=1)   # monthly worst loss

    # MLE via scipy (shape xi, loc, scale)
    shape, loc, scale = genextreme.fit(maxima)
    print(f"GEV params: shape(xi)={shape:.3f} loc={loc:.4f} scale={scale:.4f}")
    if shape > 0:
        print("Heavy tail (Fréchet / fat-tailed)")
    elif shape < 0:
        print("Bounded tail (Weibull)")
    else:
        print("Light tail (Gumbel)")

    # Return level for T-year period (T*252 trading days / block_size blocks per year)
    def return_level(T_years):
        p = 1 - 1 / (T_years * 252 / block_size)
        return genextreme.ppf(p, shape, loc, scale)

    return {
        "shape": shape, "loc": loc, "scale": scale,
        "VaR_10y": return_level(10),
        "VaR_100y": return_level(100),
    }

rng = np.random.default_rng(7)
# Fat-tailed daily losses (Student-t with 3 df)
from scipy.stats import t as student_t
losses = student_t.rvs(df=3, loc=0, scale=0.015, size=2520, random_state=7)
losses = np.maximum(losses, 0)  # keep only loss side
result = fit_gev_block_maxima(losses)
print(f"10-year VaR: {result['VaR_10y']:.4f}")
print(f"100-year VaR: {result['VaR_100y']:.4f}")`,
    explanation:
      "EVT models the distribution of extremes directly rather than extrapolating from a fitted normal. Block maxima follows a Generalized Extreme Value distribution. Shape xi > 0 (Fréchet) indicates fat tails — critical for stress testing and regulatory capital under Basel III. The Peaks-over-Threshold (POT) approach using GPD is an alternative that wastes less data.",
  },
  {
    id: "pyfin-20260718-b1-asian-cv",
    language: "python",
    tag: "finance",
    title: "Geometric Asian Option via Control Variate MC",
    code: `import numpy as np
from scipy.stats import norm

def geometric_asian_cf(S, K, T, r, sigma, n):
    """Closed-form for geometric average Asian call."""
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))
    mu_g = (r - 0.5*sigma**2) * (n + 1)/(2*n) + 0.5*sigma_g**2
    d1 = (np.log(S/K) + (mu_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    return np.exp(-r*T) * (S*np.exp(mu_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

def arithmetic_asian_cv(S, K, T, r, sigma, n=252, n_sims=100_000, seed=0):
    """
    Arithmetic average Asian call priced by MC with geometric average as control variate.
    Dramatically reduces variance vs. naive MC.
    """
    rng = np.random.default_rng(seed)
    dt = T / n
    Z = rng.standard_normal((n_sims, n))
    paths = S * np.exp(np.cumsum((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1))
    arith_avg = paths.mean(axis=1)
    geom_avg = np.exp(np.log(paths).mean(axis=1))

    payoff_arith = np.maximum(arith_avg - K, 0) * np.exp(-r*T)
    payoff_geom  = np.maximum(geom_avg  - K, 0) * np.exp(-r*T)

    cf_price = geometric_asian_cf(S, K, T, r, sigma, n)
    # OLS beta
    cov_mat = np.cov(payoff_arith, payoff_geom)
    beta = cov_mat[0, 1] / cov_mat[1, 1]
    controlled = payoff_arith - beta * (payoff_geom - cf_price)
    return controlled.mean(), controlled.std() / np.sqrt(n_sims)

price, se = arithmetic_asian_cv(100, 100, 1, 0.05, 0.20)
print(f"Arithmetic Asian call: {price:.4f} +/- {se:.6f}")
print(f"Geometric CF:          {geometric_asian_cf(100, 100, 1, 0.05, 0.20, 252):.4f}")`,
    explanation:
      "The control variate technique exploits the closed-form geometric Asian price to reduce MC variance for the arithmetic Asian (which has no closed form). We regress the arithmetic payoff on the geometric payoff, then subtract the residual. Typical variance reduction is 90-99% vs. naive MC. The OLS beta is the optimal control coefficient.",
  },
  {
    id: "pyfin-20260718-b1-cds-pricing",
    language: "python",
    tag: "finance",
    title: "CDS Pricing (Constant Hazard Rate)",
    code: `import numpy as np

def cds_price(
    spread_bps: float,
    maturity: float,
    hazard_rate: float,
    recovery: float = 0.40,
    r: float = 0.05,
    freq: int = 4,       # quarterly payments
) -> dict:
    """
    Price a CDS given a constant hazard rate (flat survival curve).
    Returns PV of protection leg, premium leg, and fair spread.
    """
    spread = spread_bps / 1e4
    dt = 1 / freq
    times = np.arange(dt, maturity + dt/2, dt)

    # Survival probability and discount factor at each payment date
    Q = np.exp(-hazard_rate * times)   # survival prob
    D = np.exp(-r * times)             # risk-free discount

    # Premium leg: expected discounted coupon payments (accrual ignored)
    pv_premium = spread * dt * np.sum(Q * D)

    # Protection leg: PV of (1-R) * expected default payments
    # Approximate: integrate hazard_rate * (1-R) * Q * D dt
    pv_protection = (1 - recovery) * hazard_rate * dt * np.sum(
        np.exp(-(hazard_rate + r) * times)
    )

    fair_spread_bps = pv_protection / (pv_premium / spread) * 1e4
    mtm = pv_protection - pv_premium   # MtM from protection buyer's view

    return {
        "pv_protection": round(pv_protection, 6),
        "pv_premium": round(pv_premium, 6),
        "fair_spread_bps": round(fair_spread_bps, 2),
        "mtm": round(mtm, 6),
    }

# 5-year CDS, 100bps spread, 2% hazard rate
result = cds_price(100, 5, hazard_rate=0.02)
print(result)
# Implied hazard rate from spread: h ≈ spread / (1 - R)
implied_h = 100e-4 / (1 - 0.40)
print(f"Implied hazard rate: {implied_h:.4f}")`,
    explanation:
      "A CDS pays (1-R) on default in exchange for periodic spread payments. With a constant hazard rate lambda, survival probability is exp(-lambda*t). The fair spread balances the protection and premium legs. In practice hazard rates are bootstrapped from a term structure of CDS spreads. The approximation h ≈ s/(1-R) works well for small spreads.",
  },
  {
    id: "pyfin-20260718-b1-irs-pricing",
    language: "python",
    tag: "finance",
    title: "Fixed-for-Floating IRS Pricing",
    code: `import numpy as np

def price_irs(
    notional: float,
    fixed_rate: float,
    maturity: float,
    zero_curve: dict,      # {tenor: zero_rate} e.g. {0.5: 0.04, 1.0: 0.045, ...}
    freq: int = 2,         # semi-annual
) -> dict:
    """
    Value a pay-fixed, receive-float IRS from the fixed-rate payer's perspective.
    Uses bootstrapped zero rates to discount and derive forward rates.
    """
    dt = 1 / freq
    times = np.arange(dt, maturity + dt/2, dt)
    tenors = sorted(zero_curve)

    def zero(t):
        return np.interp(t, tenors, [zero_curve[k] for k in tenors])

    def df(t):
        return np.exp(-zero(t) * t)

    # Floating leg: sum of forward rates * df * dt * N
    # Forward rate from t-dt to t derived from zero rates
    pv_float = 0.0
    for t in times:
        df_start = df(t - dt)
        df_end = df(t)
        fwd = (df_start / df_end - 1) / dt   # simply-compounded forward
        pv_float += fwd * dt * df_end * notional

    # Fixed leg
    pv_fixed = fixed_rate * dt * notional * sum(df(t) for t in times)

    # Par swap rate: fixed rate that makes NPV = 0
    annuity = dt * sum(df(t) for t in times)
    par_rate = (df(dt) - df(maturity)) / annuity

    return {
        "pv_fixed": round(pv_fixed, 2),
        "pv_float": round(pv_float, 2),
        "npv_pay_fixed": round(pv_float - pv_fixed, 2),
        "par_swap_rate_bps": round(par_rate * 1e4, 2),
    }

zero_curve = {0.5: 0.04, 1.0: 0.043, 2.0: 0.047, 3.0: 0.050, 5.0: 0.052}
result = price_irs(1_000_000, 0.05, 5.0, zero_curve)
print(result)`,
    explanation:
      "An interest rate swap exchanges fixed coupon payments for floating (LIBOR/SOFR) payments. The floating leg is replicated by a sequence of FRAs; its PV equals notional * (df(0) - df(T)) at inception under the martingale measure. The par swap rate is where NPV=0. IRS are the most liquid and largest market by notional worldwide.",
  },
  {
    id: "pyfin-20260718-b1-garch11",
    language: "python",
    tag: "finance",
    title: "GARCH(1,1) Parameter Estimation via MLE",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_mle(returns: np.ndarray):
    """
    MLE for GARCH(1,1): sigma_t^2 = omega + alpha*eps_{t-1}^2 + beta*sigma_{t-1}^2
    Maximises Gaussian log-likelihood.
    """
    def neg_log_likelihood(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha <= 0 or beta <= 0 or alpha + beta >= 1:
            return 1e10
        T = len(returns)
        sigma2 = np.empty(T)
        sigma2[0] = np.var(returns)
        for t in range(1, T):
            sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
        ll = -0.5 * np.sum(np.log(sigma2) + returns**2 / sigma2)
        return -ll

    # Unconditional variance: omega / (1 - alpha - beta) ≈ sample variance
    sv = np.var(returns)
    x0 = [sv * 0.1, 0.10, 0.85]
    res = minimize(neg_log_likelihood, x0,
                   method='L-BFGS-B',
                   bounds=[(1e-8, None), (1e-6, 0.5), (1e-6, 0.999)])
    omega, alpha, beta = res.x
    uncond_vol = np.sqrt(omega / (1 - alpha - beta))
    return {"omega": omega, "alpha": alpha, "beta": beta,
            "unconditional_vol": uncond_vol, "persistence": alpha + beta}

rng = np.random.default_rng(42)
rets = rng.standard_normal(2000) * 0.01
result = garch_mle(rets)
print(result)
# High persistence (alpha+beta close to 1) → volatility clustering / long memory`,
    explanation:
      "GARCH(1,1) is the workhorse volatility model in finance. alpha measures how much today's shock impacts tomorrow's vol; beta measures how much yesterday's vol persists. Persistence = alpha + beta; values near 1 imply slow mean-reversion of volatility. Unconditional variance = omega / (1 - alpha - beta). EGARCH and GJR-GARCH extend this for leverage effects.",
  },
  {
    id: "pyfin-20260718-b1-kalman-pairs",
    language: "python",
    tag: "finance",
    title: "Kalman Filter for Pairs Trading Spread",
    code: `import numpy as np

def kalman_pairs(y: np.ndarray, x: np.ndarray,
                 delta: float = 1e-4, R_noise: float = 1e-2):
    """
    State-space model: y_t = beta_t * x_t + alpha_t + eps_t
    State [alpha, beta] follows a random walk (Wk = delta*I).
    Returns time-varying hedge ratios and spread (residuals).
    """
    n = len(y)
    # State: [alpha, beta], 2x1
    theta = np.zeros(2)
    P = np.eye(2) * 1.0      # state covariance
    Q = delta * np.eye(2)    # process noise
    R = R_noise              # observation noise variance

    spreads = np.empty(n)
    betas = np.empty(n)

    for t in range(n):
        F = np.array([1.0, x[t]])   # observation vector
        # Prediction
        # theta_{t|t-1} = theta_{t-1|t-1}  (random walk)
        P = P + Q
        # Update
        v = y[t] - F @ theta          # innovation
        S = F @ P @ F + R              # innovation variance
        K = P @ F / S                  # Kalman gain
        theta = theta + K * v
        P = (np.eye(2) - np.outer(K, F)) @ P
        spreads[t] = v
        betas[t] = theta[1]

    return spreads, betas

# Simulate cointegrated pair
rng = np.random.default_rng(5)
beta_true = 1.5
x = rng.standard_normal(500).cumsum()
y = beta_true * x + rng.standard_normal(500) * 0.5

spreads, betas = kalman_pairs(y, x)
print(f"Final estimated beta: {betas[-1]:.3f}  (true: {beta_true})")
print(f"Spread stats: mean={spreads.mean():.4f} std={spreads.std():.4f}")
# Trade when spread > 1 std (z-score entry/exit)
z = spreads / np.std(spreads[-100:])
print(f"Current z-score: {z[-1]:.2f}")`,
    explanation:
      "The Kalman filter estimates a time-varying hedge ratio for pairs trading, avoiding the look-ahead bias of a rolling OLS window. The state [alpha, beta] follows a random walk; delta controls how quickly beta can change. Small delta = stable relationship; larger delta = more adaptive. The innovation v is the spread signal used for mean-reversion trading.",
  },
  {
    id: "pyfin-20260718-b1-almgren-chriss",
    language: "python",
    tag: "finance",
    title: "Almgren-Chriss Optimal Execution",
    code: `import numpy as np

def almgren_chriss_trajectory(
    X: float,          # shares to sell
    T: float,          # execution horizon (days)
    N: int,            # number of periods
    sigma: float,      # daily vol (fraction)
    eta: float,        # temporary impact ($/share per share/day)
    gamma: float,      # permanent impact ($/share per share/day)
    lam: float,        # risk-aversion parameter
) -> dict:
    """
    Almgren-Chriss (2001) efficient frontier for optimal liquidation.
    Returns the optimal trade schedule minimising E[cost] + lam*Var[cost].
    """
    tau = T / N
    kappa_sq = lam * sigma**2 / eta
    kappa = np.sqrt(kappa_sq)

    # Optimal inventory trajectory x(t_j)
    t = np.linspace(0, T, N + 1)
    x_t = X * np.sinh(kappa * (T - t)) / np.sinh(kappa * T)

    # Trading rates
    n_j = -np.diff(x_t)   # shares traded in each period

    # Expected shortfall (simplified)
    exp_cost = (0.5 * gamma * X**2
                + eta * np.sum((n_j / tau)**2) * tau)

    # Variance of shortfall
    var_cost = sigma**2 * tau * np.sum(x_t[1:]**2)

    return {
        "inventory": np.round(x_t, 2),
        "trades_per_period": np.round(n_j, 2),
        "expected_cost": round(exp_cost, 4),
        "variance_cost": round(var_cost, 4),
        "efficient_frontier_score": round(exp_cost + lam * var_cost, 4),
    }

res = almgren_chriss_trajectory(
    X=1_000_000, T=5, N=5,
    sigma=0.02, eta=2.5e-7, gamma=1e-7, lam=1e-6
)
print("Inventory schedule:", res["inventory"])
print("Trades per period:", res["trades_per_period"])
print(f"Expected cost: {res['expected_cost']:.2f}")`,
    explanation:
      "Almgren-Chriss solves the trade-off between market impact (executing faster) and timing risk (holding inventory longer). Optimal trajectory x(t) follows sinh curves: VWAP-like when lambda->0, TWAP-like for moderate risk-aversion. The efficient frontier plots expected cost vs. variance across lambda values. Used by algorithmic trading desks for optimal order scheduling.",
  },
  {
    id: "pyfin-20260718-b1-risk-parity",
    language: "python",
    tag: "finance",
    title: "Risk Parity (Equal Risk Contribution)",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_parity(sigma: np.ndarray, tol: float = 1e-8) -> np.ndarray:
    """
    Equal risk contribution portfolio: each asset contributes equal risk.
    Risk contribution of i: RC_i = w_i * (sigma @ w)_i / portfolio_vol
    Uses sequential quadratic programming via scipy.
    """
    n = sigma.shape[0]

    def portfolio_vol(w):
        return np.sqrt(w @ sigma @ w)

    def risk_contributions(w):
        pv = portfolio_vol(w)
        mrc = sigma @ w / pv   # marginal risk contributions
        return w * mrc

    def objective(w):
        rc = risk_contributions(w)
        # Minimise sum of squared pairwise differences in risk contributions
        target = portfolio_vol(w) / n
        return np.sum((rc - target) ** 2)

    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]
    bounds = [(0.01, 1.0)] * n
    w0 = np.ones(n) / n

    res = minimize(objective, w0, method="SLSQP",
                   bounds=bounds, constraints=constraints,
                   options={"ftol": tol, "maxiter": 1000})
    w = res.x / res.x.sum()
    rc = risk_contributions(w)
    return w, rc

# 4 assets with varying volatilities
vols = np.array([0.10, 0.15, 0.20, 0.25])
corr = np.array([[1, 0.3, 0.2, 0.1],
                 [0.3, 1, 0.4, 0.2],
                 [0.2, 0.4, 1, 0.3],
                 [0.1, 0.2, 0.3, 1]])
cov = np.outer(vols, vols) * corr
w, rc = risk_parity(cov)
print("Weights:", np.round(w, 4))
print("Risk contributions:", np.round(rc / rc.sum(), 4))`,
    explanation:
      "Risk parity (Bridgewater's 'All Weather') allocates so each asset contributes equally to portfolio volatility. Unlike equal-weight (equal capital) or MVO (concentrated bets), risk parity naturally underweights high-vol assets and is more stable. Marginal Risk Contribution MRC_i = (Sigma*w)_i / sigma_p; asset risk contribution RC_i = w_i * MRC_i.",
  },
  {
    id: "pyfin-20260718-b1-black-litterman",
    language: "python",
    tag: "finance",
    title: "Black-Litterman Model",
    code: `import numpy as np

def black_litterman(
    sigma: np.ndarray,
    w_mkt: np.ndarray,
    P: np.ndarray,      # K x N view matrix
    q: np.ndarray,      # K views
    omega: np.ndarray,  # K x K view uncertainty
    delta: float = 2.5, # risk-aversion (market implied)
    tau: float = 0.05,  # scaling of prior uncertainty
) -> np.ndarray:
    """
    Black-Litterman posterior returns and optimal weights.
    Returns posterior mean mu_BL and MVO weights.
    """
    # Implied equilibrium returns: pi = delta * Sigma * w_mkt
    pi = delta * sigma @ w_mkt

    # Posterior return: combine equilibrium with views
    tau_sigma = tau * sigma
    M1 = np.linalg.inv(tau_sigma)
    M2 = P.T @ np.linalg.inv(omega) @ P
    posterior_cov_inv = M1 + M2
    posterior_cov = np.linalg.inv(posterior_cov_inv)
    mu_bl = posterior_cov @ (M1 @ pi + P.T @ np.linalg.inv(omega) @ q)

    # MVO optimal weights (unconstrained)
    w_bl = np.linalg.solve(delta * sigma, mu_bl)
    return mu_bl, w_bl / w_bl.sum()

N = 4
sigma = np.array([[0.01, 0.002, 0.001, 0.0005],
                  [0.002, 0.025, 0.003, 0.001],
                  [0.001, 0.003, 0.04, 0.002],
                  [0.0005, 0.001, 0.002, 0.009]])
w_mkt = np.array([0.40, 0.30, 0.20, 0.10])
# View: asset 0 outperforms asset 1 by 2%
P = np.array([[1, -1, 0, 0]])
q = np.array([0.02])
omega = np.array([[0.0001]])

mu_bl, w_bl = black_litterman(sigma, w_mkt, P, q, omega)
print("BL returns:", np.round(mu_bl * 100, 2), "%")
print("BL weights:", np.round(w_bl, 4))`,
    explanation:
      "Black-Litterman (1990) blends CAPM equilibrium returns with investor views using Bayesian updating. Without views, weights revert to market cap weights. Views are expressed as P*mu=q with uncertainty omega. Tau scales prior confidence; omega scales view confidence. This solves the 'error maximisation' problem of raw MVO that produces extreme concentrated portfolios.",
  },
  {
    id: "pyfin-20260718-b1-lasso-factors",
    language: "python",
    tag: "finance",
    title: "Lasso-Regularised Factor Selection",
    code: `import numpy as np
from sklearn.linear_model import LassoCV
from sklearn.preprocessing import StandardScaler

def lasso_factor_selection(
    returns: np.ndarray,    # (T, 1) asset returns
    factors: np.ndarray,    # (T, K) candidate factor matrix
    cv_folds: int = 5,
) -> dict:
    """
    Use Lasso with cross-validated lambda to select relevant factors.
    Returns selected factor indices, loadings, and out-of-sample R^2.
    """
    scaler = StandardScaler()
    X = scaler.fit_transform(factors)
    y = returns.flatten()

    model = LassoCV(cv=cv_folds, max_iter=5000, random_state=42)
    model.fit(X, y)

    # Selected factors (non-zero loadings)
    nonzero = np.where(model.coef_ != 0)[0]
    r2 = model.score(X, y)

    # Standardised coefficients (betas)
    betas = model.coef_[nonzero]

    return {
        "selected_factors": nonzero.tolist(),
        "betas": dict(enumerate(np.round(betas, 4))),
        "intercept": round(model.intercept_, 6),
        "optimal_alpha": round(model.alpha_, 6),
        "r_squared": round(r2, 4),
        "n_factors_selected": len(nonzero),
    }

rng = np.random.default_rng(3)
T, K = 500, 20
true_factors = [0, 2, 5, 11]   # only 4 of 20 matter
factors = rng.standard_normal((T, K))
betas_true = np.zeros(K)
betas_true[true_factors] = [0.5, 0.3, -0.2, 0.4]
returns = factors @ betas_true + rng.standard_normal(T) * 0.1

result = lasso_factor_selection(returns, factors)
print(f"Selected factors: {result['selected_factors']}")
print(f"True relevant factors: {true_factors}")
print(f"R^2: {result['r_squared']}")`,
    explanation:
      "Lasso (L1 regularisation) performs automatic variable selection by shrinking irrelevant factor loadings to exactly zero. Critical in factor investing where you might test 100+ candidate factors (momentum, value, quality, size, etc.) but want a parsimonious model. Cross-validation chooses lambda. SCAD and Elastic Net are alternatives with better large-signal recovery properties.",
  },
  {
    id: "pyfin-20260718-b1-importance-sampling",
    language: "python",
    tag: "finance",
    title: "Importance Sampling for OTM Options",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)

def otm_call_importance_sampling(
    S: float, K: float, T: float, r: float, sigma: float,
    n_sims: int = 100_000, seed: int = 0,
) -> tuple:
    """
    Price a deep OTM call via importance sampling.
    Shifts the sampling distribution mean so paths hit the strike often.
    """
    rng = np.random.default_rng(seed)
    mu_orig = (r - 0.5 * sigma**2) * T   # original drift * T
    log_K_S = np.log(K / S)

    # Optimal shift: centre distribution just at the strike
    mu_shift = log_K_S / (sigma * np.sqrt(T)) - sigma * np.sqrt(T) * 0.5
    mu_new = mu_shift * sigma * np.sqrt(T)   # new drift * T

    Z = rng.standard_normal(n_sims)
    log_ST_shifted = mu_new + sigma * np.sqrt(T) * Z
    ST = S * np.exp(log_ST_shifted)
    payoff = np.maximum(ST - K, 0)

    # Likelihood ratio (Radon-Nikodym derivative)
    # dP/dQ = exp( (mu_orig - mu_new)*Z/sigma/sqrt(T) - 0.5*(mu_orig^2 - mu_new^2)/sigma^2/T )
    lr = np.exp((mu_orig - mu_new) * Z / (sigma * np.sqrt(T))
                - 0.5 * (mu_orig**2 - mu_new**2) / (sigma**2 * T))

    weighted_payoff = payoff * lr * np.exp(-r * T)
    price_is = weighted_payoff.mean()
    se_is = weighted_payoff.std() / np.sqrt(n_sims)
    return price_is, se_is

S, K, T, r, sig = 100, 140, 1, 0.05, 0.20
exact = bs_call(S, K, T, r, sig)
price, se = otm_call_importance_sampling(S, K, T, r, sig)
print(f"BS exact:             {exact:.6f}")
print(f"Importance sampling:  {price:.6f} +/- {se:.8f}")`,
    explanation:
      "For deep OTM options, standard MC wastes most paths below the strike. Importance sampling shifts the sampling measure so paths cluster near the strike, then corrects with a likelihood ratio. The variance reduction for a 40% OTM option can be 1000x vs naive MC. The optimal shift is the exponential tilting (saddlepoint) that centres the distribution at the strike.",
  },
  {
    id: "pyfin-20260718-b1-sobol-qmc",
    language: "python",
    tag: "finance",
    title: "Quasi-Monte Carlo with Sobol Sequences",
    code: `import numpy as np
from scipy.stats import norm
from scipy.stats.qmc import Sobol

def bs_call_payoff(S, K, T, r, sigma, uniform_draws):
    """Evaluate call payoff for given uniform(0,1) draws."""
    Z = norm.ppf(uniform_draws)
    ST = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    return np.maximum(ST - K, 0) * np.exp(-r*T)

def compare_mc_vs_qmc(S=100, K=100, T=1, r=0.05, sigma=0.20,
                       n_sims=8192):
    from scipy.stats import norm as _norm
    rng = np.random.default_rng(0)

    # Standard MC
    u_mc = rng.uniform(size=n_sims)
    payoff_mc = bs_call_payoff(S, K, T, r, sigma, u_mc)
    price_mc = payoff_mc.mean()
    se_mc = payoff_mc.std() / np.sqrt(n_sims)

    # Quasi-MC with Sobol (must be power of 2 for best uniformity)
    sampler = Sobol(d=1, scramble=True, seed=0)
    u_qmc = sampler.random(n_sims).flatten()
    payoff_qmc = bs_call_payoff(S, K, T, r, sigma, u_qmc)
    price_qmc = payoff_qmc.mean()
    se_qmc = payoff_qmc.std() / np.sqrt(n_sims)

    from scipy.stats import norm as _norm
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    exact = S * _norm.cdf(d1) - K*np.exp(-r*T)*_norm.cdf(d1 - sigma*np.sqrt(T))

    print(f"Exact:    {exact:.6f}")
    print(f"MC:       {price_mc:.6f}  se={se_mc:.6f}")
    print(f"QMC:      {price_qmc:.6f}  se={se_qmc:.6f}")
    print(f"QMC error / MC error: {abs(price_qmc-exact)/abs(price_mc-exact):.2f}x")

compare_mc_vs_qmc()`,
    explanation:
      "Sobol sequences are low-discrepancy sequences that fill the unit hypercube more uniformly than random numbers. For smooth integrands like option prices, QMC achieves O(1/N) convergence vs O(1/sqrt(N)) for MC. Scrambled Sobol avoids bias while retaining low-discrepancy properties. Critical for high-dimensional problems (multi-asset options, XVA) where the benefit compounds across dimensions.",
  },
  {
    id: "pyfin-20260718-b1-cva",
    language: "python",
    tag: "finance",
    title: "CVA (Credit Valuation Adjustment) Monte Carlo",
    code: `import numpy as np
from scipy.stats import norm

def compute_cva(
    S0: float, K: float, T: float, r: float, sigma: float,
    hazard_rate: float, recovery: float,
    n_sims: int = 50_000, n_steps: int = 50, seed: int = 0,
) -> float:
    """
    CVA for a European call option: expected loss from counterparty default.
    CVA = (1 - R) * integral_0^T lambda * exp(-lambda*t) * E[max(V(t),0)] dt
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    times = np.linspace(dt, T, n_steps)

    # Simulate underlying paths
    Z = rng.standard_normal((n_sims, n_steps))
    log_S = np.log(S0) + np.cumsum(
        (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1
    )
    S_paths = np.exp(log_S)    # shape (n_sims, n_steps)

    cva = 0.0
    for j, t in enumerate(times):
        S_t = S_paths[:, j]
        remaining = T - t
        # Black-Scholes value of call at time t conditional on S_t
        d1 = (np.log(S_t/K) + (r + 0.5*sigma**2)*remaining) / (sigma*np.sqrt(remaining))
        d2 = d1 - sigma*np.sqrt(remaining)
        V_t = S_t * norm.cdf(d1) - K * np.exp(-r*remaining) * norm.cdf(d2)
        EE_t = np.mean(np.maximum(V_t, 0))   # expected exposure

        # Survival-weighted default probability in [t-dt, t]
        default_prob = (np.exp(-hazard_rate*(t-dt)) - np.exp(-hazard_rate*t))
        cva += (1 - recovery) * default_prob * EE_t

    return cva

cva = compute_cva(100, 100, 1, 0.05, 0.20, hazard_rate=0.02, recovery=0.40)
print(f"CVA: {cva:.4f}")`,
    explanation:
      "CVA is the market value of counterparty credit risk — the cost of replacing a derivative if the counterparty defaults. CVA = (1-R) * integral[lambda * e^{-lambda*t} * EE(t)]dt where EE is expected exposure. Desks manage CVA as a separate book since Basel III. DVA (debt valuation adjustment) is the bilateral analogue — own credit risk benefit.",
  },
  {
    id: "pyfin-20260718-b1-div-bs",
    language: "python",
    tag: "finance",
    title: "Dividend-Adjusted Black-Scholes",
    code: `import numpy as np
from scipy.stats import norm

def bs_dividend(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    dividends: list,   # list of (ex_date, dividend_amount)
) -> dict:
    """
    Discrete dividend adjustment: subtract PV of dividends from spot,
    then apply standard Black-Scholes on S_adj.
    Valid when dividends are known cash amounts (not proportional).
    """
    pv_div = sum(d * np.exp(-r * t) for t, d in dividends if t < T)
    S_adj = S - pv_div

    if S_adj <= 0:
        raise ValueError(f"PV of dividends {pv_div:.2f} exceeds spot {S:.2f}")

    d1 = (np.log(S_adj/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    call = S_adj * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)
    put  = K * np.exp(-r*T) * norm.cdf(-d2) - S_adj * norm.cdf(-d1)

    # Greeks use adjusted spot
    delta_call = norm.cdf(d1)
    gamma = norm.pdf(d1) / (S_adj * sigma * np.sqrt(T))
    vega = S_adj * norm.pdf(d1) * np.sqrt(T)

    return {
        "S_adj": round(S_adj, 4),
        "call": round(call, 4),
        "put": round(put, 4),
        "delta_call": round(delta_call, 4),
        "gamma": round(gamma, 6),
        "vega": round(vega, 4),
    }

# AAPL-like: $2.50 dividend in 3 months, expiry in 6 months
result = bs_dividend(185, 185, 0.5, 0.05, 0.28,
                     dividends=[(0.25, 2.50)])
print(result)
# Escrowed dividend model: more accurate than continuous yield for single known divs`,
    explanation:
      "For single-name options with known cash dividends, the simplest approach is the escrowed dividend model: subtract the PV of dividends from today's spot and run standard BS. Continuous dividend yield q (replace S with S*exp(-q*T)) works for index options but introduces bias for individual stocks with lumpy dividends. The Black (1975) approximation for early exercise on American calls uses similar logic.",
  },
  {
    id: "pyfin-20260718-b1-min-variance",
    language: "python",
    tag: "finance",
    title: "Global Minimum Variance Portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def global_min_variance(sigma: np.ndarray,
                         allow_short: bool = False) -> np.ndarray:
    """
    Compute the Global Minimum Variance (GMV) portfolio.
    Long-only (default) uses quadratic programming via scipy.
    Unconstrained closed form: w* = Sigma^{-1} 1 / (1' Sigma^{-1} 1)
    """
    n = sigma.shape[0]
    ones = np.ones(n)

    if not allow_short:
        # Constrained QP: min w'Sigma w s.t. sum(w)=1, w>=0
        def objective(w):
            return w @ sigma @ w

        constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
        bounds = [(0, 1)] * n
        w0 = ones / n
        res = minimize(objective, w0, method="SLSQP",
                       bounds=bounds, constraints=constraints)
        w = res.x
    else:
        # Closed-form unconstrained GMV
        inv_sigma = np.linalg.inv(sigma)
        w = inv_sigma @ ones / (ones @ inv_sigma @ ones)

    port_vol = np.sqrt(w @ sigma @ w)
    return w, port_vol

# Efficient frontier: trace out mean-variance frontier
n = 5
vols = np.array([0.15, 0.20, 0.25, 0.18, 0.22])
corr = np.full((n, n), 0.35)
np.fill_diagonal(corr, 1.0)
cov = np.outer(vols, vols) * corr

w_gmv, vol_gmv = global_min_variance(cov, allow_short=False)
print("GMV weights:", np.round(w_gmv, 4))
print(f"GMV vol: {vol_gmv:.4f}")
w_uncon, vol_uncon = global_min_variance(cov, allow_short=True)
print("Unconstrained GMV vol:", round(vol_uncon, 4))`,
    explanation:
      "The Global Minimum Variance portfolio lies at the leftmost point of the efficient frontier. Unlike MV optimisation, it requires no return estimates (only the covariance matrix), making it robust to estimation error. The closed-form unconstrained solution w* = Sigma^{-1}*1 / (1'*Sigma^{-1}*1) inverts the covariance. Long-only constraints require QP and often produce concentrated allocations.",
  },
  {
    id: "pyfin-20260718-b1-credit-spread-bootstrap",
    language: "python",
    tag: "finance",
    title: "Credit Spread Term Structure Bootstrap",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_credit_curve(
    tenors: list,           # e.g. [0.5, 1, 2, 3, 5, 7, 10]
    par_spreads_bps: list,  # market CDS spreads at each tenor
    risk_free_rates: list,  # matching risk-free zero rates
    recovery: float = 0.40,
    freq: int = 4,
) -> dict:
    """
    Bootstrap hazard rates from CDS par spreads.
    Piecewise-constant hazard rates between tenors.
    """
    prev_tenor = 0.0
    hazard_rates = []
    survival_probs = {0.0: 1.0}

    def survival(t, prev_T, Q_prev, h):
        return Q_prev * np.exp(-h * (t - prev_T))

    def cds_npv(h, T_end, spread, Q_prev, T_prev, r_list, tenor_list):
        """NPV of CDS given hazard rate h for the new segment."""
        dt = 1 / freq
        times = np.arange(dt, T_end + dt/2, dt)
        total = 0.0
        for t in times:
            Q_t = survival(t, T_prev, Q_prev, h)
            D_t = np.exp(-np.interp(t, tenor_list, r_list) * t)
            prev_t = max(t - dt, T_prev)
            Q_prev_t = survival(prev_t, T_prev, Q_prev, h)
            # Premium: Q_t * D_t * spread * dt
            total += Q_t * D_t * spread * dt
            # Protection: (1-R) * lambda * Q * D (approximated)
            default_prob = Q_prev_t - Q_t
            total -= (1 - recovery) * default_prob * D_t
        return total

    for i, (T, s_bps) in enumerate(zip(tenors, par_spreads_bps)):
        s = s_bps / 1e4
        Q_prev = survival_probs[prev_tenor]
        T_prev = prev_tenor

        def npv_func(h):
            return cds_npv(h, T, s, Q_prev, T_prev, risk_free_rates, tenors)

        h_i = brentq(npv_func, 1e-6, 2.0, xtol=1e-8)
        hazard_rates.append(h_i)
        survival_probs[T] = survival(T, T_prev, Q_prev, h_i)
        prev_tenor = T

    return {
        "tenors": tenors,
        "hazard_rates_bps": [round(h * 1e4, 2) for h in hazard_rates],
        "survival_probs": {k: round(v, 6) for k, v in survival_probs.items()},
    }

tenors = [1, 2, 3, 5, 7, 10]
spreads = [50, 60, 70, 90, 105, 120]     # bps
rates = [0.04, 0.042, 0.045, 0.048, 0.05, 0.052]
result = bootstrap_credit_curve(tenors, spreads, rates)
print("Hazard rates (bps):", result["hazard_rates_bps"])
print("Survival probs:", result["survival_probs"])`,
    explanation:
      "Credit curve bootstrapping extracts piecewise-constant hazard rates from market CDS par spreads. We solve each segment sequentially: given all previously fitted hazard rates, find the new hazard rate that makes the next CDS's NPV=0. The resulting survival curve is used to price off-market CDS, CVA, and credit-linked notes. Brent's method provides fast, robust root-finding.",
  },
];
