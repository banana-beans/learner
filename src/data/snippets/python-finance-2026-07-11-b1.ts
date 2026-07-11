import { Snippet } from "./types";

export const pythonFinanceSnippets20260711B1: Snippet[] = [
  {
    id: "pyfin-20260711-b1-svensson",
    language: "python",
    title: "Svensson Yield Curve Calibration",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_spot(tau, beta0, beta1, beta2, beta3, lambda1, lambda2):
    """Svensson 4-factor spot rate model."""
    e1 = np.exp(-tau / lambda1)
    e2 = np.exp(-tau / lambda2)
    term1 = beta0
    term2 = beta1 * (1 - e1) / (tau / lambda1)
    term3 = beta2 * ((1 - e1) / (tau / lambda1) - e1)
    term4 = beta3 * ((1 - e2) / (tau / lambda2) - e2)
    return term1 + term2 + term3 + term4

def calibrate_svensson(maturities, observed_yields):
    """Fit Svensson params to observed yield curve."""
    def obj(params):
        b0, b1, b2, b3, l1, l2 = params
        fitted = svensson_spot(maturities, b0, b1, b2, b3, l1, l2)
        return np.sum((fitted - observed_yields) ** 2)

    x0 = [0.04, -0.02, 0.01, 0.01, 1.5, 5.0]
    bounds = [
        (0, 0.2), (-0.2, 0.2), (-0.5, 0.5), (-0.5, 0.5),
        (0.1, 30), (0.1, 30)
    ]
    res = minimize(obj, x0, bounds=bounds, method='L-BFGS-B')
    return res.x

# Example usage
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.052, 0.051, 0.049, 0.046, 0.044, 0.042, 0.041, 0.040, 0.039, 0.038])
params = calibrate_svensson(maturities, yields)
beta0, beta1, beta2, beta3, lambda1, lambda2 = params
print(f"Long-run rate (beta0): {beta0:.4f}")

# Interpolate to any maturity
tau_interp = np.linspace(0.25, 30, 300)
curve      = svensson_spot(tau_interp, *params)`,
    explanation:
      "The Svensson (1994) extension of Nelson-Siegel adds a fourth term with an independent decay parameter λ2, giving two humps for greater flexibility in fitting complex curves. It is the standard at many central banks (Fed, ECB, Bundesbank). The four betas control long-run level, slope, and two curvature terms. L-BFGS-B handles the bounded optimisation efficiently.",
  },
  {
    id: "pyfin-20260711-b1-cir-bond",
    language: "python",
    title: "CIR Model: Closed-Form Bond Prices",
    tag: "fixed-income",
    code: `import numpy as np

def cir_bond_price(r0, kappa, theta, sigma, T):
    """
    Closed-form zero-coupon bond price under CIR model:
    P(0,T) = A(T) * exp(-B(T)*r0)
    """
    gamma = np.sqrt(kappa**2 + 2*sigma**2)
    e_gT  = np.exp(gamma * T)

    denom_B = (gamma + kappa) * (e_gT - 1) + 2 * gamma
    B = 2 * (e_gT - 1) / denom_B

    numer_A = 2 * gamma * np.exp(0.5 * (kappa + gamma) * T)
    A = (numer_A / denom_B) ** (2 * kappa * theta / sigma**2)

    return A * np.exp(-B * r0)

def cir_yield(r0, kappa, theta, sigma, T):
    """Continuously compounded yield."""
    P = cir_bond_price(r0, kappa, theta, sigma, T)
    return -np.log(P) / T

# Example: CIR yield curve
kappa, theta, sigma, r0 = 0.5, 0.04, 0.12, 0.02
maturities = np.linspace(0.25, 30, 100)
yields     = cir_yield(r0, kappa, theta, sigma, maturities)

import matplotlib.pyplot as plt
plt.plot(maturities, yields * 100)
plt.xlabel("Maturity (yrs)"); plt.ylabel("Yield (%)")
plt.title("CIR Yield Curve")
plt.show()

# Calibrate to market using RMSE minimisation (scipy.optimize.minimize)
def cir_rmse(params, mkt_mats, mkt_yields):
    k, th, sig = params
    if k <= 0 or th <= 0 or sig <= 0 or 2*k*th < sig**2:
        return 1e10  # Feller condition
    fitted = cir_yield(r0, k, th, sig, mkt_mats)
    return np.sqrt(np.mean((fitted - mkt_yields)**2))`,
    explanation:
      "The CIR model has the closed form P(0,T) = A(T)·exp(−B(T)·r₀) where A and B depend on κ, θ, σ via Riccati equations. The Feller condition 2κθ ≥ σ² ensures rates stay positive. The yield curve shape (normal, inverted, humped) depends on whether r₀ is above or below θ. CIR is widely used for short-rate trees and interest-rate derivative pricing.",
  },
  {
    id: "pyfin-20260711-b1-hw-caplet",
    language: "python",
    title: "Hull-White Caplet via Bond Option Formula",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.stats import norm

def hw_caplet(r0, kappa, theta, sigma, T_fix, T_pay, K_rate, delta, N=1e6):
    """
    Hull-White (one-factor) caplet price using the bond-option analytic formula.
    A caplet is equivalent to a put on a bond.
    """
    # HW bond variance term
    def B(t, T):
        return (1 - np.exp(-kappa * (T - t))) / kappa

    def P(t, T):
        # Simplified: flat initial curve at r0 (replace with market discount factors)
        f = r0  # instantaneous forward approximation
        bval = B(t, T)
        integral_theta = theta * ((T - t) - bval)
        var_term = sigma**2 / (2*kappa) * (bval**2)
        return np.exp(-f*(T-t) + integral_theta * 0 - var_term * 0)  # rough approx

    P0_fix = np.exp(-r0 * T_fix)
    P0_pay = np.exp(-r0 * T_pay)

    sigma_p = sigma * B(T_fix, T_pay) * np.sqrt(
        (1 - np.exp(-2*kappa*T_fix)) / (2*kappa))

    K_bond = 1.0 / (1.0 + K_rate * delta)
    X = K_bond  # strike on bond

    d1 = np.log(P0_pay / (P0_fix * X)) / sigma_p + 0.5 * sigma_p
    d2 = d1 - sigma_p

    # Bond put price = caplet price
    caplet = N * (X * P0_fix * norm.cdf(-d2) - P0_pay * norm.cdf(-d1))
    return caplet

result = hw_caplet(r0=0.04, kappa=0.1, theta=0.05, sigma=0.01,
                   T_fix=1.0, T_pay=1.25, K_rate=0.045, delta=0.25)
print(f"HW Caplet price: {result:.4f}")`,
    explanation:
      "Under Hull-White, bond prices are lognormal: P(t,T) = A(t,T)·exp(−B(t,T)·r). A caplet paying (L−K)⁺·δ at T_pay is equivalent to (1/K_bond) put options on the bond P(T_fix, T_pay), with bond strike K_bond = 1/(1+Kδ). This analytic formula is fast and widely used for cap/floor calibration. The vol term σ_P captures integrated rate uncertainty over the fixing horizon.",
  },
  {
    id: "pyfin-20260711-b1-fra-valuation",
    language: "python",
    title: "Forward Rate Agreement (FRA) Valuation",
    tag: "fixed-income",
    code: `import numpy as np

def bootstrap_df(maturities, par_rates):
    """Bootstrap discount factors from par swap rates (simplified annual)."""
    dfs = {}
    for i, (T, s) in enumerate(zip(maturities, par_rates)):
        numerator = 1.0 - s * sum(dfs.get(maturities[j], 1) for j in range(i))
        dfs[T] = numerator / (1 + s)
    return dfs

def fra_value(notional, fra_rate, T1, T2, df1, df2):
    """
    Value of a FRA to the fixed-rate receiver.
    FRA fixing at T1, settlement at T2.
    Pays: (F - fra_rate) * delta * N  at T2
    where F = forward rate implied by discount factors.
    """
    delta   = T2 - T1                      # accrual fraction
    F       = (df1 / df2 - 1.0) / delta    # implied forward rate
    pv      = notional * (F - fra_rate) * delta * df2
    return pv, F

# Example: 3x6 FRA (fixing in 3M, maturing in 6M)
df3m = np.exp(-0.048 * 0.25)   # 4.8% 3M rate
df6m = np.exp(-0.046 * 0.50)   # 4.6% 6M rate

pv, fwd = fra_value(
    notional=10_000_000, fra_rate=0.052,
    T1=0.25, T2=0.50,
    df1=df3m, df2=df6m
)
print(f"Forward rate (3x6): {fwd*100:.4f}%")
print(f"FRA PV (receive fixed at 5.2%): USD {pv:,.2f}")`,
    explanation:
      "An FRA locks in a borrowing/lending rate for a future period. At maturity the settlement is the discounted difference between market rate and contracted rate: (F−K)δN·df(T2). The forward rate F = (df1/df2 − 1)/δ is implied by the discount curve. FRAs are the building blocks for LIBOR/SOFR swap pricing and curve construction. Post-LIBOR, most reference SOFR term rates.",
  },
  {
    id: "pyfin-20260711-b1-xccy-swap",
    language: "python",
    title: "Cross-Currency Basis Swap Valuation",
    tag: "fixed-income",
    code: `import numpy as np

def xccy_basis_swap(
    notional_dom, fx_spot,
    dom_discount_factors, for_discount_factors,
    payment_dates, basis_spread_bps):
    """
    Value a cross-currency basis swap:
    - Party A pays 3M SOFR flat on USD notional
    - Party B pays 3M EURIBOR + basis on EUR notional
    Both legs exchange notionals at start and end.
    Basis spread compensates for FX and credit differentials.
    """
    notional_for = notional_dom / fx_spot
    basis        = basis_spread_bps / 10000.0

    # USD leg: floating SOFR (pay)
    usd_pv = 0.0
    dom_df_prev = dom_discount_factors[0]
    for t, df in zip(payment_dates, dom_discount_factors[1:]):
        delta  = payment_dates[1] - payment_dates[0]  # simplified uniform
        sofr   = (dom_df_prev / df - 1) / delta
        usd_pv += sofr * delta * notional_dom * df
        dom_df_prev = df
    usd_pv += notional_dom * dom_discount_factors[-1]  # final notional

    # EUR leg: floating EURIBOR + basis (receive)
    eur_pv = 0.0
    for_df_prev = for_discount_factors[0]
    for t, df in zip(payment_dates, for_discount_factors[1:]):
        delta     = payment_dates[1] - payment_dates[0]
        euribor   = (for_df_prev / df - 1) / delta
        eur_pv   += (euribor + basis) * delta * notional_for * df
        for_df_prev = df
    eur_pv += notional_for * for_discount_factors[-1]

    # Convert EUR PV to USD at spot
    net_pv = eur_pv * fx_spot - usd_pv
    return net_pv

print("XCCY swap PV: needs bootstrapped OIS discount curves as input")`,
    explanation:
      "Cross-currency basis swaps exchange floating-rate cash flows in two currencies plus notional at both ends. The basis spread reflects the cost of obtaining one currency via the FX swap market vs directly, driven by demand imbalances and credit constraints. Post-GFC, USD basis (how much below SOFR counterparties pay for USD via EUR/USD swaps) has been persistently negative, a major FX market anomaly.",
  },
  {
    id: "pyfin-20260711-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss Optimal Liquidation Trajectory",
    tag: "portfolio",
    code: `import numpy as np
import matplotlib.pyplot as plt

def almgren_chriss_trajectory(X0, T, N, eta, gamma, sigma, lam):
    """
    Optimal liquidation of X0 shares over T days in N steps.
    eta: temporary market impact (linear)
    gamma: permanent market impact
    sigma: daily vol
    lam: risk-aversion parameter
    Returns: (times, holdings, trades)
    """
    dt  = T / N
    # κ = sqrt(lam*sigma^2 / eta) — urgency parameter
    kap = np.sqrt(lam * sigma**2 / eta)

    t   = np.linspace(0, T, N + 1)
    # Optimal trajectory: sinh-based closed form
    x   = X0 * np.sinh(kap * (T - t)) / np.sinh(kap * T)

    trades = np.diff(x)  # negative = sells
    return t, x, trades

def cost_analysis(t, x, trades, eta, gamma, sigma, lam):
    dt = t[1] - t[0]
    price = 100.0
    perm_impact = gamma * np.cumsum(np.abs(trades))
    temp_impact = eta * np.abs(trades) / dt
    # Expected total cost
    exp_cost = np.sum(temp_impact * np.abs(trades))
    # Variance of remaining shares × vol
    exp_var   = sigma**2 * np.sum(x[:-1]**2 * dt)
    return exp_cost, exp_var

# Example: liquidate 1M shares over 5 days, 250 steps
t, x, trades = almgren_chriss_trajectory(
    X0=1e6, T=5, N=250,
    eta=0.01, gamma=0.001, sigma=0.02, lam=1e-6
)
print(f"Initial: {x[0]:.0f}, Final: {x[-1]:.2f}")
print(f"Max daily trade: {min(trades)/1e3:.1f}k shares")`,
    explanation:
      "Almgren-Chriss (2001) frames liquidation as a mean-variance optimisation over time: minimize expected market impact cost + λ × variance of execution shortfall. The closed-form optimal trajectory is hyperbolic: faster trading is optimal when risk-aversion λ is high (sell more early). The urgency parameter κ = sqrt(λσ²/η) captures the tradeoff between impact and risk. Used for VWAP scheduling, block trade execution, and algo order slicing.",
  },
  {
    id: "pyfin-20260711-b1-hist-var-bootstrap",
    language: "python",
    title: "Historical VaR with Bootstrap Confidence Intervals",
    tag: "risk",
    code: `import numpy as np

def historical_var(returns, confidence=0.99, horizon=1):
    """
    Historical simulation VaR with bootstrap CI.
    returns: daily P&L or return series (array)
    confidence: e.g. 0.99 for 99% VaR
    horizon: scaling factor (sqrt rule)
    """
    scaled = returns * np.sqrt(horizon)
    var = -np.percentile(scaled, (1 - confidence) * 100)
    return var

def bootstrap_var_ci(returns, confidence=0.99, n_boot=5000, ci=0.95, seed=42):
    """
    Bootstrap 95% CI around VaR estimate.
    """
    rng     = np.random.default_rng(seed)
    n       = len(returns)
    boot_vars = np.empty(n_boot)
    for i in range(n_boot):
        sample = rng.choice(returns, size=n, replace=True)
        boot_vars[i] = historical_var(sample, confidence)
    lower = np.percentile(boot_vars, (1 - ci) * 50)
    upper = np.percentile(boot_vars, 100 - (1 - ci) * 50)
    return boot_vars.mean(), lower, upper

# Example
rng = np.random.default_rng(42)
rets = rng.normal(loc=0.0005, scale=0.015, size=1000)   # synthetic daily returns

var99 = historical_var(rets, confidence=0.99)
est, lo, hi = bootstrap_var_ci(rets)
print(f"1-day 99% VaR: {var99*100:.3f}%")
print(f"Bootstrap CI: [{lo*100:.3f}%, {hi*100:.3f}%]")`,
    explanation:
      "Historical simulation VaR uses the empirical distribution of past returns, avoiding distributional assumptions. The 99th percentile of losses is the VaR estimate. Bootstrap resampling quantifies estimation uncertainty: each bootstrap draw is a resample with replacement, giving an empirical distribution of VaR estimates. The 95% CI width is a direct measure of data quality — short histories produce wide CIs. Basel III requires VaR back-testing over at least 250 days.",
  },
  {
    id: "pyfin-20260711-b1-credit-migration",
    language: "python",
    title: "Credit Rating Migration Markov Chain",
    tag: "risk",
    code: `import numpy as np
from scipy.linalg import expm

# Annual migration matrix (Moody's / S&P style, rows sum to 1)
# States: AAA, AA, A, BBB, BB, B, CCC, Default
Q_annual = np.array([
    [0.9081, 0.0833, 0.0068, 0.0006, 0.0012, 0.0000, 0.0000, 0.0000],
    [0.0070, 0.9065, 0.0779, 0.0064, 0.0006, 0.0014, 0.0002, 0.0000],
    [0.0009, 0.0227, 0.9105, 0.0552, 0.0074, 0.0026, 0.0001, 0.0006],
    [0.0002, 0.0033, 0.0595, 0.8693, 0.0530, 0.0117, 0.0012, 0.0018],
    [0.0003, 0.0014, 0.0067, 0.0773, 0.8053, 0.0884, 0.0100, 0.0106],
    [0.0000, 0.0011, 0.0024, 0.0043, 0.0648, 0.8346, 0.0407, 0.0521],
    [0.0022, 0.0000, 0.0022, 0.0130, 0.0238, 0.1124, 0.6486, 0.1978],
    [0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 1.0000],
])

def multi_year_pd(initial_rating_idx, n_years):
    """Cumulative default probability for a bond starting at rating idx."""
    Qn = np.linalg.matrix_power(Q_annual, n_years)
    return Qn[initial_rating_idx, -1]   # prob of reaching Default state

# Generator matrix approach (continuous-time)
def generator_from_transition(Q):
    """Estimate continuous-time generator G: Q ≈ expm(G)."""
    from scipy.linalg import logm
    G = logm(Q)
    np.fill_diagonal(G, 0)
    G[G < 0] = 0      # fix numerical negatives off-diagonal
    np.fill_diagonal(G, -G.sum(axis=1))
    return G

for i, rating in enumerate(['AAA','AA','A','BBB','BB','B','CCC']):
    pd5 = multi_year_pd(i, 5)
    print(f"{rating} 5-year cumulative PD: {pd5*100:.3f}%")`,
    explanation:
      "Credit migration matrices model the probability of a borrower moving between rating categories over a fixed period. Multiplying the matrix n times gives n-year migration probabilities. The continuous-time extension uses a generator matrix G where Q = expm(G·t), allowing interpolation to arbitrary horizons. Used in CVA calculation, credit portfolio models, and Basel IRB capital requirements. The Default state is absorbing (probability 1 once entered).",
  },
  {
    id: "pyfin-20260711-b1-cva-irs",
    language: "python",
    title: "CVA Calculation for Interest Rate Swap",
    tag: "risk",
    code: `import numpy as np

def irs_expected_exposure(fixed_rate, tenor_years, notional,
                           n_paths=10000, n_steps=None, sigma=0.01, r0=0.04):
    """
    Monte Carlo expected exposure profile for a pay-fixed IRS.
    Simplified: models future swap MtM using flat-curve approximation.
    """
    if n_steps is None:
        n_steps = tenor_years * 4   # quarterly

    rng   = np.random.default_rng(42)
    dt    = tenor_years / n_steps
    sqdt  = np.sqrt(dt)
    times = np.linspace(0, tenor_years, n_steps + 1)

    # GBM for forward rates (simplified)
    r = r0 * np.ones(n_paths)
    ee = np.zeros(n_steps + 1)  # expected exposure at each node

    for step in range(1, n_steps + 1):
        r += -0.1 * (r - r0) * dt + sigma * sqdt * rng.standard_normal(n_paths)
        tau = tenor_years - times[step]
        if tau <= 0:
            break
        # Remaining swap PV: (fwd_rate - fixed) × annuity (approx)
        annuity  = (1 - np.exp(-r * tau)) / r
        mtm      = notional * (r - fixed_rate) * annuity
        ee[step] = np.mean(np.maximum(mtm, 0))

    return times, ee

def cva(ee_profile, times, hazard_rate, lgd=0.6):
    """CVA = LGD * integral[EE(t) * PD(t) * df(t) dt]."""
    r0  = 0.04
    dts = np.diff(times)
    cvs = []
    for i in range(len(dts)):
        pd_slice = hazard_rate * np.exp(-hazard_rate * times[i]) * dts[i]
        df_slice = np.exp(-r0 * times[i])
        cvs.append(lgd * ee_profile[i] * pd_slice * df_slice)
    return sum(cvs)

times, ee = irs_expected_exposure(fixed_rate=0.04, tenor_years=5, notional=1e6)
cva_val   = cva(ee, times, hazard_rate=0.01)
print(f"CVA estimate: USD {cva_val:,.2f}")`,
    explanation:
      "Credit Valuation Adjustment (CVA) is the market-price reduction to an uncollateralised OTC derivative due to counterparty default risk. CVA = LGD × ∫ EE(t) × PD(t) × df(t) dt, where EE is the expected exposure (average positive MtM), PD is the marginal default probability at t, and df is the risk-free discount factor. Monte Carlo simulates future rates to compute EE. Under IFRS 13, CVA must be included in fair value of all bilateral derivatives.",
  },
  {
    id: "pyfin-20260711-b1-vol-arb-check",
    language: "python",
    title: "Implied Vol Surface Arbitrage Checks",
    tag: "derivatives",
    code: `import numpy as np

def check_calendar_spread(iv_near, iv_far, T_near, T_far):
    """
    Calendar spread no-arb: total implied variance must be non-decreasing.
    w(k, T) = sigma^2 * T must be non-decreasing in T for each strike k.
    """
    w_near = iv_near**2 * T_near
    w_far  = iv_far**2  * T_far
    violations = np.where(w_far < w_near)[0]
    return len(violations) == 0, violations

def check_butterfly(iv_left, iv_atm, iv_right, k_left, k_atm, k_right, T):
    """
    Butterfly no-arb: call prices must be convex in strike.
    C(K-delta) - 2*C(K) + C(K+delta) >= 0  (discrete convexity)
    Equivalently: g(k) = d^2w/dk^2 - ... >= 0 (Lee, 2004 SVI condition)
    """
    from scipy.stats import norm
    def bs_call(S, K, r, sig, t, S0=100, r0=0.0):
        sqt = np.sqrt(t)
        d1  = (np.log(S0 / K) + (r0 + 0.5*sig**2)*t) / (sig * sqt)
        d2  = d1 - sig * sqt
        return S0 * norm.cdf(d1) - K * np.exp(-r0*t) * norm.cdf(d2)

    c_l = bs_call(100, k_left,  0, iv_left,  T)
    c_m = bs_call(100, k_atm,   0, iv_atm,   T)
    c_r = bs_call(100, k_right, 0, iv_right, T)
    return (c_l - 2*c_m + c_r) >= -1e-6  # True if convex

# Example surface check
strikes   = np.array([80, 90, 100, 110, 120])
iv_1m     = np.array([0.25, 0.22, 0.20, 0.21, 0.24])
iv_3m     = np.array([0.24, 0.21, 0.195, 0.20, 0.22])

ok, viol = check_calendar_spread(iv_1m, iv_3m, T_near=1/12, T_far=3/12)
print(f"Calendar spread OK: {ok}, violations at strike idx: {viol}")

for i in range(1, len(strikes) - 1):
    ok = check_butterfly(iv_1m[i-1], iv_1m[i], iv_1m[i+1],
                          strikes[i-1], strikes[i], strikes[i+1], T=1/12)
    print(f"Butterfly at K={strikes[i]}: {'OK' if ok else 'VIOLATED'}")`,
    explanation:
      "Implied vol surfaces must satisfy no-arbitrage conditions: (1) total variance w(T)=σ²T must be non-decreasing in T (calendar spread — otherwise sell the cheap calendar and receive premium). (2) Call prices must be convex in K (butterfly arbitrage — otherwise buy the butterfly, which has non-negative payoff, for negative cost). A vol surface that violates these can produce negative probabilities in the implied risk-neutral density.",
  },
  {
    id: "pyfin-20260711-b1-repo-carry",
    language: "python",
    title: "Repo Rate, Financing Cost & Bond Carry",
    tag: "fixed-income",
    code: `import numpy as np

def bond_carry(
    clean_price,     # current market clean price
    coupon_rate,     # annual coupon (e.g. 0.04)
    face_value,      # par
    coupon_freq,     # payments per year (2 = semi-annual)
    repo_rate,       # overnight/term repo rate (annualised)
    hold_days,       # holding period in days
    settlement_days=2
):
    """
    Carry = income - funding cost
    Income: coupon accrual during hold period
    Funding: repo interest on dirty price × hold_days/360
    """
    accrual_per_day = face_value * coupon_rate / 360.0
    coupon_income   = accrual_per_day * hold_days

    # Dirty price ≈ clean + accrued (simplified)
    accrued_at_buy  = accrual_per_day * settlement_days
    dirty_price     = clean_price + accrued_at_buy

    financing_cost  = dirty_price * repo_rate * hold_days / 360.0

    carry           = coupon_income - financing_cost
    carry_bps       = carry / dirty_price * 10000 * (360 / hold_days)  # annualised bps
    return carry, carry_bps

def breakeven_repo(clean_price, ytm, coupon_rate, face_value, hold_days):
    """Repo rate at which carry is zero (breakeven)."""
    # Carry ≈ 0 when coupon ≥ financing: breakeven_repo ≈ coupon / dirty_price
    accrued    = face_value * coupon_rate / 360 * 2
    dirty      = clean_price + accrued
    return face_value * coupon_rate / dirty  # approximate

carry, carry_bps = bond_carry(
    clean_price=99.5, coupon_rate=0.04, face_value=100,
    coupon_freq=2, repo_rate=0.052, hold_days=30
)
print(f"30-day carry: {carry:.4f} pts | Annualised: {carry_bps:.1f} bps")`,
    explanation:
      "Bond carry is the net return from holding a bond financed via repo: coupon accrual minus repo financing cost. When yields exceed repo rates (normal curve), carry is positive. Carry trades dominate when the yield curve is steep. Negative carry occurs when repo (funding cost) exceeds coupon income — common in inverted curves. Breakeven repo is the rate at which carry equals zero, a key metric for bond relative-value strategies.",
  },
  {
    id: "pyfin-20260711-b1-bond-futures",
    language: "python",
    title: "Bond Futures CTD & Conversion Factor",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def conversion_factor(coupon, maturity_years, futures_coupon=0.06, freq=2):
    """
    CME-style conversion factor: PV of bond at 6% yield per $1 face.
    """
    n    = int(maturity_years * freq)
    c    = coupon / freq
    y    = futures_coupon / freq
    pv   = sum(c / (1+y)**t for t in range(1, n+1))
    pv  += 1.0 / (1+y)**n
    return round(pv, 4)

def invoice_price(futures_price, cf, accrued):
    """Price paid by futures buyer for bond delivery."""
    return futures_price * cf + accrued

def ctd_bond(bonds, futures_price):
    """
    Cheapest-to-deliver: bond with highest basis (market_price - invoice_price)
    is most expensive to deliver; lowest gross basis is CTD.
    bonds: list of dicts with keys: price, coupon, maturity, accrued
    """
    results = []
    for b in bonds:
        cf      = conversion_factor(b['coupon'], b['maturity'])
        invoice = invoice_price(futures_price, cf, b['accrued'])
        basis   = b['price'] - invoice   # gross basis (cost to deliver)
        results.append({**b, 'cf': cf, 'invoice': invoice, 'basis': basis})
    results.sort(key=lambda x: x['basis'])
    return results   # first element is CTD (cheapest basis)

bonds = [
    {'price': 102.5, 'coupon': 0.04, 'maturity': 9.5, 'accrued': 0.8},
    {'price': 98.0,  'coupon': 0.025,'maturity': 7.2, 'accrued': 0.5},
    {'price': 105.0, 'coupon': 0.05, 'maturity': 10.1,'accrued': 1.0},
]
results = ctd_bond(bonds, futures_price=100.0)
print("CTD bond:", results[0])`,
    explanation:
      "Bond futures allow delivery of any bond from a deliverable basket. The conversion factor normalises each bond to a notional 6% coupon bond. The cheapest-to-deliver (CTD) is the bond with the lowest basis (market price minus futures invoice price), as the short side always delivers the cheapest option. CTD shifts as yields move: at high yields, long-duration bonds are CTD; at low yields, short-duration bonds become CTD.",
  },
  {
    id: "pyfin-20260711-b1-vanna-volga",
    language: "python",
    title: "Vanna-Volga FX Option Smile Pricing",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, rd, sigma, T):
    F   = S * np.exp((r - rd) * T)
    sqT = np.sqrt(T)
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return np.exp(-rd*T) * (F*norm.cdf(d1) - K*norm.cdf(d2))

def bs_vega(S, K, r, rd, sigma, T):
    F   = S * np.exp((r - rd) * T)
    sqT = np.sqrt(T)
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
    return S * np.exp(-rd*T) * norm.pdf(d1) * sqT

def bs_vanna(S, K, r, rd, sigma, T):
    sqT = np.sqrt(T)
    F   = S * np.exp((r - rd) * T)
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return -np.exp(-rd*T) * norm.pdf(d1) * d2 / sigma

def bs_volga(S, K, r, rd, sigma, T):
    sqT = np.sqrt(T)
    F   = S * np.exp((r - rd) * T)
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return bs_vega(S, K, r, rd, sigma, T) * d1 * d2 / sigma

def vanna_volga(S, K, r, rd, T,
                K_rr, K_atm, K_bf,       # pillar strikes
                sig_rr, sig_atm, sig_bf): # market vols at pillars
    """VV price: BS(sigma_mkt(K)) + hedging cost of vanna/volga residual."""
    # Solve for mixed vol (simplified: linearly interpolate for demo)
    sigma_k = np.interp(K, [K_rr, K_atm, K_bf], [sig_rr, sig_atm, sig_bf])
    price_bs  = bs_call(S, K, r, rd, sigma_k, T)
    # VV correction accounts for smile P&L from vanna/volga hedges
    # Full implementation solves a 3x3 system for hedge ratios
    return price_bs

price = vanna_volga(S=1.10, K=1.12, r=0.04, rd=0.02, T=0.25,
                    K_rr=1.08, K_atm=1.10, K_bf=1.13,
                    sig_rr=0.08, sig_atm=0.075, sig_bf=0.09)
print(f"VV price: {price:.6f}")`,
    explanation:
      "Vanna-Volga pricing corrects Black-Scholes by adding the cost of hedging the vanna (d²V/dSdσ) and volga (d²V/dσ²) of a target option using three market instruments (25Δ risk reversal, ATM straddle, 25Δ butterfly). It is the standard method for exotic FX option pricing in interbank markets, particularly for first-generation exotics. The correction decomposes into weighted market vanna/volga costs, avoiding full stochastic-vol calibration.",
  },
  {
    id: "pyfin-20260711-b1-mv-kelly",
    language: "python",
    title: "Multi-Asset Continuous-Time Kelly Criterion",
    tag: "portfolio",
    code: `import numpy as np

def kelly_weights(mu, Sigma, rf=0.0):
    """
    Continuous-time multi-asset Kelly: f* = Sigma^{-1} (mu - rf*1)
    Maximises expected log wealth: E[log W_T]
    Returns: (full Kelly fractions, half-Kelly fractions)
    """
    excess = mu - rf
    Sigma_inv = np.linalg.inv(Sigma)
    f_full  = Sigma_inv @ excess
    f_half  = f_full / 2.0
    return f_full, f_half

def kelly_growth_rate(f, mu, Sigma, rf=0.0):
    """Expected log-growth rate: rf + f'(mu-rf) - 0.5*f'*Sigma*f"""
    excess = mu - rf
    return rf + f @ excess - 0.5 * f @ Sigma @ f

# Example: 3-asset portfolio
mu    = np.array([0.12, 0.08, 0.10])        # expected returns
sigma = np.array([0.20, 0.15, 0.18])        # annual vols
rho   = np.array([[1.0, 0.3, 0.4],
                   [0.3, 1.0, 0.2],
                   [0.4, 0.2, 1.0]])
Sigma = np.diag(sigma) @ rho @ np.diag(sigma)

f_full, f_half = kelly_weights(mu, Sigma, rf=0.04)
g_full  = kelly_growth_rate(f_full, mu, Sigma, rf=0.04)
g_half  = kelly_growth_rate(f_half, mu, Sigma, rf=0.04)

print("Full Kelly weights:", np.round(f_full, 3))
print(f"Full Kelly growth rate: {g_full:.4f}")
print(f"Half Kelly growth rate: {g_half:.4f}")

# Kelly uses unlevered Sharpe²/2 as growth rate; SR² / 2 > benchmark`,
    explanation:
      "The continuous-time multi-asset Kelly criterion solves f* = Σ⁻¹(μ−r) as the leverage vector that maximises expected log growth. Full Kelly maximises growth but produces extreme drawdowns; half Kelly sacrifices ~25% of growth for significantly lower volatility. The growth rate is rf + f'(μ−rf) − ½f'Σf — the quadratic penalty represents vol drag. Inputs must be forward-looking; using historical moments directly is notoriously error-prone.",
  },
  {
    id: "pyfin-20260711-b1-realized-vol",
    language: "python",
    title: "Realised Vol Estimators: CC, Parkinson, GK, RS",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def close_close_vol(closes, annualise=252):
    """Classic close-to-close log-return volatility."""
    rets = np.log(closes[1:] / closes[:-1])
    return rets.std() * np.sqrt(annualise)

def parkinson_vol(highs, lows, annualise=252):
    """Parkinson (1980): uses high-low range — 5x more efficient than CC."""
    f = 1.0 / (4 * np.log(2))
    terms = (np.log(highs / lows)) ** 2
    return np.sqrt(f * terms.mean() * annualise)

def garman_klass_vol(opens, highs, lows, closes, annualise=252):
    """Garman-Klass (1980): OHLC estimator — accounts for overnight gap."""
    u = np.log(highs  / opens)
    d = np.log(lows   / opens)
    c = np.log(closes / opens)
    terms = 0.511*(u-d)**2 - 0.019*(c*(u+d) - 2*u*d) - 0.383*c**2
    return np.sqrt(terms.mean() * annualise)

def rogers_satchell_vol(opens, highs, lows, closes, annualise=252):
    """Rogers-Satchell (1991): drift-independent OHLC estimator."""
    terms = (np.log(highs/closes) * np.log(highs/opens) +
             np.log(lows /closes) * np.log(lows /opens))
    return np.sqrt(terms.mean() * annualise)

# Synthetic OHLC data
rng    = np.random.default_rng(42)
n      = 252
closes = 100 * np.exp(np.cumsum(rng.normal(0, 0.01, n)))
opens  = closes * np.exp(rng.normal(0, 0.002, n))
highs  = np.maximum(opens, closes) * np.exp(np.abs(rng.normal(0, 0.005, n)))
lows   = np.minimum(opens, closes) * np.exp(-np.abs(rng.normal(0, 0.005, n)))

print(f"Close-Close:    {close_close_vol(closes):.4f}")
print(f"Parkinson:      {parkinson_vol(highs, lows):.4f}")
print(f"Garman-Klass:   {garman_klass_vol(opens, highs, lows, closes):.4f}")
print(f"Rogers-Satchell:{rogers_satchell_vol(opens, highs, lows, closes):.4f}")`,
    explanation:
      "Close-to-close vol uses only closing prices (wastes intraday info). Parkinson uses the HL range, gaining 5× efficiency under GBM but assumes zero drift. Garman-Klass uses OHLC and is 7× more efficient. Rogers-Satchell is drift-independent (doesn't assume zero mean), making it more accurate for trending assets. Yang-Zhang (2000) extends to overnight gaps and is the most efficient estimator for daily OHLC data.",
  },
  {
    id: "pyfin-20260711-b1-put-call-synth",
    language: "python",
    title: "Put-Call Parity & Synthetic Positions",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, q, sig, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r-q+0.5*sig**2)*T) / (sig*sqT)
    d2  = d1 - sig*sqT
    return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, q, sig, T):
    return bs_call(S, K, r, q, sig, T) - S*np.exp(-q*T) + K*np.exp(-r*T)

def check_pcp(S, K, r, q, sig, T):
    """Verify: C - P = S*exp(-qT) - K*exp(-rT)."""
    C = bs_call(S, K, r, q, sig, T)
    P = bs_put(S, K, r, q, sig, T)
    lhs = C - P
    rhs = S*np.exp(-q*T) - K*np.exp(-r*T)
    return abs(lhs - rhs) < 1e-10

# Synthetic constructions (all equivalent by PCP)
def synthetic_long_stock(C, P, K, r, T, df):
    """Long call + short put = synthetic forward ≈ long stock."""
    return C - P    # + K*df for exact forward contract

def lower_bound_call(S, K, r, q, T):
    return max(0, S*np.exp(-q*T) - K*np.exp(-r*T))

def upper_bound_call(S, q, T):
    return S*np.exp(-q*T)

S, K, r, q, sig, T = 100, 105, 0.04, 0.01, 0.20, 0.5
C = bs_call(S, K, r, q, sig, T)
P = bs_put(S, K, r, q, sig, T)
print(f"Call: {C:.4f}, Put: {P:.4f}")
print(f"PCP holds: {check_pcp(S, K, r, q, sig, T)}")
print(f"Lower bound C: {lower_bound_call(S, K, r, q, T):.4f}")
print(f"Upper bound C: {upper_bound_call(S, q, T):.4f}")`,
    explanation:
      "Put-call parity C − P = S·e^(−qT) − K·e^(−rT) is a no-arbitrage identity that links European calls, puts, the underlying, and bonds. Violations imply riskless profit; in practice small deviations reflect bid-ask spreads and borrow costs. Synthetic positions: long call + short put = long forward (synthetic stock), short call + long put = short forward. Lower bound ensures C ≥ S·e^(−qT)−K·e^(−rT); upper bound C ≤ S·e^(−qT).",
  },
  {
    id: "pyfin-20260711-b1-event-study",
    language: "python",
    title: "Event Study: Abnormal Returns Around Corporate Events",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

def compute_abnormal_returns(stock_rets, mkt_rets,
                              estimation_window=(-120, -21),
                              event_window=(-5, 5)):
    """
    Market-model event study (OLS estimation, AR in event window).
    stock_rets, mkt_rets: Series indexed by day relative to event (0 = event date)
    """
    # Estimation period
    est_mask  = (stock_rets.index >= estimation_window[0]) & \
                (stock_rets.index <= estimation_window[1])
    r_est_s   = stock_rets[est_mask].values
    r_est_m   = mkt_rets[est_mask].values

    # OLS: r_s = alpha + beta*r_m + eps
    X    = np.column_stack([np.ones_like(r_est_m), r_est_m])
    beta = np.linalg.lstsq(X, r_est_s, rcond=None)[0]
    alpha, b = beta

    # Event window
    evt_mask = (stock_rets.index >= event_window[0]) & \
               (stock_rets.index <= event_window[1])
    r_evt_s  = stock_rets[evt_mask].values
    r_evt_m  = mkt_rets[evt_mask].values

    # Abnormal returns
    expected = alpha + b * r_evt_m
    AR       = r_evt_s - expected
    CAR      = np.cumsum(AR)    # Cumulative abnormal returns

    # t-statistic (simple)
    sigma_eps = np.std(r_est_s - (alpha + b * r_est_m))
    t_stats   = AR / sigma_eps
    return AR, CAR, t_stats

# Synthetic event: positive surprise on day 0
rng      = np.random.default_rng(42)
days     = np.arange(-120, 21)
mkt_rets = pd.Series(rng.normal(0, 0.01, len(days)), index=days)
stk_rets = pd.Series(1.2 * mkt_rets + rng.normal(0, 0.008, len(days)), index=days)
stk_rets[0] += 0.05   # 5% positive surprise on event date

AR, CAR, t = compute_abnormal_returns(stk_rets, mkt_rets)
print("Day | AR%   | CAR%  | t-stat")
for i, d in enumerate(range(-5, 6)):
    print(f"{d:3d}  | {AR[i]*100:+.2f} | {CAR[i]*100:+.2f} | {t[i]:+.2f}")`,
    explanation:
      "Event study methodology estimates abnormal returns around corporate events (earnings, M&A, dividends). The market model regresses stock returns on market returns in an estimation window well before the event to extract α, β. Abnormal returns (AR) in the event window are the residuals from this model; cumulative AR (CAR) aggregates them. Statistical tests assess whether the event caused abnormal performance. Standard in empirical finance and SEC enforcement.",
  },
  {
    id: "pyfin-20260711-b1-discrete-div-bs",
    language: "python",
    title: "Discrete Dividend Black-Scholes",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_discrete_div(S, K, r, sigma, T, dividends):
    """
    Black-Scholes adjusted for discrete cash dividends.
    dividends: list of (t_i, D_i) tuples (time, amount)
    Approach: subtract PV of dividends from spot to get 'forward price' stock.
    """
    # PV of dividends paid before expiry
    pv_div = sum(D * np.exp(-r * t) for t, D in dividends if t < T)

    # Adjusted spot
    S_adj = S - pv_div

    if S_adj <= 0:
        return 0.0

    sqT = np.sqrt(T)
    d1  = (np.log(S_adj / K) + (r + 0.5*sigma**2) * T) / (sigma * sqT)
    d2  = d1 - sigma * sqT
    return S_adj * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)

def bs_put_discrete_div(S, K, r, sigma, T, dividends):
    C = bs_call_discrete_div(S, K, r, sigma, T, dividends)
    pv_div = sum(D * np.exp(-r*t) for t, D in dividends if t < T)
    S_adj  = S - pv_div
    return C - S_adj + K * np.exp(-r*T)

# Example: stock paying 2 quarterly dividends before 1-year expiry
dividends = [(0.25, 1.5), (0.5, 1.5)]   # (time in years, cash amount)
S, K, r, sigma, T = 100, 100, 0.04, 0.20, 1.0

call_no_div  = bs_call_discrete_div(S, K, r, sigma, T, [])
call_with_div= bs_call_discrete_div(S, K, r, sigma, T, dividends)
print(f"Call (no div):   {call_no_div:.4f}")
print(f"Call (w/ divs):  {call_with_div:.4f}")
print(f"Dividend effect: {call_with_div - call_no_div:.4f}")`,
    explanation:
      "Discrete cash dividends reduce the stock price at ex-date. The standard adjustment subtracts the PV of future dividends from spot to obtain the 'dividend-stripped' price, then prices the option on this adjusted process. This is exact for European options but underestimates American put values (early exercise before dividend is ignored). For American options, use a binomial tree with dividend jumps at ex-dates.",
  },
  {
    id: "pyfin-20260711-b1-rolling-corr",
    language: "python",
    title: "Rolling Correlation & Breakdown Detection",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

def rolling_correlation(x, y, window=60):
    """Rolling Pearson correlation over a window."""
    df  = pd.DataFrame({'x': x, 'y': y})
    return df['x'].rolling(window).corr(df['y'])

def correlation_breakdown(corr_series, threshold_low=-0.3, threshold_high=0.9):
    """
    Flag periods where correlation deviates significantly from long-run mean.
    Returns Boolean mask of 'breakdown' periods.
    """
    mu    = corr_series.mean()
    sigma = corr_series.std()
    z     = (corr_series - mu) / sigma
    return np.abs(z) > 2.0   # 2-sigma deviation

def regime_correlation(x, y, regime_labels):
    """Compute correlation per regime (bull/bear/crisis)."""
    df = pd.DataFrame({'x': x, 'y': y, 'regime': regime_labels})
    return df.groupby('regime').apply(lambda g: g['x'].corr(g['y']))

# Example: stock vs bond correlation regime analysis
rng       = np.random.default_rng(42)
n         = 1000
mkt_shock = rng.normal(0, 0.01, n)
equity    = mkt_shock + rng.normal(0, 0.008, n)
# Post-crisis: correlation turns negative (flight to quality)
bond_ret  = np.where(np.arange(n) < 700,
                      -0.3 * mkt_shock,    # pre: mild positive
                      -0.7 * mkt_shock) + rng.normal(0, 0.005, n)

roll_corr  = rolling_correlation(equity, bond_ret, window=60)
breakdowns = correlation_breakdown(roll_corr)

print(f"Long-run eq-bond corr: {np.corrcoef(equity, bond_ret)[0,1]:.3f}")
print(f"Breakdown periods: {breakdowns.sum()} days out of {n}")`,
    explanation:
      "Rolling correlation tracks the time-varying relationship between assets. Correlation breakdown detection identifies regimes where the relationship departs significantly from its historical mean — a critical signal for pairs trading, index arb, and risk factor models. The equity-bond correlation is famously regime-dependent: positive in inflationary periods (both sell off), negative in deflationary/crisis periods (flight to quality). DCC-GARCH models this formally.",
  },
  {
    id: "pyfin-20260711-b1-pricing-kernel",
    language: "python",
    title: "Stochastic Discount Factor & Hansen-Jagannathan Bound",
    tag: "portfolio",
    code: `import numpy as np

def hansen_jagannathan_bound(returns, rf):
    """
    HJ bound: E[m] = 1/(1+rf), Std[m]/E[m] >= |SR| for any risky asset.
    Returns: minimum SDF volatility consistent with observed Sharpe ratios.
    """
    excess  = returns - rf
    sharpe  = excess.mean(axis=0) / excess.std(axis=0)
    max_sr  = np.max(np.abs(sharpe))

    E_m     = 1.0 / (1.0 + rf)
    hj_bound = E_m * max_sr   # minimum std(m)
    return E_m, hj_bound, max_sr

def sdf_from_factor_model(betas, factor_returns, rf):
    """
    Linear SDF: m_t = a - b' * f_t
    Identify using GMM: E[m * R_i] = 1 for all assets i
    (Simplified: solve for b given moment conditions)
    """
    # Factor means and covariance
    mu_f   = factor_returns.mean(axis=0)
    Sigma_f = np.cov(factor_returns.T)

    # Risk prices: lambda = Sigma_f^{-1} * mu_f (price of factor risk)
    lambda_ = np.linalg.solve(Sigma_f, mu_f)

    # SDF: m = 1/Rf - lambda' * (f - E[f]) (de-meaned factors)
    sdf = (1/(1+rf)) - (factor_returns - mu_f) @ lambda_
    return sdf, lambda_

# Example: 5 risky assets, 2 factors
rng     = np.random.default_rng(42)
n, k, p = 500, 5, 2
factors  = rng.normal(0, 0.01, (n, p))
betas    = rng.normal(0, 1.0, (k, p))
returns  = 0.004 + factors @ betas.T + rng.normal(0, 0.008, (n, k))

rf = 0.0001  # daily
E_m, hj, max_sr = hansen_jagannathan_bound(returns, rf)
sdf, lam = sdf_from_factor_model(betas, factors, rf)
print(f"Max Sharpe: {max_sr:.3f}, HJ bound on std(m): {hj:.4f}")
print(f"Factor risk prices (annualised): {lam * 252:.3f}")`,
    explanation:
      "The stochastic discount factor (SDF or pricing kernel) m is the random variable satisfying E[m·R_i]=1 for all assets. The Hansen-Jagannathan (1991) bound says Std(m)/E(m) ≥ max Sharpe ratio — any SDF consistent with observed returns must be highly volatile, ruling out early consumption CAPM models. Factor-model SDFs set m = 1/Rf − λ'(f−Ef): the risk prices λ identify how much each factor is priced. Central to modern asset pricing theory.",
  },
];
