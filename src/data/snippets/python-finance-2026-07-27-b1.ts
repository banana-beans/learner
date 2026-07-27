import type { Snippet } from "./types";

export const pythonFinanceSnippets20260727B1: Snippet[] = [
  {
    id: "pyfin-20260727-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel term structure fitting",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(tau, beta0, beta1, beta2, lam):
    """
    Nelson-Siegel (1987) yield curve:
      y(tau) = beta0 + beta1*(1 - e^{-tau/lam})/(tau/lam)
             + beta2*[(1 - e^{-tau/lam})/(tau/lam) - e^{-tau/lam}]
    Interpretation:
      beta0 = long-run level (long end of curve)
      beta1 = slope (short end - long end); negative => upward-sloping
      beta2 = curvature (hump)
      lam   = decay factor (controls where hump peaks)
    """
    x = tau / lam
    factor1 = (1 - np.exp(-x)) / x          # loading on slope
    factor2 = factor1 - np.exp(-x)           # loading on curvature
    return beta0 + beta1 * factor1 + beta2 * factor2

def fit_nelson_siegel(maturities, yields):
    mats = np.asarray(maturities)
    ys   = np.asarray(yields)

    def loss(params):
        b0, b1, b2, lam = params
        if lam <= 0:
            return 1e10
        fitted = nelson_siegel(mats, b0, b1, b2, lam)
        return np.sum((fitted - ys)**2)

    # Initial guess: level~current long rate, slope~(short-long), curvature~0
    x0 = [ys[-1], ys[0] - ys[-1], 0.0, 1.5]
    result = minimize(loss, x0, method='Nelder-Mead',
                      options={'maxiter': 5000, 'xatol': 1e-8})
    b0, b1, b2, lam = result.x
    return b0, b1, b2, lam

# US Treasury par curve (approximate) in %
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields_pct  = np.array([5.25, 5.20, 5.00, 4.70, 4.55, 4.45, 4.50, 4.60, 4.80, 4.75])
yields      = yields_pct / 100

b0, b1, b2, lam = fit_nelson_siegel(maturities, yields)
print(f"beta0={b0:.4f}  beta1={b1:.4f}  beta2={b2:.4f}  lambda={lam:.4f}")

# Interpolate the full curve
fine_mats = np.linspace(0.25, 30, 200)
fitted    = nelson_siegel(fine_mats, b0, b1, b2, lam)
print(f"Spot rate at 15Y: {nelson_siegel(15, b0, b1, b2, lam)*100:.3f}%")`,
    explanation: "Nelson-Siegel is the standard parsimonious yield curve model used by central banks: its three orthogonal components (level, slope, curvature) capture > 99% of the variation in observed yield curves, and the fitted parameters are directly interpretable as carry, roll, and butterfly risk factors in a fixed-income portfolio.",
  },
  {
    id: "pyfin-20260727-b1-cds-hazard",
    language: "python",
    title: "CDS spread implied hazard rate calibration",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_par_spread(h, r, T, freq=4, rec=0.4):
    """
    CDS par spread via reduced-form model with constant hazard rate h.
    Protection leg PV = (1-R) * integral_0^T h * e^{-(r+h)t} dt
    Premium leg PV   = s * sum_{i=1}^{N} e^{-(r+h)*ti} * (1/freq)
    Par spread s* sets PV(protection) = PV(premium).
    """
    dt = 1.0 / freq
    times = np.arange(dt, T + dt/2, dt)
    # Survival probability and discount factor combined
    disc_surv = np.exp(-(r + h) * times)

    premium_pv    = np.sum(disc_surv) * dt  # risky annuity (per unit spread)
    protection_pv = (1 - rec) * h / (r + h) * (1 - np.exp(-(r + h) * T))
    return protection_pv / premium_pv  # par spread

def implied_hazard(cds_spread_bps, r=0.05, T=5, rec=0.4):
    """Back out constant hazard rate from observed CDS spread."""
    s_target = cds_spread_bps / 10_000
    # Brentq: find h such that par_spread(h) = s_target
    f = lambda h: cds_par_spread(h, r, T, rec=rec) - s_target
    # Bounds: h in [1e-6, 0.99] (recovery adjusted max)
    h = brentq(f, 1e-6, 0.99)
    default_prob_5y = 1 - np.exp(-h * T)
    return h, default_prob_5y

print(f"{'Spread (bps)':>12}  {'Hazard Rate':>12}  {'PD (5Y)':>10}")
for sp_bps in [50, 100, 200, 500, 1000]:
    h, pd = implied_hazard(sp_bps)
    print(f"{sp_bps:>12}  {h*100:>11.3f}%  {pd*100:>9.2f}%")`,
    explanation: "In the reduced-form credit model, the CDS spread is the market's price for default protection: the par spread equates the present value of the protection leg (pays 1-R on default) to the premium leg (pays spread on surviving notional), and inverting this equation gives the risk-neutral hazard rate (instantaneous default probability) implied by the market — the credit analogue of implied volatility.",
  },
  {
    id: "pyfin-20260727-b1-hull-white",
    language: "python",
    title: "Hull-White one-factor short-rate model simulation",
    tag: "rates",
    code: `import numpy as np

def hull_white_simulate(r0, a, sigma, theta_curve, T, n_steps, n_paths=1000):
    """
    Hull-White (1990): dr_t = (theta(t) - a*r_t)*dt + sigma*dW_t
    theta(t) calibrated to today's yield curve to ensure perfect fit.
    Here we supply theta_curve as a function theta(t).

    Discretisation (Euler-Maruyama):
      r_{t+dt} = r_t + (theta(t) - a*r_t)*dt + sigma*sqrt(dt)*Z
    """
    dt = T / n_steps
    sqdt = np.sqrt(dt)
    times = np.linspace(0, T, n_steps + 1)

    r = np.full(n_paths, r0)
    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = r0

    for i, t in enumerate(times[:-1]):
        theta_t = theta_curve(t)
        dW = np.random.standard_normal(n_paths)
        r  = r + (theta_t - a * r) * dt + sigma * sqdt * dW
        paths[:, i + 1] = r
    return times, paths

def flat_theta(kappa, theta_inf, sigma, t):
    """
    theta(t) for calibration to a flat term structure at rate r_bar.
    theta(t) = a*r_bar + sigma^2/(2a)*(1 - e^{-2at})
    Ensures E[r_t] -> r_bar as t -> inf.
    """
    return kappa * theta_inf + sigma**2 / (2 * kappa) * (1 - np.exp(-2 * kappa * t))

# Parameters
a, sigma, r0 = 0.20, 0.012, 0.04
r_inf = 0.05  # long-run target

theta = lambda t: flat_theta(a, r_inf, sigma, t)
times, paths = hull_white_simulate(r0, a, sigma, theta, T=5, n_steps=260, n_paths=5000)

# Zero-coupon bond price estimate (money market account average)
# P(0,T) ≈ E[exp(-integral_0^T r_t dt)]
# Approximate with trapezoidal rule on each path
dt = 5.0 / 260
zcb_approx = np.exp(-np.trapz(paths, dx=dt, axis=1)).mean()
print(f"HW ZCB P(0,5): {zcb_approx:.4f}  (approx; exact via A/B formula)")
print(f"r(5Y) sim: mean={paths[:,-1].mean():.4f}  std={paths[:,-1].std():.4f}")`,
    explanation: "Hull-White is the practitioner's workhorse short-rate model because it is the unique Gaussian affine model that fits the observed yield curve exactly by construction (via the theta(t) function), while still admitting closed-form bond and cap/floor prices — making it tractable for Bermudan swaption pricing via a trinomial tree or PDE grid.",
  },
  {
    id: "pyfin-20260727-b1-sabr",
    language: "python",
    title: "SABR model Hagan formula for implied volatility",
    tag: "derivatives",
    code: `import numpy as np

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """
    Hagan et al. (2002) SABR implied volatility formula.
    F    = forward price
    K    = strike
    T    = time to expiry
    alpha= initial vol (backbone)
    beta = CEV exponent (0=normal, 0.5=CIR, 1=lognormal)
    rho  = correlation between F and vol
    nu   = vol-of-vol
    Returns Black-Scholes equivalent implied volatility.
    """
    eps = 1e-10
    if abs(F - K) < eps:
        # ATM formula
        fk_mid = F
        z = nu / alpha * fk_mid**(1 - beta) * (F - K + eps)  # avoid 0/0
        numerator   = alpha
        denominator = fk_mid**(1 - beta) * (1
            + (1-beta)**2/24 * alpha**2 / fk_mid**(2-2*beta)
            + rho*beta*nu*alpha / (4 * fk_mid**(1-beta))
            + (2 - 3*rho**2)/24 * nu**2)
        sigma_atm = numerator / denominator * (1
            + ((1-beta)**2/24 * alpha**2 / fk_mid**(2-2*beta)
               + rho*beta*nu*alpha / (4*fk_mid**(1-beta))
               + (2-3*rho**2)/24 * nu**2) * T)
        return sigma_atm

    log_FK = np.log(F / K)
    fk_mid = (F * K)**((1 - beta)/2)
    z      = nu / alpha * fk_mid * log_FK
    x_z    = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    numerator = alpha * (1
        + ((1-beta)**2/24 * alpha**2 / fk_mid**(2*(1-beta))
           + rho*beta*nu*alpha / (4*fk_mid**(1-beta))
           + (2-3*rho**2)/24 * nu**2) * T)
    denominator = (fk_mid * (1 + (1-beta)**2/24 * log_FK**2
                              + (1-beta)**4/1920 * log_FK**4)
                   * (x_z / z if abs(z) > eps else 1.0))
    return numerator / denominator

# Example: SABR vol smile for EUR/USD swaption
F = 0.04; T = 1.0
alpha, beta, rho, nu = 0.02, 0.5, -0.3, 0.4
strikes = np.linspace(0.01, 0.08, 15)
print(f"{'Strike':>8}  {'SABR Vol':>10}")
for K in strikes:
    vol = sabr_vol(F, K, T, alpha, beta, rho, nu)
    print(f"{K*100:>7.2f}%  {vol*100:>9.3f}%")`,
    explanation: "The SABR model by Hagan et al. is the industry standard for interest rate options because it captures the vol smile with only four parameters and provides an explicit closed-form approximate implied-vol formula — widely used for quoting swaption and cap vol surfaces with a single set of parameters per expiry that traders can calibrate intraday.",
  },
  {
    id: "pyfin-20260727-b1-control-variates",
    language: "python",
    title: "Control variates variance reduction in Monte Carlo",
    tag: "mc-methods",
    code: `import numpy as np

def mc_asian_call(S0, K, r, sigma, T, n_steps=252, n_paths=100_000, seed=42):
    """
    Asian call option (arithmetic average) with control variate.
    Control variate: geometric average Asian (has closed-form price).
    Corr(payoff_arith, payoff_geom) is very high, reducing MC variance.
    """
    np.random.seed(seed)
    dt    = T / n_steps
    Z     = np.random.standard_normal((n_paths, n_steps))
    dS    = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    logS  = np.log(S0) + np.cumsum(dS, axis=1)
    S     = np.exp(logS)

    # Arithmetic mean price
    arith_avg = S.mean(axis=1)
    payoff_arith = np.maximum(arith_avg - K, 0) * np.exp(-r * T)

    # Geometric mean price
    geom_avg  = np.exp(np.log(S).mean(axis=1))
    payoff_geom = np.maximum(geom_avg - K, 0) * np.exp(-r * T)

    # Geometric Asian closed-form (Kemna & Vorst 1990)
    sigma_g = sigma * np.sqrt((2*n_steps + 1) / (6*(n_steps + 1)))
    mu_g    = 0.5*(r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S0/K) + (mu_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    from scipy.stats import norm
    geom_exact = (np.exp((mu_g - r)*T)*S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2))

    # OLS control variate coefficient
    cov_matrix = np.cov(payoff_arith, payoff_geom)
    c = cov_matrix[0, 1] / cov_matrix[1, 1]
    payoff_cv = payoff_arith - c * (payoff_geom - geom_exact)

    plain_mc = payoff_arith.mean()
    cv_price = payoff_cv.mean()
    plain_se = payoff_arith.std() / np.sqrt(n_paths)
    cv_se    = payoff_cv.std()    / np.sqrt(n_paths)
    print(f"Plain MC:  {plain_mc:.4f}  SE={plain_se:.5f}")
    print(f"Control V: {cv_price:.4f}  SE={cv_se:.5f}")
    print(f"Variance reduction factor: {(plain_se/cv_se)**2:.1f}x")
    return cv_price

mc_asian_call(S0=100, K=100, r=0.05, sigma=0.2, T=1.0)`,
    explanation: "Control variates exploit the high correlation between the arithmetic and geometric Asian payoffs: the geometric version has a known closed-form price, so replacing (payoff_arith) with (payoff_arith - c*(payoff_geom - geom_exact)) removes the shared variance component — in practice achieving 10-50x variance reduction, equivalent to running 100-2500x more paths without the CV.",
  },
  {
    id: "pyfin-20260727-b1-importance-sampling",
    language: "python",
    title: "Importance sampling for deep OTM option pricing",
    tag: "mc-methods",
    code: `import numpy as np
from scipy.stats import norm

def mc_call_standard(S0, K, r, sigma, T, n_paths=200_000, seed=0):
    """Standard MC — inefficient for deep OTM where S_T > K is rare."""
    np.random.seed(seed)
    Z = np.random.standard_normal(n_paths)
    S_T = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    payoffs = np.maximum(S_T - K, 0) * np.exp(-r*T)
    return payoffs.mean(), payoffs.std() / np.sqrt(n_paths)

def mc_call_importance_sampling(S0, K, r, sigma, T, n_paths=200_000, seed=0):
    """
    Shift the sampling distribution so more paths hit the payoff region.
    Change of measure: sample Z ~ N(mu*, 1) where mu* = log(K/F) / (sigma*sqrt(T))
    and F = S0*exp(r*T) is the forward.
    Weight each path by the likelihood ratio p(Z)/q(Z).
    """
    np.random.seed(seed)
    sqT = np.sqrt(T)
    F   = S0 * np.exp(r * T)
    # Optimal drift: center the sampling distribution at the breakeven Z
    mu_star = np.log(K / F) / (sigma * sqT) - 0.5  # puts mean near moneyness

    Z_shifted = np.random.standard_normal(n_paths) + mu_star
    S_T = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*sqT*Z_shifted)

    # Likelihood ratio: dP/dQ = exp(-mu*Z_orig + 0.5*mu^2) where Z_orig = Z_shifted - mu*
    lr = np.exp(-mu_star * (Z_shifted - mu_star) - 0.5 * mu_star**2)
    payoffs = np.maximum(S_T - K, 0) * np.exp(-r*T) * lr

    return payoffs.mean(), payoffs.std() / np.sqrt(n_paths)

# Deep OTM: K = 1.5 * S0
S0, r, sigma, T = 100, 0.05, 0.20, 1.0
K = 150

p_std, se_std = mc_call_standard(S0, K, r, sigma, T)
p_is,  se_is  = mc_call_importance_sampling(S0, K, r, sigma, T)
print(f"Standard MC:          price={p_std:.6f}  SE={se_std:.6f}")
print(f"Importance Sampling:  price={p_is:.6f}  SE={se_is:.6f}")
print(f"Variance reduction:   {(se_std/se_is)**2:.0f}x")`,
    explanation: "Importance sampling shifts the sampling measure toward the event of interest (option finishing ITM) and corrects for the shift with a likelihood ratio weight; for deep OTM options where only 1 in 10,000 paths contributes to the payoff, this can reduce Monte Carlo variance by a factor of 100-10,000, turning a problem requiring billions of standard paths into one requiring thousands of IS paths.",
  },
  {
    id: "pyfin-20260727-b1-parametric-var",
    language: "python",
    title: "Parametric and historical VaR with CVaR (ES)",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def parametric_var_cvar(returns, confidence=0.99):
    """
    Parametric (normal distribution) VaR and CVaR (Expected Shortfall / ES).
    Assumes returns ~ N(mu, sigma^2).
    VaR(alpha) = -(mu + sigma * z_alpha)  [loss convention: positive = loss]
    CVaR(alpha) = -(mu - sigma * phi(z_alpha)/(1-alpha))
    where phi = standard normal PDF, z_alpha = norm.ppf(1-alpha).
    """
    mu, sigma = returns.mean(), returns.std()
    z_alpha = norm.ppf(1 - confidence)
    var   = -(mu + sigma * z_alpha)
    cvar  = -(mu - sigma * norm.pdf(z_alpha) / (1 - confidence))
    return var, cvar

def historical_var_cvar(returns, confidence=0.99):
    """
    Historical simulation VaR: empirical quantile — no distributional assumption.
    CVaR = mean of losses beyond VaR.
    """
    losses = -returns  # flip sign: losses are positive
    var  = np.quantile(losses, confidence)
    cvar = losses[losses >= var].mean()
    return var, cvar

# Simulated portfolio daily P&L (in $ thousands)
np.random.seed(42)
n = 1000
# Fat-tailed: mix of normal and crisis days
returns = np.concatenate([
    np.random.normal(0.05, 1.0, int(n * 0.95)),   # normal days
    np.random.normal(-3.0, 2.0, int(n * 0.05)),   # stress days
])

pvar_99, pcvar_99 = parametric_var_cvar(returns, 0.99)
hvar_99, hcvar_99 = historical_var_cvar(returns, 0.99)

print(f"Parametric 99% VaR: \${pvar_99:.2f}k  CVaR: \${pcvar_99:.2f}k")
print(f"Historical 99% VaR: \${hvar_99:.2f}k  CVaR: \${hcvar_99:.2f}k")
print(f"\\nNote: Historical CVaR is larger due to fat tails — the normal model underestimates tail risk.")`,
    explanation: "CVaR (Expected Shortfall) is the mean loss in the worst (1-confidence) fraction of scenarios; unlike VaR it is a coherent risk measure (sub-additive, so diversification always reduces it) and satisfies Basel III regulatory requirements; the comparison between parametric and historical ES here illustrates why assuming normality systematically underestimates tail risk in crisis regimes.",
  },
  {
    id: "pyfin-20260727-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory: GPD tail fit and tail VaR",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto

def evt_var_cvar(losses, threshold_pct=0.90, confidence=0.99):
    """
    Peaks-over-Threshold (POT) method:
    1. Choose threshold u (e.g. 90th percentile of losses).
    2. Fit Generalised Pareto Distribution to exceedances (losses - u).
    3. Extrapolate VaR and CVaR beyond the sample using GPD formula.
    GPD CDF: H(y; xi, beta) = 1 - (1 + xi*y/beta)^{-1/xi}  (xi != 0)
    """
    u = np.quantile(losses, threshold_pct)
    exceedances = losses[losses > u] - u
    n_total = len(losses)
    n_u     = len(exceedances)
    p_u     = n_u / n_total  # fraction exceeding threshold

    # MLE fit of GPD to exceedances
    xi, loc, beta = genpareto.fit(exceedances, floc=0)
    print(f"GPD fit: xi (shape)={xi:.4f}  beta (scale)={beta:.4f}")
    print(f"Threshold u={u:.4f}  exceedances: {n_u}/{n_total} ({100*p_u:.1f}%)")

    if xi == 0:
        raise ValueError("Exponential tail (xi=0) — use exponential formula")

    # VaR via inverse GPD extrapolation
    p_exceed = 1 - confidence          # target probability in full distribution
    q        = (p_exceed / p_u)        # quantile of exceedances needed
    var      = u + beta / xi * ((1/q)**xi - 1)

    # CVaR (Expected Shortfall above VaR)
    cvar = (var + beta - xi * u) / (1 - xi)

    return var, cvar, xi, beta

np.random.seed(0)
# Simulate fat-tailed losses (Student-t df=3)
from scipy.stats import t as student_t
losses = student_t.rvs(df=3, scale=1.5, size=10_000)
losses = losses[losses > 0]  # keep losses only

var_99, cvar_99, xi, beta = evt_var_cvar(losses, 0.90, 0.99)
print(f"\\nEVT 99% VaR:  {var_99:.4f}")
print(f"EVT 99% CVaR: {cvar_99:.4f}")`,
    explanation: "Extreme Value Theory's POT method fits a Generalised Pareto Distribution only to the tail of the loss distribution rather than assuming a global parametric form; the shape parameter xi > 0 indicates a heavy tail (Pareto-like), and the GPD extrapolation provides quantile estimates far beyond the historical sample — critical for 99.97% or 99.99% stress VaR calculations required for regulatory capital.",
  },
  {
    id: "pyfin-20260727-b1-kelly-sizing",
    language: "python",
    title: "Kelly criterion and fractional Kelly position sizing",
    tag: "portfolio",
    code: `import numpy as np

def kelly_fraction(mu, sigma, rf=0.0):
    """
    Continuous Kelly fraction for a lognormal asset:
    f* = (mu - rf) / sigma^2
    where mu is the expected log return (drift) and sigma is the vol.
    Equivalently, f* = Sharpe / sigma (per unit of vol).
    """
    return (mu - rf) / sigma**2

def kelly_discrete(p_win, p_loss, b):
    """
    Discrete Kelly for binary bets:
    f* = (p_win * b - p_loss) / b
       = p_win - p_loss/b
    p_win: probability of winning
    p_loss = 1 - p_win: probability of losing
    b: net odds (bet b:1 — if you win, gain b per unit staked)
    """
    p_loss = 1 - p_win
    return p_win - p_loss / b

def simulate_kelly(mu, sigma, T=252, n_sims=5000, seed=42):
    """Simulate Kelly vs fractional Kelly vs over-bet over T periods."""
    np.random.seed(seed)
    fk = kelly_fraction(mu, sigma)
    results = {}
    for frac in [0.25, 0.5, 1.0, 1.5]:
        f = frac * fk
        daily_rets = mu - 0.5*f*sigma**2 + f*sigma*np.random.standard_normal((n_sims, T))
        final_wealth = np.exp(daily_rets.sum(axis=1))
        results[frac] = {
            'median': np.median(final_wealth),
            'mean':   final_wealth.mean(),
            'p10':    np.percentile(final_wealth, 10),
        }

    print(f"Kelly fraction f* = {fk:.4f}  ({fk*100:.2f}% of wealth)")
    print(f"{'Bet':>6}  {'Median W':>10}  {'Mean W':>10}  {'10th pct':>10}")
    for frac, stats in results.items():
        label = f"{frac:.2f}f*"
        print(f"{label:>6}  {stats['median']:>10.3f}  {stats['mean']:>10.3f}  {stats['p10']:>10.3f}")

# Strategy: daily mu=0.001 (25% annualised), sigma=0.015 (24% vol)
simulate_kelly(mu=0.001, sigma=0.015)

# Discrete bet: 55% win prob, 3:1 odds
fk_d = kelly_discrete(0.55, 1, 3)
print(f"\\nDiscrete Kelly (p=0.55, b=3): f*={fk_d:.3f} ({fk_d*100:.1f}%)")`,
    explanation: "The Kelly criterion maximises the geometric growth rate of wealth, which equals the log-utility expectation; over-betting beyond Kelly (f > f*) reduces the geometric mean even as it increases the arithmetic mean, a subtle but catastrophic distinction — 2× Kelly has zero expected geometric growth, and 1.5× Kelly has lower median terminal wealth than 0.5× Kelly despite higher expected value.",
  },
  {
    id: "pyfin-20260727-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter for dynamic hedge ratio in pairs trading",
    tag: "stat-arb",
    code: `import numpy as np

def kalman_pairs(y, x, delta=1e-4, R_noise=1e-3):
    """
    Kalman filter for time-varying hedge ratio (beta) in y = beta*x + alpha + eps.
    State: [beta, alpha]. Observation: y - beta*x - alpha = 0 (approximately).

    delta: process noise — controls how fast beta can change (larger = faster adaptation)
    R_noise: observation noise variance

    Returns: betas, alphas, spreads (residuals)
    """
    n = len(y)
    # State covariance (start with high uncertainty)
    P = np.eye(2) * 1.0
    # State transition: identity (beta/alpha drift as random walk)
    Q = np.eye(2) * delta      # process noise
    R = np.array([[R_noise]])  # observation noise (scalar)

    # Initial state
    state = np.zeros(2)   # [beta, alpha]

    betas  = np.zeros(n)
    alphas = np.zeros(n)
    spreads= np.zeros(n)

    for t in range(n):
        # Observation matrix: y_t = [x_t, 1] @ [beta, alpha] + eps
        H = np.array([[x[t], 1.0]])

        # Prediction step (random-walk transition)
        P_pred = P + Q

        # Innovation
        y_hat = H @ state
        S = H @ P_pred @ H.T + R      # innovation covariance
        K = P_pred @ H.T @ np.linalg.inv(S)  # Kalman gain

        # Update step
        state = state + K.flatten() * (y[t] - y_hat[0])
        P     = (np.eye(2) - K @ H) @ P_pred

        betas[t]   = state[0]
        alphas[t]  = state[1]
        spreads[t] = y[t] - state[0]*x[t] - state[1]

    return betas, alphas, spreads

# Simulate cointegrated pair
np.random.seed(42)
n = 500
x  = np.cumsum(np.random.normal(0, 1, n)) + 100
# Drifting true beta (0.8 -> 1.2 over the sample)
true_beta = np.linspace(0.8, 1.2, n)
y  = true_beta * x + np.random.normal(0, 2, n)

betas, alphas, spread = kalman_pairs(y, x)
print(f"Beta estimate range: [{betas.min():.3f}, {betas.max():.3f}]")
print(f"True beta range:     [{true_beta.min():.3f}, {true_beta.max():.3f}]")
print(f"Spread mean: {spread.mean():.4f}  std: {spread.std():.4f}")
zscore = (spread - spread.mean()) / spread.std()
n_signals = (np.abs(zscore) > 2).sum()
print(f"Entry signals (|z|>2): {n_signals}")`,
    explanation: "The Kalman filter models the hedge ratio as a random walk and updates it with each new observation via the Kalman gain — it automatically adapts to structural breaks in the co-integration relationship faster than rolling OLS while suppressing noise better than exponential weighting; the time-varying spread z-score is the pairs-trading signal, replacing the static spread used in classical ADF-based cointegration pairs.",
  },
  {
    id: "pyfin-20260727-b1-pca-yield-curve",
    language: "python",
    title: "PCA decomposition of yield curve movements",
    tag: "fixed-income",
    code: `import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

def yield_curve_pca(yield_changes, tenors=None):
    """
    PCA on daily yield curve changes.
    First 3 PCs typically explain > 99% of variance and correspond to:
    PC1: parallel shift (level) — most variance, all loadings same sign
    PC2: tilt (slope) — short vs long rate, opposing signs
    PC3: butterfly (curvature) — wings vs belly, middle has opposite sign
    """
    if tenors is None:
        tenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]

    X = np.asarray(yield_changes)
    # Do NOT standardise for yield curve (want to preserve relative variance)
    pca = PCA()
    pca.fit(X)

    explained = pca.explained_variance_ratio_ * 100
    cumulative = np.cumsum(explained)
    print(f"PCA explained variance:")
    for i, (e, c) in enumerate(zip(explained[:5], cumulative[:5])):
        print(f"  PC{i+1}: {e:6.2f}%  (cumulative {c:6.2f}%)")

    loadings = pca.components_
    print(f"\\nFactor loadings (PC1=Level, PC2=Slope, PC3=Curvature):")
    print(f"{'Tenor':>6}  {'PC1 (Lvl)':>10}  {'PC2 (Slp)':>10}  {'PC3 (Crv)':>10}")
    for j, tau in enumerate(tenors):
        print(f"{tau:>6.2f}  {loadings[0,j]:>10.4f}  {loadings[1,j]:>10.4f}  {loadings[2,j]:>10.4f}")

    return pca

# Simulate daily yield changes across 10 tenors
np.random.seed(7)
n_days, n_tenors = 500, 10
# PC1: parallel shift dominates; PC2: slope; noise on rest
shifts = np.random.normal(0, 5, n_days)     # basis points (level)
tilts  = np.random.normal(0, 2, n_days)     # slope
tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
level_load = np.ones(n_tenors)
slope_load = np.linspace(-1, 1, n_tenors)

changes = (shifts[:, None] * level_load[None, :] +
           tilts[:, None]  * slope_load[None, :] +
           np.random.normal(0, 0.5, (n_days, n_tenors)))

pca = yield_curve_pca(changes, tenors)`,
    explanation: "PCA on yield curve changes consistently produces three factors that explain > 99% of curve variance in any market: the level (parallel shift), slope (bear/bull steepener), and curvature (butterfly) factors — each factor corresponds to a distinct type of central-bank action or supply/demand dynamic, and duration-neutral butterfly trades are constructed by going long/short the PC3 factor portfolio.",
  },
  {
    id: "pyfin-20260727-b1-ff3-regression",
    language: "python",
    title: "Fama-French three-factor model OLS regression",
    tag: "factor-models",
    code: `import numpy as np
import statsmodels.api as sm

def fama_french3(portfolio_returns, mkt_rf, smb, hml, rf):
    """
    Fama-French three-factor model:
      r_i - rf = alpha + beta_mkt*(Mkt-RF) + beta_smb*SMB + beta_hml*HML + eps

    MKT-RF: market excess return (systematic risk)
    SMB: Small Minus Big (size factor)
    HML: High Minus Low book-to-market (value factor)

    alpha (Jensen's alpha): risk-adjusted excess return not explained by factors
    """
    excess_ret = portfolio_returns - rf
    X = sm.add_constant(np.column_stack([mkt_rf - rf, smb, hml]))
    model = sm.OLS(excess_ret, X).fit(cov_type='HC3')

    alpha      = model.params[0]
    beta_mkt   = model.params[1]
    beta_smb   = model.params[2]
    beta_hml   = model.params[3]
    t_alpha    = model.tvalues[0]
    r_squared  = model.rsquared

    print(f"FF3 Regression Results (n={len(portfolio_returns)} months)")
    print(f"  alpha (annualised) = {alpha*12*100:.2f}%  t-stat={t_alpha:.2f}")
    print(f"  beta_mkt           = {beta_mkt:.4f}")
    print(f"  beta_smb (size)    = {beta_smb:.4f}")
    print(f"  beta_hml (value)   = {beta_hml:.4f}")
    print(f"  R^2                = {r_squared:.4f}")
    return model

# Simulate 120 months of factor data
np.random.seed(1)
n = 120
rf    = np.full(n, 0.003)     # 3.6% annual risk-free
mkt   = np.random.normal(0.008, 0.045, n)   # market return
smb   = np.random.normal(0.002, 0.025, n)   # size factor
hml   = np.random.normal(0.002, 0.025, n)   # value factor

# Simulate a value-tilted fund: high HML loading, modest alpha
port_excess = (0.002              # alpha: 2.4% annual
               + 1.05*(mkt - rf)   # close-to-market beta
               + 0.20*smb          # small-cap tilt
               + 0.45*hml          # value tilt
               + np.random.normal(0, 0.012, n))   # idiosyncratic noise
portfolio = port_excess + rf

fama_french3(portfolio, mkt, smb, hml, rf)`,
    explanation: "The Fama-French three-factor model decomposes a portfolio's return into a risk-free rate plus compensation for three systematic risk factors; alpha represents genuine skill (return unexplained by passive factor exposure) and its t-statistic must exceed ~2.0 to be statistically significant — many active funds that appear to outperform the CAPM lose their alpha once size and value exposures are controlled for.",
  },
  {
    id: "pyfin-20260727-b1-local-vol-dupire",
    language: "python",
    title: "Dupire local volatility surface from market option prices",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(K_grid, T_grid, C_surface, S0, r):
    """
    Dupire (1994) equation for local volatility sigma_loc(K, T):
      sigma_loc^2 = 2 * (dC/dT + r*K*dC/dK) / (K^2 * d^2C/dK^2)

    C_surface: call prices on a (T, K) grid
    Numerics: finite differences on the interpolated spline.
    """
    # Fit smooth spline to noisy call price surface
    spline = RectBivariateSpline(T_grid, K_grid, C_surface, kx=3, ky=3)

    loc_vol = np.zeros((len(T_grid), len(K_grid)))
    for i, T in enumerate(T_grid):
        for j, K in enumerate(K_grid):
            dC_dT   = spline(T, K, dx=1, dy=0)[0, 0]
            dC_dK   = spline(T, K, dx=0, dy=1)[0, 0]
            d2C_dK2 = spline(T, K, dx=0, dy=2)[0, 0]
            numerator   = 2 * (dC_dT + r * K * dC_dK)
            denominator = K**2 * d2C_dK2
            if denominator > 1e-10 and numerator > 0:
                loc_vol[i, j] = np.sqrt(numerator / denominator)
            else:
                loc_vol[i, j] = np.nan
    return loc_vol

# Build a synthetic call price surface (BS with a vol smile)
from scipy.stats import norm

def bs_call_price(S, K, r, sigma, T):
    if T <= 0: return max(S - K, 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

S0, r = 100.0, 0.05
T_grid = np.array([0.25, 0.5, 1.0, 2.0])
K_grid = np.linspace(70, 140, 20)

# Smiling implied vol surface: higher vol for OTM puts/calls
def iv_smile(K, T):
    moneyness = np.log(K / S0) / np.sqrt(T)
    return 0.20 + 0.03 * moneyness**2 - 0.01 * moneyness  # skew + smile

C_surf = np.array([[bs_call_price(S0, K, r, iv_smile(K, T), T) for K in K_grid]
                   for T in T_grid])

loc_vol = dupire_local_vol(K_grid, T_grid, C_surf, S0, r)
print(f"Local vol at T=1Y, ATM (K=100): {loc_vol[2, 10]*100:.2f}%")
print(f"Local vol at T=1Y, OTM (K=130): {loc_vol[2, -4]*100:.2f}%")`,
    explanation: "Dupire's equation inverts the relationship between call prices and the local volatility surface: given a complete market of option prices, the local vol sigma_loc(K,T) is the unique diffusion coefficient that reprices all options exactly — unlike stochastic vol models, the local vol model is complete and can be calibrated to an arbitrary smile, at the cost of poor forward-smile dynamics that affect exotic pricing.",
  },
  {
    id: "pyfin-20260727-b1-cointegration-eg",
    language: "python",
    title: "Engle-Granger cointegration test and spread modelling",
    tag: "stat-arb",
    code: `import numpy as np
from statsmodels.tsa.stattools import coint, adfuller
import statsmodels.api as sm

def test_cointegration(y, x, alpha=0.05):
    """
    Engle-Granger (1987) two-step cointegration test:
    Step 1: OLS regression y = beta*x + c + u
    Step 2: ADF test on residuals u. Reject H0 (unit root) => cointegrated.
    """
    X = sm.add_constant(x)
    ols = sm.OLS(y, X).fit()
    beta_hat = ols.params[1]
    intercept = ols.params[0]
    residuals = y - beta_hat * x - intercept

    # ADF on residuals (specific critical values for cointegration context)
    adf_stat, adf_pval, _, _, critical, _ = adfuller(residuals, maxlag=5, regression='nc')
    cointegrated = adf_pval < alpha

    # Convenience: also run statsmodels coint
    score, pval, cvs = coint(y, x)

    print(f"OLS: beta={beta_hat:.4f}  intercept={intercept:.4f}")
    print(f"ADF on residuals: stat={adf_stat:.4f}  p-value={adf_pval:.4f}")
    print(f"Cointegrated at {alpha*100:.0f}% significance: {cointegrated}")
    print(f"statsmodels coint p-value: {pval:.4f}")

    z_score = (residuals - residuals.mean()) / residuals.std()
    return beta_hat, residuals, z_score, cointegrated

# Simulate genuinely cointegrated pair
np.random.seed(1)
n = 500
noise_common = np.cumsum(np.random.normal(0, 1, n))   # shared I(1) driver
x = noise_common + np.random.normal(0, 0.5, n) + 50
y = 0.9 * noise_common + np.random.normal(0, 0.8, n) + 10

beta, spread, zscore, cointest = test_cointegration(y, x)

# Trading signals
entries = np.where(np.abs(zscore) > 2.0)[0]
print(f"\\nSpread mean-reversion half-life estimate:")
from statsmodels.regression.linear_model import OLS
dspread = np.diff(spread)
ols2 = OLS(dspread, spread[:-1]).fit()
hl = -np.log(2) / ols2.params[0]
print(f"  half-life = {hl:.1f} days")
print(f"  entry signals (|z|>2): {len(entries)}")`,
    explanation: "The Engle-Granger procedure tests whether two I(1) time series share a common stochastic trend: if the OLS residuals are stationary (ADF rejects a unit root), the series are cointegrated and the spread is mean-reverting on a known half-life — directly providing the horizon over which to hold the pairs trade before the statistical edge decays.",
  },
  {
    id: "pyfin-20260727-b1-cvxpy-portfolio",
    language: "python",
    title: "Mean-variance portfolio optimization with cvxpy",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def mv_optimize(mu, Sigma, gamma=1.0, max_weight=0.20, min_weight=0.0):
    """
    Mean-variance portfolio: maximise mu^T w - (gamma/2) * w^T Sigma w
    subject to: sum(w) = 1, min_weight <= w_i <= max_weight.

    gamma: risk-aversion coefficient (higher => more conservative)
    """
    n = len(mu)
    w = cp.Variable(n)
    ret  = mu @ w
    risk = cp.quad_form(w, Sigma)   # w^T Sigma w

    objective   = cp.Maximize(ret - (gamma / 2) * risk)
    constraints = [
        cp.sum(w) == 1,
        w >= min_weight,
        w <= max_weight,
    ]
    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL)

    if prob.status not in ["optimal", "optimal_inaccurate"]:
        raise RuntimeError(f"Optimisation failed: {prob.status}")

    w_opt = w.value
    port_ret  = mu @ w_opt
    port_vol  = np.sqrt(w_opt @ Sigma @ w_opt)
    sharpe    = port_ret / port_vol   # assume rf = 0 for simplicity

    print(f"Optimal portfolio (gamma={gamma}):")
    print(f"  Expected return: {port_ret*252*100:.2f}% pa")
    print(f"  Volatility:      {port_vol*np.sqrt(252)*100:.2f}% pa")
    print(f"  Sharpe ratio:    {sharpe*np.sqrt(252):.3f}")
    for i, wi in enumerate(w_opt):
        print(f"  Asset {i+1}: {wi*100:.2f}%")
    return w_opt

# 5-asset example
np.random.seed(0)
n = 5
mu_annual = np.array([0.08, 0.12, 0.06, 0.10, 0.09])
vols      = np.array([0.15, 0.25, 0.10, 0.20, 0.18])
corr      = np.array([
    [1.00, 0.30, 0.10, 0.25, 0.20],
    [0.30, 1.00, 0.05, 0.40, 0.35],
    [0.10, 0.05, 1.00, 0.15, 0.10],
    [0.25, 0.40, 0.15, 1.00, 0.50],
    [0.20, 0.35, 0.10, 0.50, 1.00],
])
Sigma_annual = np.diag(vols) @ corr @ np.diag(vols)

mu_daily    = mu_annual / 252
Sigma_daily = Sigma_annual / 252

w_opt = mv_optimize(mu_daily, Sigma_daily, gamma=2.0, max_weight=0.30)`,
    explanation: "cvxpy formulates mean-variance optimisation as a convex quadratic programme: the quadratic risk term (w^T Sigma w) is convex in weights, the linear return term is concave, and sum-to-one plus box constraints are linear — the CLARABEL/OSQP solver finds the global optimum in milliseconds, enabling daily reoptimisation with fresh covariance estimates as a practical alternative to Markowitz's analytical formula when constraints are non-trivial.",
  },
  {
    id: "pyfin-20260727-b1-backtester-costs",
    language: "python",
    title: "Event-driven backtester with transaction costs and slippage",
    tag: "backtesting",
    code: `import numpy as np
import pandas as pd

def backtest_with_costs(prices: np.ndarray,
                        signals: np.ndarray,
                        commission_bps: float = 5.0,
                        slippage_bps: float = 3.0,
                        initial_capital: float = 1_000_000.0):
    """
    Vectorised single-asset backtest.
    signal[t]: target position in shares (positive=long, negative=short, 0=flat)
    commission_bps: round-trip cost per notional in basis points
    slippage_bps:   one-way execution slippage per trade

    Returns a DataFrame with daily P&L and cumulative return.
    """
    n = len(prices)
    pos  = np.zeros(n)    # actual position held
    cash = np.full(n, initial_capital)
    pnl  = np.zeros(n)
    trade_cost = np.zeros(n)

    pos[0] = signals[0]
    cost_rate = (commission_bps + slippage_bps) / 10_000

    for t in range(1, n):
        delta = signals[t] - pos[t-1]    # change in position
        if delta != 0:
            exec_price = prices[t] * (1 + np.sign(delta) * slippage_bps/10_000)
            cost = abs(delta) * exec_price * cost_rate
            trade_cost[t] = cost
        pos[t] = signals[t]

        # P&L = position * price change - trading costs
        pnl[t] = pos[t-1] * (prices[t] - prices[t-1]) - trade_cost[t]
        cash[t] = cash[t-1] + pnl[t]

    ret = pd.Series(pnl / cash[0])
    cum_ret = (1 + ret).cumprod() - 1
    annualised_ret = (1 + cum_ret.iloc[-1])**(252/n) - 1
    vol = ret.std() * np.sqrt(252)
    sharpe = annualised_ret / vol
    max_dd  = (cum_ret - cum_ret.cummax()).min()

    print(f"Backtest Summary ({n} days):")
    print(f"  Total return:       {cum_ret.iloc[-1]*100:.2f}%")
    print(f"  Annualised return:  {annualised_ret*100:.2f}%")
    print(f"  Annualised vol:     {vol*100:.2f}%")
    print(f"  Sharpe ratio:       {sharpe:.3f}")
    print(f"  Max drawdown:       {max_dd*100:.2f}%")
    print(f"  Total trade costs:  \${trade_cost.sum():.2f}")
    return pd.DataFrame({'price':prices,'signal':signals,'pnl':pnl,'cum_ret':cum_ret})

# Example: simple 20/50 SMA crossover on simulated prices
np.random.seed(5)
n = 500
prices = 100 * np.exp(np.cumsum(np.random.normal(0.0003, 0.015, n)))
short_ma = pd.Series(prices).rolling(20).mean().values
long_ma  = pd.Series(prices).rolling(50).mean().values
raw_signal = np.where(short_ma > long_ma, 100, 0)  # 100 shares or flat

results = backtest_with_costs(prices, raw_signal, commission_bps=5, slippage_bps=3)`,
    explanation: "This event-driven backtester applies slippage to the execution price (shifting the fill price adversely) and deducts commission from cash — critical distinctions from gross-return backtesting where applying costs only to P&L underestimates their drag, particularly for high-turnover strategies where cumulative transaction costs can easily exceed the alpha being harvested.",
  },
  {
    id: "pyfin-20260727-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula for correlated default simulation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_defaults(n_names: int,
                             correlation: float,
                             pd_individual: float,
                             n_sims: int = 100_000,
                             seed: int = 42):
    """
    Li (2000) Gaussian copula model for correlated defaults (CDO pricing).
    Single-factor model:
      X_i = rho*M + sqrt(1-rho^2)*Z_i
    where M ~ N(0,1) is the systemic factor (market) and Z_i ~ N(0,1) is
    idiosyncratic noise. Name i defaults if X_i < Phi^{-1}(PD_i).

    Correlation between any two obligors = rho^2 (asset correlation).
    """
    np.random.seed(seed)
    # Default threshold (inverse-normal transformed PD)
    threshold = norm.ppf(pd_individual)

    # Simulate systemic and idiosyncratic factors
    M = np.random.standard_normal(n_sims)              # shape (n_sims,)
    Z = np.random.standard_normal((n_sims, n_names))   # shape (n_sims, n_names)

    # Latent creditworthiness variable
    X = correlation * M[:, None] + np.sqrt(1 - correlation**2) * Z

    # Count defaults in each simulation
    defaults = (X < threshold).sum(axis=1)   # shape (n_sims,)

    expected_loss = defaults.mean()
    std_loss      = defaults.std()
    tranche_loss  = {
        f'[0, {n_names//5}]':         (defaults <= n_names//5).mean(),
        f'[{n_names//5}, {n_names//2}]': ((defaults > n_names//5) &
                                           (defaults <= n_names//2)).mean(),
        f'[{n_names//2}, {n_names}]':  (defaults > n_names//2).mean(),
    }

    print(f"Gaussian Copula: n={n_names} names, rho={correlation:.2f}, PD={pd_individual:.2%}")
    print(f"Expected defaults: {expected_loss:.2f}  Std: {std_loss:.2f}")
    print(f"99th pct defaults: {np.percentile(defaults, 99):.0f}")
    print("Tranche probabilities:")
    for tranche, prob in tranche_loss.items():
        print(f"  {tranche}: {prob*100:.2f}%")

gaussian_copula_defaults(n_names=100, correlation=0.3,
                         pd_individual=0.02, n_sims=200_000)`,
    explanation: "The Li Gaussian copula models joint default timing by mapping individual survival probabilities to a correlated multivariate normal via the single-factor structure; the asset correlation rho^2 (not rho) controls how much defaults cluster — low correlation means losses are predictable (Binomial), while high correlation concentrates losses into rare catastrophic scenarios, which is why CDO senior tranches are extremely sensitive to correlation assumptions.",
  },
  {
    id: "pyfin-20260727-b1-market-impact",
    language: "python",
    title: "Square-root market impact model for trade scheduling",
    tag: "execution",
    code: `import numpy as np

def sqrt_market_impact(Q, V, sigma, eta=0.1, gamma=0.314):
    """
    Almgren-Chriss (2001) square-root market impact model:
      impact(Q) = eta * sigma * sqrt(Q/V)
    where:
      Q     = order size (shares)
      V     = daily volume (shares)
      sigma = daily volatility (fractional)
      eta   = market impact coefficient (typically 0.05-0.5)
      gamma = liquidity parameter (0.314 for US equities, empirical)
    Returns impact as a fraction of price (bps = impact * 10000).
    """
    participation = Q / V          # fraction of daily volume (POV)
    impact = eta * sigma * np.sqrt(participation)
    return impact, participation

def optimal_execution_twap(Q, V, sigma, n_slices, eta=0.1):
    """
    TWAP execution: split Q into n_slices equal pieces.
    Total cost = n_slices * impact(Q/n_slices) + timing risk.
    Timing risk: sigma^2 * T (variance of unexecuted position).
    Optimal n minimises total_cost = permanent_impact + timing_risk.
    """
    slice_size = Q / n_slices
    per_slice_impact, _ = sqrt_market_impact(slice_size, V, sigma, eta)
    total_impact = n_slices * slice_size * per_slice_impact  # in shares * fraction

    # Variance of unexecuted inventory (assuming uniform execution):
    # sum_{k=0}^{n-1} (Q - k*slice_size)^2 * sigma^2/n
    unexec = np.array([Q - k * slice_size for k in range(n_slices)])
    timing_variance = (unexec**2).mean() * (sigma**2 / n_slices)

    return total_impact, np.sqrt(timing_variance)

print("Market impact for different order sizes (V=10M shares, sigma=1.5%/day):")
V, sigma = 10_000_000, 0.015
print(f"{'Order':>10}  {'POV':>8}  {'Impact (bps)':>14}")
for Q in [10_000, 50_000, 200_000, 1_000_000, 3_000_000]:
    impact, pov = sqrt_market_impact(Q, V, sigma)
    print(f"{Q:>10,}  {pov*100:>7.2f}%  {impact*10_000:>13.1f}")

print("\\nTWAP slicing trade-off (Q=500k, V=10M, sigma=1.5%):")
Q = 500_000
print(f"{'Slices':>8}  {'Impact (\\$)':>12}  {'Timing risk':>14}")
for n in [1, 5, 10, 20, 50]:
    imp, t_risk = optimal_execution_twap(Q, V, sigma, n)
    print(f"{n:>8}  {imp*100:>11.2f}  {t_risk:>14.2f}")`,
    explanation: "The square-root impact law (impact ∝ sqrt(Q/V)) is the most empirically robust finding in market microstructure: it holds across asset classes, time periods, and market conditions, arising from the concave price impact of informed order flow; the TWAP trade-off makes explicit that breaking a large order into more slices reduces market impact cost but increases timing risk from adverse price movement during execution.",
  },
];
