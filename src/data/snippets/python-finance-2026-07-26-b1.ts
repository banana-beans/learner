import type { Snippet } from "./types";

export const pythonFinanceSnippets20260726B1: Snippet[] = [
  {
    id: "pyfin-20260726-b1-garch11",
    language: "python",
    title: "GARCH(1,1) parameter estimation via MLE",
    tag: "volatility",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_log_likelihood(params, returns):
    """
    GARCH(1,1): sigma^2_t = omega + alpha * eps_{t-1}^2 + beta * sigma^2_{t-1}
    Parameters: omega > 0, alpha >= 0, beta >= 0, alpha + beta < 1 (stationarity)
    Log-likelihood: -0.5 * sum(log(h_t) + r_t^2 / h_t)
    """
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10

    n   = len(returns)
    h   = np.zeros(n)
    # Initialise variance with unconditional variance
    h[0] = omega / (1 - alpha - beta)

    for t in range(1, n):
        h[t] = omega + alpha * returns[t-1]**2 + beta * h[t-1]

    # Gaussian log-likelihood
    ll = -0.5 * np.sum(np.log(h) + returns**2 / h)
    return -ll   # minimise negative log-likelihood

def fit_garch11(returns):
    r = np.asarray(returns)
    # Starting values: small omega, equal alpha/beta
    x0 = [r.var() * 0.05, 0.09, 0.90]
    bounds = [(1e-10, None), (0, 1), (0, 1)]
    result = minimize(garch11_log_likelihood, x0, args=(r,),
                      method='L-BFGS-B', bounds=bounds)
    omega, alpha, beta = result.x
    uncond_vol = np.sqrt(omega / (1 - alpha - beta))
    half_life  = np.log(0.5) / np.log(alpha + beta)
    print(f"omega={omega:.6f}  alpha={alpha:.4f}  beta={beta:.4f}")
    print(f"Persistence: {alpha+beta:.4f}  Uncond vol: {uncond_vol:.4%}")
    print(f"Half-life of vol shock: {half_life:.1f} days")
    return result.x

np.random.seed(0)
# Simulate GARCH(1,1) with alpha=0.1, beta=0.85, omega=0.00002
n = 1000
h = np.zeros(n); r = np.zeros(n)
h[0] = 0.00002 / (1 - 0.1 - 0.85)
for t in range(1, n):
    h[t] = 0.00002 + 0.1 * r[t-1]**2 + 0.85 * h[t-1]
    r[t] = np.sqrt(h[t]) * np.random.standard_normal()

params = fit_garch11(r)`,
    explanation: "GARCH(1,1) captures volatility clustering by letting today's variance depend on yesterday's squared return (ARCH term) and yesterday's variance (GARCH term); the persistence parameter α+β close to 1 (e.g. 0.95) implies shocks decay slowly, which matches the empirical observation that high-volatility regimes in equity markets typically last weeks to months.",
  },
  {
    id: "pyfin-20260726-b1-vasicek",
    language: "python",
    title: "Vasicek short-rate model: simulation and zero-coupon bond pricing",
    tag: "rates",
    code: `import numpy as np
from scipy.stats import norm

def vasicek_simulate(r0, kappa, theta, sigma, T, n_steps, n_paths=1):
    """
    Vasicek (1977): dr_t = kappa*(theta - r_t)*dt + sigma*dW_t
    Exact (Ornstein-Uhlenbeck) simulation: the conditional distribution is Gaussian.
    r_{t+dt} | r_t ~ N(mean, var) analytically.
    """
    dt  = T / n_steps
    ekt = np.exp(-kappa * dt)

    # Exact transition moments
    cond_mean = lambda r: r * ekt + theta * (1 - ekt)
    cond_var  = sigma**2 / (2 * kappa) * (1 - ekt**2)
    cond_std  = np.sqrt(cond_var)

    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = r0
    for t in range(n_steps):
        paths[:, t+1] = (cond_mean(paths[:, t]) +
                         cond_std * np.random.standard_normal(n_paths))
    return paths

def vasicek_zcb_price(r0, kappa, theta, sigma, T):
    """
    Closed-form zero-coupon bond price P(0,T) = A(T) * exp(-B(T) * r0)
    B(T) = (1 - e^{-kappa*T}) / kappa
    A(T) = exp[(theta - sigma^2/(2*kappa^2))*(B-T) - sigma^2*B^2/(4*kappa)]
    """
    B = (1 - np.exp(-kappa * T)) / kappa
    A_log = (theta - sigma**2 / (2 * kappa**2)) * (B - T) - sigma**2 * B**2 / (4 * kappa)
    price = np.exp(A_log) * np.exp(-B * r0)
    zero_rate = -np.log(price) / T
    return price, zero_rate

# Parameters: kappa=0.3 (mean reversion speed), theta=0.04 (long-run mean), sigma=0.01
kappa, theta, sigma, r0 = 0.3, 0.04, 0.01, 0.03

print("--- Zero-coupon bond prices (closed form) ---")
for T in [0.5, 1, 2, 5, 10]:
    p, z = vasicek_zcb_price(r0, kappa, theta, sigma, T)
    print(f"T={T:4.1f}  P(0,T)={p:.4f}  zero rate={z:.4%}")

# Simulate and check terminal distribution
paths = vasicek_simulate(r0, kappa, theta, sigma, 1.0, 252, n_paths=10000)
r_T = paths[:, -1]
print(f"\\nSimulated r(1Y): mean={r_T.mean():.4f}  std={r_T.std():.4f}")
# Analytical: mean = r0*e^{-kT} + theta*(1-e^{-kT})
an_mean = r0*np.exp(-kappa) + theta*(1-np.exp(-kappa))
an_std  = np.sqrt(sigma**2/(2*kappa)*(1-np.exp(-2*kappa)))
print(f"Analytical:      mean={an_mean:.4f}  std={an_std:.4f}")`,
    explanation: "The Vasicek model is the simplest mean-reverting interest rate model: the short rate drifts toward its long-run mean theta at speed kappa, and the Ornstein-Uhlenbeck SDE has an exact Gaussian conditional distribution that allows simulation without discretisation error; the closed-form bond price formula makes it analytically tractable for yield curve fitting.",
  },
  {
    id: "pyfin-20260726-b1-heston-mc",
    language: "python",
    title: "Heston stochastic volatility model Monte Carlo",
    tag: "derivatives",
    code: `import numpy as np

def heston_mc(S0, K, r, v0, kappa, theta, sigma_v, rho, T,
              n_steps=252, n_paths=50_000):
    """
    Heston (1993) model:
      dS = r*S*dt + sqrt(v)*S*dW_S
      dv = kappa*(theta - v)*dt + sigma_v*sqrt(v)*dW_v
      corr(dW_S, dW_v) = rho  (typically negative for equity: -0.7)

    Uses Milstein discretisation for the variance (CIR) process to reduce bias.
    Feller condition 2*kappa*theta > sigma_v^2 ensures v stays positive.
    """
    dt    = T / n_steps
    sqdt  = np.sqrt(dt)
    feller = 2 * kappa * theta > sigma_v**2
    print(f"Feller condition: {'satisfied' if feller else 'VIOLATED (v may go negative)'}")

    S = np.full(n_paths, S0, dtype=float)
    v = np.full(n_paths, v0, dtype=float)

    for _ in range(n_steps):
        Z1 = np.random.standard_normal(n_paths)
        Z2 = np.random.standard_normal(n_paths)
        # Correlate Z1 (vol) and Zs (stock)
        Zv = Z1
        Zs = rho * Z1 + np.sqrt(1 - rho**2) * Z2

        v_pos = np.maximum(v, 0)  # full truncation scheme
        sqv   = np.sqrt(v_pos)

        # Milstein for v: adds 0.25*sigma_v^2*((sqdt*Z)^2 - dt) correction
        dv = (kappa * (theta - v_pos) * dt
              + sigma_v * sqv * sqdt * Zv
              + 0.25 * sigma_v**2 * (sqdt**2 * Zv**2 - dt))
        v  = np.maximum(v + dv, 0)   # full truncation

        # Log-Euler for S: exact for the GBM part
        S *= np.exp((r - 0.5 * v_pos) * dt + sqv * sqdt * Zs)

    payoff = np.maximum(S - K, 0)
    price  = np.exp(-r * T) * payoff.mean()
    se     = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)
    print(f"Heston call: {price:.4f}  SE: {se:.4f}")
    return price

# Typical equity Heston parameters
heston_mc(S0=100, K=100, r=0.05, v0=0.04, kappa=2.0,
          theta=0.04, sigma_v=0.3, rho=-0.7, T=1.0)`,
    explanation: "The Heston model introduces a mean-reverting stochastic variance process (CIR) correlated with the stock, capturing the volatility smile and skew that Black-Scholes cannot; the negative correlation rho generates left skew in equity options — large down moves coincide with vol spikes, matching the 'leverage effect' empirically observed in equity markets.",
  },
  {
    id: "pyfin-20260726-b1-sabr",
    language: "python",
    title: "SABR model approximate implied volatility (Hagan formula)",
    tag: "derivatives",
    code: `import numpy as np

def sabr_implied_vol(F, K, T, alpha, beta, rho, nu):
    """
    Hagan et al. (2002) SABR approximate implied Black vol formula.
    SABR: dF = alpha * F^beta * dW1,  dalpha = nu*alpha*dW2,  corr=rho
    alpha: initial vol, beta: CEV exponent, nu: vol-of-vol, rho: correlation.

    ATM forward vol: alpha / F^(1-beta) * [1 + correction terms * T]
    Full formula handles all strikes via log-moneyness expansion.
    """
    if abs(F - K) < 1e-10:
        # ATM approximation (numerically stable)
        FK_beta = F**(1 - beta)
        atm_vol = alpha / FK_beta
        corr    = (1 + ((1-beta)**2/24 * alpha**2/FK_beta**2
                         + rho*beta*nu*alpha/(4*FK_beta)
                         + (2 - 3*rho**2)/24 * nu**2) * T)
        return atm_vol * corr

    z   = nu / alpha * (F * K)**((1-beta)/2) * np.log(F / K)
    chi = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    numer = alpha
    denom = ((F*K)**((1-beta)/2)
             * (1 + (1-beta)**2/24 * np.log(F/K)**2
                + (1-beta)**4/1920 * np.log(F/K)**4))

    core = (z / chi) if abs(chi) > 1e-10 else 1.0

    correction = (1 + ((1-beta)**2/24 * alpha**2 / (F*K)**(1-beta)
                        + rho*beta*nu*alpha / (4*(F*K)**((1-beta)/2))
                        + (2 - 3*rho**2)/24 * nu**2) * T)
    return numer / denom * core * correction

# Calibrate by fitting to market quotes on a SOFR cap vol surface
F = 0.05       # forward rate
alpha, beta, rho, nu = 0.035, 0.5, -0.25, 0.40

print("SABR smile across strikes (beta=0.5, rho=-0.25):")
strikes = np.array([0.03, 0.04, 0.045, 0.05, 0.055, 0.06, 0.07])
for K in strikes:
    vol = sabr_implied_vol(F, K, T=1.0, alpha=alpha,
                           beta=beta, rho=rho, nu=nu)
    moneyness = "ATM" if abs(K-F) < 1e-3 else ("OTM" if K > F else "ITM")
    print(f"  K={K:.3f} ({moneyness}): Black vol = {vol:.4f}")`,
    explanation: "The SABR (Stochastic Alpha Beta Rho) model is the market standard for interest-rate vol surfaces: its closed-form approximate formula maps from model parameters directly to Black implied vol at any strike, enabling fast calibration; the beta parameter controls the backbone shape (beta=0 is Normal/Bachelier, beta=1 is log-normal/Black), and the vol-of-vol nu generates the smile curvature.",
  },
  {
    id: "pyfin-20260726-b1-merton-jump",
    language: "python",
    title: "Merton jump-diffusion option pricing (series expansion)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm
from math import factorial, exp, log, sqrt

def merton_call(S, K, r, sigma, T, lam, mu_J, sigma_J, n_terms=50):
    """
    Merton (1976) jump-diffusion: stock follows GBM + Poisson jumps.
    dS/S = (r - lam*kbar)*dt + sigma*dW + (J-1)*dN
    J ~ log-normal: log(J) ~ N(mu_J, sigma_J^2)
    lam: jump intensity (jumps/yr), kbar = E[J-1] = exp(mu_J + 0.5*sigma_J^2) - 1

    Exact price = Σ_n e^{-lam_T}*(lam_T)^n/n! * BS(sigma_n, r_n)
    where lam_T = lam*(1+kbar)*T, sigma_n^2 = sigma^2 + n*sigma_J^2/T,
          r_n = r - lam*kbar + n*(mu_J + 0.5*sigma_J^2)/T
    """
    kbar   = exp(mu_J + 0.5 * sigma_J**2) - 1.0
    lam_T  = lam * (1 + kbar) * T

    def bs_call(S, K, r_n, sig_n, T):
        if sig_n * sqrt(T) < 1e-10:
            return max(S * exp((r_n - r) * T) - K * exp(-r * T), 0)
        d1 = (log(S / K) + (r_n + 0.5 * sig_n**2) * T) / (sig_n * sqrt(T))
        d2 = d1 - sig_n * sqrt(T)
        return S * norm.cdf(d1) - K * exp(-r * T) * norm.cdf(d2)

    price = 0.0
    for n in range(n_terms):
        # Poisson weight
        weight = exp(-lam_T) * (lam_T ** n) / factorial(n)
        # Conditional BS parameters given n jumps
        sigma_n = sqrt(sigma**2 + n * sigma_J**2 / T)
        r_n     = r - lam * kbar + n * (mu_J + 0.5 * sigma_J**2) / T
        price  += weight * bs_call(S, K, r_n, sigma_n, T)
        if weight < 1e-15:
            break   # series converged

    return price

# Parameters: 5 jumps/yr, avg jump -5% (crash risk), 15% jump vol
price = merton_call(S=100, K=100, r=0.05, sigma=0.15, T=1.0,
                    lam=5, mu_J=-0.05, sigma_J=0.15)
print(f"Merton jump-diffusion call: {price:.4f}")

# Pure diffusion BS for comparison
from scipy.stats import norm as norm2
def bs(S, K, r, sig, T):
    d1 = (log(S/K)+(r+0.5*sig**2)*T)/(sig*sqrt(T))
    return S*norm2.cdf(d1)-K*exp(-r*T)*norm2.cdf(d1-sig*sqrt(T))
print(f"Black-Scholes (no jumps):   {bs(100, 100, 0.05, 0.15, 1.0):.4f}")`,
    explanation: "Merton's jump-diffusion prices each n-jump scenario with a modified Black-Scholes formula (increased variance, shifted drift) and sums with Poisson weights; the series converges rapidly because the Poisson weight decays factorially; jump risk generates the pronounced short-maturity OTM skew that pure diffusion models cannot match.",
  },
  {
    id: "pyfin-20260726-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula for credit portfolio correlation",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_loss(n_credits, pd, rho, recovery, n_sims=100_000):
    """
    Li (2000) Gaussian copula model for CDO pricing.
    Each credit i has a latent variable X_i = rho*M + sqrt(1-rho^2)*Z_i
    where M ~ N(0,1) is the common market factor,
          Z_i ~ N(0,1) are idiosyncratic shocks.
    Credit i defaults if X_i < Phi^{-1}(PD_i).

    This is the 'one-factor' Gaussian copula (Basel II credit correlation model).
    """
    threshold = norm.ppf(pd)     # default threshold in standard normal space
    lgd       = 1.0 - recovery  # loss given default

    losses = np.zeros(n_sims)
    M = np.random.standard_normal(n_sims)   # systematic factor (one per scenario)
    Z = np.random.standard_normal((n_sims, n_credits))  # idiosyncratic

    X = rho * M[:, None] + np.sqrt(1 - rho**2) * Z   # n_sims x n_credits
    defaults = (X < threshold)                          # boolean default matrix
    losses   = defaults.mean(axis=1) * lgd              # portfolio loss rate

    # Portfolio loss distribution
    mean_loss = losses.mean()
    el        = pd * lgd                # expected loss (analytical)
    var95_idx = int(n_sims * 0.95)
    var99_idx = int(n_sims * 0.99)
    sl = np.sort(losses)

    print(f"Expected loss: {mean_loss:.4f} (analytical: {el:.4f})")
    print(f"95% loss quantile: {sl[var95_idx]:.4f}")
    print(f"99% loss quantile: {sl[var99_idx]:.4f}")

    # Conditional default probability given market stress (M = -2, -3 sigma)
    for stress in [-2, -3]:
        cond_pd = norm.cdf((threshold - rho * stress) / np.sqrt(1 - rho**2))
        print(f"Cond. PD at M={stress}: {cond_pd:.4f}")
    return losses

np.random.seed(42)
losses = gaussian_copula_loss(n_credits=100, pd=0.02, rho=0.3, recovery=0.4)`,
    explanation: "The Gaussian copula maps each credit's default probability to a latent variable threshold, then simulates correlated defaults via a shared market factor M; the single correlation parameter rho controls how clustered defaults are — low rho means diversification works, high rho means systemic risk dominates; Basel II's IRB formula is the analytical version of this model.",
  },
  {
    id: "pyfin-20260726-b1-gpd-evt",
    language: "python",
    title: "Extreme Value Theory: GPD tail fitting for tail risk",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(returns, threshold_quantile=0.90):
    """
    Peaks-Over-Threshold (POT) EVT: model losses exceeding a threshold u
    as a Generalized Pareto Distribution (GPD).

    GPD CDF: F(x) = 1 - (1 + xi*x/beta)^{-1/xi}  for xi != 0
    xi > 0: heavy-tailed (Pareto); xi < 0: bounded; xi = 0: exponential

    Tail VaR:  VaR_p = u + (beta/xi)*((n/n_u*(1-p))^{-xi} - 1)
    Tail ES:   ES_p  = VaR_p/(1-xi) + (beta - xi*u)/(1-xi)
    """
    losses = -np.asarray(returns)   # work with losses (positive = bad)
    u      = np.quantile(losses, threshold_quantile)
    excesses = losses[losses > u] - u

    n    = len(losses)
    n_u  = len(excesses)
    print(f"Threshold u={u:.4f} ({threshold_quantile*100:.0f}th pctile), "
          f"exceedances={n_u} ({n_u/n:.1%})")

    # Fit GPD via MLE
    xi, loc, beta = genpareto.fit(excesses, floc=0)
    print(f"GPD fit: xi={xi:.4f}  beta={beta:.4f}")

    # Tail VaR at confidence levels
    for p in [0.99, 0.999]:
        var_gp = u + (beta / xi) * ((n / n_u * (1 - p))**(-xi) - 1)
        es_gp  = var_gp / (1 - xi) + (beta - xi * u) / (1 - xi)
        print(f"GPD VaR_{p:.1%}: {var_gp:.4f}  ES_{p:.1%}: {es_gp:.4f}")

    # Compare with historical quantile
    var_hist = np.quantile(losses, 0.99)
    print(f"Historical 99% VaR:   {var_hist:.4f}  (no tail extrapolation)")
    return xi, beta, u

np.random.seed(1)
# Student-t returns (fat tails, df=4)
returns = np.random.standard_t(df=4, size=3000) * 0.01
fit_gpd_tail(returns, threshold_quantile=0.90)`,
    explanation: "The Peaks-Over-Threshold method fits a GPD to the tail of the loss distribution using only observations above a threshold, which is more data-efficient than GEV block maxima; the shape parameter xi captures tail heaviness — typical equity daily returns have xi ≈ 0.1–0.4 (Pareto tail), meaning GPD-based VaR significantly exceeds Gaussian VaR at the 99.9% level.",
  },
  {
    id: "pyfin-20260726-b1-expected-shortfall",
    language: "python",
    title: "Historical Expected Shortfall with bootstrap confidence intervals",
    tag: "risk",
    code: `import numpy as np

def historical_es(returns, confidence=0.99, n_bootstrap=1000, ci_level=0.95):
    """
    Historical simulation Expected Shortfall (CVaR):
      ES_alpha = E[Loss | Loss > VaR_alpha]  (mean of the tail)

    Bootstrap 95% CI: resample the return series with replacement
    to quantify estimation uncertainty in ES.
    """
    losses = -np.asarray(returns)   # convert to losses
    n      = len(losses)
    k      = int(n * (1 - confidence))   # number of tail observations
    if k == 0:
        k = 1

    sorted_losses = np.sort(losses)[::-1]   # descending (worst first)
    var    = sorted_losses[k]                # VaR = k-th worst loss
    es     = sorted_losses[:k].mean()        # ES = mean of k worst losses

    # Bootstrap confidence interval for ES
    es_boot = np.zeros(n_bootstrap)
    for b in range(n_bootstrap):
        sample = np.random.choice(losses, size=n, replace=True)
        sl     = np.sort(sample)[::-1]
        es_boot[b] = sl[:max(int(n * (1 - confidence)), 1)].mean()

    lo = np.percentile(es_boot, (1 - ci_level) / 2 * 100)
    hi = np.percentile(es_boot, (1 + ci_level) / 2 * 100)

    print(f"Confidence: {confidence:.1%}")
    print(f"VaR:        {var:.4f}  (threshold)")
    print(f"ES:         {es:.4f}  ({ci_level:.0%} CI: [{lo:.4f}, {hi:.4f}])")
    print(f"ES/VaR:     {es/var:.3f}  (ratio > 1 indicates tail weight)")
    return var, es, (lo, hi)

np.random.seed(42)
# Daily equity returns: heavy-tailed (realistic)
r = np.concatenate([
    np.random.normal(0.0005, 0.012, 900),    # quiet period
    np.random.normal(-0.002, 0.030, 100),    # stress period
])
historical_es(r, confidence=0.99)`,
    explanation: "Expected Shortfall measures the average loss in the worst (1-α)% of scenarios and is a coherent risk measure (satisfies subadditivity), making it theoretically superior to VaR; the bootstrap confidence interval reveals that ES is estimated much less precisely than VaR because it depends only on the few observations in the extreme tail.",
  },
  {
    id: "pyfin-20260726-b1-pca-yield-curve",
    language: "python",
    title: "PCA on yield curve: level, slope, and curvature factors",
    tag: "rates",
    code: `import numpy as np

def yield_curve_pca(yield_changes, tenors=None):
    """
    PCA on daily yield curve changes reveals three main risk factors:
    PC1 (level): all yields move together — ~70% of variance
    PC2 (slope): short rates move opposite long rates — ~20%
    PC3 (curvature): belly moves opposite wings — ~5%

    yield_changes: (n_days, n_tenors) matrix of daily yield changes in bps
    """
    if tenors is None:
        tenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]

    Y = np.asarray(yield_changes, dtype=float)
    # Centre
    Y -= Y.mean(axis=0)

    # Covariance matrix and eigendecomposition
    cov = np.cov(Y.T)
    eigenvalues, eigenvectors = np.linalg.eigh(cov)

    # Sort descending by variance explained
    idx  = np.argsort(eigenvalues)[::-1]
    vals = eigenvalues[idx]
    vecs = eigenvectors[:, idx]

    total_var = vals.sum()
    print("PC  Variance  Cumul.  Shape")
    for i in range(3):
        explained = vals[i] / total_var
        cumul     = vals[:i+1].sum() / total_var
        shape     = "level" if i == 0 else ("slope" if i == 1 else "curvature")
        print(f"PC{i+1}: {explained:.1%}    {cumul:.1%}    ({shape})")

    # Factor loadings (eigenvectors) for 3 PCs
    print("\\nLoadings (tenors vs PCs):")
    header = " ".join(f"T={t:.0f}y" if t >= 1 else f"T={t:.2f}y" for t in tenors)
    print(f"{'':5} {header}")
    for i in range(3):
        row = " ".join(f"{v:+.3f}" for v in vecs[:, i])
        print(f"PC{i+1}   {row}")

    # DV01-equivalent risk factor exposures
    scores = Y @ vecs[:, :3]   # (n_days, 3) — daily factor realizations
    print(f"\\nFactor vols (bps/day): "
          f"PC1={scores[:,0].std():.2f}  PC2={scores[:,1].std():.2f}  "
          f"PC3={scores[:,2].std():.2f}")
    return vecs[:, :3], vals[:3] / total_var

np.random.seed(7)
n_days, n_tenors = 500, 10
# Simulate yield changes: 3 factor structure
lvl  = np.random.normal(0, 3, n_days)
slp  = np.random.normal(0, 1.5, n_days)
curv = np.random.normal(0, 0.8, n_days)
t    = np.linspace(0, 1, n_tenors)
Y = (lvl[:, None] * np.ones(n_tenors) +
     slp[:, None] * (2*t - 1) +
     curv[:, None] * (6*t**2 - 6*t + 1) +
     np.random.normal(0, 0.5, (n_days, n_tenors)))
yield_curve_pca(Y)`,
    explanation: "Yield curve PCA consistently finds three dominant factors across all currencies and time periods: level shifts (parallel moves), slope changes (flattening/steepening), and curvature changes (butterfly); together they explain 95%+ of daily yield variance, enabling parsimonious hedging — a portfolio immunised against all three PC factors is substantially duration-neutral, slope-neutral, and convexity-neutral.",
  },
  {
    id: "pyfin-20260726-b1-carhart-4factor",
    language: "python",
    title: "Carhart 4-factor model with momentum (WML)",
    tag: "factor-models",
    code: `import numpy as np

def carhart_4factor(returns, mkt_rf, smb, hml, wml, rf):
    """
    Carhart (1997) 4-factor model extends Fama-French with momentum:
      r_t - rf_t = alpha + b1*(Mkt-Rf) + b2*SMB + b3*HML + b4*WML + eps_t

    WML (Winners Minus Losers): long past 12-month winners, short losers
    Captures the price momentum anomaly: past 12M return predicts future 1M return.

    Returns: alpha (ann.), factor betas, t-stats, R-squared, information ratio
    """
    r = np.asarray(returns) - np.asarray(rf)
    X = np.column_stack([np.ones(len(r)),
                          np.asarray(mkt_rf),
                          np.asarray(smb),
                          np.asarray(hml),
                          np.asarray(wml)])
    n, k  = X.shape
    beta  = np.linalg.lstsq(X, r, rcond=None)[0]
    fitted= X @ beta
    resid = r - fitted

    sse  = resid @ resid
    sst  = ((r - r.mean())**2).sum()
    r_sq = 1 - sse / sst
    s2   = sse / (n - k)
    se   = np.sqrt(np.diag(s2 * np.linalg.inv(X.T @ X)))
    t    = beta / se

    alpha_ann = beta[0] * 252
    te        = resid.std() * np.sqrt(252)      # tracking error
    ir        = alpha_ann / te                   # information ratio

    print(f"Alpha (ann.): {alpha_ann:.4%}   t={t[0]:.2f}")
    print(f"Beta_Mkt:     {beta[1]:.4f}     t={t[1]:.2f}")
    print(f"Beta_SMB:     {beta[2]:.4f}     t={t[2]:.2f}")
    print(f"Beta_HML:     {beta[3]:.4f}     t={t[3]:.2f}")
    print(f"Beta_WML:     {beta[4]:.4f}     t={t[4]:.2f}  (momentum)")
    print(f"R-squared:    {r_sq:.4f}")
    print(f"Info ratio:   {ir:.4f}  (alpha/TE)")
    return beta, t, r_sq, ir

np.random.seed(42)
n = 500
mkt = np.random.normal(0.0003, 0.010, n)
smb = np.random.normal(0.0001, 0.005, n)
hml = np.random.normal(0.0001, 0.004, n)
wml = np.random.normal(0.0002, 0.006, n)
rf  = np.full(n, 0.00015)
# Momentum-tilted portfolio with positive WML loading
r   = (0.00008 + 1.05*mkt + 0.2*smb - 0.1*hml + 0.35*wml
       + np.random.normal(0, 0.003, n))
carhart_4factor(r, mkt, smb, hml, wml, rf)`,
    explanation: "Carhart's momentum factor (WML) explains the tendency for past 12-month winners to continue outperforming for another month — one of the strongest and most pervasive equity anomalies; a portfolio with significant WML beta (positive momentum loading) will show artificially high 3-factor alpha until WML is included, revealing that the excess return was compensation for momentum risk.",
  },
  {
    id: "pyfin-20260726-b1-cvxpy-mv",
    language: "python",
    title: "Mean-variance portfolio optimisation with cvxpy",
    tag: "portfolio",
    code: `import numpy as np

def mean_variance_cvxpy(mu, Sigma, risk_aversion=1.0,
                         long_only=True, max_weight=0.30):
    """
    Markowitz (1952) mean-variance optimisation via cvxpy:
      max  mu'w - (lambda/2) * w'*Sigma*w
      s.t. sum(w) = 1
           w >= 0                    (long only)
           w <= max_weight            (concentration limit)

    Equivalent to minimising variance for a given expected return.
    """
    try:
        import cvxpy as cp
    except ImportError:
        print("cvxpy not installed; using scipy.optimize fallback")
        return _scipy_fallback(mu, Sigma, risk_aversion)

    n = len(mu)
    w = cp.Variable(n)

    expected_return  = mu @ w
    portfolio_var    = cp.quad_form(w, Sigma)
    objective        = cp.Maximize(expected_return - risk_aversion/2 * portfolio_var)

    constraints = [cp.sum(w) == 1]
    if long_only:
        constraints += [w >= 0]
    constraints += [w <= max_weight]

    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.OSQP, warm_start=True)

    if prob.status not in ["optimal", "optimal_inaccurate"]:
        print(f"Solver status: {prob.status}")
        return None

    w_opt   = w.value
    ret_opt = float(mu @ w_opt)
    vol_opt = float(np.sqrt(w_opt @ Sigma @ w_opt))
    sr      = (ret_opt - 0.00015) / vol_opt  # Sharpe (risk-free ≈ 3.8% ann)

    print(f"Expected return: {ret_opt*252:.4%} (ann.)")
    print(f"Portfolio vol:   {vol_opt*np.sqrt(252):.4%} (ann.)")
    print(f"Sharpe ratio:    {sr*np.sqrt(252):.4f}")
    print(f"Max weight:      {w_opt.max():.4f}  Min: {w_opt.min():.4f}")
    return w_opt

def _scipy_fallback(mu, Sigma, lam):
    from scipy.optimize import minimize
    n = len(mu)
    def neg_util(w):
        return -(mu @ w - lam/2 * w @ Sigma @ w)
    res = minimize(neg_util, np.ones(n)/n,
                   constraints=[{"type":"eq","fun":lambda w: w.sum()-1}],
                   bounds=[(0, 0.3)]*n)
    return res.x

np.random.seed(0)
n = 10
mu    = np.random.normal(0.0004, 0.0002, n)   # daily expected returns
vols  = np.random.uniform(0.008, 0.020, n)
corr  = 0.3 * np.ones((n, n)) + (1 - 0.3) * np.eye(n)
Sigma = np.diag(vols) @ corr @ np.diag(vols)

w = mean_variance_cvxpy(mu, Sigma, risk_aversion=2.0)
if w is not None:
    print("Optimal weights:", np.round(w, 4))`,
    explanation: "cvxpy formulates and solves the mean-variance problem as a convex quadratic program with arbitrary linear constraints; the risk-aversion parameter lambda traces the efficient frontier (low lambda → aggressive/concentrated, high lambda → defensive/diversified), and adding the concentration constraint w_i ≤ 0.30 prevents the unconstrained solution's tendency to hold only 1–3 assets.",
  },
  {
    id: "pyfin-20260726-b1-txn-cost-backtest",
    language: "python",
    title: "Transaction-cost-adjusted backtest performance metrics",
    tag: "backtesting",
    code: `import numpy as np

def backtest_with_costs(prices, signals, half_spread_bps=2.5,
                         impact_bps_per_pct_adv=10.0,
                         adv_frac=0.005):
    """
    Compute strategy P&L net of realistic transaction costs:
    1. Half-spread: crossing the bid-ask spread
    2. Market impact: square-root law ~ impact_coeff * sqrt(size/ADV)

    signals: position in units of 1 (can be fractional for sizing).
    adv_frac: order size as fraction of average daily volume.
    Returns gross and net performance metrics.
    """
    r       = np.diff(np.log(prices))
    pos     = np.asarray(signals[:-1], dtype=float)  # position during return
    gross   = pos * r

    # Turnover: absolute change in position
    turnover     = np.abs(np.diff(np.concatenate([[0], signals[:-1]])))
    half_spread  = half_spread_bps / 10_000
    impact       = impact_bps_per_pct_adv / 10_000 * np.sqrt(adv_frac)

    # Cost per unit turnover = spread + impact
    cost_per_turn = half_spread + impact
    costs         = turnover * cost_per_turn
    net           = gross - costs

    # Performance metrics
    ann      = 252
    days     = len(gross)
    gross_sr = gross.mean() / gross.std() * np.sqrt(ann)
    net_sr   = net.mean()   / net.std()   * np.sqrt(ann)
    ann_turn = turnover.mean() * ann
    cost_drag= costs.mean()    * ann

    print(f"Gross Sharpe:    {gross_sr:.3f}")
    print(f"Net Sharpe:      {net_sr:.3f}")
    print(f"Annual turnover: {ann_turn:.1f}x")
    print(f"Cost drag (ann): {cost_drag:.4%}")
    print(f"Breakeven SR:    {gross_sr - net_sr:.3f} (lost to costs)")
    return gross, net, costs

np.random.seed(3)
n = 500
prices  = 100 * np.exp(np.cumsum(np.random.normal(0.0003, 0.012, n)))
# Momentum signal: position = sign of 10-day return
signals = np.zeros(n)
for i in range(10, n):
    signals[i] = np.sign(prices[i] - prices[i-10])
backtest_with_costs(prices, signals)`,
    explanation: "Transaction costs are the single largest alpha killer in high-frequency strategies: a gross Sharpe of 2.0 can collapse to 0.5 once realistic spreads and impact are accounted for; decomposing performance into gross return, spread cost, and impact cost allows managers to identify whether a strategy needs a better signal or lower turnover.",
  },
  {
    id: "pyfin-20260726-b1-momentum-factor",
    language: "python",
    title: "Cross-sectional momentum factor construction",
    tag: "factor-models",
    code: `import numpy as np

def momentum_factor(returns_matrix, lookback=252, skip=21, top_pct=0.2):
    """
    Jegadeesh-Titman (1993) momentum: rank stocks on past (lookback-skip) returns,
    go long top decile, short bottom decile.
    Skip last 'skip' days to avoid short-term reversal (1-month reversal effect).

    returns_matrix: (n_days, n_stocks) daily return matrix.
    Returns: daily portfolio returns, average turnover.
    """
    n_days, n_stocks = returns_matrix.shape
    port_returns = []
    turnover     = []
    prev_longs   = set()
    prev_shorts  = set()

    for t in range(lookback, n_days):
        # Momentum signal: cumulative log return from t-lookback to t-skip
        r_window = returns_matrix[t - lookback: t - skip]
        cum_ret  = np.sum(r_window, axis=0)   # log returns sum

        # Rank and select
        n_top    = max(1, int(n_stocks * top_pct))
        rank     = np.argsort(cum_ret)
        longs    = set(rank[-n_top:])
        shorts   = set(rank[:n_top])

        # Today's portfolio return
        today_r  = returns_matrix[t]
        long_r   = today_r[list(longs)].mean()
        short_r  = today_r[list(shorts)].mean()
        port_returns.append(long_r - short_r)

        # Turnover: fraction of names changed
        if prev_longs:
            to_l = len(longs - prev_longs) / len(longs)
            to_s = len(shorts - prev_shorts) / len(shorts)
            turnover.append(0.5 * (to_l + to_s))
        prev_longs  = longs
        prev_shorts = shorts

    pr  = np.array(port_returns)
    sr  = pr.mean() / pr.std() * np.sqrt(252)
    to  = np.mean(turnover) * 252 if turnover else np.nan
    ann = pr.mean() * 252
    print(f"Momentum factor: Ann.ret={ann:.4%}  Sharpe={sr:.3f}  Annual TO={to:.1f}x")
    return pr

np.random.seed(5)
n_days, n_stocks = 600, 50
# Simulate: past return slightly predicts future (momentum)
base = np.random.normal(0.0003, 0.012, (n_days, n_stocks))
trend = np.zeros((n_days, n_stocks))
for i in range(10, n_days):
    trend[i] = 0.02 * base[i-10]   # small autocorrelation
returns = base + trend

momentum_factor(returns, lookback=252, skip=21, top_pct=0.2)`,
    explanation: "The cross-sectional momentum factor is constructed by sorting stocks on their past 12-1-month return (12 months formation, skip the most recent month to remove short-term reversal), then going long winners and short losers; the strategy has been profitable across markets and time periods but suffers from 'momentum crashes' during sharp market reversals, making it negatively skewed.",
  },
  {
    id: "pyfin-20260726-b1-hull-white",
    language: "python",
    title: "Hull-White one-factor interest rate model simulation",
    tag: "rates",
    code: `import numpy as np

def hull_white_simulate(r0, a, sigma, T, n_steps, n_paths,
                         theta_func=None):
    """
    Hull-White extended Vasicek:
      dr_t = (theta(t) - a*r_t)*dt + sigma*dW_t

    theta(t) is calibrated to fit the initial yield curve exactly.
    For simplicity, use a flat theta = a * r_bar (Vasicek form).

    a: mean reversion speed, sigma: volatility, theta(t): time-dependent drift.
    Exact conditional moments (like Vasicek but with time-dependent drift).
    """
    if theta_func is None:
        r_bar   = 0.04    # long-run mean
        theta_func = lambda t: a * r_bar  # flat: reduces to Vasicek

    dt    = T / n_steps
    ekt   = np.exp(-a * dt)

    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = r0

    for t_idx in range(n_steps):
        t_mid    = (t_idx + 0.5) * dt
        theta_t  = theta_func(t_mid)
        mean_rev = paths[:, t_idx] * ekt + theta_t/a * (1 - ekt)
        var      = sigma**2 / (2*a) * (1 - ekt**2)
        paths[:, t_idx+1] = (mean_rev +
                              np.sqrt(var) * np.random.standard_normal(n_paths))

    return paths

def hw_zcb_price(r0, a, sigma, T, r_bar=0.04):
    """Closed-form ZCB price for Hull-White (same as Vasicek with r_bar)."""
    B = (1 - np.exp(-a * T)) / a
    A_log = (r_bar - sigma**2/(2*a**2)) * (B - T) - sigma**2*B**2/(4*a)
    return np.exp(A_log - B * r0)

np.random.seed(10)
a, sigma, r0 = 0.1, 0.015, 0.03

paths = hull_white_simulate(r0, a, sigma, T=5.0, n_steps=1260,
                             n_paths=5000)
r_5y  = paths[:, -1]
print(f"Simulated r(5Y): mean={r_5y.mean():.4f}  std={r_5y.std():.4f}")

print("\\nHull-White ZCB prices:")
for T in [1, 2, 3, 5, 10]:
    p    = hw_zcb_price(r0, a, sigma, T)
    zero = -np.log(p) / T
    print(f"  T={T:2d}  P(0,T)={p:.4f}  zero={zero:.4%}")`,
    explanation: "Hull-White extends Vasicek with a time-dependent drift theta(t) that is calibrated to match the initial market yield curve exactly, making it a no-arbitrage model; this is the industry-standard model for pricing interest rate derivatives like Bermudan swaptions and caps because it reproduces today's term structure while generating realistic future rate dynamics.",
  },
  {
    id: "pyfin-20260726-b1-credit-scoring",
    language: "python",
    title: "Logistic regression credit scoring and PD estimation",
    tag: "credit",
    code: `import numpy as np
from scipy.special import expit   # sigmoid function
from scipy.optimize import minimize

def logistic_credit_score(X_train, y_train, X_test=None, reg_lambda=0.01):
    """
    Logistic regression for Probability of Default (PD) estimation.
    Features: financial ratios (leverage, coverage, liquidity, profitability).
    P(default) = sigmoid(X @ beta) = 1 / (1 + exp(-X @ beta))

    Ridge regularisation prevents overfitting on small credit datasets.
    """
    n, p  = X_train.shape
    X     = np.hstack([np.ones((n, 1)), X_train])   # add intercept

    def neg_log_likelihood(beta):
        logit  = X @ beta
        log_p  = np.log(expit(logit)  + 1e-15)
        log_1p = np.log(1-expit(logit)+ 1e-15)
        nll    = -(y_train @ log_p + (1-y_train) @ log_1p)
        # L2 regularisation (skip intercept)
        nll   += reg_lambda * np.sum(beta[1:]**2)
        return nll

    def gradient(beta):
        p   = expit(X @ beta)
        g   = -X.T @ (y_train - p)
        g[1:] += 2 * reg_lambda * beta[1:]
        return g

    result = minimize(neg_log_likelihood, np.zeros(p + 1),
                      jac=gradient, method='L-BFGS-B')
    beta = result.x

    # In-sample predictions
    pd_train = expit(X @ beta)
    pred     = (pd_train > 0.5).astype(int)
    acc      = (pred == y_train).mean()
    auc      = roc_auc_numpy(y_train, pd_train)

    print(f"Training accuracy: {acc:.4f}")
    print(f"AUC (approx):      {auc:.4f}")
    print(f"Coefficients: intercept={beta[0]:.3f}  "
          + "  ".join(f"b{i}={v:.3f}" for i, v in enumerate(beta[1:])))
    return beta, pd_train

def roc_auc_numpy(y, scores):
    """Trapezoidal AUC without sklearn."""
    sorted_idx = np.argsort(-scores)
    y_sorted   = y[sorted_idx]
    tpr = np.cumsum(y_sorted) / y_sorted.sum()
    fpr = np.cumsum(1-y_sorted) / (1-y_sorted).sum()
    return np.trapz(tpr, fpr)

np.random.seed(42)
n = 500
# Features: [leverage, interest coverage, current ratio, ROA]
X = np.random.randn(n, 4)
# Higher leverage and lower coverage → higher PD
true_beta = np.array([0.5, 1.2, -0.8, -0.5, -1.0])  # [intercept, coeffs]
X_aug = np.hstack([np.ones((n,1)), X])
pd_true = expit(X_aug @ true_beta)
y = (np.random.uniform(0, 1, n) < pd_true).astype(float)
print(f"Default rate: {y.mean():.4%}")
beta, pd_hat = logistic_credit_score(X, y)`,
    explanation: "Logistic regression is the workhorse of retail credit scoring because its output is a calibrated probability of default (PD) that maps directly to Basel III capital requirements; the AUC (Gini coefficient) measures discriminatory power — a score of 0.75 means 75% of random (defaulter, survivor) pairs are correctly ranked by PD.",
  },
  {
    id: "pyfin-20260726-b1-basket-option",
    language: "python",
    title: "Basket option Monte Carlo with correlation sampling",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def basket_call_mc(S0, weights, K, r, sigma_vec, corr_matrix,
                   T, n_paths=100_000):
    """
    Basket call option: pays max(weighted average - K, 0).
    Basket of n stocks: S = weights' * [S1, ..., Sn]
    Stocks follow correlated GBM; simulate via Cholesky decomposition.

    Cholesky factorises the correlation matrix: C = L @ L.T
    Correlated normals: Z = L @ iid_normals gives Cov(Z) = C.
    """
    n      = len(S0)
    S0     = np.asarray(S0, dtype=float)
    w      = np.asarray(weights, dtype=float)
    sig    = np.asarray(sigma_vec, dtype=float)
    C      = np.asarray(corr_matrix, dtype=float)

    # Cholesky decomposition of correlation matrix
    L = np.linalg.cholesky(C)

    # Simulate terminal stock prices
    Z_iid  = np.random.standard_normal((n, n_paths))   # n x n_paths
    Z_corr = L @ Z_iid                                   # correlated: n x n_paths

    drift = (r - 0.5 * sig**2) * T
    logS  = np.log(S0)[:, None] + drift[:, None] + sig[:, None] * np.sqrt(T) * Z_corr
    S_T   = np.exp(logS)    # n x n_paths

    # Basket value = weighted sum of terminal prices
    basket_T = w @ S_T   # 1 x n_paths

    payoff = np.maximum(basket_T - K, 0)
    price  = np.exp(-r * T) * payoff.mean()
    se     = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)

    # Implied basket vol (for comparison with single-stock vols)
    basket_var = w @ (np.diag(sig**2) * np.outer(np.ones(n), np.ones(n)) * T
                      + sig[:, None] * sig[None, :] * (C - np.eye(n)) * T) @ w
    print(f"Basket call price: {price:.4f}  SE: {se:.4f}")
    print(f"Correlation drag vs uncorrelated: reduces effective vol")
    return price, se

np.random.seed(42)
n_assets = 5
basket_call_mc(
    S0      = [100]*5,
    weights = [0.2]*5,
    K       = 100,
    r       = 0.05,
    sigma_vec    = [0.20, 0.25, 0.18, 0.22, 0.30],
    corr_matrix  = 0.4*np.ones((5,5)) + (1-0.4)*np.eye(5),
    T       = 1.0,
)`,
    explanation: "Basket options are priced via Monte Carlo because the weighted sum of correlated log-normals has no closed-form distribution; the Cholesky decomposition decomposes the correlation matrix into a lower-triangular factor L such that L @ iid_normals has the target correlation structure — a textbook technique for sampling multivariate normals without rejection.",
  },
  {
    id: "pyfin-20260726-b1-vol-arb-check",
    language: "python",
    title: "Butterfly and calendar spread arbitrage checks on vol surface",
    tag: "derivatives",
    code: `import numpy as np

def check_surface_arbitrage(strikes, expiries, call_prices, S=100, r=0.05):
    """
    Two necessary (not sufficient) no-arbitrage conditions:
    1. Calendar spread: C(K, T1) < C(K, T2) for T1 < T2 (same K)
       Violation → free money: sell short-dated, buy long-dated.
    2. Butterfly: C(K-dK) - 2*C(K) + C(K+dK) >= 0 (convexity in K)
       Violation → free butterfly (risk-free profit).
       Equivalently: d^2C/dK^2 >= 0 (Breeden-Litzenberger: this is the PDF)

    Also check: call prices are non-negative and < S (no model needed).
    """
    K = np.asarray(strikes)
    T = np.asarray(expiries)
    C = np.asarray(call_prices)   # shape (n_strikes, n_expiries)

    violations = []

    # 1. Calendar spread: C must increase with T for fixed K
    for i in range(len(K)):
        for j in range(len(T) - 1):
            if C[i, j] >= C[i, j+1] - 1e-6:
                violations.append(
                    f"Calendar arb: K={K[i]:.0f} C(T={T[j]:.2f})={C[i,j]:.3f} "
                    f">= C(T={T[j+1]:.2f})={C[i,j+1]:.3f}")

    # 2. Butterfly: C must be convex in K (second finite difference >= 0)
    for j in range(len(T)):
        for i in range(1, len(K) - 1):
            dK1 = K[i]   - K[i-1]
            dK2 = K[i+1] - K[i]
            # Normalised butterfly (finite difference approximation)
            bf = (C[i-1, j]/dK1 - C[i, j]*(1/dK1 + 1/dK2) + C[i+1, j]/dK2)
            if bf < -1e-4:
                violations.append(
                    f"Butterfly arb: T={T[j]:.2f} K={K[i]:.0f} "
                    f"value={bf:.4f}")

    if violations:
        print(f"FOUND {len(violations)} ARBITRAGE VIOLATIONS:")
        for v in violations[:5]:
            print(f"  {v}")
    else:
        print("No arbitrage violations detected.")
    return violations

# Construct a surface with one planted butterfly violation
K = np.array([90.0, 95, 100, 105, 110])
T = np.array([0.25, 0.5, 1.0])
# Generate BS-consistent call prices (no arb)
from scipy.stats import norm as N
def bs(S, K, r, sig, T):
    d1 = (np.log(S/K)+(r+0.5*sig**2)*T)/(sig*np.sqrt(T))
    return S*N.cdf(d1)-K*np.exp(-r*T)*N.cdf(d1-sig*np.sqrt(T))

vols = np.array([0.22, 0.21, 0.20, 0.21, 0.22])  # smile
C = np.array([[bs(100, ki, 0.05, vols[ii], tj)
               for tj in T] for ii, ki in enumerate(K)])

print("--- Clean surface (no arb) ---")
check_surface_arbitrage(K, T, C)

# Plant a butterfly violation: make C(K=100) too expensive
C[2, 1] += 2.0
print("\\n--- After planting butterfly violation ---")
check_surface_arbitrage(K, T, C)`,
    explanation: "A vol surface must satisfy monotonicity in T (calendar condition) and convexity in K (butterfly condition) to be free of static arbitrage; the butterfly condition is equivalent to requiring the risk-neutral density (∂²C/∂K²) to be non-negative by Breeden-Litzenberger, so a butterfly violation implies a negative risk-neutral probability — a model-free flag for a mis-specified surface.",
  },
  {
    id: "pyfin-20260726-b1-variance-swap",
    language: "python",
    title: "Variance swap replication via log contract pricing",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def variance_swap_strike(S, r, T, call_prices, put_prices, strikes):
    """
    Model-free variance swap strike (fair variance) from the Carr-Madan formula:
      K_var = (2/T) * [ Σ_K>F (C_K/K^2)*dK + Σ_K<=F (P_K/K^2)*dK ]
                  + correction for non-zero F

    This is the square of the VIX (CBOE uses this formula).
    Uses trapezoidal integration over a discrete strike grid.
    """
    F = S * np.exp(r * T)   # forward price
    K = np.asarray(strikes, dtype=float)
    dK = np.diff(K)

    # Use puts for K < F, calls for K > F (standard CBOE convention)
    midpoints = 0.5 * (K[:-1] + K[1:])
    option_prices = np.where(midpoints <= F,
                             0.5*(put_prices[:-1]+put_prices[1:]),
                             0.5*(call_prices[:-1]+call_prices[1:]))

    # Integrand: 2/K^2 per Carr-Madan
    integrand = 2.0 / midpoints**2 * option_prices

    # Trapezoidal sum
    fair_var = np.sum(integrand * dK) / T

    # ATM correction (approximate): subtract (F/K_atm - 1)^2 term
    K_atm  = K[np.argmin(np.abs(K - F))]
    corr   = (F / K_atm - 1)**2
    fair_var -= corr

    vix_equiv = np.sqrt(fair_var) * 100   # in vol points (like VIX)
    print(f"Forward: {F:.2f}")
    print(f"Fair variance: {fair_var:.6f}")
    print(f"Fair vol (VIX-equiv): {vix_equiv:.2f}")
    return fair_var

# Generate BS smile call/put prices to test
from scipy.stats import norm as N
def bs_call(S, K, r, sig, T):
    d1 = (np.log(S/K)+(r+0.5*sig**2)*T)/(sig*np.sqrt(T))
    return S*N.cdf(d1)-K*np.exp(-r*T)*N.cdf(d1-sig*np.sqrt(T))
def bs_put(S, K, r, sig, T):
    return bs_call(S, K, r, sig, T) - S + K*np.exp(-r*T)

S, r, T = 100, 0.05, 1.0
strikes = np.linspace(70, 140, 50)
vol     = 0.20   # flat vol (no smile)
calls   = [bs_call(S, K, r, vol, T) for K in strikes]
puts    = [bs_put(S, K, r, vol, T)  for K in strikes]
k_var   = variance_swap_strike(S, r, T, calls, puts, strikes)
print(f"Expected: vol^2 = {vol**2:.4f}  (recover with dense enough grid)")`,
    explanation: "The Carr-Madan formula prices a variance swap model-free by decomposing the log contract into a portfolio of vanilla options across all strikes; this is the theoretical foundation of the VIX index (which computes fair volatility from the S&P 500 options surface) and shows that implied variance is the market price of a volatility derivative regardless of the model.",
  },
  {
    id: "pyfin-20260726-b1-ledoit-wolf",
    language: "python",
    title: "Ledoit-Wolf shrinkage estimator for the covariance matrix",
    tag: "portfolio",
    code: `import numpy as np

def ledoit_wolf_shrinkage(returns):
    """
    Ledoit-Wolf (2004) analytical shrinkage of the sample covariance matrix
    toward a structured target (scaled identity matrix).

    Sigma_shrunk = (1-alpha)*S + alpha*mu_bar*I
    where alpha is the optimal shrinkage intensity derived analytically.

    This reduces estimation error for high-dimensional portfolios (p > n/5)
    without requiring cross-validation.
    """
    T, n = returns.shape
    X    = returns - returns.mean(axis=0)   # demean

    S    = (X.T @ X) / T           # sample covariance (biased, but consistent)
    mu   = np.trace(S) / n          # average variance = target scaling

    # Compute the Ledoit-Wolf shrinkage intensity alpha*
    # Using the Rao-Ledoit-Wolf formula (simplified for identity target)
    # delta^2: squared Frobenius distance between S and target
    delta2 = np.sum((S - mu * np.eye(n))**2) / n

    # beta^2: mean squared estimation error (approximate)
    b2 = 0.0
    for t in range(T):
        xt = X[t, :]
        Xt = np.outer(xt, xt)
        b2 += np.sum((Xt - S)**2)
    b2 /= T**2 * n

    alpha = min(b2 / delta2, 1.0)    # shrinkage intensity in [0, 1]

    Sigma_shrunk = (1 - alpha) * S + alpha * mu * np.eye(n)

    # Condition number comparison
    eig_S  = np.linalg.eigvalsh(S)
    eig_sh = np.linalg.eigvalsh(Sigma_shrunk)
    cond_S  = eig_S[-1]  / max(eig_S[0],  1e-10)
    cond_sh = eig_sh[-1] / max(eig_sh[0], 1e-10)

    print(f"Shrinkage intensity alpha: {alpha:.4f}")
    print(f"Condition number: sample={cond_S:.1f}  shrunk={cond_sh:.1f}")
    print(f"Min eigenvalue: sample={eig_S[0]:.4f}  shrunk={eig_sh[0]:.4f}")
    return Sigma_shrunk, alpha

np.random.seed(42)
# High-dimensional case: 50 assets, 100 observations (challenging for sample cov)
n, T = 50, 100
true_cov = 0.3*np.ones((n, n)) + 0.7*np.eye(n)
L = np.linalg.cholesky(true_cov)
returns = np.random.standard_normal((T, n)) @ L.T

Sigma_shrunk, alpha = ledoit_wolf_shrinkage(returns)`,
    explanation: "When the number of assets p approaches the number of observations T, the sample covariance matrix becomes ill-conditioned (some eigenvalues collapse to zero), causing MVO to assign extreme weights; Ledoit-Wolf shrinkage pulls eigenvalues toward the cross-sectional mean, dramatically improving the condition number and out-of-sample portfolio performance at the cost of a slight bias.",
  },
  {
    id: "pyfin-20260726-b1-order-flow-imbalance",
    language: "python",
    title: "Order flow imbalance (OFI) signal for short-term alpha",
    tag: "microstructure",
    code: `import numpy as np

def order_flow_imbalance(bid_sizes, ask_sizes, bid_prices, ask_prices,
                          window=10):
    """
    Order Flow Imbalance (Cont, Kukanov, Stoikov 2014):
      OFI_t = delta_BidSize * I(bid unchanged) + BidSize * I(bid increased)
             - delta_AskSize * I(ask unchanged) - AskSize * I(ask decreased)

    Simplified version: OFI = (bid_size_change - ask_size_change) / total_size
    Positive OFI → buying pressure → price likely to rise.
    """
    n = len(bid_sizes)
    ofi = np.zeros(n)

    for t in range(1, n):
        d_bid = bid_sizes[t] - bid_sizes[t-1]
        d_ask = ask_sizes[t] - ask_sizes[t-1]
        # Standard OFI: bid queue growth - ask queue growth
        total = bid_sizes[t] + ask_sizes[t] + 1e-6
        ofi[t] = (d_bid - d_ask) / total

    # Rolling OFI: sum over window (captures accumulated imbalance)
    rolling_ofi = np.convolve(ofi, np.ones(window)/window, mode='same')

    # Mid-price change for next tick
    mid = (bid_prices + ask_prices) / 2.0
    fwd_ret = np.diff(mid, append=mid[-1])

    # Information coefficient: Pearson corr(OFI, forward return)
    mask = np.arange(window, n - 1)
    ic   = np.corrcoef(rolling_ofi[mask], fwd_ret[mask])[0, 1]
    print(f"OFI-return IC: {ic:.4f}  (>0 confirms directional predictability)")

    # Signal: top/bottom decile OFI triggers position
    q90 = np.percentile(rolling_ofi, 90)
    q10 = np.percentile(rolling_ofi, 10)
    position = np.where(rolling_ofi > q90, 1,
               np.where(rolling_ofi < q10, -1, 0))
    strategy_ret = position[:-1] * fwd_ret[:-1]
    sr = strategy_ret.mean() / (strategy_ret.std() + 1e-10) * np.sqrt(n)
    print(f"Strategy Sharpe (ann.): {sr:.3f}")
    return rolling_ofi, ic

np.random.seed(42)
n = 500
mid  = 100.0 + np.cumsum(np.random.normal(0, 0.01, n))
bid  = mid - 0.01
ask  = mid + 0.01
# Simulate: large bid queue → price tends to rise
bid_s = 200 + 50*np.random.randn(n)
ask_s = 200 + 50*np.random.randn(n)
# Inject signal: large bid size predicts +0.005 move
bid_s += 30 * np.sign(np.diff(mid, append=mid[-1]))
order_flow_imbalance(bid_s, ask_s, bid, ask)`,
    explanation: "Order Flow Imbalance is a high-frequency alpha signal based on level-1 quote dynamics: an imbalance in the replenishment of bid vs. ask queues predicts short-term price direction because it reflects net execution pressure not yet reflected in the mid-price; it is the most consistently documented microstructure alpha signal with typical information coefficients of 0.02–0.10.",
  },
];
