import type { Snippet } from "./types";

export const pythonFinanceSnippets20260530B1: Snippet[] = [
  {
    id: "pyfin-20260530-b1-ou-mle",
    language: "python",
    title: "Ornstein-Uhlenbeck parameter MLE estimation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar
from scipy.stats import norm

def ou_mle(x: np.ndarray, dt: float) -> dict:
    """
    MLE for dX = kappa*(theta - X)*dt + sigma*dW.
    Discretised exact solution: X_{t+1} | X_t ~ N(mu_c, sigma_c^2)
    where mu_c = theta + (X_t - theta)*exp(-kappa*dt)
          sigma_c^2 = sigma^2*(1 - exp(-2*kappa*dt)) / (2*kappa)

    We concentrate out theta and sigma analytically, leaving a 1-D search over kappa.
    """
    n = len(x) - 1
    x0 = x[:-1]; x1 = x[1:]

    def neg_log_lik(kappa: float) -> float:
        if kappa <= 0.0:
            return 1e12
        e = np.exp(-kappa * dt)
        # Concentrated MLE estimates for theta and sigma^2
        sx  = np.sum(x0);  sy  = np.sum(x1)
        sxx = np.sum(x0**2); sxy = np.sum(x0 * x1); syy = np.sum(x1**2)
        denom = n * sxx - sx**2
        if denom == 0:
            return 1e12
        theta = (sy * sxx - sx * sxy) / ((1.0 - e) * denom)
        sigma2_dt = (syy - 2.0 * e * sxy + e**2 * sxx
                     - 2.0 * theta * (1.0 - e) * (sy - e * sx)
                     + n * theta**2 * (1.0 - e)**2) / n
        if sigma2_dt <= 0:
            return 1e12
        sigma2 = sigma2_dt * 2.0 * kappa / (1.0 - np.exp(-2.0 * kappa * dt))
        # Log-likelihood
        var_c = sigma2 * (1.0 - np.exp(-2.0 * kappa * dt)) / (2.0 * kappa)
        residuals = x1 - theta - (x0 - theta) * e
        return 0.5 * n * np.log(var_c) + 0.5 * np.sum(residuals**2) / var_c

    res = minimize_scalar(neg_log_lik, bounds=(1e-4, 100.0), method='bounded')
    kappa = res.x
    e = np.exp(-kappa * dt)
    n = len(x) - 1
    sx = np.sum(x0); sy = np.sum(x1); sxx = np.sum(x0**2)
    sxy = np.sum(x0 * x1); syy = np.sum(x1**2)
    denom = n * sxx - sx**2
    theta  = (sy * sxx - sx * sxy) / ((1.0 - e) * denom)
    sigma2_dt = (syy - 2.0*e*sxy + e**2*sxx - 2.0*theta*(1.0-e)*(sy-e*sx)
                 + n*theta**2*(1.0-e)**2) / n
    sigma  = np.sqrt(sigma2_dt * 2.0 * kappa / (1.0 - np.exp(-2.0*kappa*dt)))
    half_life = np.log(2.0) / kappa
    return {'kappa': kappa, 'theta': theta, 'sigma': sigma, 'half_life_days': half_life / dt}

rng = np.random.default_rng(42)
dt = 1/252
n = 500
# Simulate OU: kappa=10, theta=100, sigma=2
kappa_true, theta_true, sigma_true = 10.0, 100.0, 2.0
x = np.zeros(n + 1)
x[0] = 100.0
for i in range(n):
    x[i+1] = theta_true + (x[i] - theta_true)*np.exp(-kappa_true*dt) \\
              + sigma_true*np.sqrt((1-np.exp(-2*kappa_true*dt))/(2*kappa_true))*rng.standard_normal()

params = ou_mle(x, dt)
print(f"kappa={params['kappa']:.2f}  theta={params['theta']:.2f}  "
      f"sigma={params['sigma']:.2f}  half_life={params['half_life_days']:.1f}d")
`,
    explanation:
      "MLE for the OU process concentrates out theta and sigma analytically, leaving a 1-D bounded search over kappa — much faster and more numerically stable than optimizing all three jointly. Half-life = ln(2)/kappa is the key output for pairs trading: it tells you how many days the spread takes to revert halfway to its mean, which sets the holding period.",
  },

  {
    id: "pyfin-20260530-b1-swaption-black",
    language: "python",
    title: "Swaption pricing with Black's model (payer and receiver)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def annuity(swap_rate: float, tenor_yrs: float, freq: int = 2) -> float:
    """Present value of an annuity paying 1/freq at freq periods per year."""
    periods = int(tenor_yrs * freq)
    r = swap_rate / freq
    return (1.0 - (1.0 + r) ** (-periods)) / r

def swaption_black(
    F: float,           # forward swap rate
    K: float,           # strike (fixed rate)
    sigma: float,       # Black lognormal vol of forward swap rate
    T_exp: float,       # time to expiry (years)
    tenor: float,       # swap tenor after expiry (years)
    freq: int = 2,      # coupon freq per year
    notional: float = 1e6,
    payer: bool = True, # True = payer swaption (long fixed-rate payer)
) -> dict:
    sqrt_T = np.sqrt(T_exp)
    d1 = (np.log(F / K) + 0.5 * sigma**2 * T_exp) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T

    # Annuity factor (PV01 per unit notional per period)
    A = annuity(F, tenor, freq)

    if payer:
        # Payer: pays fixed K, receives float — profits if rates rise
        price = notional * A * (F * norm.cdf(d1) - K * norm.cdf(d2))
        delta = notional * A * norm.cdf(d1)        # dPrice/dF
    else:
        # Receiver: receives fixed K, pays float
        price = notional * A * (K * norm.cdf(-d2) - F * norm.cdf(-d1))
        delta = -notional * A * norm.cdf(-d1)

    vega = notional * A * F * norm.pdf(d1) * sqrt_T  # dPrice/dsigma

    return {'price': price, 'delta': delta, 'vega': vega, 'annuity': A}

# 1Y expiry into 5Y swap, ATM forward = 4.5%, Black vol = 80bps normal ~17.8% lognormal
result = swaption_black(F=0.045, K=0.045, sigma=0.178, T_exp=1.0, tenor=5.0,
                        notional=10_000_000, payer=True)
print(f"Payer swaption: \${result['price']:,.0f}")
print(f"Delta (DV01):   \${result['delta']*0.0001:,.0f} per bp")
print(f"Vega:           \${result['vega']*0.01:,.0f} per 1% vol move")
`,
    explanation:
      "Black's model prices swaptions by treating the forward swap rate as a lognormal martingale under the annuity measure, so the familiar BSM formula applies with the annuity factor (PV01) as the numeraire. The delta in rate-point terms (dPrice/dF * 1bp) is the key hedge ratio used to delta-neutralize swaption books against parallel rate moves.",
  },

  {
    id: "pyfin-20260530-b1-vol-arb-check",
    language: "python",
    title: "Volatility surface arbitrage check — calendar and butterfly",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def check_calendar_arb(sigma_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calendar arbitrage: for a fixed strike, total variance = sigma^2 * T
    must be non-decreasing in T. If var(T2) < var(T1) for T2 > T1, calendar arb exists.
    sigma_df: columns=strikes (%), rows=expiries (years), values=lognormal vols.
    """
    violations = []
    tenors = sigma_df.index.tolist()
    for k in sigma_df.columns:
        for i in range(len(tenors) - 1):
            T1, T2 = tenors[i], tenors[i + 1]
            var1 = sigma_df.loc[T1, k] ** 2 * T1
            var2 = sigma_df.loc[T2, k] ** 2 * T2
            if var2 < var1 - 1e-8:
                violations.append({'strike': k, 'T1': T1, 'T2': T2,
                                    'deficit': var1 - var2})
    return pd.DataFrame(violations)

def check_butterfly_arb(sigma_df: pd.DataFrame, tenors: list | None = None) -> pd.DataFrame:
    """
    Butterfly (convexity) arbitrage for a fixed expiry:
    The risk-neutral density must be non-negative, which requires:
      d^2 C / d K^2 >= 0  (call price convex in K).
    Equivalent undiscounted condition: d^2(sigma^2*T) / d(ln K)^2 >= 0 (approx).
    Here we use the simpler finite-difference check on total variance.
    """
    tenors = tenors or sigma_df.index.tolist()
    violations = []
    strikes = sigma_df.columns.tolist()
    for T in tenors:
        vols = sigma_df.loc[T]
        total_var = (vols ** 2 * T).values
        for i in range(1, len(strikes) - 1):
            # Central second difference of total variance in log-strike space
            dk = np.log(strikes[i] / strikes[i - 1])
            butterfly = (total_var[i+1] - 2*total_var[i] + total_var[i-1]) / dk**2
            if butterfly < -1e-6:
                violations.append({'T': T, 'K_mid': strikes[i], 'butterfly': butterfly})
    return pd.DataFrame(violations)

# Sample surface: EURUSD-style with slight skew
strikes = [0.80, 0.90, 1.00, 1.10, 1.20]
tenors  = [0.25, 0.50, 1.00, 2.00]
data = np.array([
    [0.120, 0.105, 0.100, 0.108, 0.118],  # 3M
    [0.118, 0.103, 0.098, 0.105, 0.115],  # 6M
    [0.115, 0.101, 0.096, 0.103, 0.113],  # 1Y
    [0.113, 0.099, 0.095, 0.101, 0.111],  # 2Y
])
sigma_df = pd.DataFrame(data, index=tenors, columns=strikes)

print("Calendar arb violations:")
print(check_calendar_arb(sigma_df))
print("\\nButterfly arb violations:")
print(check_butterfly_arb(sigma_df))
`,
    explanation:
      "A volatility surface must satisfy two no-arbitrage conditions: calendar spreads (total variance non-decreasing in time) and butterfly spreads (risk-neutral density non-negative). Violating calendar implies negative forward variance; violating butterfly implies negative probability mass in some region. Model calibration routines penalize these violations, and quant libraries like QuantLib reject surfaces that fail these checks.",
  },

  {
    id: "pyfin-20260530-b1-ois-swap-multicurve",
    language: "python",
    title: "Multi-curve IRS pricing — OIS discounting vs LIBOR forwarding",
    tag: "finance",
    code: `import numpy as np

# Post-2008, swap pricing uses two separate curves:
# 1. OIS (overnight index swap) curve for discounting (risk-free)
# 2. LIBOR/SOFR curve for projecting floating cash flows
# This dual-curve framework emerged because LIBOR-OIS basis widened significantly.

def bootstrap_ois(ois_rates: list[tuple[float, float]]) -> dict:
    """Bootstrap OIS zero rates from par rates: [(T, par_rate), ...]."""
    zeros = {}
    for T, par in sorted(ois_rates):
        # For OIS: assume annual payments, use previously bootstrapped zeros.
        if len(zeros) == 0:
            zeros[T] = par  # short end: par ≈ zero
        else:
            # Discount all intermediate coupons using known zeros,
            # solve for the new zero rate analytically.
            coupon_pv = 0.0
            prev_Ts = sorted(k for k in zeros if k < T)
            for t in prev_Ts:
                coupon_pv += par * np.exp(-zeros[t] * t)
            # Face + last coupon discounted at unknown zero z_T:
            # coupon_pv + (1 + par) * exp(-z_T * T) = 1
            zeros[T] = -np.log((1.0 - coupon_pv) / (1.0 + par)) / T
    return zeros

def df(zeros: dict, T: float) -> float:
    """Interpolated OIS discount factor (linear zero interpolation)."""
    Ts = sorted(zeros.keys())
    if T <= Ts[0]:
        return np.exp(-zeros[Ts[0]] * T)
    if T >= Ts[-1]:
        return np.exp(-zeros[Ts[-1]] * T)
    # Linear interpolation on zero rates
    i = next(j for j, t in enumerate(Ts) if t > T)
    T1, T2 = Ts[i-1], Ts[i]
    z = zeros[T1] + (zeros[T2] - zeros[T1]) * (T - T1) / (T2 - T1)
    return np.exp(-z * T)

def price_fixed_for_float_swap(
    libor_fwds: list[tuple[float, float, float]],  # (T_start, T_end, fwd_rate)
    fixed_rate: float,
    ois_zeros: dict,
    notional: float = 1e6,
) -> dict:
    """
    Value a plain-vanilla fixed-for-float IRS under dual-curve.
    Fixed leg PV = sum( fixed_rate * alpha_i * DF(T_end_i) ) * notional
    Float leg PV = sum( fwd_rate_i * alpha_i * DF(T_end_i) ) * notional
    """
    fixed_pv = 0.0; float_pv = 0.0
    for T_s, T_e, fwd in libor_fwds:
        alpha = T_e - T_s       # day-count fraction
        d     = df(ois_zeros, T_e)
        fixed_pv += fixed_rate * alpha * d
        float_pv += fwd * alpha * d
    npv = (float_pv - fixed_pv) * notional
    par = float_pv / sum(
        (T_e - T_s) * df(ois_zeros, T_e) for T_s, T_e, _ in libor_fwds
    )
    return {'npv': npv, 'par_rate': par, 'fixed_pv': fixed_pv * notional,
            'float_pv': float_pv * notional}

ois_rates = [(0.5, 0.052), (1.0, 0.053), (2.0, 0.054)]
ois_zeros = bootstrap_ois(ois_rates)

libor_forwards = [
    (0.0, 0.5, 0.056), (0.5, 1.0, 0.057), (1.0, 1.5, 0.058), (1.5, 2.0, 0.058)
]
result = price_fixed_for_float_swap(libor_forwards, fixed_rate=0.057, ois_zeros=ois_zeros)
print(f"Swap NPV:    \${result['npv']:,.0f}")
print(f"Par rate:    {result['par_rate']*100:.4f}%")
`,
    explanation:
      "The dual-curve framework separates discounting (OIS, near risk-free) from projection (LIBOR/SOFR, which embeds bank credit risk) — essential since 2008 when LIBOR-OIS basis exceeded 350bp in the crisis. Par rates bootstrapped from the OIS curve give risk-free discount factors; the LIBOR curve is separately bootstrapped to imply forward rates, and the two curves are used together to value each cash flow.",
  },

  {
    id: "pyfin-20260530-b1-student-t-var",
    language: "python",
    title: "Parametric VaR with Student-t fat tails",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as student_t
from scipy.optimize import minimize

def fit_student_t(returns: np.ndarray) -> tuple[float, float, float]:
    """MLE fit of scaled-and-shifted Student-t to daily returns."""
    def neg_ll(params):
        nu, mu, scale = params
        if nu <= 2.0 or scale <= 0:
            return 1e12
        return -np.sum(student_t.logpdf(returns, df=nu, loc=mu, scale=scale))
    mu0 = returns.mean()
    s0  = returns.std()
    res = minimize(neg_ll, x0=[5.0, mu0, s0], method='Nelder-Mead',
                   options={'xatol': 1e-6, 'fatol': 1e-6, 'maxiter': 5000})
    nu, mu, scale = res.x
    return nu, mu, scale

def var_es_student_t(
    returns: np.ndarray,
    confidence: float = 0.99,
    horizon_days: int = 1,
    notional: float = 1e6,
) -> dict:
    nu, mu, scale = fit_student_t(returns)
    # Scale to horizon (assumes i.i.d., square-root-of-time scaling)
    scale_h = scale * np.sqrt(horizon_days)
    mu_h    = mu * horizon_days

    alpha = 1.0 - confidence
    # Quantile of the fitted t
    q = student_t.ppf(alpha, df=nu, loc=mu_h, scale=scale_h)

    # Expected shortfall: E[X | X < q] for a scaled-shifted t
    # ES = mu_h - scale_h * (t.pdf(t.ppf(alpha, nu), nu) / alpha) * (nu + t.ppf(alpha,nu)**2) / (nu-1)
    z = student_t.ppf(alpha, df=nu)  # standardized quantile
    pdf_z = student_t.pdf(z, df=nu)
    es_std = -pdf_z / alpha * (nu + z**2) / (nu - 1)
    es = mu_h + scale_h * es_std

    normal_var = mu_h - 1.645 * scale_h * np.sqrt(horizon_days) / np.sqrt(horizon_days)
    return {
        'nu': nu,
        'VaR_t':      -q * notional,
        'ES_t':       -es * notional,
        'VaR_normal': -student_t.ppf(alpha, df=1e9, loc=mu_h, scale=scale_h) * notional,
    }

rng = np.random.default_rng(42)
# Simulate fat-tailed returns (nu=5)
returns = student_t.rvs(df=5, loc=0.0, scale=0.01, size=1000, random_state=rng)

res = var_es_student_t(returns, confidence=0.99, horizon_days=1)
print(f"Fitted nu:  {res['nu']:.2f}")
print(f"t-VaR 99%:  \${res['VaR_t']:,.0f}")
print(f"t-ES  99%:  \${res['ES_t']:,.0f}")
print(f"Normal VaR: \${res['VaR_normal']:,.0f}  (underestimates tail)")
`,
    explanation:
      "Equity returns exhibit fat tails — kurtosis well above 3 — so the normal VaR at 99% consistently underestimates tail losses. Fitting a Student-t with MLE gives an additional parameter (degrees of freedom nu) capturing tail heaviness; for nu=4 the 99% VaR is roughly 25% larger than the normal equivalent. Expected Shortfall (CVaR) has a closed-form expression under the Student-t and is the coherent risk measure required by Basel III.",
  },

  {
    id: "pyfin-20260530-b1-jump-detect",
    language: "python",
    title: "Lee-Mykland jump detection in high-frequency returns",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def lee_mykland_jumps(
    prices: pd.Series,
    alpha: float = 0.001,  # significance level
    window: int = 270,     # ~daily window for bipower variation
) -> pd.DataFrame:
    """
    Lee & Mykland (2008) jump test.
    J_t = |r_t| / sigma_hat_t  where sigma_hat_t is local bipower variation.
    Under no-jump null, J_t converges to the max of abs(standard normal).
    Critical value from Gumbel extreme-value distribution.
    """
    log_ret = np.log(prices / prices.shift(1)).dropna()

    # Bipower variation: uses |r_{t-1}| * |r_t| pairs, robust to jumps
    abs_r = log_ret.abs()
    bipower_var = (np.pi / 2) * (abs_r.shift(1) * abs_r).rolling(window).mean()
    local_vol   = np.sqrt(bipower_var)

    # Standardized jump statistic
    J = log_ret.abs() / local_vol.reindex(log_ret.index)

    # Gumbel critical value for significance level alpha
    # c_n = sqrt(2 * log(n)), C_n = 2*log(n) + log(log(n)) - log(pi)
    n = window
    c_n  = np.sqrt(2.0 * np.log(n))
    C_n  = 2.0 * np.log(n) + np.log(np.log(n)) - np.log(np.pi)
    # P(max > beta) = alpha => beta = C_n/c_n + (-log(-log(1-alpha)))/c_n
    beta = (C_n - np.log(-np.log(1.0 - alpha))) / c_n

    jumps = J[J > beta].dropna()
    result = pd.DataFrame({
        'return':    log_ret[jumps.index],
        'J_stat':    jumps,
        'local_vol': local_vol[jumps.index],
        'is_jump':   True,
    })
    return result

# Demo with simulated jumps
rng = np.random.default_rng(42)
n = 2000
dt = 1 / (252 * 78)  # 5-min bars
prices_arr = np.zeros(n)
prices_arr[0] = 100.0
for i in range(1, n):
    jump = rng.binomial(1, 0.002) * rng.choice([-1, 1]) * rng.uniform(0.005, 0.015)
    prices_arr[i] = prices_arr[i-1] * np.exp(-0.5*0.2**2*dt + 0.2*np.sqrt(dt)*rng.standard_normal() + jump)
prices = pd.Series(prices_arr)

detected = lee_mykland_jumps(prices, alpha=0.001)
print(f"Detected {len(detected)} jumps")
if not detected.empty:
    print(detected.head())
`,
    explanation:
      "The Lee-Mykland test identifies price jumps in intraday data by normalizing returns by local bipower variation — a measure of continuous quadratic variation that is robust to jumps because it multiplies adjacent returns (a jump only affects one return). The critical value from extreme-value theory is exact for large samples, and the test is used in HFT to distinguish regime changes from continuous diffusion for model-switching and signal filtering.",
  },

  {
    id: "pyfin-20260530-b1-skew-rr-bf",
    language: "python",
    title: "25-delta risk reversal and butterfly vol quote conversion",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def bs_call(S, K, r, q, sigma, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, q, sigma, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    return K*np.exp(-r*T)*norm.cdf(-d2) - S*np.exp(-q*T)*norm.cdf(-d1)

def implied_vol(price, S, K, r, q, T, is_call=True, tol=1e-8):
    fn = bs_call if is_call else bs_put
    try:
        return brentq(lambda s: fn(S, K, r, q, s, T) - price, 1e-6, 5.0, xtol=tol)
    except ValueError:
        return np.nan

def delta25_strike(S, r, q, sigma, T, delta_target=0.25, is_call=True):
    """Find K such that Black-Scholes delta = delta_target."""
    sign = 1 if is_call else -1
    sqT  = np.sqrt(T)
    # Analytical inverse: d1 = norm.ppf(delta / exp(-q*T))
    d1   = norm.ppf(sign * delta_target * np.exp(q * T))
    K    = S * np.exp(-d1 * sigma * sqT + (r - q + 0.5*sigma**2)*T)
    return K

def rr_bf_to_smile(atm_vol, rr25, bf25, S, r, q, T):
    """
    Market quote convention:
      ATM vol = sigma_atm (delta-neutral straddle vol)
      25-delta risk reversal: RR = sigma_call25 - sigma_put25
      25-delta butterfly:     BF = 0.5*(sigma_call25 + sigma_put25) - sigma_atm
    => sigma_call25 = atm + BF + 0.5*RR
       sigma_put25  = atm + BF - 0.5*RR
    """
    sigma_c25 = atm_vol + bf25 + 0.5 * rr25
    sigma_p25 = atm_vol + bf25 - 0.5 * rr25

    K_c25 = delta25_strike(S, r, q, sigma_c25, T, delta_target=0.25, is_call=True)
    K_p25 = delta25_strike(S, r, q, sigma_p25, T, delta_target=0.25, is_call=False)
    K_atm = S * np.exp((r - q) * T)  # forward (ATM-forward convention)

    return {
        'K_put25': K_p25, 'K_atm': K_atm, 'K_call25': K_c25,
        'vol_put25': sigma_p25, 'vol_atm': atm_vol, 'vol_call25': sigma_c25,
    }

# EUR/USD 1M: ATM=8.5%, RR25=-0.8% (put skew), BF25=0.3%
S, r, q, T = 1.08, 0.052, 0.035, 1/12
smile = rr_bf_to_smile(0.085, -0.008, 0.003, S, r, q, T)
for k, v in smile.items():
    print(f"{k:12s}: {v:.5f}")
`,
    explanation:
      "FX options are quoted in delta-space (ATM, 25-delta, 10-delta) rather than strike-space, using three market conventions: ATM vol, risk reversal (skew), and butterfly (kurtosis). Converting from (ATM, RR, BF) to strike-space vols requires iteratively solving for the delta-25 strikes using the implied vol — the three-pillar FX smile parameterization that every FX options desk works with daily.",
  },

  {
    id: "pyfin-20260530-b1-cdx-spread",
    language: "python",
    title: "CDX index spread from single-name CDS (bottom-up)",
    tag: "finance",
    code: `import numpy as np

def cds_survival_prob(hazard_rate: float, t: float) -> float:
    """Constant hazard rate: Q(tau > t) = exp(-lambda * t)."""
    return np.exp(-hazard_rate * t)

def cds_spread(
    hazard_rate: float,
    recovery: float = 0.40,
    tenors: np.ndarray | None = None,
    r: float = 0.05,
) -> float:
    """
    Par CDS spread (bps): premium PV = protection PV.
    Continuous approximation over quarterly payment dates.
    """
    if tenors is None:
        tenors = np.arange(0.25, 5.25, 0.25)  # 5Y CDS quarterly

    dt       = tenors[0]
    Q_vals   = cds_survival_prob(hazard_rate, tenors)
    df_vals  = np.exp(-r * tenors)

    # Premium leg: Q(survive to Ti) * discount * dt
    premium_pv = np.sum(Q_vals * df_vals * dt)

    # Protection leg: (1-R) * default probability in each period
    Q_prev  = np.concatenate([[1.0], Q_vals[:-1]])
    dp      = Q_prev - Q_vals                     # prob of default in [T_{i-1}, T_i]
    t_mid   = tenors - 0.5 * dt
    prot_pv = (1.0 - recovery) * np.sum(dp * np.exp(-r * t_mid))

    return prot_pv / premium_pv * 10_000  # in basis points

def cdx_index_spread(
    names: list[dict],    # [{'hazard_rate': ..., 'recovery': ..., 'weight': ...}]
    r: float = 0.05,
) -> float:
    """
    CDX spread ≈ weighted average of constituent CDS spreads.
    Equal-weighted for on-the-run CDX; uses flat hazard rates per name.
    """
    total_weight = sum(n['weight'] for n in names)
    index_spread = 0.0
    for name in names:
        s = cds_spread(name['hazard_rate'], name.get('recovery', 0.40), r=r)
        index_spread += s * name['weight'] / total_weight
    return index_spread

# CDX IG 125-name index (simplified: 5 representative names)
names = [
    {'hazard_rate': 0.005, 'recovery': 0.40, 'weight': 1},  # IG ~50bp
    {'hazard_rate': 0.008, 'recovery': 0.40, 'weight': 1},
    {'hazard_rate': 0.006, 'recovery': 0.40, 'weight': 1},
    {'hazard_rate': 0.010, 'recovery': 0.35, 'weight': 1},
    {'hazard_rate': 0.004, 'recovery': 0.40, 'weight': 1},
]
index_s = cdx_index_spread(names)
print(f"CDX index spread (approx): {index_s:.1f} bps")
for i, n in enumerate(names):
    print(f"  Name {i+1}: {cds_spread(n['hazard_rate'], n['recovery']):.1f} bps")
`,
    explanation:
      "The CDX index spread is a weighted average of constituent single-name CDS spreads — this bottom-up construction allows arbitrage traders to compare the index quote against the sum-of-parts to find index-versus-single-name basis trades. A constant hazard rate (flat credit curve) is the simplest model; real desks use piecewise-constant hazard rates bootstrapped from the full term structure of CDS quotes.",
  },

  {
    id: "pyfin-20260530-b1-factor-tilt",
    language: "python",
    title: "Factor-tilt portfolio construction — systematic reweighting",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def factor_tilt_portfolio(
    benchmark_weights: pd.Series,   # market-cap weights, sums to 1
    factor_scores: pd.DataFrame,     # cols = factor names, rows = assets
    target_tilts: dict[str, float],  # {factor: target active exposure}
    sigma: np.ndarray,               # covariance matrix (n x n)
    lam: float = 10.0,               # risk-aversion
    max_abs_active: float = 0.05,    # max abs active weight per stock
) -> pd.Series:
    """
    Solve for active weights w_active that achieve target factor tilts
    with minimum tracking error via quadratic programming (hand-rolled).
    min  lam * w_a' * Sigma * w_a
    s.t. F' * w_a = target_exposures
         |w_a_i| <= max_abs_active

    Here we use a gradient-descent approach for simplicity.
    """
    n = len(benchmark_weights)
    assets = benchmark_weights.index
    F = factor_scores.loc[assets].values        # (n x k)
    target = np.array([target_tilts.get(c, 0.0) for c in factor_scores.columns])

    # Analytical solution without box constraints:
    # Lagrangian: grad = 2*lam*Sigma*w + F*mu = 0
    # F'*w = target => mu = -(F'*Sigma^{-1}*F)^{-1}*(target - F'*w_bm)
    # w_active = -(1/(2*lam))*Sigma^{-1}*F*mu
    Sigma_inv = np.linalg.inv(sigma)
    FtSi      = F.T @ Sigma_inv                          # (k x n)
    FtSiF     = FtSi @ F                                 # (k x k)
    # Current benchmark exposure
    bm_exposure = F.T @ benchmark_weights.values          # (k,)
    rhs = target - bm_exposure
    mu  = np.linalg.solve(FtSiF, rhs)
    w_active = (Sigma_inv @ F @ mu) / (2.0 * lam)

    # Clip to box constraint
    w_active = np.clip(w_active, -max_abs_active, max_abs_active)
    total_weights = pd.Series(benchmark_weights.values + w_active, index=assets)
    total_weights = total_weights.clip(0.0)               # no shorts
    total_weights /= total_weights.sum()
    return total_weights

# Example: 5-stock universe, 2 factors (value, momentum)
assets = ['AAPL', 'JPM', 'XOM', 'PG', 'AMZN']
bm_w   = pd.Series([0.30, 0.25, 0.15, 0.15, 0.15], index=assets)
scores = pd.DataFrame({
    'value':    [-0.5, 0.8, 1.2, 0.3, -1.0],
    'momentum': [ 1.2, 0.1, -0.3, 0.5, 0.9],
}, index=assets)
sigma  = np.eye(5) * 0.04 + 0.01  # simplified: 20% vol, 25% pairwise corr

port = factor_tilt_portfolio(bm_w, scores, {'value': 0.3, 'momentum': 0.2}, sigma)
print("Portfolio weights:")
for a, w in port.items():
    print(f"  {a}: {w:.4f}  (active: {w - bm_w[a]:+.4f})")

achieved = scores.loc[assets].T.values @ (port.values - bm_w.values)
for f, exp in zip(scores.columns, achieved):
    print(f"Active {f} exposure: {exp:.4f}  (target: {{'value':0.3,'momentum':0.2}[f]:.1f})")
`,
    explanation:
      "Factor-tilt portfolios reweight a benchmark to achieve target exposures to systematic factors (value, momentum, quality) while minimizing tracking error — the standard construction used by smart-beta and quantitative equity funds. The Lagrangian solution gives the minimum-tracking-error active weights analytically; box constraints require quadratic programming in practice (cvxpy or OSQP), but this shows the key algebra.",
  },

  {
    id: "pyfin-20260530-b1-rolling-sharpe-jk",
    language: "python",
    title: "Rolling Sharpe ratio with Jobson-Korkie significance test",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import norm

def jobson_korkie_test(r1: np.ndarray, r2: np.ndarray) -> dict:
    """
    Tests H0: SR1 = SR2 using the asymptotic JK statistic (Memmel 2003 correction).
    Returns z-statistic and p-value for one-sided test (SR1 > SR2).
    """
    n    = len(r1)
    mu1, mu2   = r1.mean(), r2.mean()
    s1,  s2    = r1.std(), r2.std()
    sr1, sr2   = mu1 / s1, mu2 / s2
    # Cross-moment
    s12  = ((r1 - mu1) * (r2 - mu2)).mean()
    # Asymptotic variance of SR1 - SR2 (Memmel 2003)
    theta = (1/n) * (2*s1**2*s2**2 - 2*s1*s2*s12 + 0.5*mu1**2*s2**2
                     + 0.5*mu2**2*s1**2 - mu1*mu2*s12) / (s1*s2)**2
    z  = (sr1 - sr2) / np.sqrt(max(theta, 1e-12))
    p  = 1.0 - norm.cdf(z)   # one-tailed
    return {'sr1': sr1 * np.sqrt(252), 'sr2': sr2 * np.sqrt(252),
            'z': z, 'p_value': p, 'significant': p < 0.05}

def rolling_sharpe(returns: pd.Series, window: int = 60) -> pd.Series:
    roll_mean = returns.rolling(window).mean()
    roll_std  = returns.rolling(window).std()
    return (roll_mean / roll_std * np.sqrt(252)).dropna()

rng = np.random.default_rng(42)
n   = 500
# Strategy A: slightly better Sharpe
r_a = rng.normal(0.0006, 0.01, n)   # ~1.0 Sharpe
r_b = rng.normal(0.0004, 0.01, n)   # ~0.64 Sharpe

print("Rolling Sharpe (last 5 obs):")
print(rolling_sharpe(pd.Series(r_a)).tail())

jk = jobson_korkie_test(r_a, r_b)
print(f"\\nJK test: SR_A={jk['sr1']:.2f}  SR_B={jk['sr2']:.2f}")
print(f"z={jk['z']:.2f}  p={jk['p_value']:.3f}  significant={jk['significant']}")
`,
    explanation:
      "The Jobson-Korkie (1981) test with Memmel's (2003) correction is the proper statistical test for whether strategy A has a significantly higher Sharpe ratio than strategy B — a question every quant faces in backtesting. With 500 days (~2 years) of data, even a true Sharpe difference of 0.4 only yields ~60% power at 5% significance, which is why long track records matter for alpha validation.",
  },

  {
    id: "pyfin-20260530-b1-execution-shortfall",
    language: "python",
    title: "Implementation shortfall decomposition — delay, impact, timing",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def implementation_shortfall(
    decision_price: float,  # price when portfolio manager decides to trade
    fills: list[tuple[float, float]],   # [(fill_price, qty), ...]
    cancel_qty: float = 0.0,            # qty left unexecuted
    total_target_qty: float | None = None,
) -> dict:
    """
    Perold (1988) implementation shortfall = paper portfolio return - actual return.
    Decomposed into:
      - Delay cost:  price drift from decision to first fill
      - Market impact: additional cost from execution (price movement during fills)
      - Timing (slippage): within-day deviations from VWAP
      - Opportunity cost: cost of unexecuted shares (cancel_qty * drift)
    """
    if not fills:
        return {}
    total_qty = sum(q for _, q in fills) + cancel_qty
    if total_target_qty is None:
        total_target_qty = total_qty

    # Paper portfolio: all shares filled at decision price
    paper_cost = decision_price * total_target_qty

    # First fill price (for delay decomposition)
    first_fill_px = fills[0][0]
    last_fill_px  = fills[-1][0]

    # Actual execution cost (VWAP of fills)
    fill_notional = sum(p * q for p, q in fills)
    fill_qty      = sum(q for _, q in fills)
    vwap_fill     = fill_notional / fill_qty if fill_qty else 0.0

    # Delay cost: drift from decision to first fill
    delay_cost    = (first_fill_px - decision_price) * fill_qty

    # Market impact: drift during execution (last fill vs first)
    impact_cost   = (last_fill_px - first_fill_px) * fill_qty * 0.5  # linear approx

    # Slippage: actual vs VWAP (timing cost)
    timing_cost   = (vwap_fill - (first_fill_px + last_fill_px) / 2) * fill_qty

    # Opportunity cost: unexecuted shares * (last_fill - decision)
    opp_cost      = cancel_qty * (last_fill_px - decision_price)

    total_is      = delay_cost + impact_cost + timing_cost + opp_cost
    is_bps        = total_is / paper_cost * 1e4

    return {
        'paper_cost': paper_cost, 'actual_notional': fill_notional,
        'vwap_fill': vwap_fill, 'delay_cost': delay_cost,
        'impact_cost': impact_cost, 'timing_cost': timing_cost,
        'opportunity_cost': opp_cost, 'total_IS': total_is,
        'IS_bps': is_bps,
    }

fills = [(182.50, 5000), (182.65, 10000), (182.80, 8000), (183.10, 7000)]
result = implementation_shortfall(
    decision_price=182.40,
    fills=fills,
    cancel_qty=2000,
    total_target_qty=32000,
)
for k, v in result.items():
    print(f"{k:25s}: {v:>12.2f}")
`,
    explanation:
      "Implementation shortfall (Perold 1988) is the total cost of execution measured against a frictionless paper portfolio. Decomposing it into delay, impact, timing, and opportunity cost pinpoints where cost is leaking: high delay cost suggests the order arrived late (signal decay), high impact cost suggests order size relative to market depth is too large (use TWAP/VWAP), high opportunity cost means too aggressive cancellation.",
  },

  {
    id: "pyfin-20260530-b1-twap-vwap-exec",
    language: "python",
    title: "TWAP vs VWAP execution benchmark — schedule simulation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def simulate_twap_vwap(
    intraday_prices: pd.Series,   # 5-min bar closing prices
    intraday_volumes: pd.Series,  # 5-min volumes
    total_qty: int,
    strategy: str = 'vwap',       # 'twap' or 'vwap'
) -> dict:
    """
    TWAP: split order equally across all bars.
    VWAP: allocate proportional to historical volume profile.
    Returns scheduled fills and achieved VWAP vs market VWAP.
    """
    n = len(intraday_prices)
    if strategy == 'twap':
        # Equal slice per bar, rounding so total = total_qty
        slice_qty = np.full(n, total_qty // n)
        slice_qty[:total_qty % n] += 1
    elif strategy == 'vwap':
        vol_fracs = intraday_volumes / intraday_volumes.sum()
        slice_qty = np.round(vol_fracs * total_qty).astype(int)
        # Adjust rounding error on the largest slice
        diff = total_qty - slice_qty.sum()
        slice_qty[vol_fracs.argmax()] += diff
    else:
        raise ValueError(strategy)

    # Simulate fills: assume we fill at bar close (worst case; reality = VWAP of bar)
    fill_notional = (slice_qty * intraday_prices.values).sum()
    executed_qty  = slice_qty.sum()
    achieved_vwap = fill_notional / executed_qty

    # Market VWAP (benchmark)
    market_vwap   = (intraday_prices * intraday_volumes).sum() / intraday_volumes.sum()
    slippage_bps  = (achieved_vwap - market_vwap) / market_vwap * 1e4

    return {
        'strategy': strategy, 'achieved_vwap': achieved_vwap,
        'market_vwap': market_vwap, 'slippage_bps': slippage_bps,
        'fill_notional': fill_notional, 'slice_qty': slice_qty,
    }

rng = np.random.default_rng(42)
n_bars = 78  # 6.5-hour day, 5-min bars
# Simulated intraday prices and U-shaped volume profile
t = np.linspace(0, 1, n_bars)
volume_profile = 2.0 + 3.0 * (1 - 4*(t - 0.5)**2)  # U-shape
volumes = (volume_profile * 1e5 * (1 + 0.3 * rng.standard_normal(n_bars))).clip(1e4)
prices  = 100.0 + np.cumsum(rng.standard_normal(n_bars) * 0.05)

prices_s  = pd.Series(prices)
volumes_s = pd.Series(volumes)

for strat in ['twap', 'vwap']:
    res = simulate_twap_vwap(prices_s, volumes_s, 100_000, strategy=strat)
    print(f"{strat.upper()}: achieved={res['achieved_vwap']:.4f}  "
          f"market={res['market_vwap']:.4f}  slippage={res['slippage_bps']:.2f}bps")
`,
    explanation:
      "VWAP execution schedules more shares in high-volume periods (open and close for most equities), which reduces market impact by spreading the order when liquidity is deepest. TWAP ignores the volume curve and is therefore suboptimal versus VWAP on most instruments — but TWAP is preferable when the trader has alpha that decays uniformly through the day, since it doesn't front-load the open when the signal is strongest.",
  },

  {
    id: "pyfin-20260530-b1-hf-microstructure-features",
    language: "python",
    title: "HFT microstructure features — order imbalance and arrival intensity",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import poisson

def order_flow_imbalance(
    bid_changes: pd.Series,   # delta bid qty at touch: positive=add, negative=cancel/fill
    ask_changes: pd.Series,
    window: int = 10,
) -> pd.Series:
    """
    Cont-Kukanov (2013) Order Flow Imbalance:
      OFI_t = bid_change_t - ask_change_t
    Rolling OFI captures directional pressure at the best quotes.
    High positive OFI => more buying pressure => price tends to move up.
    """
    ofi = bid_changes - ask_changes
    return ofi.rolling(window).sum()

def trade_arrival_intensity(
    timestamps_ns: np.ndarray,   # nanosecond timestamps of trades
    window_sec: float = 1.0,
) -> np.ndarray:
    """
    Estimate Poisson arrival intensity (lambda) in rolling windows.
    Returns lambda_hat = count / window_sec for each trade.
    """
    n = len(timestamps_ns)
    lambdas = np.zeros(n)
    window_ns = window_sec * 1e9
    for i in range(n):
        t_start = timestamps_ns[i] - window_ns
        count   = np.searchsorted(timestamps_ns, timestamps_ns[i], 'right') \
                - np.searchsorted(timestamps_ns, t_start, 'left')
        lambdas[i] = count / window_sec
    return lambdas

def vpin(
    buy_vols: np.ndarray,   # signed buy volume per bucket
    sell_vols: np.ndarray,  # signed sell volume per bucket
    window: int = 50,
) -> np.ndarray:
    """
    Volume-synchronized Probability of Informed Trading (VPIN).
    VPIN = |buy_vol - sell_vol| / total_vol  averaged over window buckets.
    High VPIN signals toxic order flow (informed trading), causing market makers to widen.
    """
    imbalance = np.abs(buy_vols - sell_vols)
    total_vol  = buy_vols + sell_vols
    # Rolling mean of imbalance fraction
    n = len(imbalance)
    vpin_vals = np.full(n, np.nan)
    for i in range(window - 1, n):
        w = slice(i - window + 1, i + 1)
        vpin_vals[i] = imbalance[w].sum() / total_vol[w].sum()
    return vpin_vals

rng = np.random.default_rng(42)
n = 200
bid_changes = pd.Series(rng.integers(-50, 100, n))
ask_changes = pd.Series(rng.integers(-100, 50, n))
ofi = order_flow_imbalance(bid_changes, ask_changes, window=10)
print("OFI (last 5):", ofi.dropna().tail())

# VPIN demo
buy_vols  = rng.uniform(50, 200, 100)
sell_vols = rng.uniform(50, 200, 100)
v = vpin(buy_vols, sell_vols, window=50)
print(f"Mean VPIN: {np.nanmean(v):.3f}")
`,
    explanation:
      "Order Flow Imbalance (OFI) measures directional pressure at the best bid and ask by tracking how queue sizes change — it is the strongest short-horizon price predictor at the microsecond level. VPIN (Volume-Synchronized PIN) measures the fraction of volume attributable to informed traders; market makers monitor it in real time to decide whether to widen spreads or pull quotes entirely to avoid being adversely selected.",
  },

  {
    id: "pyfin-20260530-b1-tips-breakeven",
    language: "python",
    title: "TIPS breakeven inflation and real yield computation",
    tag: "finance",
    code: `import numpy as np

def tips_cash_flows(
    notional: float,
    coupon_rate: float,         # real coupon (e.g. 1.5%)
    index_ratio: float,         # accrued CPI / base CPI
    freq: int = 2,
    tenor_yrs: float = 10.0,
) -> list[tuple[float, float]]:
    """
    TIPS cash flows adjusted for inflation via the index ratio.
    Accrued principal = notional * index_ratio.
    Each coupon = real_rate/freq * accrued_principal.
    At maturity, return max(accrued_principal, notional) (deflation floor).
    Returns [(time_years, cash_flow), ...].
    """
    periods = int(tenor_yrs * freq)
    accrued = notional * index_ratio
    coupon  = coupon_rate / freq * accrued
    cfs = [(i / freq, coupon) for i in range(1, periods)]
    cfs.append((tenor_yrs, coupon + max(accrued, notional)))  # final + principal
    return cfs

def tips_price(real_yield: float, coupon_rate: float, index_ratio: float,
               notional: float = 1000.0, freq: int = 2, tenor_yrs: float = 10.0) -> float:
    """Dirty price of TIPS given real yield (continuously compounded for simplicity)."""
    cfs = tips_cash_flows(notional, coupon_rate, index_ratio, freq, tenor_yrs)
    return sum(cf * np.exp(-real_yield * t) for t, cf in cfs)

def breakeven_inflation(nominal_yield: float, real_yield: float) -> dict:
    """
    Breakeven inflation rate = nominal yield - real yield (Fisher decomposition).
    Also compute inflation risk premium (IRP) if survey expectations available.
    """
    bei = nominal_yield - real_yield
    return {
        'nominal_yield':    nominal_yield,
        'real_yield':       real_yield,
        'breakeven_inf':    bei,
        'bei_bps':          bei * 1e4,
    }

# Current US 10Y: nominal ~4.5%, TIPS real ~2.1%
info = breakeven_inflation(nominal_yield=0.045, real_yield=0.021)
print("Breakeven inflation analysis:")
for k, v in info.items():
    print(f"  {k:20s}: {v:.4f}")

# TIPS price sensitivity to real yield
for real_y in [0.015, 0.020, 0.025, 0.030]:
    px = tips_price(real_yield=real_y, coupon_rate=0.015, index_ratio=1.15)
    print(f"  real_yield={real_y:.3f} => TIPS price: \${px:.2f}")
`,
    explanation:
      "TIPS principal accretes with realized CPI via the index ratio, so the real yield isolates compensation for real economic risk while breakeven inflation = nominal − real measures the market's inflation expectation embedded in prices. The deflation floor (principal can't fall below par) is an embedded put option that makes TIPS slightly richer than pure inflation swaps, which don't have the floor.",
  },

  {
    id: "pyfin-20260530-b1-bond-oas",
    language: "python",
    title: "Option-adjusted spread (OAS) for callable bonds via binomial tree",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def build_ho_lee_tree(r0: float, sigma: float, T: int, dt: float = 1.0) -> np.ndarray:
    """
    Ho-Lee interest rate tree (simplified, constant theta for flat term structure).
    r[i][j] = r0 + sigma*(2j - i)*sqrt(dt)  (recombining binomial).
    """
    tree = np.zeros((T + 1, T + 1))
    for i in range(T + 1):
        for j in range(i + 1):
            tree[i][j] = r0 + sigma * (2*j - i) * np.sqrt(dt)
    return tree

def callable_bond_price(
    r_tree: np.ndarray,
    coupon: float,
    face: float,
    call_price: float,     # call schedule price (assume constant for simplicity)
    call_start: int,       # first period callable
    T: int,
    dt: float = 1.0,
    oas: float = 0.0,
) -> float:
    """
    Backward induction on the rate tree for a callable bond.
    At each node: V = min(call_price, (Vu + Vd)/2 * df + coupon).
    OAS shifts all rates: r_adj[i][j] = r_tree[i][j] + oas.
    """
    # Terminal values
    V = np.full(T + 1, face + coupon)  # face + last coupon at expiry

    for i in range(T - 1, -1, -1):
        V_new = np.zeros(i + 1)
        for j in range(i + 1):
            r_adj = r_tree[i][j] + oas
            df    = np.exp(-r_adj * dt)
            # Risk-neutral avg of up and down child nodes
            V_hold = 0.5 * (V[j + 1] + V[j]) * df + coupon * df
            # Issuer calls if holding cost > call price (optimal call)
            if i >= call_start:
                V_new[j] = min(V_hold, call_price)
            else:
                V_new[j] = V_hold
        V = V_new
    return V[0]

def compute_oas(
    market_price: float, r0: float, sigma: float,
    coupon: float, face: float, call_price: float,
    call_start: int, T: int, dt: float = 1.0,
) -> float:
    """Find OAS such that model price = market price."""
    r_tree = build_ho_lee_tree(r0, sigma, T, dt)
    def objective(oas):
        return callable_bond_price(r_tree, coupon, face, call_price, call_start, T, dt, oas) \
               - market_price
    return brentq(objective, -0.05, 0.10, xtol=1e-6)

r_tree = build_ho_lee_tree(r0=0.05, sigma=0.01, T=10, dt=1.0)
# 10Y callable bond, callable from year 5
px_nc = callable_bond_price(r_tree, coupon=5.0, face=100.0, call_price=100.0,
                             call_start=5, T=10, dt=1.0, oas=0.0)
print(f"Model price (OAS=0):  {px_nc:.4f}")

oas = compute_oas(market_price=97.50, r0=0.05, sigma=0.01,
                  coupon=5.0, face=100.0, call_price=100.0, call_start=5, T=10)
print(f"OAS for market price 97.50: {oas*10000:.1f} bps")
`,
    explanation:
      "OAS is the constant spread added to all rates in the tree such that the model replicates the market price of a callable bond — it isolates the credit/liquidity spread after stripping out the embedded call option value. A callable bond always trades at a discount to an equivalent non-callable (the call penalizes the bondholder), so a positive OAS indicates that the option value has been over-stripped and the bond is cheap, or that there is genuine credit/liquidity premium.",
  },

  {
    id: "pyfin-20260530-b1-stoch-vol-nelder",
    language: "python",
    title: "Heston model calibration via Nelder-Mead on market vols",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def heston_cf(phi: float, S: float, K: float, T: float, r: float,
              kappa: float, theta: float, sigma: float, rho: float, v0: float) -> complex:
    """Heston characteristic function for log(S_T) under Q."""
    u = 0.5
    b = kappa - rho * sigma * phi * 1j
    d = np.sqrt(b**2 + sigma**2 * (phi * 1j + phi**2))
    g = (b - d) / (b + d)
    # Avoid numerical issues with exp(-d*T)
    C = r * phi * 1j * T + kappa * theta / sigma**2 * (
        (b - d) * T - 2.0 * np.log((1.0 - g * np.exp(-d * T)) / (1.0 - g)))
    D = (b - d) / sigma**2 * (1.0 - np.exp(-d * T)) / (1.0 - g * np.exp(-d * T))
    return np.exp(C + D * v0 + 1j * phi * np.log(S * np.exp(r * T)))

def heston_call_price(S, K, T, r, kappa, theta, sigma, rho, v0, N=64) -> float:
    """Carr-Madan FFT-lite: direct Gauss-Laguerre integration of Gil-Pelaez formula."""
    phi_vals = np.linspace(1e-5, 200, N)
    dphi     = phi_vals[1] - phi_vals[0]
    integrand1 = np.array([
        np.real(np.exp(-1j * phi * np.log(K)) * heston_cf(phi - 1j, S, K, T, r,
                kappa, theta, sigma, rho, v0) / (1j * phi)) for phi in phi_vals])
    integrand2 = np.array([
        np.real(np.exp(-1j * phi * np.log(K)) * heston_cf(phi, S, K, T, r,
                kappa, theta, sigma, rho, v0) / (1j * phi)) for phi in phi_vals])
    P1 = 0.5 + (1/np.pi) * np.trapz(integrand1, phi_vals)
    P2 = 0.5 + (1/np.pi) * np.trapz(integrand2, phi_vals)
    return S * P1 - K * np.exp(-r * T) * P2

def bs_implied_vol(price, S, K, r, T, is_call=True, tol=1e-8):
    from scipy.optimize import brentq
    from scipy.stats import norm as N
    def bs_price(sigma):
        sqT = np.sqrt(T)
        d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T)/(sigma*sqT)
        d2 = d1 - sigma*sqT
        return S*N.cdf(d1) - K*np.exp(-r*T)*N.cdf(d2) - price
    try:
        return brentq(bs_price, 1e-6, 5.0, xtol=tol)
    except Exception:
        return np.nan

# Synthetic market vols (what we're calibrating to)
S, r = 100.0, 0.05
market_data = [
    (0.25, 95,  0.235), (0.25, 100, 0.200), (0.25, 105, 0.195),
    (1.00, 90,  0.230), (1.00, 100, 0.195), (1.00, 110, 0.210),
]

def calibration_error(params):
    kappa, theta, sigma, rho, v0 = params
    if kappa <= 0 or theta <= 0 or sigma <= 0 or v0 <= 0 or abs(rho) >= 1:
        return 1e6
    if 2*kappa*theta <= sigma**2:   # Feller condition
        return 1e6
    error = 0.0
    for T, K, mkt_vol in market_data:
        try:
            px    = heston_call_price(S, K, T, r, kappa, theta, sigma, rho, v0)
            model_vol = bs_implied_vol(px, S, K, r, T)
            if np.isnan(model_vol):
                return 1e6
            error += (model_vol - mkt_vol) ** 2
        except Exception:
            return 1e6
    return error

x0 = [2.0, 0.04, 0.40, -0.70, 0.04]
res = minimize(calibration_error, x0, method='Nelder-Mead',
               options={'maxiter': 2000, 'xatol': 1e-5, 'fatol': 1e-8})
kappa, theta, sigma, rho, v0 = res.x
print(f"Calibrated: kappa={kappa:.3f} theta={theta:.4f} "
      f"sigma={sigma:.3f} rho={rho:.3f} v0={v0:.4f}")
print(f"Calibration RMSE: {np.sqrt(res.fun / len(market_data))*100:.3f}%")
`,
    explanation:
      "Heston calibration fits five parameters (mean reversion speed, long-run variance, vol-of-vol, correlation, initial variance) to match market implied vols across strikes and tenors simultaneously. Nelder-Mead is used in practice for its derivative-free robustness to the non-smooth RMSE surface; the Feller condition (2κθ > σ²) ensures variance stays positive. Real calibration uses Carr-Madan FFT for speed and adds regularization to prevent overfitting.",
  },

  {
    id: "pyfin-20260530-b1-nelson-siegel-fit",
    language: "python",
    title: "Nelson-Siegel term structure fitting to Treasury yields",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import curve_fit, minimize
import pandas as pd

def nelson_siegel(t: np.ndarray, beta0: float, beta1: float,
                  beta2: float, lam: float) -> np.ndarray:
    """
    Nelson-Siegel yield curve:
      y(t) = beta0 + beta1*(1 - e^{-t/lam})/(t/lam)
           + beta2*[(1 - e^{-t/lam})/(t/lam) - e^{-t/lam}]
    beta0: long-run level; beta1: slope (short minus long);
    beta2: curvature (hump); lam: decay factor.
    """
    x = t / lam
    load1 = (1.0 - np.exp(-x)) / x
    load2 = load1 - np.exp(-x)
    return beta0 + beta1 * load1 + beta2 * load2

def fit_nelson_siegel(maturities: np.ndarray, yields: np.ndarray,
                      lam_grid: np.ndarray | None = None) -> dict:
    """
    Two-step: grid search over lambda (non-linear), then OLS for betas (linear).
    This avoids local minima in full nonlinear fit.
    """
    if lam_grid is None:
        lam_grid = np.arange(0.5, 5.0, 0.1)

    best_sse, best_lam, best_params = np.inf, None, None

    for lam in lam_grid:
        x = maturities / lam
        x = np.where(x < 1e-8, 1e-8, x)
        load1 = (1.0 - np.exp(-x)) / x
        load2 = load1 - np.exp(-x)
        # OLS: [1, load1, load2] @ [beta0, beta1, beta2] = yields
        X = np.column_stack([np.ones_like(maturities), load1, load2])
        try:
            betas, _, _, _ = np.linalg.lstsq(X, yields, rcond=None)
        except np.linalg.LinAlgError:
            continue
        fitted = X @ betas
        sse = np.sum((fitted - yields) ** 2)
        if sse < best_sse:
            best_sse = sse
            best_lam = lam
            best_params = betas

    beta0, beta1, beta2 = best_params
    fitted_yields = nelson_siegel(maturities, beta0, beta1, beta2, best_lam)
    rmse = np.sqrt(np.mean((fitted_yields - yields)**2)) * 1e4  # bps

    return {'beta0': beta0, 'beta1': beta1, 'beta2': beta2, 'lam': best_lam,
            'rmse_bps': rmse, 'fitted': fitted_yields}

# US Treasury curve (approximate 2024)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([5.27, 5.25, 5.02, 4.60, 4.38, 4.20, 4.18, 4.22, 4.50, 4.35]) / 100

result = fit_nelson_siegel(maturities, yields)
print(f"beta0(level)={result['beta0']*100:.3f}%  "
      f"beta1(slope)={result['beta1']*100:.3f}%  "
      f"beta2(curv)={result['beta2']*100:.3f}%  "
      f"lam={result['lam']:.2f}")
print(f"RMSE: {result['rmse_bps']:.2f} bps")
print("\\nFitted vs Actual:")
for t, y_mkt, y_fit in zip(maturities, yields, result['fitted']):
    print(f"  {t:5.2f}Y: mkt={y_mkt*100:.3f}%  fit={y_fit*100:.3f}%")
`,
    explanation:
      "The Nelson-Siegel model is the most widely used parametric term structure model in central banking and fixed-income portfolio management because its three factors (level, slope, curvature) have intuitive economic interpretations — level is the long-run equilibrium rate, slope captures the monetary policy stance, and curvature reflects medium-term risk premia. The two-step lambda grid search avoids local minima in the full nonlinear fit while keeping the beta estimation as fast OLS.",
  },
];
