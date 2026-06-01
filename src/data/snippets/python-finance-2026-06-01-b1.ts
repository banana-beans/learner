import type { Snippet } from "./types";

export const pythonFinanceSnippets20260601B1: Snippet[] = [
  {
    id: "pyfin-20260601-b1-svensson",
    language: "python",
    title: "Svensson yield curve fitting — extended Nelson-Siegel with two humps",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Svensson (1994) adds a second hump term to Nelson-Siegel:
# y(tau) = beta0 + beta1*(1-e^(-tau/lambda1))/(tau/lambda1)
#         + beta2*((1-e^(-tau/lambda1))/(tau/lambda1) - e^(-tau/lambda1))
#         + beta3*((1-e^(-tau/lambda1))/(tau/lambda1) - e^(-tau/lambda1))
# with a second set of parameters for the extra hump.

def svensson(tau: np.ndarray, params: np.ndarray) -> np.ndarray:
    b0, b1, b2, b3, l1, l2 = params
    t1 = tau / l1
    t2 = tau / l2
    f1 = (1 - np.exp(-t1)) / t1
    f2 = (1 - np.exp(-t2)) / t2
    return (b0
            + b1 * f1
            + b2 * (f1 - np.exp(-t1))
            + b3 * (f2 - np.exp(-t2)))

def fit_svensson(maturities: np.ndarray, yields: np.ndarray) -> dict:
    def objective(params):
        if params[4] < 0.1 or params[5] < 0.1:  # lambda bounds
            return 1e10
        fitted = svensson(maturities, params)
        return np.sum((fitted - yields) ** 2)

    # Initial guess: b0=long-run, b1=slope, b2=b3=hump, l1=2, l2=10
    x0 = np.array([yields[-1], yields[0]-yields[-1], 0.01, 0.01, 2.0, 10.0])
    result = minimize(objective, x0, method='Nelder-Mead',
                      options={'xatol': 1e-8, 'fatol': 1e-10, 'maxiter': 10000})

    params = result.x
    fitted = svensson(maturities, params)
    rmse   = np.sqrt(np.mean((fitted - yields) ** 2))
    return {'beta0': params[0], 'beta1': params[1], 'beta2': params[2],
            'beta3': params[3], 'lambda1': params[4], 'lambda2': params[5],
            'rmse_bps': rmse * 10000, 'fitted': fitted}

# US Treasury par yields (approximate, as of mid-2025)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.053, 0.052, 0.050, 0.047, 0.046, 0.046,
                       0.047, 0.047, 0.050, 0.049])

fit = fit_svensson(maturities, yields)
print(f"Svensson fit RMSE: {fit['rmse_bps']:.2f} bps")
print(f"Beta0 (long-run): {fit['beta0']:.4f}")
print(f"Lambda1: {fit['lambda1']:.2f}  Lambda2: {fit['lambda2']:.2f}")
for m, y_obs, y_fit in zip(maturities, yields, fit['fitted']):
    print(f"  {m:5.2f}yr: obs={y_obs*100:.3f}%  fit={y_fit*100:.3f}%")
`,
    explanation:
      "Svensson extends Nelson-Siegel with a second hump term (β₃) controlled by λ₂, allowing the curve to capture both a short-end hump and a longer-maturity inflection — common in real yield curves where Fed policy and term premium create two distinct curvature regimes. Central banks (ECB, Riksbank) publish Svensson parameters daily for their sovereign curves.",
  },

  {
    id: "pyfin-20260601-b1-bachelier",
    language: "python",
    title: "Bachelier (normal) model — options under negative rates",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

# Bachelier (1900) assumes S follows arithmetic (normal) Brownian motion:
#   dS = sigma_n * dW   (no drift in risk-neutral world after discounting)
# Normal vol sigma_n is in absolute price units, not a percentage.
# Required when rates go negative (S can be negative, lognormal blows up).

def bachelier_call(F: float, K: float, sigma_n: float, T: float, r: float = 0.0) -> float:
    """European call under Bachelier model. F = forward price."""
    sqrt_T = np.sqrt(T)
    d      = (F - K) / (sigma_n * sqrt_T)
    disc   = np.exp(-r * T)
    return disc * ((F - K) * norm.cdf(d) + sigma_n * sqrt_T * norm.pdf(d))

def bachelier_put(F: float, K: float, sigma_n: float, T: float, r: float = 0.0) -> float:
    """European put under Bachelier model."""
    sqrt_T = np.sqrt(T)
    d      = (F - K) / (sigma_n * sqrt_T)
    disc   = np.exp(-r * T)
    return disc * ((K - F) * norm.cdf(-d) + sigma_n * sqrt_T * norm.pdf(d))

def bachelier_delta(F: float, K: float, sigma_n: float, T: float, flag: str = 'call') -> float:
    d = (F - K) / (sigma_n * np.sqrt(T))
    return norm.cdf(d) if flag == 'call' else norm.cdf(d) - 1.0

def bachelier_vega(F: float, K: float, sigma_n: float, T: float) -> float:
    """Vega: d(price)/d(sigma_n). Same formula for call and put."""
    d = (F - K) / (sigma_n * np.sqrt(T))
    return np.sqrt(T) * norm.pdf(d)

def implied_normal_vol(market_price: float, F: float, K: float,
                       T: float, flag: str = 'call', r: float = 0.0) -> float:
    """Invert Bachelier formula to get implied normal vol via bisection."""
    pricer = bachelier_call if flag == 'call' else bachelier_put
    f = lambda v: pricer(F, K, v, T, r) - market_price
    return brentq(f, 1e-6, abs(F) * 5.0, xtol=1e-10)

# SOFR cap swaption example: forward = -0.005 (negative rate scenario)
F, K, T = -0.005, 0.0, 1.0
sigma_n  = 0.005   # 50 bps normal vol
call_price = bachelier_call(F, K, sigma_n, T)
print(f"Bachelier call: {call_price*10000:.2f} bps")
print(f"Delta: {bachelier_delta(F, K, sigma_n, T):.4f}")
print(f"Vega:  {bachelier_vega(F, K, sigma_n, T)*100:.4f} (per 1% sigma change)")
iv = implied_normal_vol(call_price, F, K, T)
print(f"Implied normal vol: {iv*10000:.2f} bps (should match {sigma_n*10000:.0f})")
`,
    explanation:
      "The Bachelier model uses an arithmetic (additive) Brownian motion for the underlying, which means the underlying can go negative — essential for pricing SOFR, ESTR, or Bund futures options during negative rate environments where the lognormal Black model produces zero or imaginary implied vols. Market standard in rates trading: swaption desks quote in 'normal vol' (basis points per year), not lognormal vol.",
  },

  {
    id: "pyfin-20260601-b1-garman-kohlhagen",
    language: "python",
    title: "Garman-Kohlhagen FX option pricing — domestic and foreign rates",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

# Garman-Kohlhagen (1983) extends Black-Scholes to FX options.
# S = spot FX (domestic per foreign, e.g. USD per EUR)
# rd = domestic risk-free rate, rf = foreign risk-free rate.
# The foreign currency earns a continuous dividend yield rf —
# analogous to Merton's continuous dividend formula.

def gk_call(S: float, K: float, rd: float, rf: float,
            sigma: float, T: float) -> float:
    sqrt_T = np.sqrt(T)
    F      = S * np.exp((rd - rf) * T)          # forward FX rate
    d1     = (np.log(S / K) + (rd - rf + 0.5*sigma**2)*T) / (sigma * sqrt_T)
    d2     = d1 - sigma * sqrt_T
    return (S * np.exp(-rf*T) * norm.cdf(d1)
            - K * np.exp(-rd*T) * norm.cdf(d2))

def gk_put(S: float, K: float, rd: float, rf: float,
           sigma: float, T: float) -> float:
    sqrt_T = np.sqrt(T)
    d1     = (np.log(S / K) + (rd - rf + 0.5*sigma**2)*T) / (sigma * sqrt_T)
    d2     = d1 - sigma * sqrt_T
    return (K * np.exp(-rd*T) * norm.cdf(-d2)
            - S * np.exp(-rf*T) * norm.cdf(-d1))

def gk_delta(S: float, K: float, rd: float, rf: float,
             sigma: float, T: float, flag: str = 'call') -> float:
    """Spot delta = dV/dS."""
    d1 = (np.log(S / K) + (rd - rf + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return np.exp(-rf*T) * (norm.cdf(d1) if flag == 'call' else norm.cdf(d1) - 1)

def gk_implied_vol(market_price: float, S: float, K: float,
                   rd: float, rf: float, T: float, flag: str = 'call') -> float:
    pricer = gk_call if flag == 'call' else gk_put
    f = lambda v: pricer(S, K, rd, rf, v, T) - market_price
    intrinsic = max(S*np.exp(-rf*T) - K*np.exp(-rd*T), 0) if flag=='call' else max(K*np.exp(-rd*T) - S*np.exp(-rf*T), 0)
    if market_price < intrinsic - 1e-10:
        raise ValueError("Price below intrinsic")
    return brentq(f, 1e-6, 5.0, xtol=1e-10)

# EURUSD example: S=1.08, K=1.09 (OTM call), rd=5.25%, rf=4.0%, T=1M
S, K, rd, rf, sigma, T = 1.08, 1.09, 0.0525, 0.04, 0.072, 1/12
call = gk_call(S, K, rd, rf, sigma, T)
put  = gk_put(S, K, rd, rf, sigma, T)
print(f"GK call: {call:.5f}  put: {put:.5f}")
print(f"Delta (call): {gk_delta(S, K, rd, rf, sigma, T):.4f}")
print(f"Put-call parity check: C-P = {call-put:.5f}, "
      f"F*exp(-rd*T)-K*exp(-rd*T) = {S*np.exp((rd-rf)*T)*np.exp(-rd*T) - K*np.exp(-rd*T):.5f}")
`,
    explanation:
      "Garman-Kohlhagen is Black-Scholes with the domestic risk-free rate rd replaced by rd−rf in the drift — the foreign currency earns rf as a continuous 'dividend', depressing the forward price below S. Delta in FX is quoted as spot delta (percent of notional in the domestic currency), and quoting conventions vary: EUR/USD options are typically quoted in USD pips per EUR notional.",
  },

  {
    id: "pyfin-20260601-b1-risk-parity",
    language: "python",
    title: "Risk parity portfolio — equal risk contribution via Newton's method",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Risk parity (Qian 2005): each asset contributes equally to portfolio volatility.
# Risk contribution of asset i: RC_i = w_i * (Sigma @ w)_i / (w^T Sigma w)^0.5
# Equal RC: RC_i = sigma_p / N for all i.
# Equivalent to minimising sum_i (RC_i - sigma_p/N)^2.

def portfolio_vol(w: np.ndarray, cov: np.ndarray) -> float:
    return np.sqrt(w @ cov @ w)

def risk_contributions(w: np.ndarray, cov: np.ndarray) -> np.ndarray:
    sigma_p   = portfolio_vol(w, cov)
    marginal  = cov @ w                     # marginal risk contribution
    return w * marginal / sigma_p           # absolute risk contribution

def risk_parity_weights(cov: np.ndarray, n_iter: int = 2000) -> np.ndarray:
    n = cov.shape[0]
    target_rc = 1.0 / n   # each asset: 1/N of total variance contribution

    def objective(w):
        sigma_p = portfolio_vol(w, cov)
        rc = risk_contributions(w, cov) / sigma_p   # fractional RC
        return np.sum((rc - target_rc) ** 2)

    def gradient(w):
        # Numerical gradient (scipy will use it automatically with jac=False)
        pass

    # Start from vol-weighted equal risk: w_i ~ 1/sigma_i
    vol   = np.sqrt(np.diag(cov))
    w0    = (1.0 / vol) / np.sum(1.0 / vol)

    result = minimize(
        objective, w0,
        method='SLSQP',
        constraints={'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
        bounds=[(0.0, 1.0)] * n,
        options={'ftol': 1e-12, 'maxiter': n_iter}
    )
    w_opt = result.x / result.x.sum()   # renormalise
    return w_opt

# 4-asset example: equity, bond, commodity, FX
cov = np.array([
    [0.040, 0.006, 0.008, 0.002],
    [0.006, 0.005, 0.001, 0.000],
    [0.008, 0.001, 0.030, 0.003],
    [0.002, 0.000, 0.003, 0.015],
])

w = risk_parity_weights(cov)
rc = risk_contributions(w, cov)
sigma_p = portfolio_vol(w, cov)
print("Risk Parity weights:", np.round(w, 4))
print("Risk contributions (%):", np.round(rc / sigma_p * 100, 2))
# Should be approximately [25, 25, 25, 25]
`,
    explanation:
      "Risk parity avoids the concentration problem of mean-variance: instead of minimising variance given a return target, it allocates so each asset contributes equally to total portfolio risk. The low-volatility asset (bonds) gets a large weight and the high-volatility asset (equity) a small one — risk parity portfolios are effectively long fixed income and short equity compared to 60/40, which is why they underperform in rising-rate environments.",
  },

  {
    id: "pyfin-20260601-b1-cds-hazard",
    language: "python",
    title: "CDS pricing from a piecewise-constant hazard rate curve",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

# CDS protection buyer pays a spread s_p per period.
# Protection seller pays (1-R) at default if default occurs.
# Fair spread: PV(protection leg) = PV(premium leg)
#
# With piecewise-constant hazard h(t), survival probability:
#   Q(t) = exp(-integral_0^t h(u) du)
# Protection leg PV = (1-R) * integral_0^T Q(t)*h(t)*D(t) dt
# Premium leg PV    = s_p * sum_i delta_i * Q(T_i) * D(T_i)  (quarterly)

def survival_prob(t: float, hazards: list, tenors: list) -> float:
    """Q(t) from piecewise-constant hazard rate curve."""
    integral = 0.0
    prev_t   = 0.0
    for i, h in enumerate(hazards):
        end = tenors[i]
        if t <= prev_t:
            break
        seg = min(t, end) - prev_t
        integral += h * seg
        if t <= end:
            break
        prev_t = end
    return np.exp(-integral)

def cds_fair_spread(r: float, recovery: float, hazards: list, tenors: list,
                    T: float = 5.0, freq: int = 4) -> float:
    """Bootstrap fair CDS spread from hazard rates."""
    dt = 1.0 / freq
    payment_dates = np.arange(dt, T + 1e-9, dt)

    # Protection leg: integrate analytically per piecewise segment
    prot_pv = 0.0
    for i, px in enumerate(payment_dates):
        t_start = payment_dates[i-1] if i > 0 else 0.0
        t_end   = px
        # Midpoint approximation for hazard * Q * D
        t_mid   = (t_start + t_end) / 2
        q_mid   = survival_prob(t_mid, hazards, tenors)
        h_mid   = hazards[min(i, len(hazards)-1)]
        d_mid   = np.exp(-r * t_mid)
        prot_pv += (1 - recovery) * h_mid * q_mid * d_mid * dt

    # Premium leg
    prem_pv = 0.0
    for t_pay in payment_dates:
        q_t = survival_prob(t_pay, hazards, tenors)
        d_t = np.exp(-r * t_pay)
        prem_pv += dt * q_t * d_t

    return prot_pv / prem_pv if prem_pv > 0 else 0.0

# Example: 5-year CDS with hazard rates bootstrapped from market
r        = 0.05   # risk-free rate
recovery = 0.40   # standard ISDA recovery
hazards  = [0.010, 0.015, 0.020]   # h in (0,1], (1,3], (3,5]
tenors   = [1.0,   3.0,   5.0]

spread = cds_fair_spread(r, recovery, hazards, tenors)
print(f"5Y CDS fair spread: {spread*10000:.1f} bps")

# Single-name PD: 1-year survival prob
q1y = survival_prob(1.0, hazards, tenors)
print(f"1Y survival probability: {q1y:.4f}  (PD={1-q1y:.4f})")
`,
    explanation:
      "CDS pricing reduces to equating two legs: the premium leg (periodic spread payments, probability-weighted) and the protection leg (loss-given-default payment, hazard-rate-weighted). Piecewise-constant hazard rates allow analytic integration within each segment, and bootstrapping calibrates hazards sequentially from the shortest maturity CDS up — the standard approach in credit trading desks.",
  },

  {
    id: "pyfin-20260601-b1-variance-swap",
    language: "python",
    title: "Variance swap fair value from discrete log returns",
    tag: "finance",
    code: `import numpy as np
from scipy.integrate import quad

# Variance swap pays (sigma_realized^2 - K_var) * notional at expiry.
# Fair strike K_var is the risk-neutral expected annualised variance.
# Demeterfi-Derman-Kamal-Zou (1999): K_var = 2/T * (sum of OTM option prices)
# Discrete approximation: K_var ≈ 2/T * integral_0^inf (C(K)/K^2 for K>F, P(K)/K^2 for K<F) dK

def var_swap_strike(S: float, F: float, r: float, T: float,
                    call_fn, put_fn,
                    K_min: float = 0.5, K_max: float = 2.5) -> float:
    """
    Numerical integration of the replication portfolio.
    call_fn(K) and put_fn(K) return undiscounted prices (already forward-adjusted).
    """
    disc = np.exp(-r * T)

    # OTM calls for K > F, OTM puts for K < F
    def integrand_call(K):
        return disc * call_fn(K) / (K * K)

    def integrand_put(K):
        return disc * put_fn(K) / (K * K)

    I_calls, _ = quad(integrand_call, F, K_max * S)
    I_puts,  _ = quad(integrand_put,  K_min * S, F)

    K_var = (2.0 / T) * (I_calls + I_puts)
    return K_var

# Black-Scholes prices for the replication portfolio
from scipy.stats import norm

def bs_call_fn(S, r, sigma, T):
    def _call(K):
        if K <= 0: return max(S - K, 0)
        d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
    return _call

def bs_put_fn(S, r, sigma, T):
    def _put(K):
        if K <= 0: return 0.0
        d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        return K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)
    return _put

S, r, sigma, T = 100.0, 0.05, 0.20, 1.0
F = S * np.exp(r * T)

K_var = var_swap_strike(S, F, r, T,
                        bs_call_fn(S, r, sigma, T),
                        bs_put_fn(S, r, sigma, T))
print(f"Var swap strike K_var = {K_var:.6f}")
print(f"Vol equivalent        = {np.sqrt(K_var)*100:.4f}%")
# Should be close to sigma^2 = 0.04 for flat vol surface
print(f"Flat vol sigma^2 = {sigma**2:.4f}  (exact for flat smile)")
`,
    explanation:
      "The variance swap strike equals twice the undiscounted sum of OTM option prices divided by K², integrated over all strikes — the replication portfolio. For a flat implied vol surface K_var = σ², but a skewed surface makes K_var < σ_atm² because out-of-the-money puts are overpriced. This explains why variance swaps typically trade below at-the-money implied variance — the 'convexity adjustment' that volatility desks explicitly manage.",
  },

  {
    id: "pyfin-20260601-b1-cliquet",
    language: "python",
    title: "Cliquet option Monte Carlo — periodic resetting strike",
    tag: "finance",
    code: `import numpy as np

# A cliquet (ratchet) pays the sum of periodic returns, each floored at local_floor
# and capped at local_cap, with a global floor applied to the total.
# Payoff = max(sum_k min(max(R_k, local_floor), local_cap), global_floor)
# where R_k = S(t_k)/S(t_{k-1}) - 1.

def cliquet_mc(S0: float, r: float, sigma: float, T: float,
               n_periods: int, local_floor: float, local_cap: float,
               global_floor: float, N_paths: int = 200_000,
               seed: int = 42) -> float:
    rng  = np.random.default_rng(seed)
    dt   = T / n_periods
    disc = np.exp(-r * T)

    # Simulate n_periods log-returns simultaneously.
    drift = (r - 0.5 * sigma**2) * dt
    Z     = rng.standard_normal((N_paths, n_periods))
    log_r = drift + sigma * np.sqrt(dt) * Z   # shape (N_paths, n_periods)

    # Simple returns per period.
    simple_r = np.expm1(log_r)   # exp(log_r) - 1

    # Apply local floor and cap to each period's return.
    clipped = np.clip(simple_r, local_floor, local_cap)

    # Sum capped/floored returns and apply global floor.
    total     = clipped.sum(axis=1)
    payoffs   = np.maximum(total, global_floor)

    return disc * payoffs.mean()

# 3-year cliquet, quarterly resets, local floor=-5%, cap=+10%, global floor=0%
price = cliquet_mc(
    S0=100, r=0.05, sigma=0.20, T=3.0,
    n_periods=12,           # quarterly
    local_floor=-0.05,
    local_cap=0.10,
    global_floor=0.0,
    N_paths=500_000
)
print(f"Cliquet price: {price:.4f}")

# Compare: sum of ATM forward-starting options (cheaper, no local cap)
from scipy.stats import norm
S, r, sigma = 100.0, 0.05, 0.20
dt_q = 3.0/12
def fwd_start_call(dt):
    # ATM forward-starting call: strike = F*1 (local), reset at t
    d1 = (0 + (r + 0.5*sigma**2)*dt) / (sigma*np.sqrt(dt))  # K=F, log(F/K)=0
    d2 = d1 - sigma*np.sqrt(dt)
    return np.exp(-r*dt) * (norm.cdf(d1) - norm.cdf(d2))   # / S0 (percentage)
fwd_sum = sum(fwd_start_call(dt_q) for _ in range(12))
print(f"Sum of 12 fwd-starting ATM calls: {fwd_sum:.4f}  (upper bound approx)")
`,
    explanation:
      "Cliquet options are path-dependent because each period's return is individually floored and capped before summing, creating a correlation across periods that makes them much harder to price than a single vanilla option. The local cap reduces the value of high-return periods (short convexity locally), while the local floor reduces the loss from downside periods — the net effect makes cliquets sensitive to forward skew and forward vol, which the market prices via 'forward start vol' quotes.",
  },

  {
    id: "pyfin-20260601-b1-rough-bergomi",
    language: "python",
    title: "Rough Bergomi variance process — fractional Brownian motion simulation",
    tag: "finance",
    code: `import numpy as np

# Rough Bergomi (Bayer-Friz-Gatheral 2016):
#   dV_t = xi_0(t) * exp(eta * W^H_t - 0.5 * eta^2 * t^{2H}) dt
# where W^H is fractional Brownian motion with Hurst H < 0.5 (rough).
# Simulated via the Cholesky decomposition of the fBM covariance matrix
# or the Euler scheme with the Volterra kernel approximation.
#
# Here we use the exact Cholesky method for small N_steps.

def fbm_covariance(n: int, H: float, dt: float) -> np.ndarray:
    """Covariance matrix of fractional BM increments."""
    # Cov[W^H(t), W^H(s)] = 0.5*(|t|^{2H} + |s|^{2H} - |t-s|^{2H})
    # For increments over [k*dt, (k+1)*dt]:
    idx = np.arange(n)
    # We use the full fBM covariance C[i,j] = Cov[W^H(i+1)*dt, W^H(j+1)*dt]
    t   = (idx + 1) * dt
    C   = 0.5 * (t[:, None]**(2*H) + t[None, :]**(2*H)
                  - np.abs(t[:, None] - t[None, :])**(2*H))
    return C

def rough_bergomi_mc(S0: float, xi0: float, H: float, eta: float, rho: float,
                     T: float, N_steps: int = 50, N_paths: int = 5000,
                     seed: int = 42) -> tuple:
    """
    Returns (S_T paths, V_T paths).
    xi0: initial forward variance (approx sigma^2)
    H:   Hurst exponent, typically ~0.1 for equity vol
    eta: vol-of-vol
    rho: correlation between spot and variance innovations
    """
    rng = np.random.default_rng(seed)
    dt  = T / N_steps

    # Cholesky of fBM covariance (N_steps x N_steps) — expensive but exact.
    C   = fbm_covariance(N_steps, H, dt)
    L   = np.linalg.cholesky(C + 1e-12 * np.eye(N_steps))

    prices = np.full(N_paths, S0, dtype=float)
    vols   = np.full(N_paths, xi0, dtype=float)

    for p in range(N_paths):
        Z1 = rng.standard_normal(N_steps)           # fBM driver
        Z2 = rng.standard_normal(N_steps)           # independent
        W_H = L @ Z1                                # fBM increments
        W_S = rho * Z1 + np.sqrt(1 - rho**2) * Z2  # correlated spot BM

        # Accumulate fBM path for variance.
        W_H_path = np.cumsum(W_H)
        t_arr = (np.arange(N_steps) + 1) * dt

        for s in range(N_steps):
            t = t_arr[s]
            V = xi0 * np.exp(eta * W_H_path[s] - 0.5 * eta**2 * t**(2*H))
            prices[p] *= np.exp(-0.5 * V * dt + np.sqrt(V * dt) * W_S[s])

    return prices, vols

paths, _ = rough_bergomi_mc(100, xi0=0.04, H=0.1, eta=1.8, rho=-0.7, T=1.0)
atm_call = np.mean(np.maximum(paths - 100, 0)) * np.exp(-0.05)
print(f"Rough Bergomi ATM call (MC): {atm_call:.4f}")
print(f"Mean S_T: {paths.mean():.2f}  Std: {paths.std():.4f}")
`,
    explanation:
      "Rough volatility models use fractional Brownian motion with Hurst H ≈ 0.1 (rougher than standard BM which has H = 0.5) to capture the empirically observed power-law decay of the autocorrelation of volatility increments. The model generates realistic short-term vol-of-vol skew that matches SPX options much better than classical Heston (H = 0.5), explaining why every major derivatives desk monitors rough vol metrics.",
  },

  {
    id: "pyfin-20260601-b1-lsm-python",
    language: "python",
    title: "Longstaff-Schwartz LSM — American put via regression-based stopping",
    tag: "finance",
    code: `import numpy as np
from numpy.polynomial.laguerre import lagval

# LSM (Longstaff-Schwartz 2001): at each time step, regress continuation
# value on in-the-money paths using polynomial basis functions.
# Decision rule: exercise early if immediate payoff > expected continuation.

def lsm_american_put(S0: float, K: float, r: float, sigma: float, T: float,
                     N_paths: int = 50_000, N_steps: int = 50,
                     seed: int = 42) -> float:
    rng  = np.random.default_rng(seed)
    dt   = T / N_steps
    disc = np.exp(-r * dt)

    # Simulate paths (antithetic for variance reduction).
    drift  = (r - 0.5*sigma**2) * dt
    stddev = sigma * np.sqrt(dt)
    Z      = rng.standard_normal((N_paths // 2, N_steps))
    Z      = np.concatenate([Z, -Z], axis=0)             # antithetic

    log_S  = np.log(S0) + drift + stddev * Z
    S      = np.exp(np.cumsum(log_S, axis=1))            # shape (N_paths, N_steps)
    S      = np.column_stack([np.full(N_paths, S0), S])  # prepend S0

    # Cash flow array: initially terminal payoff.
    payoff = np.maximum(K - S[:, -1], 0.0)
    CF     = payoff.copy()

    # Backward induction from T-dt to dt.
    for t in range(N_steps - 1, 0, -1):
        S_t   = S[:, t]
        itm   = S_t < K    # in-the-money puts
        if itm.sum() == 0:
            CF *= disc
            continue

        X = S_t[itm]
        Y = CF[itm] * disc   # discounted future cash flows

        # Basis: [1, x, x^2] Laguerre or simple polynomial.
        A = np.column_stack([np.ones_like(X), X, X**2, X**3])
        coeffs, *_ = np.linalg.lstsq(A, Y, rcond=None)

        continuation = A @ coeffs
        exercise     = np.maximum(K - X, 0.0)

        # Update cash flow: exercise if immediate > continuation.
        CF[itm] = np.where(exercise >= continuation, exercise, Y)
        CF[~itm] *= disc

    return CF.mean() * disc   # discount back one more step to t=0

price = lsm_american_put(100, 100, 0.05, 0.20, 1.0)
print(f"LSM American put: {price:.4f}")
# Compare to CRR binomial (1000 steps) ≈ 10.478
`,
    explanation:
      "Longstaff-Schwartz converts the American option optimal stopping problem into a sequence of regressions: at each time step, regress discounted future cash flows on basis functions of the current stock price (Laguerre polynomials, powers of S) to estimate the continuation value, then exercise wherever immediate payoff exceeds the regression estimate. The method extends naturally to multi-factor and path-dependent payoffs where lattice methods become intractable.",
  },

  {
    id: "pyfin-20260601-b1-barra-factor",
    language: "python",
    title: "BARRA-style factor risk decomposition from return panel",
    tag: "finance",
    code: `import numpy as np

# BARRA (now MSCI) factor model: R_i = B_i @ f + epsilon_i
# B_i = (K-vector) factor exposures, f = factor returns
# Portfolio risk: sigma_p^2 = w^T (B F B^T + Delta) w
# where F = factor cov, Delta = diagonal specific risk

def barra_risk_decomp(returns: np.ndarray,     # (T, N) asset returns
                      factor_loadings: np.ndarray,  # (N, K) factor exposures
                      weights: np.ndarray     # (N,) portfolio weights
                      ) -> dict:
    T, N = returns.shape
    K    = factor_loadings.shape[1]

    # Step 1: OLS factor return extraction (cross-sectional regression each period).
    factor_returns = np.zeros((T, K))
    specific_returns = np.zeros((T, N))
    for t in range(T):
        r_t = returns[t]
        B   = factor_loadings
        # WLS (equal weight here): f_t = (B^T B)^{-1} B^T r_t
        f_t, _, _, _ = np.linalg.lstsq(B, r_t, rcond=None)
        factor_returns[t]   = f_t
        specific_returns[t] = r_t - B @ f_t

    # Step 2: Factor covariance matrix (K x K).
    F_cov = np.cov(factor_returns.T, ddof=1)   # (K, K)

    # Step 3: Specific (idiosyncratic) risk — diagonal (N,).
    spec_var = np.var(specific_returns, axis=0, ddof=1)
    Delta    = np.diag(spec_var)

    # Step 4: Total covariance matrix.
    B   = factor_loadings
    Cov = B @ F_cov @ B.T + Delta             # (N, N)

    # Step 5: Portfolio risk decomposition.
    port_var       = weights @ Cov @ weights
    factor_var     = weights @ (B @ F_cov @ B.T) @ weights
    specific_var   = weights @ Delta @ weights

    # Factor contribution (percentage).
    factor_contrib  = (weights[:, None] * B) @ F_cov @ (B.T @ weights) / port_var
    asset_risk_pct  = weights * (Cov @ weights) / port_var

    return {
        'total_vol_pct':    np.sqrt(port_var) * 100,
        'factor_pct':       factor_var / port_var * 100,
        'specific_pct':     specific_var / port_var * 100,
        'factor_contrib':   factor_contrib,
        'asset_risk_pct':   asset_risk_pct,
        'factor_cov':       F_cov,
        'spec_var':         spec_var,
    }

# Example: 3 assets, 2 factors (market + value), 250 days
rng = np.random.default_rng(42)
T, N, K = 250, 5, 3
B    = rng.standard_normal((N, K))         # random factor loadings
F_r  = rng.multivariate_normal([0]*K, np.eye(K)*0.0001, T)  # factor returns
eps  = rng.normal(0, 0.01, (T, N))         # specific returns
Rets = F_r @ B.T + eps                     # (T, N) returns
w    = np.array([0.3, 0.2, 0.2, 0.15, 0.15])

res = barra_risk_decomp(Rets, B, w)
print(f"Portfolio vol: {res['total_vol_pct']:.3f}%")
print(f"Factor risk:   {res['factor_pct']:.1f}%  Specific: {res['specific_pct']:.1f}%")
`,
    explanation:
      "BARRA-style decomposition separates portfolio risk into factor (systematic, non-diversifiable) and specific (idiosyncratic, diversifiable) components. Running cross-sectional OLS each period to extract factor returns, then taking their covariance, is the standard 'fundamental factor model' approach — you observe B (style/industry loadings) and estimate F, unlike PCA which does the reverse. The specific risk diagonal Delta is the residual not explained by factors.",
  },

  {
    id: "pyfin-20260601-b1-stressed-var",
    language: "python",
    title: "Stressed VaR — historical simulation with scenario overlay",
    tag: "finance",
    code: `import numpy as np

# Basel III requires Stressed VaR: re-run historical simulation over a
# 1-year window of significant market stress (e.g., 2008-09, 2020-03).
# SVaR is the 99th-percentile loss from the stressed window.

def historical_var(returns: np.ndarray, weights: np.ndarray,
                   confidence: float = 0.99) -> float:
    """Standard historical VaR from a return matrix."""
    port_r = returns @ weights
    return -np.percentile(port_r, (1 - confidence) * 100)

def stressed_var(all_returns: np.ndarray,        # (T_total, N) full history
                 stressed_idx: tuple,             # (start, end) stressed window index
                 weights: np.ndarray,
                 confidence: float = 0.99) -> dict:
    """
    Compute normal VaR, Stressed VaR, and the ratio (SVaR/VaR).
    stressed_idx: slice of rows corresponding to the stress period.
    """
    start, end = stressed_idx
    stressed_returns = all_returns[start:end]

    var_normal  = historical_var(all_returns, weights, confidence)
    var_stressed = historical_var(stressed_returns, weights, confidence)

    # Expected Shortfall (CVaR) for both windows
    port_r_all      = all_returns @ weights
    port_r_stressed = stressed_returns @ weights

    cutoff_all   = np.percentile(port_r_all,      (1-confidence)*100)
    cutoff_str   = np.percentile(port_r_stressed, (1-confidence)*100)
    es_all       = -port_r_all[port_r_all <= cutoff_all].mean()
    es_stressed  = -port_r_stressed[port_r_stressed <= cutoff_str].mean()

    return {
        'var_normal':   var_normal,
        'var_stressed': var_stressed,
        'es_normal':    es_all,
        'es_stressed':  es_stressed,
        'svar_ratio':   var_stressed / var_normal,
        'n_days_stress': end - start,
    }

rng = np.random.default_rng(42)
# Simulate 5 years of daily returns: 3 normal + 1 crisis + 1 normal
T_total, N = 1260, 4
returns_normal = rng.normal(0.0005, 0.01, (1008, N))
returns_stress = rng.normal(-0.001, 0.025, (252, N))  # higher vol, negative drift
returns = np.vstack([returns_normal, returns_stress, returns_normal[:252]])

w = np.array([0.4, 0.3, 0.2, 0.1])
result = stressed_var(returns, stressed_idx=(1008, 1260), weights=w)
print(f"Normal VaR (99%):   {result['var_normal']*100:.3f}%")
print(f"Stressed VaR (99%): {result['var_stressed']*100:.3f}%")
print(f"SVaR / VaR ratio:   {result['svar_ratio']:.2f}x")
print(f"Normal ES:          {result['es_normal']*100:.3f}%")
print(f"Stressed ES:        {result['es_stressed']*100:.3f}%")
`,
    explanation:
      "Basel III's Stressed VaR requirement mandates identifying a 12-month historical window of significant losses for the current portfolio and computing VaR over that stress period, then adding it to normal VaR as a regulatory capital buffer. In practice, banks maintain a library of pre-identified stress windows (GFC, COVID, Eurobond crisis) and select the one that maximises SVaR for the current book — an incentive-compatible design that forces capital buffers to grow during quiet periods.",
  },

  {
    id: "pyfin-20260601-b1-ou-pairs-signal",
    language: "python",
    title: "Pairs trading: OU calibration, z-score signal, and position sizing",
    tag: "finance",
    code: `import numpy as np
from statsmodels.regression.linear_model import OLS
from statsmodels.tools.tools import add_constant

def fit_hedge_ratio(y: np.ndarray, x: np.ndarray) -> tuple:
    """OLS hedge ratio: y = beta * x + alpha + eps."""
    X = add_constant(x)
    res = OLS(y, X).fit()
    beta, alpha = res.params[1], res.params[0]
    spread = y - beta * x - alpha
    return beta, alpha, spread

def ou_half_life(spread: np.ndarray, dt: float = 1/252) -> float:
    """Estimate OU mean-reversion speed from lag-1 AR regression."""
    y   = spread[1:]
    x   = spread[:-1]
    X   = add_constant(x)
    res = OLS(y, X).fit()
    # AR(1): spread_{t+1} = a + b*spread_t + eps
    # b = exp(-kappa*dt) => kappa = -log(b)/dt
    b       = res.params[1]
    if b >= 1.0 or b <= 0.0:
        return float('inf')
    kappa   = -np.log(b) / dt
    return np.log(2.0) / kappa   # half-life in same time units as dt

def zscore_signal(spread: np.ndarray, lookback: int = 60) -> np.ndarray:
    """Rolling z-score of spread over lookback window."""
    z = np.full_like(spread, np.nan)
    for i in range(lookback, len(spread)):
        window = spread[i-lookback:i]
        z[i]   = (spread[i] - window.mean()) / (window.std() + 1e-12)
    return z

def generate_trades(z: np.ndarray, entry: float = 2.0, exit_: float = 0.5) -> np.ndarray:
    """
    Returns position: +1 (long spread), -1 (short spread), 0 (flat).
    Entry: |z| > entry. Exit: |z| < exit_.
    """
    pos = np.zeros_like(z)
    current = 0
    for i in range(1, len(z)):
        if np.isnan(z[i]):
            continue
        if current == 0:
            if z[i] < -entry:   current =  1   # spread too low: buy
            elif z[i] > entry:  current = -1   # spread too high: sell
        else:
            if abs(z[i]) < exit_: current = 0
        pos[i] = current
    return pos

# Simulate two cointegrated assets
rng = np.random.default_rng(42)
n   = 500
e   = rng.normal(0, 1, n).cumsum()    # common factor
y   = e + rng.normal(0, 0.5, n)
x   = e + rng.normal(0, 0.5, n)

beta, alpha, spread = fit_hedge_ratio(y, x)
hl  = ou_half_life(spread)
z   = zscore_signal(spread)
pos = generate_trades(z)

# P&L: long spread = long y, short beta*x
dy, dx = np.diff(y), np.diff(x)
pnl    = pos[:-1] * (dy - beta * dx)
sharpe = pnl.mean() / (pnl.std() + 1e-12) * np.sqrt(252)

print(f"Hedge ratio beta: {beta:.3f}")
print(f"Spread half-life: {hl:.1f} days")
print(f"Sharpe ratio:     {sharpe:.2f}")
print(f"Total trades:     {int(np.sum(np.abs(np.diff(pos)) > 0))}")
`,
    explanation:
      "Pairs trading fuses cointegration theory (OLS hedge ratio), OU calibration (half-life determines holding period), and signal generation (rolling z-score with entry/exit thresholds) into a complete strategy pipeline. A short half-life (< 20 days) allows frequent rebalancing with low overnight risk; a long half-life means the spread is nearly a random walk and the strategy edge disappears — this is the key screen that filters tradable from untradable pairs.",
  },

  {
    id: "pyfin-20260601-b1-pfe",
    language: "python",
    title: "Potential Future Exposure (PFE) via Monte Carlo paths",
    tag: "finance",
    code: `import numpy as np

# PFE measures worst-case exposure at a confidence level over time.
# Regulatory standard: 95th percentile of mark-to-market exposure
# across scenarios, taken per time bucket — used to set credit limits.

def gbm_paths(S0: float, r: float, sigma: float, T: float,
              N_steps: int, N_paths: int, seed: int = 42) -> np.ndarray:
    """Returns shape (N_paths, N_steps+1) GBM price paths."""
    rng   = np.random.default_rng(seed)
    dt    = T / N_steps
    Z     = rng.standard_normal((N_paths, N_steps))
    log_r = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    S     = S0 * np.exp(np.concatenate([np.zeros((N_paths, 1)),
                                         np.cumsum(log_r, axis=1)], axis=1))
    return S

def equity_forward_mtm(S: np.ndarray, K: float, r: float,
                       T: float, t_grid: np.ndarray) -> np.ndarray:
    """MTM of a long forward contract at each time t: S(t)*exp(-r*(T-t)) - K*exp(-r*(T-t))."""
    mtm = np.zeros_like(S)
    for j, t in enumerate(t_grid):
        disc = np.exp(-r * (T - t))
        mtm[:, j] = S[:, j] * disc - K * disc
    return mtm

def compute_pfe(mtm: np.ndarray, t_grid: np.ndarray,
                confidence: float = 0.95) -> dict:
    """
    mtm: (N_paths, N_steps) exposure profiles.
    Returns PFE profile and expected positive exposure (EPE).
    """
    # Only positive exposures (counterparty credit exposure).
    pos_mtm = np.maximum(mtm, 0)

    pfe  = np.percentile(pos_mtm, confidence * 100, axis=0)
    epe  = pos_mtm.mean(axis=0)   # Expected Positive Exposure
    peak_pfe = pfe.max()

    return {'pfe': pfe, 'epe': epe, 'peak_pfe': peak_pfe,
            't_grid': t_grid, 'confidence': confidence}

T, N_steps, N_paths = 1.0, 52, 50_000
S0, K, r, sigma = 100.0, 100.0, 0.05, 0.25

t_grid = np.linspace(0, T, N_steps + 1)
S      = gbm_paths(S0, r, sigma, T, N_steps, N_paths)
mtm    = equity_forward_mtm(S, K, r, T, t_grid)
result = compute_pfe(mtm, t_grid)

print(f"Peak PFE (95%): {result['peak_pfe']:.2f}")
print(f"EPE at T=0.5:   {result['epe'][N_steps//2]:.2f}")
print(f"PFE at T=0.5:   {result['pfe'][N_steps//2]:.2f}")
# PFE profile peaks near 1/3 of the way through for a forward contract
`,
    explanation:
      "PFE is a forward-looking credit metric: at each future date you compute the 95th-percentile positive exposure across Monte Carlo scenarios, then report the profile or its peak. A forward contract's PFE peaks around expiry date T/3 and returns to zero at T because the exposure grows with price uncertainty initially but shrinks as the remaining time-value discounting disappears — a hump-shaped profile that drives credit limit consumption for structured products.",
  },

  {
    id: "pyfin-20260601-b1-fsd",
    language: "python",
    title: "First- and second-order stochastic dominance check",
    tag: "finance",
    code: `import numpy as np

# Portfolio A first-order stochastic dominates portfolio B (A FSD B) iff
#   F_A(x) <= F_B(x) for all x, with strict inequality somewhere.
# where F is the CDF. All risk-averse or non-satiated investors prefer A.
#
# Second-order (SSD): integral of F_A <= integral of F_B everywhere.
# SSD does not require dominating at every point — captures risk aversion.

def cdf(returns: np.ndarray, x_grid: np.ndarray) -> np.ndarray:
    """Empirical CDF at each point in x_grid."""
    return np.array([np.mean(returns <= x) for x in x_grid])

def check_fsd(ret_a: np.ndarray, ret_b: np.ndarray, n_grid: int = 500) -> dict:
    """Test whether A FSD B: F_A(x) <= F_B(x) for all x."""
    all_r  = np.concatenate([ret_a, ret_b])
    x_grid = np.linspace(all_r.min(), all_r.max(), n_grid)

    F_a = cdf(ret_a, x_grid)
    F_b = cdf(ret_b, x_grid)
    diff = F_a - F_b   # < 0 everywhere means A FSD B

    a_dominates_b = np.all(diff <= 1e-10) and np.any(diff < -1e-10)
    b_dominates_a = np.all(-diff <= 1e-10) and np.any(-diff < -1e-10)

    return {'a_fsd_b': a_dominates_b, 'b_fsd_a': b_dominates_a,
            'max_fsd_violation': max(0, diff.max()), 'x_grid': x_grid,
            'F_a': F_a, 'F_b': F_b}

def check_ssd(ret_a: np.ndarray, ret_b: np.ndarray, n_grid: int = 500) -> dict:
    """Test whether A SSD B: integral of F_A <= integral of F_B."""
    all_r  = np.concatenate([ret_a, ret_b])
    x_grid = np.linspace(all_r.min(), all_r.max(), n_grid)
    dx     = x_grid[1] - x_grid[0]

    F_a = cdf(ret_a, x_grid)
    F_b = cdf(ret_b, x_grid)

    # Cumulative integral (trapz) of CDFs.
    int_Fa = np.cumsum(F_a) * dx
    int_Fb = np.cumsum(F_b) * dx
    diff   = int_Fa - int_Fb

    a_ssd_b = np.all(diff <= 1e-10) and np.any(diff < -1e-10)
    b_ssd_a = np.all(-diff <= 1e-10) and np.any(-diff < -1e-10)

    return {'a_ssd_b': a_ssd_b, 'b_ssd_a': b_ssd_a,
            'max_ssd_violation': max(0, diff.max())}

rng = np.random.default_rng(42)
# Portfolio A: higher mean, same vol — should FSD B.
ret_a = rng.normal(0.001, 0.01, 5000)
ret_b = rng.normal(0.0,   0.01, 5000)
# Portfolio C: same mean, higher vol (only SSD relationship).
ret_c = rng.normal(0.001, 0.015, 5000)

print("FSD test (A vs B):", check_fsd(ret_a, ret_b)['a_fsd_b'])    # roughly True
print("FSD test (A vs C):", check_fsd(ret_a, ret_c)['a_fsd_b'])    # False (C has more variance)
print("SSD test (A vs C):", check_ssd(ret_a, ret_c)['a_ssd_b'])    # True (A less risky)
`,
    explanation:
      "Stochastic dominance gives a partial ordering over distributions that is free of specific utility function assumptions: FSD requires every risk-averse or non-satiated investor to prefer A, while SSD only requires risk-averse investors. Practitioners use SSD tests to screen fund managers (does the top manager's return distribution SSD the benchmark?) and to validate that a new allocation rule weakly improves upon the existing one for the broadest class of rational investors.",
  },

  {
    id: "pyfin-20260601-b1-lmm-caplet",
    language: "python",
    title: "LIBOR Market Model (BGM) — caplet pricing and forward rate simulation",
    tag: "finance",
    code: `import numpy as np

# BGM/LMM (Brace-Gatarek-Musiela): forward LIBOR rates L_k(t) follow
#   dL_k = mu_k dt + sigma_k * L_k * dW_k   (under terminal measure)
# Caplet payoff (cap on L_k): delta * max(L_k(T_k) - K, 0)
# Black's formula recovers analytically; MC validates.

from scipy.stats import norm

def black_caplet(L0: float, K: float, sigma: float, T: float,
                 delta: float = 0.25, r: float = 0.05) -> float:
    """Black (1976) caplet formula. L0 = current forward rate."""
    sqrt_T = np.sqrt(T)
    d1     = (np.log(L0/K) + 0.5*sigma**2*T) / (sigma*sqrt_T)
    d2     = d1 - sigma * sqrt_T
    disc   = np.exp(-r * (T + delta))
    return disc * delta * (L0 * norm.cdf(d1) - K * norm.cdf(d2))

def lmm_caplet_mc(L0: float, K: float, sigma: float, T: float,
                  delta: float = 0.25, r: float = 0.05,
                  N_paths: int = 100_000, N_steps: int = 100,
                  seed: int = 42) -> float:
    """LMM simulation of a single caplet under terminal measure."""
    rng  = np.random.default_rng(seed)
    dt   = T / N_steps
    drift = -0.5 * sigma**2 * dt   # lognormal drift correction

    log_L = np.log(L0)
    dW    = rng.standard_normal((N_paths, N_steps)) * np.sqrt(dt)

    # Simulate forward rate from 0 to T.
    log_paths = log_L + np.cumsum(drift + sigma * dW, axis=1)
    L_T       = np.exp(log_paths[:, -1])

    # Caplet payoff settled at T + delta.
    payoffs = np.maximum(L_T - K, 0.0) * delta
    disc    = np.exp(-r * (T + delta))
    return disc * payoffs.mean()

# 3M caplet expiring in 1 year, strike = 5.5%, current fwd = 5.75%
L0, K, sigma, T, delta = 0.0575, 0.055, 0.30, 1.0, 0.25
black = black_caplet(L0, K, sigma, T, delta)
mc    = lmm_caplet_mc(L0, K, sigma, T, delta)
print(f"Black caplet: {black*10000:.2f} bps")
print(f"LMM MC:       {mc*10000:.2f} bps")
print(f"Difference:   {abs(black-mc)*10000:.2f} bps")
`,
    explanation:
      "The LIBOR Market Model specifies dynamics for each forward rate directly under a terminal measure, making it consistent with market caplet pricing formulas (each caplet prices exactly as Black 1976). Its advantage over short-rate models is that it naturally produces realistic volatility term structures from market caplet quotes, but calibration to the full cap/swaption surface requires careful handling of the cross-correlations between rates.",
  },

  {
    id: "pyfin-20260601-b1-regime-hamilton",
    language: "python",
    title: "Hamilton regime-switching filter — 2-state Markov hidden vol",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Hamilton (1989) hidden Markov model with 2 states (bull/bear).
# Observation: r_t | s_t ~ N(mu_s, sigma_s^2)
# Transition: P(s_t=j | s_{t-1}=i) = P[i,j]
# Filter: update P(s_t) via Bayes' rule.

def hamilton_filter(returns: np.ndarray, params: np.ndarray) -> dict:
    """
    params = [mu1, mu2, sig1, sig2, p11, p22]
    Returns: smoothed state probabilities, log-likelihood, filtered probs.
    """
    mu1, mu2, sig1, sig2, p11, p22 = params
    p12   = 1.0 - p11
    p21   = 1.0 - p22
    P     = np.array([[p11, p12], [p21, p22]])  # transition matrix
    mus   = np.array([mu1, mu2])
    sigs  = np.array([sig1, sig2])

    T     = len(returns)
    xi    = np.zeros((T, 2))     # filtered P(s_t=j)
    eta   = np.zeros((T, 2))     # conditional likelihoods

    # Stationary distribution as starting prob.
    xi0 = np.array([p21/(p12+p21), p12/(p12+p21)])

    log_lik = 0.0
    xi_prev = xi0

    for t in range(T):
        # Conditional density for each state.
        eta[t] = (1/(np.sqrt(2*np.pi)*sigs) *
                  np.exp(-0.5*((returns[t]-mus)/sigs)**2))

        # Prediction: P(s_t | I_{t-1}).
        xi_pred = P.T @ xi_prev

        # Update (Bayes): P(s_t | I_t).
        numer   = eta[t] * xi_pred
        denom   = numer.sum()
        if denom < 1e-300:
            return {'log_lik': -1e12}
        xi[t]   = numer / denom
        log_lik += np.log(denom)
        xi_prev = xi[t]

    return {'log_lik': log_lik, 'filtered': xi, 'eta': eta}

def fit_hamilton(returns: np.ndarray) -> dict:
    def neg_ll(params):
        mu1, mu2, sig1, sig2, p11, p22 = params
        if sig1 <= 0 or sig2 <= 0 or p11 <= 0 or p11 >= 1 or p22 <= 0 or p22 >= 1:
            return 1e12
        if mu1 > mu2: return 1e12   # identification: state 1 = bear
        res = hamilton_filter(returns, params)
        return -res.get('log_lik', 1e12)

    x0  = np.array([-0.001, 0.001, 0.02, 0.01, 0.95, 0.95])
    res = minimize(neg_ll, x0, method='Nelder-Mead',
                   options={'xatol': 1e-6, 'fatol': 1e-8, 'maxiter': 5000})
    params = res.x
    out    = hamilton_filter(returns, params)
    out.update({'mu': params[:2], 'sigma': params[2:4],
                'P11': params[4], 'P22': params[5]})
    return out

rng = np.random.default_rng(42)
n1, n2 = 200, 100
r_bull = rng.normal(0.0006, 0.01, n1)
r_bear = rng.normal(-0.001, 0.02, n2)
returns = np.concatenate([r_bull, r_bear])

out = fit_hamilton(returns)
print(f"Bear state mu={out['mu'][0]*252:.1%}  sigma={out['sigma'][0]*np.sqrt(252):.1%}")
print(f"Bull state mu={out['mu'][1]*252:.1%}  sigma={out['sigma'][1]*np.sqrt(252):.1%}")
print(f"P(stay bull): {out['P22']:.3f}  P(stay bear): {out['P11']:.3f}")
print(f"Current bear prob: {out['filtered'][-1,0]:.3f}")
`,
    explanation:
      "The Hamilton filter sequentially updates the probability of being in each regime via Bayes' rule, using a Gaussian emission model per state. MLE over the log-likelihood identifies mean returns and volatilities for each state, plus the persistence parameters P11 and P22. High P11 and P22 (close to 1) indicate sticky regimes — bear markets last many months — while low persistence implies rapid regime switching like in FX markets.",
  },

  {
    id: "pyfin-20260601-b1-carry-momentum",
    language: "python",
    title: "Carry + momentum combo signal with Sharpe weighting",
    tag: "finance",
    code: `import numpy as np

# Carry: profit from holding an asset assuming no price change.
#   FX carry = interest rate differential (high-yield long, low-yield short)
#   Bond carry = current yield - repo rate
#   Commodity carry = convenience yield - storage cost
#
# Momentum: time-series (past 12-1 month return) or cross-sectional rank.
#
# Combo: weight signals by their historical information ratio (Sharpe).

def time_series_momentum(prices: np.ndarray, lookback: int = 252,
                         skip: int = 21) -> np.ndarray:
    """Returns normalised momentum signal: sign(12-1 return) * |ret|/std."""
    n = prices.shape[0]
    signal = np.full(n, np.nan)
    for t in range(lookback + skip, n):
        ret = prices[t - skip] / prices[t - lookback] - 1.0
        vols = np.diff(np.log(prices[t-lookback:t-skip]))
        signal[t] = ret / (vols.std() * np.sqrt(lookback - skip) + 1e-12)
    return signal

def carry_signal(carry_returns: np.ndarray, lookback: int = 63) -> np.ndarray:
    """Z-score of recent carry vs its rolling mean/std."""
    signal = np.full_like(carry_returns, np.nan)
    for t in range(lookback, len(carry_returns)):
        window = carry_returns[t-lookback:t]
        signal[t] = (carry_returns[t] - window.mean()) / (window.std() + 1e-12)
    return signal

def combine_signals(*signals, lookback: int = 252) -> np.ndarray:
    """
    Combine multiple signals using their historical Sharpe as weights.
    Returns the weighted average signal.
    """
    T       = len(signals[0])
    weights = np.zeros(len(signals))
    combo   = np.zeros(T)

    for t in range(lookback, T):
        for k, sig in enumerate(signals):
            hist = sig[t-lookback:t]
            valid = hist[~np.isnan(hist)]
            if len(valid) < 30:
                weights[k] = 0.0
            else:
                sr = valid.mean() / (valid.std() + 1e-12)
                weights[k] = max(sr, 0)  # only positive Sharpe contributions

        w_sum = weights.sum()
        if w_sum > 0:
            vals = np.array([s[t] if not np.isnan(s[t]) else 0.0 for s in signals])
            combo[t] = (vals @ weights) / w_sum

    return combo

rng = np.random.default_rng(42)
T  = 1000
# Simulate FX prices and carry returns.
prices       = 100 * np.exp(rng.normal(0, 0.01, T).cumsum())
carry_ret    = rng.normal(0.0002, 0.003, T)   # simulated carry component

mom  = time_series_momentum(prices)
carr = carry_signal(carry_ret)
comb = combine_signals(mom, carr)

# Simple backtest: position = sign(combo signal).
valid = ~np.isnan(comb)
port_ret = np.sign(comb[valid]) * rng.normal(0.0003, 0.01, valid.sum())
sharpe   = port_ret.mean() / (port_ret.std() + 1e-12) * np.sqrt(252)
corr_mc  = np.corrcoef(mom[valid], carr[valid])[0, 1]
print(f"Combo signal Sharpe: {sharpe:.2f}")
print(f"Corr mom vs carry:   {corr_mc:.3f}")
`,
    explanation:
      "Carry and momentum are the two most robust return premia across asset classes (Asness-Moskowitz-Pedersen 2013). Combining them via Sharpe-weighted averaging exploits their near-zero correlation: carry earns during range-bound trending environments while momentum earns during trends, so their sum has a higher Sharpe than either alone — the 'diversification premium' of uncorrelated return premia.",
  },

  {
    id: "pyfin-20260601-b1-irs-bucketed-dv01",
    language: "python",
    title: "Interest rate swap bucketed DV01 — parallel rate bumping per tenor",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import interp1d

# Bucketed DV01: sensitivity of swap PV to a 1bp parallel shift in each
# tenor bucket of the discount curve. Used to hedge swap risk with a
# tenor-matched hedge (e.g., Treasury futures of specific maturity).

def discount_factor(rate_curve: dict, t: float) -> float:
    """Log-linear interpolation of zero rates."""
    tenors = np.array(sorted(rate_curve.keys()))
    rates  = np.array([rate_curve[t] for t in tenors])
    log_df = interp1d(tenors, -rates * tenors, kind='linear',
                      fill_value='extrapolate')
    return float(np.exp(log_df(t)))

def irs_pv(fixed_rate: float, rate_curve: dict, T: float,
           freq: int = 2, notional: float = 1_000_000.0) -> float:
    """Price of a receive-fixed IRS (fixed leg minus floating leg)."""
    dt       = 1.0 / freq
    tenors   = np.arange(dt, T + 1e-9, dt)
    pv_fixed = 0.0
    pv_float = 0.0

    for t in tenors:
        df    = discount_factor(rate_curve, t)
        pv_fixed += fixed_rate * dt * df

    # Floating leg = 1 - final_df (no-arbitrage)
    pv_float = 1.0 - discount_factor(rate_curve, T)

    return notional * (pv_fixed - pv_float)

def bucketed_dv01(fixed_rate: float, rate_curve: dict, T: float,
                  bump_bps: float = 1.0) -> dict:
    """
    Bump each tenor key by 1bp and compute DV01 per bucket.
    Returns dict of {tenor: DV01_in_dollars}.
    """
    pv_base = irs_pv(fixed_rate, rate_curve, T)
    dv01s   = {}
    bump    = bump_bps / 10_000.0

    for tenor in rate_curve:
        bumped_curve = dict(rate_curve)
        bumped_curve[tenor] += bump
        pv_bumped = irs_pv(fixed_rate, bumped_curve, T)
        dv01s[tenor] = pv_bumped - pv_base   # positive = receive-fixed gains when rate rises

    return dv01s

# Receive-fixed 5-year IRS at 4.8% vs flat OIS curve at 5%
rate_curve = {0.25: 0.0530, 0.5: 0.0525, 1.0: 0.0515, 2.0: 0.0505,
              3.0: 0.0500, 5.0: 0.0495, 7.0: 0.0495, 10.0: 0.0493}
fixed_rate = 0.0480
T = 5.0

pv    = irs_pv(fixed_rate, rate_curve, T)
dv01s = bucketed_dv01(fixed_rate, rate_curve, T)

print(f"IRS PV:       {pv:,.0f} USD")
print(f"Total DV01:   {sum(dv01s.values()):,.0f} USD/bp")
print("Bucketed DV01:")
for tenor, dv in sorted(dv01s.items()):
    print(f"  {tenor:.2f}yr: {dv:+,.0f} USD/bp")
`,
    explanation:
      "Bucketed DV01 measures sensitivity to each individual tenor rather than a parallel shift, revealing the term structure of risk: a 5-year receive-fixed swap has most exposure in the 2-5 year bucket because that's where most of the fixed coupon cash flows fall. Traders use bucketed DV01 to construct a duration-matched hedge (offsetting Treasury futures per bucket) that hedges the curve shape risk, not just the level.",
  },

  {
    id: "pyfin-20260601-b1-autocall",
    language: "python",
    title: "Snowball autocallable — simplified Monte Carlo pricing",
    tag: "finance",
    code: `import numpy as np

# Autocallable: automatically redeems early if underlying S >= barrier B_k
# on each observation date t_k, paying coupon C_k.
# If never called, pays either the bond floor or (if S < K_put) a capital loss.
# 'Snowball' variant: coupon accumulates from previous uncalled periods.

def autocall_mc(S0: float, r: float, sigma: float,
                obs_dates: list,       # annual observation dates
                call_barrier: float,   # fraction of S0, e.g. 1.0 (at-the-money)
                coupon_rate: float,    # per period if called, e.g. 0.08
                put_barrier: float,    # capital loss if S < this at final date
                notional: float = 1.0,
                N_paths: int = 200_000,
                seed: int = 42) -> float:
    rng   = np.random.default_rng(seed)
    T     = obs_dates[-1]
    N_obs = len(obs_dates)

    # Build N_obs period returns
    dt    = np.diff([0] + obs_dates)   # time increments
    drift = (r - 0.5*sigma**2)

    # Simulate paths to each observation date.
    Z     = rng.standard_normal((N_paths, N_obs))
    log_r = drift * dt + sigma * np.sqrt(dt) * Z
    S_rel = np.exp(np.cumsum(log_r, axis=1))  # S(t_k) / S0

    payoffs = np.zeros(N_paths)

    for p in range(N_paths):
        called = False
        for k in range(N_obs):
            t_k = obs_dates[k]
            if S_rel[p, k] >= call_barrier:
                # Called: return notional + accumulated coupon.
                coupon     = notional * coupon_rate * (k + 1)  # snowball sum
                disc       = np.exp(-r * t_k)
                payoffs[p] = (notional + coupon) * disc
                called     = True
                break

        if not called:
            # Not called: check capital loss condition at final.
            S_T  = S_rel[p, -1]
            disc = np.exp(-r * T)
            if S_T < put_barrier:
                # Capital loss: receive S_T/S0 of notional.
                payoffs[p] = notional * S_T * disc
            else:
                # Return notional (no coupon if never called).
                payoffs[p] = notional * disc

    return payoffs.mean()

# 3-year autocallable, annual observations, call barrier 100%, put barrier 70%
obs_dates    = [1.0, 2.0, 3.0]
price        = autocall_mc(
    S0=100, r=0.05, sigma=0.25,
    obs_dates=obs_dates,
    call_barrier=1.0,   # calls if S >= S0
    coupon_rate=0.08,   # 8% per year (snowball)
    put_barrier=0.70,   # loss if S < 70% of S0 at final
)
print(f"Autocallable PV: {price:.4f}  (notional=1.0)")
print(f"Fair coupon premium over par: {(price - np.exp(-0.05*3))*100:.2f}%")
`,
    explanation:
      "Autocallables dominate structured product issuance because they offer enhanced coupons in exchange for the investor bearing early redemption risk (the issuer is short a call on volatility) and capital loss risk (the investor is short a put). The 'snowball' feature accumulates unpaid coupons, creating a strong call incentive — but if never called, the investor has sold a significant put on the underlying.",
  },

  {
    id: "pyfin-20260601-b1-student-t-copula",
    language: "python",
    title: "Student-t copula — joint default simulation for credit portfolios",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as t_dist, norm

# Student-t copula captures tail dependence better than Gaussian copula:
# tail dependence coefficient lambda = 2 * t_{nu+1}(-sqrt((nu+1)*(1-rho)/(1+rho)))
# High lambda means joint extreme losses are more likely than Gaussian.

def simulate_t_copula(n: int, corr: np.ndarray, nu: float,
                      seed: int = 42) -> np.ndarray:
    """
    Simulate n samples from a d-dim Student-t copula.
    Returns U: (n, d) uniform marginals in [0,1].
    """
    rng = np.random.default_rng(seed)
    d   = corr.shape[0]

    # Cholesky decomposition of correlation matrix.
    L   = np.linalg.cholesky(corr)

    # Step 1: draw d independent standard normals.
    Z   = rng.standard_normal((n, d))
    Y   = Z @ L.T   # correlated normals

    # Step 2: draw chi-squared (nu) for scaling.
    chi2 = rng.chisquare(nu, size=n)
    X    = Y / np.sqrt(chi2[:, None] / nu)   # multivariate t

    # Step 3: transform to uniform via t CDF.
    U    = t_dist.cdf(X, df=nu)
    return U

def gaussian_copula(n: int, corr: np.ndarray, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    d   = corr.shape[0]
    L   = np.linalg.cholesky(corr)
    Z   = rng.standard_normal((n, d)) @ L.T
    return norm.cdf(Z)

def default_simulation(U: np.ndarray, pd: np.ndarray) -> np.ndarray:
    """
    U: (n, d) uniform samples from copula.
    pd: (d,) marginal default probabilities.
    Returns: (n, d) boolean default indicators.
    """
    return U < pd[None, :]   # default if uniform < PD (inverse CDF of Bernoulli)

def portfolio_loss(defaults: np.ndarray, lgd: np.ndarray,
                   notional: np.ndarray) -> np.ndarray:
    """Total loss per simulation."""
    return (defaults * lgd[None, :] * notional[None, :]).sum(axis=1)

# 5-asset credit portfolio
n_sim   = 200_000
d       = 5
corr    = 0.3 * np.ones((d, d)) + 0.7 * np.eye(d)  # pairwise corr = 0.3
pd_vec  = np.array([0.02, 0.03, 0.015, 0.025, 0.04])
lgd_vec = np.full(d, 0.60)
N_vec   = np.array([10e6, 8e6, 12e6, 7e6, 9e6])

U_t   = simulate_t_copula(n_sim, corr, nu=4)
U_g   = gaussian_copula(n_sim, corr)

def_t = default_simulation(U_t, pd_vec)
def_g = default_simulation(U_g, pd_vec)

loss_t = portfolio_loss(def_t, lgd_vec, N_vec)
loss_g = portfolio_loss(def_g, lgd_vec, N_vec)

print(f"t-copula  99.9% VaR: {np.percentile(loss_t, 99.9)/1e6:.2f}M USD")
print(f"Gaussian  99.9% VaR: {np.percentile(loss_g, 99.9)/1e6:.2f}M USD")
print(f"t-copula has {(np.percentile(loss_t,99.9)/np.percentile(loss_g,99.9)-1)*100:.0f}% more tail risk")
`,
    explanation:
      "The Student-t copula with ν ≈ 4–6 degrees of freedom produces 'tail dependence' — the probability that two credits default together given one defaults is strictly positive, unlike the Gaussian copula where this probability is zero. The Gaussian copula's failure to capture tail dependence (Li 2000) contributed to systematic underpricing of CDO tranches pre-2008; the t-copula is now the regulatory standard for internal credit models.",
  },

  {
    id: "pyfin-20260601-b1-svi-fit",
    language: "python",
    title: "SVI parametrization — arbitrage-free volatility smile fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# SVI (Stochastic Volatility Inspired, Gatheral 2004):
#   w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2))
# where k = log(K/F), w = total implied variance = sigma_imp^2 * T.
# Parameters: a (level), b (angle), rho (asymmetry), m (centre), sigma (smoothness).
# Convexity constraint: b*(1+|rho|) < 4/T ensures no calendar spread arbitrage.
# Butterfly constraint: d^2w/dk^2 >= 0 ensures no static arbitrage.

def svi_variance(k: np.ndarray, a: float, b: float, rho: float,
                 m: float, sigma: float) -> np.ndarray:
    d = k - m
    return a + b * (rho * d + np.sqrt(d**2 + sigma**2))

def svi_vol(k: np.ndarray, T: float, a: float, b: float, rho: float,
            m: float, sigma: float) -> np.ndarray:
    w = svi_variance(k, a, b, rho, m, sigma)
    return np.sqrt(np.maximum(w / T, 0.0))

def fit_svi(k: np.ndarray, iv_obs: np.ndarray, T: float) -> dict:
    """Fit SVI to observed implied vols by minimising RMSE in variance space."""
    w_obs = iv_obs**2 * T

    def objective(params):
        a, b, rho, m, sigma = params
        # Constraint guards.
        if b <= 0 or sigma <= 0 or abs(rho) >= 1 or a + b*sigma*np.sqrt(1-rho**2) < 0:
            return 1e8
        w_fit = svi_variance(k, a, b, rho, m, sigma)
        return np.sum((w_fit - w_obs)**2)

    # Initial guess from ATM vol level.
    atm_idx = np.argmin(np.abs(k))
    a0  = iv_obs[atm_idx]**2 * T * 0.8
    x0  = [a0, 0.1, -0.3, 0.0, 0.1]

    result = minimize(objective, x0, method='Nelder-Mead',
                      options={'xatol': 1e-9, 'fatol': 1e-10, 'maxiter': 10000})

    a, b, rho, m, sigma = result.x
    w_fit  = svi_variance(k, a, b, rho, m, sigma)
    iv_fit = np.sqrt(np.maximum(w_fit / T, 0.0))
    rmse   = np.sqrt(np.mean((iv_fit - iv_obs)**2)) * 10000   # bps

    return {'a': a, 'b': b, 'rho': rho, 'm': m, 'sigma': sigma,
            'rmse_bps': rmse, 'iv_fit': iv_fit}

# SPX-like smile: wings elevated, left skew
T      = 1.0   # 1-year
k      = np.array([-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3])
iv_obs = np.array([0.32, 0.28, 0.23, 0.20, 0.19, 0.20, 0.22])

fit = fit_svi(k, iv_obs, T)
print(f"SVI fit RMSE: {fit['rmse_bps']:.2f} bps")
print(f"rho (skew): {fit['rho']:.3f}  b (angle): {fit['b']:.4f}")
for ki, iv_o, iv_f in zip(k, iv_obs, fit['iv_fit']):
    print(f"  k={ki:+.1f}: obs={iv_o*100:.2f}%  fit={iv_f*100:.2f}%")
`,
    explanation:
      "SVI parametrizes the total implied variance surface with 5 parameters per maturity slice and is analytically tractable: ρ captures the skew (left-skewed equity surface has ρ ≈ -0.7), b controls the angle (wing spread), and σ smooths the ATM curvature. SVI's key theoretical property is that it is free of static arbitrage when its convexity and non-crossing constraints are satisfied, making it a market standard for vol surface interpolation and extrapolation.",
  },
];
