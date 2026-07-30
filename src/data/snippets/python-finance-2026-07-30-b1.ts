import type { Snippet } from "./types";

export const pythonFinanceSnippets20260730B1: Snippet[] = [
  {
    id: "pyfin-20260730-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter for dynamic hedge ratio in pairs trading",
    tag: "finance",
    code: `import numpy as np

# Kalman filter tracks the dynamic hedge ratio beta between two cointegrated assets.
# State: [alpha, beta]; observation: y_t = alpha + beta * x_t + e_t
# Allows beta to drift slowly (random walk state transition).

class KalmanPairsFilter:
    def __init__(self, delta=1e-4, R=1.0):
        """
        delta: state variance / measurement variance (controls tracking speed)
        R:     observation noise variance
        """
        self.delta = delta
        self.R     = R
        self.Wt    = delta / (1 - delta) * np.eye(2)  # state noise covariance
        self.Vt    = R                                   # obs noise variance
        self.theta = np.zeros(2)                         # [alpha, beta]
        self.P     = np.zeros((2, 2))                    # state covariance
        self.initialized = False

    def update(self, y, x):
        """Update filter with new observation y and predictor x."""
        F = np.array([1.0, x])   # observation matrix

        # Predict
        P_pred = self.P + self.Wt

        # Kalman gain
        S = F @ P_pred @ F + self.Vt   # scalar
        K = P_pred @ F / S             # 2x1 gain vector

        # Innovation (prediction error)
        y_hat = F @ self.theta
        innov = y - y_hat

        # Update state and covariance
        self.theta = self.theta + K * innov
        self.P     = (np.eye(2) - np.outer(K, F)) @ P_pred

        return innov, np.sqrt(S)   # spread and its std

# Simulate cointegrated pair: y = 1.5*x + noise, drifting beta
np.random.seed(42)
n = 500
x = np.cumsum(np.random.randn(n)) + 100
beta_true = 1.5 + np.cumsum(np.random.randn(n) * 0.005)  # slowly drifting
y = beta_true * x + np.random.randn(n) * 2.0

kf = KalmanPairsFilter(delta=1e-4, R=4.0)
spreads, betas = [], []
for t in range(n):
    innov, std = kf.update(y[t], x[t])
    spreads.append(innov / std)   # z-score of spread
    betas.append(kf.theta[1])

spreads = np.array(spreads)
betas   = np.array(betas)

# Trading signal: enter when |z| > 2, exit when |z| < 0.5
long_entry  = spreads < -2.0
short_entry = spreads >  2.0

print(f"Beta estimate: {betas[-1]:.4f} (true={beta_true[-1]:.4f})")
print(f"Long signals:  {long_entry.sum()}")
print(f"Short signals: {short_entry.sum()}")
print(f"Final spread z-score: {spreads[-1]:.3f}")`,
    explanation: "The Kalman filter estimates the hedge ratio as a latent state that evolves as a random walk, tracking slow structural changes in the cointegration relationship; the innovation process (actual minus predicted spread) is a zero-mean series when properly hedged, and its z-score provides a clean entry signal without look-ahead bias.",
  },
  {
    id: "pyfin-20260730-b1-student-t-copula",
    language: "python",
    title: "Student-t copula for fat-tailed joint default modelling",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as tdist, norm
from scipy.optimize import minimize_scalar

# Gaussian copula underestimates joint tail events; Student-t copula
# adds tail dependence via the degrees-of-freedom parameter nu.
# Lower nu => fatter tails => more simultaneous extreme losses.

def student_t_copula_sample(rho, nu, n_samples, n_assets=2):
    """
    Sample from a multivariate Student-t copula.
    rho:  scalar correlation (2-asset case)
    nu:   degrees of freedom (> 2 for finite variance)
    """
    # Correlation matrix
    Sigma = np.array([[1.0, rho], [rho, 1.0]])
    L = np.linalg.cholesky(Sigma)   # Cholesky for correlated Gaussians

    # Draw correlated Gaussians
    Z = np.random.randn(n_samples, n_assets) @ L.T

    # Chi-squared draw for the scaling factor
    chi2 = np.random.chisquare(nu, n_samples)
    S    = np.sqrt(nu / chi2)[:, None]  # broadcast

    # Correlated t draws
    T_draws = Z * S

    # Convert to uniform via t CDF (copula samples in [0,1]^d)
    U = tdist.cdf(T_draws, df=nu)
    return U

def joint_tail_prob(rho, nu, threshold=0.01, n_sims=500_000):
    """P(U1 < threshold AND U2 < threshold) — joint extreme loss probability."""
    U = student_t_copula_sample(rho, nu, n_sims)
    return np.mean((U[:, 0] < threshold) & (U[:, 1] < threshold))

# Compare Gaussian (nu=inf) vs Student-t copula
rho = 0.6
threshold = 0.01   # 1st percentile — simultaneous extreme losses

gaussian_joint = joint_tail_prob(rho, nu=1000)  # large nu ~ Gaussian
t5_joint       = joint_tail_prob(rho, nu=5)
t3_joint       = joint_tail_prob(rho, nu=3)

print(f"Joint P(1st %ile) with rho={rho}:")
print(f"  Gaussian copula: {gaussian_joint:.6f}")
print(f"  t(nu=5) copula:  {t5_joint:.6f}  ({t5_joint/gaussian_joint:.1f}x)")
print(f"  t(nu=3) copula:  {t3_joint:.6f}  ({t3_joint/gaussian_joint:.1f}x)")`,
    explanation: "The Student-t copula introduces tail dependence absent from the Gaussian copula: even with the same linear correlation, assets connected by a t(nu=3) copula are dramatically more likely to default simultaneously — this is why Gaussian copula models famously underpriced CDO tranches before 2008, and why regulators now require fat-tailed copulas for correlation trading books.",
  },
  {
    id: "pyfin-20260730-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory: Peaks-over-Threshold (GPD) for tail risk",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

# Peaks-over-Threshold (POT): fit a Generalized Pareto Distribution (GPD)
# to losses that exceed a high threshold u.
# GPD CDF: F(x) = 1 - (1 + xi*x/sigma)^(-1/xi)
# xi > 0: heavy tail (Pareto-like); xi=0: exponential; xi < 0: bounded.

def fit_gpd(exceedances):
    """MLE fit of GPD to exceedances above threshold."""
    # scipy's genpareto uses loc=0, c=xi, scale=sigma
    xi, loc, sigma = genpareto.fit(exceedances, floc=0)
    return xi, sigma

def gpd_var(xi, sigma, u, n_total, n_exceed, confidence=0.99):
    """VaR at confidence level from fitted GPD."""
    p_exceed = n_exceed / n_total   # empirical P(loss > u)
    # VaR_q = u + sigma/xi * ((1-q)/p_exceed)^(-xi) - 1) for xi != 0
    if abs(xi) < 1e-10:
        return u - sigma * np.log((1 - confidence) / p_exceed)
    return u + sigma / xi * ((1 - confidence) / p_exceed)**(-xi) - sigma / xi

def gpd_es(xi, sigma, var, u, n_total, n_exceed, confidence=0.99):
    """Expected Shortfall from GPD."""
    # ES = VaR / (1 - xi) + (sigma - xi*u) / (1 - xi)   for xi < 1
    if xi >= 1:
        return np.inf
    return (var + sigma - xi * u) / (1 - xi)

# Simulate heavy-tailed losses (Student-t(3) scaled)
np.random.seed(42)
losses = np.random.standard_t(df=3, size=10_000) * 0.02
losses = -losses[losses < 0]   # take negative returns as positive losses

threshold_u = np.percentile(losses, 90)   # 90th percentile as threshold
exceedances = losses[losses > threshold_u] - threshold_u
n_total, n_exceed = len(losses), len(exceedances)

xi, sigma = fit_gpd(exceedances)
var_99 = gpd_var(xi, sigma, threshold_u, n_total, n_exceed, 0.99)
es_99  = gpd_es(xi, sigma, var_99, threshold_u, n_total, n_exceed, 0.99)

print(f"GPD fit: xi={xi:.4f} (shape)  sigma={sigma:.6f} (scale)")
print(f"Threshold u = {threshold_u:.6f}")
print(f"VaR(99%) = {var_99:.6f}  ({var_99*100:.2f}% of portfolio)")
print(f"ES(99%)  = {es_99:.6f}   ({es_99*100:.2f}% of portfolio)")

# Compare to historical VaR
hist_var = np.percentile(losses, 99)
print(f"Historical VaR(99%) = {hist_var:.6f}")`,
    explanation: "EVT's POT method focuses on the tail where standard parametric models fail: by fitting a GPD only to exceedances above a high threshold, it accurately models the tail shape parameter xi without assuming Gaussian returns; xi > 0 indicates a heavy power-law tail (common in equities), which makes EVT VaR substantially larger than Gaussian VaR at extreme confidence levels.",
  },
  {
    id: "pyfin-20260730-b1-hw-simulation",
    language: "python",
    title: "Hull-White simulation for interest rate path generation",
    tag: "finance",
    code: `import numpy as np
from scipy.integrate import quad

# Hull-White: dr = (theta(t) - a*r)*dt + sigma*dW
# theta(t) = df/dt(0,t) + a*f(0,t) + sigma^2/(2a) * (1 - e^{-2at})
# where f(0,t) is the instantaneous forward rate.
# For flat initial curve r0: f(0,t) = r0 for all t.

def hw_simulate(r0, a, sigma, r_flat, T, n_paths=10_000, n_steps=252):
    """Simulate Hull-White paths using exact conditional distribution."""
    dt = T / n_steps
    # Under flat curve: theta = a*r_flat + sigma^2/(2a)*(1-exp(-2a*dt))... simplified
    theta = a * r_flat + sigma**2 / (2*a) * (1 - np.exp(-2*a*dt))

    rates = np.full(n_paths, r0)    # current short rates
    all_paths = np.zeros((n_steps + 1, n_paths))
    all_paths[0] = r0

    exp_adt = np.exp(-a * dt)
    mean_reversion = theta / a * (1 - exp_adt)
    # Conditional variance of r(t+dt) | r(t)
    cond_var = sigma**2 / (2*a) * (1 - exp_adt**2)
    cond_std = np.sqrt(cond_var)

    for i in range(n_steps):
        Z = np.random.randn(n_paths)
        rates = rates * exp_adt + mean_reversion + cond_std * Z
        all_paths[i + 1] = rates

    return all_paths

# Price ZCB via MC: P(0,T) = E[exp(-integral_0^T r dt)]
def mc_zcb_price(r0, a, sigma, r_flat, T, n_paths=50_000, n_steps=252):
    paths = hw_simulate(r0, a, sigma, r_flat, T, n_paths, n_steps)
    dt = T / n_steps
    integral_r = paths[:-1].sum(axis=0) * dt   # trapezoidal approximation
    zcb_prices = np.exp(-integral_r)
    return zcb_prices.mean(), zcb_prices.std() / np.sqrt(n_paths)

a, sigma, r0 = 0.1, 0.01, 0.03
for T in [1, 2, 5]:
    price, se = mc_zcb_price(r0, a, sigma, r0, T, n_paths=20_000)
    # Analytical benchmark (flat curve): P=exp(-r0*T) * correction
    analytical = np.exp(-r0*T + sigma**2/(4*a**3) * (1 - np.exp(-a*T))**2 * (np.exp(2*a*T)-1))
    print(f"T={T}: MC={price:.6f} +/-{1.96*se:.6f}  analytical={analytical:.6f}")`,
    explanation: "Hull-White's exact conditional distribution of r(t+dt)|r(t) avoids Euler discretisation bias: the conditional mean and variance have closed forms so each time step is drawn from the correct Gaussian without needing to refine the grid; the MC ZCB price should match the analytical formula to within statistical error, validating the simulation before it is used for path-dependent exotics.",
  },
  {
    id: "pyfin-20260730-b1-sabr-hagan",
    language: "python",
    title: "SABR model Hagan approximation for implied vol smile",
    tag: "finance",
    code: `import numpy as np

# SABR: dF = sigma * F^beta * dW1
#        dsigma = nu * sigma * dW2
#        dW1 dW2 = rho dt
# Hagan (2002) approximation: closed-form formula for BS implied vol.

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """Hagan (2002) SABR approximation for log-normal implied vol."""
    if abs(F - K) < 1e-12:   # ATM formula
        Fmid = F
        logFK = 0.0
        z = nu / alpha * Fmid**(1-beta) * logFK if logFK != 0 else 0.0
        numer = alpha
        denom = Fmid**(1-beta) * (1
            + ((1-beta)**2/24 * alpha**2 / Fmid**(2*(1-beta))
               + rho*beta*nu*alpha / (4*Fmid**(1-beta))
               + (2-3*rho**2)/24 * nu**2) * T)
        return numer / denom

    FK = F * K
    FKmid = FK**((1-beta)/2)
    logFK = np.log(F / K)

    # Leading term
    z = nu / alpha * FKmid * logFK

    # chi(z)
    chi = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    A = alpha / (FKmid * (1 + (1-beta)**2/24 * logFK**2
                           + (1-beta)**4/1920 * logFK**4))

    B = z / chi if abs(chi) > 1e-10 else 1.0

    C = 1 + ((1-beta)**2/24 * alpha**2 / FKmid**2
             + rho*beta*nu*alpha / (4*FKmid)
             + (2-3*rho**2)/24 * nu**2) * T

    return A * B * C

# Calibrate to a vol smile
F, T = 100.0, 1.0   # forward and maturity
strikes = np.array([80, 85, 90, 95, 100, 105, 110, 115, 120])
# Market implied vols (steep skew)
market_vols = np.array([0.28, 0.25, 0.23, 0.21, 0.20, 0.20, 0.205, 0.21, 0.22])

# Typical SABR parameters for equity
alpha, beta, rho, nu = 0.20, 0.5, -0.7, 0.4

sabr_vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])

print("Strike | Market IV | SABR IV   | Error")
print("-" * 45)
for K, mv, sv in zip(strikes, market_vols, sabr_vols):
    print(f"  {K:3d}  |  {mv:.4f}   |  {sv:.4f}   | {abs(mv-sv)*100:+.2f}%")`,
    explanation: "The SABR model's stochastic volatility captures the volatility smile endogenously through the correlation rho (controls skew) and vol-of-vol nu (controls smile curvature); the Hagan approximation provides a single closed-form formula for implied vol across strikes, making real-time Greeks and scenario analysis tractable without Monte Carlo simulation.",
  },
  {
    id: "pyfin-20260730-b1-hist-var-bootstrap",
    language: "python",
    title: "Historical simulation VaR with bootstrap confidence intervals",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as t_dist

# Historical simulation VaR: use actual observed P&L distribution.
# No parametric assumptions; captures fat tails, skew, and clustering.
# Bootstrap CI: resample with replacement to quantify estimation uncertainty.

def historical_var(returns, confidence=0.99):
    """Historical VaR at given confidence level (loss = positive number)."""
    losses = -returns    # convert returns to losses
    return np.percentile(losses, confidence * 100)

def historical_es(returns, confidence=0.99):
    """Historical Expected Shortfall (CVaR)."""
    losses = -returns
    var    = np.percentile(losses, confidence * 100)
    return losses[losses >= var].mean()

def bootstrap_var_ci(returns, confidence=0.99, n_bootstrap=5000, alpha=0.05):
    """Bootstrap confidence interval for VaR estimate."""
    n = len(returns)
    boot_vars = np.array([
        historical_var(np.random.choice(returns, n, replace=True), confidence)
        for _ in range(n_bootstrap)
    ])
    lo = np.percentile(boot_vars, alpha/2 * 100)
    hi = np.percentile(boot_vars, (1 - alpha/2) * 100)
    return boot_vars.mean(), lo, hi

# Simulate fat-tailed portfolio returns (t(4) distribution)
np.random.seed(42)
n_days = 1000
returns = t_dist.rvs(df=4, scale=0.012, size=n_days)

var_99    = historical_var(returns, 0.99)
var_95    = historical_var(returns, 0.95)
es_99     = historical_es(returns, 0.99)
var_mean, var_lo, var_hi = bootstrap_var_ci(returns, 0.99, n_bootstrap=2000)

print(f"Historical VaR (95%): {var_95:.4f} ({var_95*100:.2f}%)")
print(f"Historical VaR (99%): {var_99:.4f} ({var_99*100:.2f}%)")
print(f"Historical ES  (99%): {es_99:.4f}  ({es_99*100:.2f}%)")
print(f"95% CI for VaR(99%):  [{var_lo:.4f}, {var_hi:.4f}]")
print(f"CI width as % of VaR: {(var_hi-var_lo)/var_99*100:.1f}%")

# Conditional VaR scaling (square-root-of-time rule — assumes iid returns)
holding_period = 10   # days
var_10d = var_99 * np.sqrt(holding_period)
print(f"10-day VaR (sqrt rule): {var_10d:.4f}")`,
    explanation: "Historical simulation avoids distributional assumptions by using the empirical P&L distribution directly, but the bootstrap confidence interval reveals that with only 1000 days of data, the 99th percentile VaR estimate has a ±30-50% confidence range — a key reason regulators require at least 250 days and why institutions blend historical simulation with stress scenarios.",
  },
  {
    id: "pyfin-20260730-b1-cds-hazard",
    language: "python",
    title: "CDS pricing and hazard rate bootstrapping",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

# CDS: protection buyer pays spread S per year; seller pays (1-R) upon default.
# Survival probability: Q(t) = exp(-integral_0^t h(s) ds) for hazard rate h(s).
# Fair spread: S = (1-R) * sum_t PD(t) * DF(t) / sum_t Q(t) * DF(t) * dt
# where PD(t) = Q(t-1) - Q(t) is the marginal default probability.

def flat_hazard_cds_spread(h, R, maturities, df_curve):
    """CDS par spread for flat hazard rate h."""
    dt = maturities[0]   # assume equal spacing
    Q  = np.exp(-h * maturities)   # survival probs at coupon dates
    DF = np.array([df_curve(t) for t in maturities])

    # Numerator: expected loss leg (discrete sum)
    # Marginal default prob at each coupon: Q(t-dt) - Q(t) approx h*dt*Q(t)
    PD   = h * dt * Q   # approximate marginal default probability
    loss_leg = (1 - R) * np.sum(PD * DF)

    # Denominator: premium leg
    prem_leg = np.sum(Q * DF * dt)

    return loss_leg / prem_leg

def bootstrap_hazard_curve(market_spreads, maturities, R, disc_rates):
    """Bootstrap piecewise-flat hazard rates from CDS spreads."""
    dt = maturities[0]
    hazards = []
    Q_prev = 1.0   # survival prob at t=0

    for i, (T, S) in enumerate(zip(maturities, market_spreads)):
        def objective(h):
            # Q at this maturity assuming piecewise-flat h up to T
            Q_T = Q_prev * np.exp(-h * dt)
            DF  = np.exp(-disc_rates[i] * T)
            # Single-period fair spread
            PD      = Q_prev - Q_T
            loss    = (1 - R) * PD * DF
            premium = 0.5 * (Q_prev + Q_T) * DF * S * dt
            return loss - premium

        h_i = brentq(objective, 1e-6, 10.0)
        hazards.append(h_i)
        Q_prev *= np.exp(-h_i * dt)

    return np.array(hazards)

R  = 0.40   # recovery rate
mats = np.array([0.5, 1.0, 2.0, 3.0, 5.0])
disc = np.array([0.04, 0.043, 0.045, 0.046, 0.048])   # risk-free yields
cds_spreads = np.array([0.0100, 0.0120, 0.0150, 0.0170, 0.0200])  # 100-200 bps

hazards = bootstrap_hazard_curve(cds_spreads, mats, R, disc)
survival_probs = np.exp(-hazards.cumsum() * mats[0])

print("Bootstrapped CDS term structure:")
print(f"{'Mat':>5} | {'Spread':>8} | {'Hazard':>8} | {'Survival':>10}")
for m, s, h, q in zip(mats, cds_spreads, hazards, survival_probs):
    print(f"{m:5.1f} | {s*10000:7.1f}bp | {h*100:7.4f}% | {q:10.6f}")`,
    explanation: "CDS hazard rate bootstrapping is an exact analogy of yield curve bootstrapping: given the CDS spread at maturity T, solve for the hazard rate h that makes the premium leg equal the loss leg, conditioning on survival probabilities already calibrated to shorter maturities; the bootstrapped hazard curve is then used to price off-market CDS, calculate default-adjusted bond yields, and compute CVA.",
  },
  {
    id: "pyfin-20260730-b1-mvp-frontier",
    language: "python",
    title: "Mean-variance efficient frontier via scipy.optimize",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Markowitz (1952): minimise portfolio variance subject to target return.
# Sweep over target returns to trace the efficient frontier.

def portfolio_stats(w, mu, cov):
    ret = w @ mu
    vol = np.sqrt(w @ cov @ w)
    return ret, vol

def min_variance_portfolio(mu, cov, target_ret):
    n = len(mu)
    constraints = [
        {'type': 'eq', 'fun': lambda w: w.sum() - 1},
        {'type': 'eq', 'fun': lambda w: w @ mu - target_ret},
    ]
    bounds = [(-0.5, 1.5)] * n   # allow moderate short selling
    w0 = np.ones(n) / n
    res = minimize(lambda w: w @ cov @ w, w0,
                   method='SLSQP', bounds=bounds, constraints=constraints,
                   options={'ftol': 1e-12, 'maxiter': 1000})
    return res.x if res.success else None

# 5 assets: US equity, EU equity, EM equity, Bonds, Gold
mu  = np.array([0.10, 0.08, 0.12, 0.04, 0.06])
cov = np.array([
    [0.040, 0.018, 0.020, -0.004, 0.005],
    [0.018, 0.036, 0.015, -0.003, 0.004],
    [0.020, 0.015, 0.064, -0.002, 0.006],
    [-0.004,-0.003,-0.002, 0.0016,-0.001],
    [0.005, 0.004, 0.006, -0.001, 0.018],
])

# Global minimum variance portfolio (no target return constraint)
res_gmv = minimize(lambda w: w @ cov @ w, np.ones(5)/5,
                   method='SLSQP',
                   bounds=[(-0.5, 1.5)]*5,
                   constraints=[{'type': 'eq', 'fun': lambda w: w.sum()-1}])
w_gmv = res_gmv.x
ret_gmv, vol_gmv = portfolio_stats(w_gmv, mu, cov)
print(f"GMV portfolio: ret={ret_gmv:.4f}  vol={vol_gmv:.4f}  SR={ret_gmv/vol_gmv:.2f}")

# Efficient frontier
target_rets = np.linspace(ret_gmv, 0.115, 20)
print("\\nEfficient Frontier:")
print(f"{'Return':>8} | {'Vol':>8} | {'Sharpe':>8}")
for target in target_rets:
    w = min_variance_portfolio(mu, cov, target)
    if w is not None:
        r, v = portfolio_stats(w, mu, cov)
        sr = (r - 0.03) / v   # excess Sharpe (rf=3%)
        print(f"{r:8.4f} | {v:8.4f} | {sr:8.4f}")`,
    explanation: "The efficient frontier is computed by parametrically solving the QP for each target return; the global minimum variance (GMV) portfolio anchors the left end of the frontier and is found without the return constraint — below the GMV return, the frontier folds back and is dominated, forming the 'minimum variance frontier' but not the 'efficient' subset.",
  },
  {
    id: "pyfin-20260730-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel yield curve fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Nelson-Siegel (1987): 3-factor model for yield curve.
# r(T) = b0 + b1 * (1-e^{-T/tau}) / (T/tau)
#           + b2 * ((1-e^{-T/tau})/(T/tau) - e^{-T/tau})
# b0: long-run level, b1: slope, b2: hump, tau: decay factor.

def nelson_siegel(T, b0, b1, b2, tau):
    T = np.asarray(T, dtype=float)
    x = T / tau
    with np.errstate(divide='ignore', invalid='ignore'):
        f1 = np.where(x > 1e-8, (1 - np.exp(-x)) / x, 1.0 - x/2)
        f2 = f1 - np.exp(-x)
    return b0 + b1 * f1 + b2 * f2

def fit_ns(maturities, yields):
    def objective(params):
        b0, b1, b2, tau = params
        if tau <= 0: return 1e10
        fitted = nelson_siegel(maturities, b0, b1, b2, tau)
        return np.sum((fitted - yields)**2)

    best, best_res = None, None
    for tau0 in [0.5, 1.0, 2.0, 5.0]:
        y0 = yields[-1]   # long-run level ~= longest yield
        x0 = [y0, yields[0]-y0, 0.0, tau0]
        res = minimize(objective, x0, method='Nelder-Mead',
                       options={'xatol': 1e-8, 'fatol': 1e-10, 'maxiter': 5000})
        if best_res is None or res.fun < best_res.fun:
            best_res = res
    return best_res.x

# US Treasury curve (illustrative)
mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.053, 0.052, 0.050, 0.047, 0.045, 0.043, 0.042, 0.041, 0.040, 0.039])

b0, b1, b2, tau = fit_ns(mats, yields)
fitted = nelson_siegel(mats, b0, b1, b2, tau)

print(f"Nelson-Siegel parameters:")
print(f"  b0 (level)={b0:.4f}  b1 (slope)={b1:.4f}  b2 (hump)={b2:.4f}  tau={tau:.3f}")
print(f"  RMSE = {np.sqrt(np.mean((fitted-yields)**2))*10000:.2f} bps")
print(f"\\n{'Mat':>5} | {'Market':>8} | {'Fitted':>8} | {'Error bps':>10}")
for m, y, f in zip(mats, yields, fitted):
    print(f"{m:5.2f} | {y*100:7.3f}% | {f*100:7.3f}% | {(f-y)*10000:+9.2f}")`,
    explanation: "Nelson-Siegel's three factors have direct economic interpretations: b0 is the long-run level (10-year yield as proxy), b1 is the slope (2s10s spread), and b2 is the curvature (butterfly trade signal); the model fits most observed yield curves with 4 parameters and is the standard at central banks and for risk-neutral rate extrapolation beyond the last liquid tenor.",
  },
  {
    id: "pyfin-20260730-b1-carry-signal",
    language: "python",
    title: "FX carry trade signal: forward premium construction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# FX carry: borrow in low-rate currency, invest in high-rate currency.
# Carry = forward discount = (F - S) / S = (r_d - r_f) * T approximately.
# Uncovered Interest Parity (UIP) predicts carry = 0; empirically it earns.

def compute_carry(spot, rate_domestic, rate_foreign, T=1/12):
    """
    spot: S (units of domestic per foreign)
    rate_domestic, rate_foreign: annual rates
    T: horizon in years (default 1 month)
    Carry = implied return from holding foreign bond vs domestic.
    """
    # Forward rate (covered interest parity)
    forward = spot * (1 + rate_domestic * T) / (1 + rate_foreign * T)
    # Carry = forward discount of foreign currency
    carry = (spot - forward) / spot  # positive = foreign currency at discount
    return carry, forward

# Simulate 6 currency pairs against USD
np.random.seed(42)
currencies = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF']
spot_rates   = np.array([1.085, 1.265, 149.5, 0.648, 1.362, 0.905])
dom_rate     = 0.053   # USD rate
foreign_rates = np.array([0.040, 0.052, 0.001, 0.044, 0.050, 0.015])

carries = []
for i, ccy in enumerate(currencies):
    carry, fwd = compute_carry(spot_rates[i], dom_rate, foreign_rates[i])
    carries.append(carry)
    print(f"{ccy}: spot={spot_rates[i]:.4f}  fwd={fwd:.4f}  "
          f"carry={carry*100:+.3f}%/mo  ({carry*1200:+.1f}%/yr)")

carries = np.array(carries)

# Simple carry strategy: long top-3 carry, short bottom-3
rank = np.argsort(carries)[::-1]   # descending carry
long_ccy  = [currencies[i] for i in rank[:3]]
short_ccy = [currencies[i] for i in rank[3:]]

print(f"\\nLong  (high carry): {long_ccy}")
print(f"Short (low carry):  {short_ccy}")

# Simulate 1-month returns (risk = spot moves against carry)
spot_changes = np.random.normal(0, 0.02, 6)   # monthly spot vol ~2%
carry_returns = carries + spot_changes
strategy_return = carry_returns[rank[:3]].mean() - carry_returns[rank[3:]].mean()
print(f"Strategy return (1 month sim): {strategy_return*100:.3f}%")`,
    explanation: "FX carry exploits the empirical failure of Uncovered Interest Parity: high-yielding currencies do not depreciate as much as their forward rates imply, earning the interest differential in addition to spot appreciation; the strategy's Sharpe ratio is historically around 0.5-0.7 but with severe crash risk — during risk-off episodes, high-yield currencies depreciate sharply as carry trades are unwound.",
  },
  {
    id: "pyfin-20260730-b1-twap-simulation",
    language: "python",
    title: "TWAP and VWAP execution algorithm simulation",
    tag: "finance",
    code: `import numpy as np

# TWAP: time-weighted average price — trade equal-sized slices each interval.
# VWAP: volume-weighted average price — target market participation rate.
# Both measure execution quality vs the day's VWAP benchmark.

def simulate_market(n_periods=24, daily_volume=1_000_000, drift=0, vol=0.01):
    """Simulate intraday price and volume."""
    # U-shaped volume pattern (high at open/close)
    t = np.linspace(0, 1, n_periods)
    volume_profile = 1 + 1.5 * np.sin(np.pi * t - np.pi/2)**2
    volume_profile /= volume_profile.sum()
    volumes = (volume_profile * daily_volume).astype(int)

    # Price path
    prices = 100 * np.cumprod(1 + np.random.randn(n_periods) * vol + drift)
    return prices, volumes

def twap_execution(target_qty, prices, n_periods=24):
    """Execute equal slices each period."""
    slice_qty = target_qty // n_periods
    fills = []
    total_qty = 0
    for i in range(n_periods):
        qty = slice_qty if total_qty + slice_qty <= target_qty else target_qty - total_qty
        if qty > 0:
            # Assume we get mid-price with half-spread slippage
            fill_price = prices[i] * (1 + 0.0001)  # 1 bp slippage
            fills.append((qty, fill_price))
            total_qty += qty
    return fills

def vwap_execution(target_qty, prices, volumes, participation_rate=0.05):
    """Participate at fixed fraction of each period's volume."""
    fills = []
    total_qty = 0
    for price, vol in zip(prices, volumes):
        if total_qty >= target_qty: break
        qty = min(int(vol * participation_rate), target_qty - total_qty)
        if qty > 0:
            fill_price = price * (1 + 0.0001)
            fills.append((qty, fill_price))
            total_qty += qty
    return fills

def vwap_benchmark(prices, volumes):
    return np.dot(prices, volumes) / volumes.sum()

np.random.seed(42)
prices, volumes = simulate_market(n_periods=24)
market_vwap = vwap_benchmark(prices, volumes)

target_qty = 50_000

twap_fills = twap_execution(target_qty, prices)
vwap_fills = vwap_execution(target_qty, prices, volumes)

def execution_price(fills):
    total_pv = sum(q*p for q,p in fills)
    total_q  = sum(q   for q,_ in fills)
    return total_pv / total_q

twap_px = execution_price(twap_fills)
vwap_px = execution_price(vwap_fills)

print(f"Market VWAP:     {market_vwap:.4f}")
print(f"TWAP exec price: {twap_px:.4f}  slippage vs VWAP: {(twap_px-market_vwap)/market_vwap*10000:+.2f} bps")
print(f"VWAP exec price: {vwap_px:.4f}  slippage vs VWAP: {(vwap_px-market_vwap)/market_vwap*10000:+.2f} bps")`,
    explanation: "VWAP minimises implementation shortfall vs the day's volume-weighted benchmark by trading heavier when the market is more liquid, matching the natural U-shaped intraday volume pattern; TWAP ignores volume and can accidentally trade into thin markets, increasing market impact — comparing both to the independent market VWAP reveals implementation shortfall.",
  },
  {
    id: "pyfin-20260730-b1-momentum-factor",
    language: "python",
    title: "12-1 month cross-sectional momentum factor construction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Jegadeesh-Titman (1993) momentum: sort stocks by past 12-1 month return
# (skip most recent month to avoid short-term reversal).
# Long top decile (winners), short bottom decile (losers).
# Monthly rebalancing; equal-weighted within decile.

np.random.seed(42)

# Simulate 3 years of monthly returns for 100 stocks
n_months = 36
n_stocks = 100
# True momentum: stocks with high past return tend to continue
returns = np.random.randn(n_months, n_stocks) * 0.05 + 0.005

# Introduce momentum: add autocorrelation in cross-section
for t in range(12, n_months):
    past_12_1 = returns[t-12:t-1].sum(axis=0)   # 12-1 month return
    returns[t] += 0.005 * np.sign(past_12_1)     # momentum alpha

def momentum_signal(returns, t, lookback=12, skip=1):
    """Compute 12-1 month cumulative return at time t."""
    return returns[t - lookback: t - skip].sum(axis=0)

# Backtest: rebalance monthly
strategy_returns = []
for t in range(12, n_months):
    sig = momentum_signal(returns, t)
    rank = np.argsort(sig)
    # Long top decile (10 stocks), short bottom decile
    long_leg  = rank[-10:]
    short_leg = rank[:10]

    # Next period return
    next_ret  = returns[t]
    long_ret  = next_ret[long_leg].mean()
    short_ret = next_ret[short_leg].mean()
    strategy_returns.append(long_ret - short_ret)

strategy_returns = np.array(strategy_returns)
ann_ret  = strategy_returns.mean() * 12
ann_vol  = strategy_returns.std()  * np.sqrt(12)
sharpe   = ann_ret / ann_vol
max_dd   = np.min(np.cumsum(strategy_returns)
                  - np.maximum.accumulate(np.cumsum(strategy_returns)))

print(f"Momentum factor (12-1 month, decile):")
print(f"  Annualised return: {ann_ret*100:.2f}%")
print(f"  Annualised vol:    {ann_vol*100:.2f}%")
print(f"  Sharpe ratio:      {sharpe:.2f}")
print(f"  Max drawdown:      {max_dd*100:.2f}%")
print(f"  Win rate:          {(strategy_returns>0).mean()*100:.1f}%")`,
    explanation: "The 12-1 month momentum construction skips the most recent month to avoid the microstructure reversal that dominates at 1-week horizons; equal-weighting within deciles avoids mega-cap concentration, and the long-short construction is market-neutral, isolating the cross-sectional momentum premium from broad market exposure.",
  },
  {
    id: "pyfin-20260730-b1-kelly-sizing",
    language: "python",
    title: "Kelly criterion and fractional Kelly for position sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

# Kelly criterion: maximise E[log(wealth)] -> optimal bet fraction f*.
# Continuous Kelly: f* = mu / sigma^2 (Sharpe^2 / sigma) — for log-normal returns.
# In practice: use fractional Kelly (e.g., half-Kelly) to reduce drawdowns.

def kelly_continuous(mu, sigma):
    """Kelly fraction for continuous return stream with mean mu, std sigma."""
    return mu / sigma**2

def kelly_discrete(p_win, win_fraction, loss_fraction):
    """Kelly fraction for binary bet: win fraction W with prob p, lose fraction L with 1-p."""
    # f* = p/L - (1-p)/W  (classic Kelly formula)
    return p / loss_fraction - (1 - p_win) / win_fraction

def growth_rate(f, mu, sigma):
    """Expected log-growth rate for fraction f of Kelly."""
    return f * mu - 0.5 * f**2 * sigma**2

def simulate_kelly(f, mu, sigma, n_periods=1000, n_sims=500):
    """Simulate wealth paths for a given Kelly fraction."""
    log_rets = np.random.normal(f*mu - 0.5*f**2*sigma**2, f*sigma,
                                 (n_sims, n_periods))
    log_wealth = np.cumsum(log_rets, axis=1)
    return np.exp(log_wealth)

# Strategy with mu=15%/yr, sigma=20%/yr
mu, sigma = 0.15, 0.20
f_kelly = kelly_continuous(mu, sigma)
f_half  = f_kelly / 2

g_kelly  = growth_rate(f_kelly, mu, sigma)
g_half   = growth_rate(f_half, mu, sigma)
g_100pct = growth_rate(1.0, mu, sigma)   # full capital

print(f"Strategy: mu={mu:.0%}/yr  sigma={sigma:.0%}/yr")
print(f"Full Kelly fraction:     f* = {f_kelly:.4f} ({f_kelly*100:.1f}% of capital)")
print(f"Expected log-growth:     g(f*) = {g_kelly:.4f}/yr")
print(f"Half Kelly:              f/2 = {f_half:.4f}")
print(f"Expected log-growth:     g(f/2) = {g_half:.4f}/yr  ({g_half/g_kelly*100:.0f}% of optimal)")
print(f"100% allocation:         g(1) = {g_100pct:.4f}/yr")

# Simulate wealth distributions
np.random.seed(42)
wealth_kelly  = simulate_kelly(f_kelly, mu, sigma)
wealth_half   = simulate_kelly(f_half, mu, sigma)

print(f"\\n1000-period simulation (500 paths):")
print(f"Full Kelly  median wealth: {np.median(wealth_kelly[:,-1]):.2f}  "
      f"ruin rate: {(wealth_kelly[:,-1]<0.1).mean():.3f}")
print(f"Half Kelly  median wealth: {np.median(wealth_half[:,-1]):.2f}  "
      f"ruin rate: {(wealth_half[:,-1]<0.1).mean():.3f}")`,
    explanation: "The Kelly criterion maximises the long-run growth rate of wealth but leads to large drawdowns that are psychologically difficult to sustain; the half-Kelly captures 75% of the optimal growth rate (the growth function is quadratic in f, so f/2 gives g*/2 + g*/4 = 3g*/4... actually g(f/2) = 3/4 * g(f*)) with dramatically smaller drawdowns, which is why institutional allocators almost always implement fractional Kelly.",
  },
  {
    id: "pyfin-20260730-b1-johansen",
    language: "python",
    title: "Johansen cointegration test for pairs selection",
    tag: "finance",
    code: `import numpy as np
from statsmodels.tsa.vector_ar.vecm import coint_johansen

# Johansen (1988): multivariate test for cointegrating relationships.
# Tests rank r of the VECM: ΔX_t = Pi*X_{t-1} + Gamma*ΔX_{t-1} + e_t
# where rank(Pi) = r = number of cointegrating vectors.
# More powerful than Engle-Granger for k > 2 series.

np.random.seed(42)
n = 500

# Simulate 3 cointegrated series: one common stochastic trend
trend = np.cumsum(np.random.randn(n))       # I(1) common factor
e1, e2, e3 = [np.random.randn(n)*0.5 for _ in range(3)]

# X1 = trend + e1, X2 = 1.5*trend + e2, X3 = 0.8*trend - 0.5*X2_resid + e3
X1 = trend + e1
X2 = 1.5 * trend + e2
X3 = 0.8 * trend - 0.5 * e2 + e3  # weakly linked to X2

data = np.column_stack([X1, X2, X3])

# Run Johansen test
result = coint_johansen(data, det_order=0, k_ar_diff=1)

print("Johansen Cointegration Test")
print("=" * 50)
print(f"Trace statistics:      {result.lr1.round(4)}")
print(f"Max eigenvalue stats:  {result.lr2.round(4)}")
print(f"Critical values (90%, 95%, 99%) for trace:")
print(result.cvt.round(4))
print()

# Cointegrating vectors (eigenvectors of Pi)
print("Cointegrating vectors (normalised):")
for i in range(result.evec.shape[1]):
    vec = result.evec[:, i]
    vec /= vec[0]   # normalise to first element = 1
    print(f"  CV{i+1}: {vec.round(4)}")

# Implied hedge ratios from first cointegrating vector
cv = result.evec[:, 0]
print(f"\\nFirst cointegrating vector hedge ratios:")
print(f"  {cv[0]:.4f} * X1 + {cv[1]:.4f} * X2 + {cv[2]:.4f} * X3 = stationary")

# Spread constructed from first CV
spread = data @ cv
print(f"Spread stationarity: mean={spread.mean():.4f}  std={spread.std():.4f}")`,
    explanation: "Johansen's test is preferred over Engle-Granger for three or more series because it simultaneously estimates the number of cointegrating relationships (the rank r) and the cointegrating vectors, whereas Engle-Granger requires pre-specifying the dependent variable; the cointegrating vectors provide the hedge ratios for a market-neutral spread that should be mean-reverting.",
  },
  {
    id: "pyfin-20260730-b1-garch-mle",
    language: "python",
    title: "GARCH(1,1) maximum likelihood estimation from scratch",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# GARCH(1,1): sigma_t^2 = omega + alpha*e_{t-1}^2 + beta*sigma_{t-1}^2
# Stationarity: alpha + beta < 1
# Unconditional variance: omega / (1 - alpha - beta)

def garch_log_likelihood(params, returns):
    """Negative log-likelihood for GARCH(1,1)."""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10

    n    = len(returns)
    sig2 = np.zeros(n)
    # Init variance = unconditional variance
    sig2[0] = omega / (1 - alpha - beta)

    for t in range(1, n):
        sig2[t] = omega + alpha * returns[t-1]**2 + beta * sig2[t-1]

    # Gaussian log-likelihood: -0.5 * sum(log(sig2) + r^2/sig2)
    ll = -0.5 * np.sum(np.log(sig2) + returns**2 / sig2)
    return -ll   # return negative for minimisation

def fit_garch(returns):
    """Fit GARCH(1,1) via MLE with multiple starts."""
    best = None
    for omega0 in [1e-5, 1e-4]:
        for alpha0 in [0.05, 0.10]:
            for beta0 in [0.80, 0.88]:
                x0 = [omega0, alpha0, beta0]
                res = minimize(garch_log_likelihood, x0, args=(returns,),
                               method='L-BFGS-B',
                               bounds=[(1e-8, 0.1), (1e-8, 0.5), (1e-8, 0.999)])
                if best is None or res.fun < best.fun:
                    best = res
    return best.x

# Simulate GARCH(1,1) returns
np.random.seed(42)
n, omega_true, alpha_true, beta_true = 2000, 1e-5, 0.08, 0.90
sig2 = np.zeros(n)
sig2[0] = omega_true / (1 - alpha_true - beta_true)
returns = np.zeros(n)
for t in range(1, n):
    sig2[t] = omega_true + alpha_true * returns[t-1]**2 + beta_true * sig2[t-1]
    returns[t] = np.sqrt(sig2[t]) * np.random.randn()

omega_est, alpha_est, beta_est = fit_garch(returns)
print(f"True:      omega={omega_true:.2e}  alpha={alpha_true:.4f}  beta={beta_true:.4f}")
print(f"Estimated: omega={omega_est:.2e}  alpha={alpha_est:.4f}  beta={beta_est:.4f}")
print(f"Persistence: alpha+beta={alpha_est+beta_est:.4f} (true={alpha_true+beta_true:.4f})")
print(f"Uncond. vol: {np.sqrt(omega_est/(1-alpha_est-beta_est))*np.sqrt(252)*100:.2f}% annualised")`,
    explanation: "GARCH(1,1) MLE requires the likelihood recursion to run forward through the data because each variance depends on the previous one; the persistence parameter alpha+beta determines how quickly volatility mean-reverts — values close to 1 indicate persistent volatility clustering, common in equity returns, and imply a slow half-life of volatility shocks.",
  },
  {
    id: "pyfin-20260730-b1-correlated-mc-var",
    language: "python",
    title: "Correlated multi-asset Monte Carlo for portfolio VaR",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

# Portfolio VaR via Monte Carlo: simulate correlated returns using
# Cholesky decomposition of the covariance matrix.
# P&L = sum_i w_i * S_i * r_i; VaR = -q_alpha(P&L distribution)

def mc_portfolio_var(weights, S0_vals, mu, cov, horizon=1/252,
                     n_sims=200_000, confidence=0.99):
    """
    weights:    portfolio weights (fractions)
    S0_vals:    current prices
    mu:         daily drift (usually set to 0 for short horizons)
    cov:        daily covariance matrix
    """
    n = len(weights)
    # Dollar exposures
    exposures = weights * S0_vals   # $ per unit

    # Cholesky decomposition for correlated sampling
    L = np.linalg.cholesky(cov * horizon)

    # Simulate returns
    Z = np.random.randn(n_sims, n)
    corr_returns = Z @ L.T + mu * horizon   # shape (n_sims, n)

    # Portfolio P&L
    pnl = corr_returns @ exposures   # shape (n_sims,)

    var = -np.percentile(pnl, (1 - confidence) * 100)
    es  = -pnl[pnl <= -var].mean()
    return var, es, pnl

# 3-asset portfolio
weights = np.array([0.5, 0.3, 0.2])
S0      = np.array([100., 200., 50.])
mu_d    = np.array([0.0, 0.0, 0.0])   # zero drift for VaR
vol_d   = np.array([0.015, 0.012, 0.02])   # daily vols
corr    = np.array([[1.0, 0.6, 0.3],
                    [0.6, 1.0, 0.2],
                    [0.3, 0.2, 1.0]])
cov_d   = np.outer(vol_d, vol_d) * corr

portfolio_value = (weights * S0).sum()  # total portfolio $

var_1d, es_1d, pnl = mc_portfolio_var(weights, S0, mu_d, cov_d)
var_10d = var_1d * np.sqrt(10)   # 10-day scaling

# Parametric VaR benchmark (assumes normality)
port_vol_d = np.sqrt(weights @ (np.outer(S0, S0) * cov_d) @ weights)
param_var   = port_vol_d * norm.ppf(0.99)

print(f"Portfolio value: \${portfolio_value:.0f}")
print(f"MC 1-day VaR (99%):  \${var_1d:.2f}  ({var_1d/portfolio_value*100:.2f}%)")
print(f"MC 1-day ES  (99%):  \${es_1d:.2f}  ({es_1d/portfolio_value*100:.2f}%)")
print(f"MC 10-day VaR (99%): \${var_10d:.2f}")
print(f"Parametric VaR:      \${param_var:.2f}  (normal assumption)")`,
    explanation: "Cholesky decomposition of the covariance matrix provides the unique lower-triangular transformation that maps independent Gaussian draws into correlated portfolio returns; the MC approach naturally captures skew and kurtosis from non-Gaussian marginals (by substituting t-distributed or historical draws) while maintaining the correlation structure, unlike the parametric VaR's normality assumption.",
  },
  {
    id: "pyfin-20260730-b1-irs-pricing",
    language: "python",
    title: "Interest rate swap NPV: fixed-vs-floating leg pricing",
    tag: "finance",
    code: `import numpy as np

# Plain vanilla IRS: fixed payer pays rate K quarterly; receives LIBOR/SOFR.
# Fixed leg PV  = K * tau * sum_i DF(t_i)
# Float leg PV  = sum_i (F(t_{i-1},t_i) * tau * DF(t_i))
# where F is the forward rate and DF the discount factor.
# At inception: K (par swap rate) is set so NPV = 0.

def discount_factor(t, zero_rates):
    """Linear interpolation of zero curve."""
    mats = np.array(sorted(zero_rates.keys()))
    rates = np.array([zero_rates[m] for m in mats])
    r = np.interp(t, mats, rates)
    return np.exp(-r * t)

def forward_rate(t1, t2, zero_rates, tau=None):
    """Simply-compounded forward rate from t1 to t2."""
    if tau is None:
        tau = t2 - t1
    df1 = discount_factor(t1, zero_rates)
    df2 = discount_factor(t2, zero_rates)
    return (df1 / df2 - 1) / tau

def swap_npv(K, notional, pay_dates, zero_rates):
    """NPV of fixed-payer IRS (positive = receiver)."""
    tau = np.diff([0.0] + list(pay_dates))   # accrual fractions
    dfs = np.array([discount_factor(t, zero_rates) for t in pay_dates])

    # Fixed leg: K * tau * DF
    fixed_leg = K * np.sum(tau * dfs) * notional

    # Float leg: sum of forward rates * tau * DF
    float_leg = 0.0
    prev_t = 0.0
    for i, t in enumerate(pay_dates):
        F = forward_rate(prev_t, t, zero_rates, tau[i])
        float_leg += F * tau[i] * dfs[i]
        prev_t = t
    float_leg *= notional

    return float_leg - fixed_leg   # NPV to fixed payer

def par_swap_rate(pay_dates, zero_rates):
    """Swap rate K* such that NPV = 0."""
    tau = np.diff([0.0] + list(pay_dates))
    dfs = np.array([discount_factor(t, zero_rates) for t in pay_dates])
    annuity = np.sum(tau * dfs)

    float_pv = 0.0
    prev_t = 0.0
    for i, t in enumerate(pay_dates):
        F = forward_rate(prev_t, t, zero_rates, tau[i])
        float_pv += F * tau[i] * dfs[i]
        prev_t = t

    return float_pv / annuity

# USD zero curve (annual, interpolate)
zero_curve = {0.25: 0.053, 0.5: 0.052, 1: 0.050, 2: 0.047,
              3: 0.045, 5: 0.043, 7: 0.042, 10: 0.041}
notional = 10_000_000   # $10M
pay_dates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]   # quarterly for 2yr

K_par = par_swap_rate(pay_dates, zero_curve)
print(f"2yr quarterly par swap rate: {K_par*100:.4f}%")

# Value a swap entered at an off-market rate
K_off = 0.049   # slightly off-market
npv = swap_npv(K_off, notional, pay_dates, zero_curve)
dv01 = (swap_npv(K_off + 0.0001, notional, pay_dates, zero_curve)
      - swap_npv(K_off - 0.0001, notional, pay_dates, zero_curve)) / 2
print(f"Off-market swap (K={K_off*100:.2f}%) NPV: \${npv:,.0f}")
print(f"DV01: \${dv01:,.0f} per bp")`,
    explanation: "The fixed leg of an IRS is priced like a bond (sum of discounted fixed coupons) and the floating leg reduces to 1 - DF(T) for a par float, since each SOFR setting re-prices the floating bond to par at reset; the par swap rate is found by equating the two legs analytically — the ratio of the float PV to the annuity factor — without solving a non-linear equation.",
  },
  {
    id: "pyfin-20260730-b1-pca-yield-curve",
    language: "python",
    title: "PCA on yield curve changes for risk factor decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# Yield curve PCA: first 3 PCs explain >95% of yield moves.
# PC1 = parallel shift (level), PC2 = twist (slope), PC3 = butterfly (curvature).
# Used for: factor VaR, scenario analysis, DV01 by PC rather than by tenor.

np.random.seed(42)

# Simulate 2 years of daily yield curve changes (10 tenors)
tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
n_days = 500

# Level, slope, curvature factors
level   = np.random.randn(n_days) * 0.003     # ±30bp parallel shift
slope   = np.random.randn(n_days) * 0.002     # ±20bp twist
curve   = np.random.randn(n_days) * 0.001     # ±10bp butterfly

# Yield changes = loadings * factors + idiosyncratic noise
loadings_level = np.ones(10) * 1.0
loadings_slope = np.linspace(-0.5, 0.5, 10)   # short-end negative, long-end positive
loadings_curve = -(tenors - tenors.mean())**2; loadings_curve /= loadings_curve.std()

dY = (np.outer(level, loadings_level)
    + np.outer(slope, loadings_slope)
    + np.outer(curve, loadings_curve)
    + np.random.randn(n_days, 10) * 0.0003)   # idio noise

# Fit PCA
pca = PCA(n_components=5)
pca.fit(dY)

print("Explained variance by PC:")
for i, ev in enumerate(pca.explained_variance_ratio_):
    print(f"  PC{i+1}: {ev*100:.2f}%  (cumul: {pca.explained_variance_ratio_[:i+1].sum()*100:.2f}%)")

print("\\nPC loadings (economic interpretation):")
for i in range(3):
    pc = pca.components_[i]
    labels = ["Level", "Twist", "Butterfly"]
    print(f"  PC{i+1} ({labels[i]}): {pc.round(3)}")

# Reconstruct yield moves using 3 PCs
scores = pca.transform(dY)[:, :3]
reconstructed = pca.inverse_transform(
    np.column_stack([scores, np.zeros((n_days, 2))])
)
resid_var = np.var(dY - reconstructed, axis=0)
print(f"\\nResidual variance after 3 PCs: {resid_var.mean()*1e8:.2f} x10^-8 (bps^2)")`,
    explanation: "Yield curve PCA reduces a 10-tenor position to 3 risk factors that explain over 95% of daily moves: parallel shifts (hedged with duration), slope changes (hedged with a 2s10s steepener), and butterfly moves (hedged with a 2s5s10s trade); factor VaR using PC scores is dramatically more stable than tenor-by-tenor VaR because the PCs are orthogonal by construction.",
  },
  {
    id: "pyfin-20260730-b1-cva-mc",
    language: "python",
    title: "CVA (Credit Valuation Adjustment) via Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

# CVA: adjustment to fair value of a derivative for counterparty default risk.
# CVA = (1 - R) * sum_t DF(t) * EE(t) * PD(t,t+dt)
# EE(t) = E[max(V(t), 0)] = Expected Exposure at time t
# PD(t,t+dt) = marginal default probability

def bs_call(S, K, T, r, sigma):
    if T <= 0: return max(S - K, 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def compute_cva(S0, K, T, r, sigma, hazard_rate, recovery,
                n_paths=50_000, n_steps=50):
    """
    Compute CVA for a European call option.
    Assumes counterparty has flat hazard rate h (constant PD).
    """
    dt = T / n_steps
    t_grid = np.linspace(dt, T, n_steps)

    # Simulate S paths
    log_returns = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*np.random.randn(n_paths, n_steps)
    log_S = np.log(S0) + np.cumsum(log_returns, axis=1)
    S_paths = np.exp(log_S)   # shape (n_paths, n_steps)

    # At each time step, compute expected exposure
    # EE(t) = E[call value | survive to t] = E[max(V(t),0)]
    cva = 0.0
    for i, t in enumerate(t_grid):
        S_t  = S_paths[:, i]
        tau  = T - t   # remaining time to maturity
        # Value of option at time t conditional on spot S_t
        V_t  = np.array([bs_call(s, K, tau, r, sigma) for s in S_t[:100]])  # sample for speed
        EE_t = np.maximum(V_t, 0).mean()

        DF_t   = np.exp(-r * t)
        # Marginal PD for interval [t, t+dt]
        PD_t   = hazard_rate * np.exp(-hazard_rate * t) * dt

        cva += (1 - recovery) * DF_t * EE_t * PD_t

    return cva

# Clean option price vs CVA-adjusted price
S0, K, T, r, sigma = 100, 100, 1.0, 0.05, 0.20
clean_price = bs_call(S0, K, T, r, sigma)

cva = compute_cva(S0, K, T, r, sigma,
                  hazard_rate=0.02, recovery=0.40,
                  n_paths=5000, n_steps=20)

print(f"Clean call price:      {clean_price:.4f}")
print(f"CVA adjustment:        {cva:.4f}")
print(f"CVA-adjusted price:    {clean_price - cva:.4f}")
print(f"CVA as % of clean:     {cva/clean_price*100:.2f}%")`,
    explanation: "CVA is the risk-neutral expected cost of counterparty default, computed as the discounted integral of expected positive exposure weighted by the marginal probability of default; the Expected Exposure profile for a call option peaks around the money before maturity and drops to zero at expiry, concentrating CVA at intermediate horizons rather than at the final maturity.",
  },
  {
    id: "pyfin-20260730-b1-bond-futures-ctd",
    language: "python",
    title: "Bond futures cheapest-to-deliver (CTD) and basis",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

# Bond futures: seller delivers any bond from a basket.
# Conversion factor (CF) normalises each bond to a 6% coupon.
# Cheapest to deliver (CTD) = bond with lowest invoice price / futures price.
# Basis = cash price - CF * futures price; CTD has minimum basis.

def bond_price(ytm, coupon, face, maturity, freq=2):
    """Clean price of a bond at given YTM."""
    n = int(maturity * freq)
    c = coupon * face / freq
    r = ytm / freq
    t = np.arange(1, n+1)
    pv = c * (1 - (1+r)**-n) / r + face * (1+r)**-n
    return pv

def conversion_factor(coupon, maturity, futures_coupon=0.06, freq=2):
    """CF = price of bond at futures_coupon rate, normalised to par."""
    return bond_price(futures_coupon, coupon, 1.0, maturity, freq)

def ytm_solver(price, coupon, face, maturity, freq=2):
    return brentq(lambda y: bond_price(y, coupon, face, maturity, freq) - price,
                  1e-6, 2.0)

# Bond basket for a 10-year Treasury futures contract
bonds = [
    {'name': 'Bond-A', 'coupon': 0.025, 'maturity': 9.5, 'price': 88.50},
    {'name': 'Bond-B', 'coupon': 0.030, 'maturity': 10.0, 'price': 92.25},
    {'name': 'Bond-C', 'coupon': 0.035, 'maturity': 10.5, 'price': 96.00},
    {'name': 'Bond-D', 'coupon': 0.040, 'maturity': 9.75, 'price': 99.80},
]

futures_price = 94.50   # hypothetical quoted price
repo_rate     = 0.054   # financing rate for carry

print(f"{'Bond':>8} | {'Price':>7} | {'CF':>7} | {'Invoice':>8} | {'Net Basis':>10} | {'Adj Carry':>10}")
ctd_net_basis = np.inf
ctd_name = ""
for b in bonds:
    cf = conversion_factor(b['coupon'], b['maturity'])
    invoice = cf * futures_price    # adjusted price at delivery
    basis   = b['price'] - invoice  # raw basis
    # Net basis = basis - carry (accrued interest - repo cost)
    # Simplified: carry = (coupon - repo_rate * price) * delivery_period
    carry   = (b['coupon'] * 100 - repo_rate * b['price']) * (3/12)  # 3-month delivery
    net_basis = basis - carry

    if net_basis < ctd_net_basis:
        ctd_net_basis = net_basis
        ctd_name = b['name']

    ytm = ytm_solver(b['price'], b['coupon'], 100, b['maturity'])
    print(f"{b['name']:>8} | {b['price']:7.2f} | {cf:7.4f} | {invoice:8.2f} | {net_basis:+10.4f} | {carry:+10.4f}")

print(f"\\nCTD: {ctd_name}  Net basis: {ctd_net_basis:+.4f}")`,
    explanation: "The cheapest-to-deliver bond minimises net basis (raw basis minus carry): the seller of a futures contract is short a quality option and will always select the bond that makes delivery most advantageous; when yields are above the notional coupon (typically 6%), bonds with longer duration are CTD because they receive more benefit from the repo funding, and vice versa below the coupon rate.",
  },
];
