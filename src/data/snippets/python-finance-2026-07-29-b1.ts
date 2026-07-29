import type { Snippet } from "./types";

export const pythonFinanceSnippets20260729B1: Snippet[] = [
  {
    id: "pyfin-20260729-b1-bdt-model",
    language: "python",
    title: "Black-Derman-Toy (BDT) short-rate model calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

# BDT: lognormal short-rate tree calibrated to market zero-coupon prices.
# At each time step n, node rates are: r[n][j] = a[n] * exp(b[n]*j)
# where a[n] scales the level and b[n] controls volatility.

def bdt_price_zcb(a, b, dt, n_steps):
    """Price a zero-coupon bond on a BDT tree."""
    n = n_steps
    # Build rate tree: r[step][node]
    rates = []
    for i in range(n + 1):
        level = [a[i] * np.exp(b[i] * j) for j in range(i + 1)]
        rates.append(level)

    # Backward induction: start at maturity (price = 1)
    prices = [[1.0] * (n + 1)]
    for i in range(n - 1, -1, -1):
        prev = prices[0]
        curr = []
        for j in range(i + 1):
            r = rates[i][j]
            p = 0.5 * (prev[j] + prev[j + 1]) * np.exp(-r * dt)
            curr.append(p)
        prices.insert(0, curr)
    return prices[0][0]

def calibrate_bdt(market_prices, vol=0.15, dt=1.0):
    """Calibrate BDT a[i] to match market ZCB prices at each maturity."""
    n = len(market_prices)
    a = np.ones(n)
    b = np.full(n, vol)  # flat vol for simplicity

    for i in range(n):
        target = market_prices[i]
        def objective(ai):
            a[i] = ai
            return bdt_price_zcb(a, b, dt, i + 1) - target
        a[i] = brentq(objective, 1e-6, 1.0)

    return a, b

# Market zero-coupon bond prices for maturities 1..5
market_zcbs = [0.9524, 0.9070, 0.8638, 0.8227, 0.7835]  # ~5% flat rate
a_fit, b_fit = calibrate_bdt(market_zcbs, vol=0.15, dt=1.0)
print("Calibrated BDT rates (a[i]):", np.round(a_fit, 4))`,
    explanation: "BDT builds a lognormal interest rate tree calibrated exactly to market zero-coupon bond prices at each maturity, ensuring the model is arbitrage-free by construction; the scalar a[i] at each step is found by 1-D root-finding so that backward induction reproduces the market price.",
  },
  {
    id: "pyfin-20260729-b1-svensson-fit",
    language: "python",
    title: "Svensson term structure fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Svensson (1994): extension of Nelson-Siegel with a second hump/trough.
# r(T) = b0 + b1*(1-e^(-T/t1))/(T/t1)
#           + b2*((1-e^(-T/t1))/(T/t1) - e^(-T/t1))
#           + b3*((1-e^(-T/t2))/(T/t2) - e^(-T/t2))

def svensson(T, b0, b1, b2, b3, t1, t2):
    def factor(T_, tau):
        x = T_ / tau
        return (1 - np.exp(-x)) / x - np.exp(-x)
    x1 = T / t1
    level = b0
    slope = b1 * (1 - np.exp(-x1)) / x1
    hump1 = b2 * factor(T, t1)
    hump2 = b3 * factor(T, t2)
    return level + slope + hump1 + hump2

def fit_svensson(maturities, yields):
    def obj(params):
        b0,b1,b2,b3,t1,t2 = params
        if t1 <= 0 or t2 <= 0 or t1 == t2: return 1e10
        fitted = svensson(np.asarray(maturities), b0,b1,b2,b3,t1,t2)
        return np.sum((fitted - yields)**2)

    # Multiple starts to escape local minima
    best = None
    for t1_init in [1.0, 2.0, 5.0]:
        for t2_init in [3.0, 7.0, 10.0]:
            x0 = [0.04, -0.02, 0.01, 0.01, t1_init, t2_init]
            res = minimize(obj, x0, method='Nelder-Mead',
                           options={'maxiter': 5000, 'xatol': 1e-8})
            if best is None or res.fun < best.fun:
                best = res
    return best.x

# US Treasury yield curve (illustrative)
mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.053, 0.052, 0.050, 0.048, 0.046, 0.044, 0.043, 0.042, 0.041, 0.040])

params = fit_svensson(mats, yields)
b0,b1,b2,b3,t1,t2 = params
print(f"b0={b0:.4f} b1={b1:.4f} b2={b2:.4f} b3={b3:.4f} t1={t1:.2f} t2={t2:.2f}")
fitted = svensson(mats, *params)
print("RMSE:", np.sqrt(np.mean((fitted - yields)**2)))`,
    explanation: "Svensson adds a second exponential decay term to Nelson-Siegel, allowing the model to capture a second hump in the yield curve (common when both short-end and long-end policy expectations shift); multiple Nelder-Mead starts avoid the parameter non-identifiability that makes the 6-dimensional optimisation surface multi-modal.",
  },
  {
    id: "pyfin-20260729-b1-cir-model",
    language: "python",
    title: "CIR short-rate model: simulation and bond pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import ncx2

# Cox-Ingersoll-Ross (1985): dr = kappa*(theta - r)*dt + sigma*sqrt(r)*dW
# Mean-reverting, non-negative if 2*kappa*theta >= sigma^2 (Feller condition).
# Zero-coupon bond: P(0,T) = A(T)*exp(-B(T)*r0)

def cir_zcb(r0, kappa, theta, sigma, T):
    """Closed-form CIR zero-coupon bond price."""
    h = np.sqrt(kappa**2 + 2*sigma**2)
    A = ((2*h*np.exp((kappa+h)*T/2)) /
         (2*h + (kappa+h)*(np.exp(h*T)-1)))**(2*kappa*theta/sigma**2)
    B = (2*(np.exp(h*T) - 1)) / (2*h + (kappa+h)*(np.exp(h*T)-1))
    return A * np.exp(-B * r0)

def cir_simulate(r0, kappa, theta, sigma, T, n_paths=50_000, n_steps=252):
    """Simulate CIR paths using full truncation Euler."""
    dt = T / n_steps
    r = np.full(n_paths, r0)
    for _ in range(n_steps):
        r_pos = np.maximum(r, 0)
        r += kappa*(theta - r_pos)*dt + sigma*np.sqrt(r_pos*dt)*np.random.randn(n_paths)
        r = np.maximum(r, 0)  # full truncation
    return r

# Parameters
kappa, theta, sigma, r0, T = 0.5, 0.04, 0.1, 0.03, 5.0

# Check Feller condition
print(f"Feller condition 2*kappa*theta={2*kappa*theta:.4f} vs sigma^2={sigma**2:.4f}:",
      "satisfied" if 2*kappa*theta >= sigma**2 else "violated")

# Closed-form bond price
p_cf = cir_zcb(r0, kappa, theta, sigma, T)
print(f"ZCB P(0,{T}) closed-form: {p_cf:.6f}")

# MC bond price: E[exp(-integral r dt)] approx by exp(-mean(r)*T)
# (accurate when path is short; use path integral for precision)
r_T = cir_simulate(r0, kappa, theta, sigma, T)
print(f"Terminal rate mean: {r_T.mean():.4f}, std: {r_T.std():.4f}")`,
    explanation: "The CIR model is the simplest short-rate model that remains non-negative under the Feller condition; its closed-form bond pricing formula makes calibration to the yield curve straightforward via a one-dimensional root-finding per maturity, and the non-central chi-squared distribution of the terminal rate enables exact (non-Euler) simulation.",
  },
  {
    id: "pyfin-20260729-b1-regime-switching",
    language: "python",
    title: "2-state Markov regime-switching return model",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Hamilton (1989): returns switch between a 'bull' and 'bear' regime.
# Hidden Markov Model with Gaussian emissions and 2x2 transition matrix.
# Estimated via EM (Baum-Welch): E-step = filter+smoother, M-step = update params.

def em_regime_switching(returns, n_iter=100):
    n = len(returns)
    # Init: bull = positive mean, bear = negative mean
    mu    = np.array([0.001, -0.002])
    sigma = np.array([0.01,   0.02])
    P     = np.array([[0.97, 0.03],   # transition matrix [from state]
                      [0.05, 0.95]])
    pi    = np.array([0.6, 0.4])      # initial state distribution

    for _ in range(n_iter):
        # E-step: forward-backward algorithm
        # Emission probabilities
        from scipy.stats import norm
        em = np.column_stack([norm.pdf(returns, mu[s], sigma[s]) for s in range(2)])
        em = np.maximum(em, 1e-300)

        # Forward pass
        alpha = np.zeros((n, 2))
        alpha[0] = pi * em[0]
        alpha[0] /= alpha[0].sum()
        scales = np.zeros(n)
        scales[0] = alpha[0].sum() if alpha[0].sum() > 0 else 1
        for t in range(1, n):
            alpha[t] = (alpha[t-1] @ P) * em[t]
            s = alpha[t].sum()
            scales[t] = s if s > 0 else 1
            alpha[t] /= scales[t]

        # Backward pass
        beta = np.ones((n, 2))
        for t in range(n-2, -1, -1):
            beta[t] = (P * em[t+1] * beta[t+1]).sum(axis=1)
            beta[t] /= beta[t].sum() + 1e-300

        # Smoothed state probabilities
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True) + 1e-300

        # M-step: update parameters
        mu    = (gamma * returns[:, None]).sum(0) / gamma.sum(0)
        sigma = np.sqrt((gamma * (returns[:, None] - mu)**2).sum(0) / gamma.sum(0))
        xi = np.zeros((2, 2))
        for t in range(n-1):
            xi += alpha[t:t+1].T * P * em[t+1] * beta[t+1]
        xi /= xi.sum() + 1e-300
        P = xi / xi.sum(axis=1, keepdims=True)
        pi = gamma[0]

    return mu, sigma, P, gamma

np.random.seed(42)
bull = np.random.normal(0.001, 0.01, 500)
bear = np.random.normal(-0.002, 0.025, 200)
returns = np.concatenate([bull, bear, bull[:100]])

mu, sigma, P, gamma = em_regime_switching(returns)
print(f"Bull regime: mu={mu[0]:.4f}  sigma={sigma[0]:.4f}")
print(f"Bear regime: mu={mu[1]:.4f}  sigma={sigma[1]:.4f}")
print(f"Transition P:\\n{P.round(3)}")`,
    explanation: "The Hamilton (1989) regime-switching model captures structural breaks in return distributions by allowing the mean and variance to jump between latent states; the Baum-Welch EM algorithm is used for calibration because the likelihood is not available in closed form — the forward-backward recursion computes the E-step in O(T·K²) time where K=2 states.",
  },
  {
    id: "pyfin-20260729-b1-asian-geo-cv",
    language: "python",
    title: "Asian call MC with geometric average control variate",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def geo_asian_closed(S0, K, T, r, sigma, n):
    """Closed-form geometric-average Asian call (Kemna-Vorst 1990)."""
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))
    mu_g    = (r - 0.5*sigma**2) * (n + 1) / (2*n) + 0.5*sigma_g**2
    d1 = (np.log(S0/K) + (mu_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    return np.exp(-r*T) * (S0*np.exp(mu_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

def asian_arith_with_cv(S0, K, T, r, sigma, n_paths=200_000, n_steps=52):
    dt = T / n_steps
    S = np.full(n_paths, S0)
    arith_sums = np.zeros(n_paths)
    log_sums   = np.zeros(n_paths)

    for _ in range(n_steps):
        Z = np.random.randn(n_paths)
        S *= np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z)
        arith_sums += S
        log_sums   += np.log(S)

    arith_avg = arith_sums / n_steps
    geo_avg   = np.exp(log_sums / n_steps)

    payoff_arith = np.maximum(arith_avg - K, 0)
    payoff_geo   = np.maximum(geo_avg   - K, 0)

    # Control variate: use geometric payoff, known analytical value
    geo_price_mc  = np.exp(-r*T) * payoff_geo.mean()
    geo_price_cf  = geo_asian_closed(S0, K, T, r, sigma, n_steps)
    correction    = geo_price_cf - geo_price_mc

    arith_price_raw = np.exp(-r*T) * payoff_arith.mean()
    # Optimal beta via covariance
    cov = np.cov(payoff_arith, payoff_geo)
    beta = cov[0,1] / cov[1,1]
    arith_price_cv = arith_price_raw + beta * correction

    raw_se = payoff_arith.std() / np.sqrt(n_paths) * np.exp(-r*T)
    cv_se  = (payoff_arith - beta*payoff_geo).std() / np.sqrt(n_paths) * np.exp(-r*T)
    return arith_price_raw, arith_price_cv, raw_se, cv_se

raw, cv, se_raw, se_cv = asian_arith_with_cv(100, 100, 1, 0.05, 0.2)
print(f"Arith Asian call (raw): {raw:.4f} ± {1.96*se_raw:.4f}")
print(f"Arith Asian call (CV):  {cv:.4f} ± {1.96*se_cv:.4f}")
print(f"Variance reduction: {(se_raw/se_cv)**2:.1f}x")`,
    explanation: "The geometric average Asian option has a closed-form price (Kemna-Vorst), making it a near-perfect control variate for the arithmetic average: both payoffs are driven by the same paths and are highly correlated, so subtracting the known bias of the geometric estimator reduces Monte Carlo variance by a factor of 10–50x in practice.",
  },
  {
    id: "pyfin-20260729-b1-lookback-python",
    language: "python",
    title: "Floating-strike lookback call MC and analytical price",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def lookback_float_call_cf(S0, T, r, sigma):
    """Goldman-Sosin-Gatto (1979) floating-strike lookback call.
    Payoff = S_T - min(S_t, 0<=t<=T).
    Assumes S_min = S0 (option issued at-the-money start).
    """
    d1 = (np.log(1.0) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    # Exact formula for S_min = S_0 (at inception)
    price = (S0 * norm.cdf(d1)
             - S0 * np.exp(-r*T) * norm.cdf(d2)
             + S0 * sigma**2 / (2*r) * (norm.cdf(-d1)
               - np.exp(-r*T) * norm.cdf(-d2)))
    return price

def lookback_float_call_mc(S0, T, r, sigma, n_paths=200_000, n_steps=252):
    dt = T / n_steps
    S = np.full(n_paths, S0)
    S_min = np.full(n_paths, S0)
    for _ in range(n_steps):
        S *= np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*np.random.randn(n_paths))
        S_min = np.minimum(S_min, S)
    payoff = S - S_min
    price  = np.exp(-r*T) * payoff.mean()
    se     = np.exp(-r*T) * payoff.std() / np.sqrt(n_paths)
    return price, se

S0, T, r, sigma = 100, 1.0, 0.05, 0.20
cf  = lookback_float_call_cf(S0, T, r, sigma)
mc, se = lookback_float_call_mc(S0, T, r, sigma)
print(f"Closed-form: {cf:.4f}")
print(f"Monte Carlo: {mc:.4f} ± {1.96*se:.4f}")`,
    explanation: "The floating-strike lookback call always delivers the maximum possible profit from any entry point, so it prices at a significant premium to a vanilla call — typically 1.5–3x; the Goldman-Sosin-Gatto formula provides a closed-form benchmark that MC must reproduce, making it an ideal sanity check for path-dependent pricing engines.",
  },
  {
    id: "pyfin-20260729-b1-digital-greeks",
    language: "python",
    title: "Digital option Greeks via finite differences",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def digital_cash_call(S, K, T, r, sigma):
    """Cash-or-nothing call: pays $1 if S_T > K."""
    d2 = (np.log(S/K) + (r - 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return np.exp(-r*T) * norm.cdf(d2)

def digital_greeks_fd(S, K, T, r, sigma, bump_pct=0.01):
    """Finite-difference Greeks for the cash-or-nothing call."""
    dS    = S * bump_pct
    dsig  = sigma * bump_pct
    dT    = T * bump_pct
    dr    = r * bump_pct if r != 0 else 0.001

    price = digital_cash_call(S, K, T, r, sigma)

    delta = (digital_cash_call(S+dS, K, T, r, sigma)
           - digital_cash_call(S-dS, K, T, r, sigma)) / (2*dS)

    gamma = (digital_cash_call(S+dS, K, T, r, sigma)
           - 2*price
           + digital_cash_call(S-dS, K, T, r, sigma)) / (dS**2)

    vega  = (digital_cash_call(S, K, T, r, sigma+dsig)
           - digital_cash_call(S, K, T, r, sigma-dsig)) / (2*dsig)

    theta = -(digital_cash_call(S, K, T-dT, r, sigma) - price) / dT

    rho   = (digital_cash_call(S, K, T, r+dr, sigma)
           - digital_cash_call(S, K, T, r-dr, sigma)) / (2*dr)

    return dict(price=price, delta=delta, gamma=gamma,
                vega=vega, theta=theta, rho=rho)

g = digital_greeks_fd(100, 100, 1.0, 0.05, 0.2)
for k, v in g.items():
    print(f"  {k:8s} = {v:+.6f}")`,
    explanation: "Digital options have a spike in gamma and vega near expiry as the binary payoff concentrates around the strike — the discontinuity makes the Black-Scholes formula well-known but the Greeks numerically unstable via analytic formulas near ATM; finite differences with a relative bump are more numerically robust and generalize to exotic payoffs without closed-form Greeks.",
  },
  {
    id: "pyfin-20260729-b1-sobol-qmc",
    language: "python",
    title: "Sobol quasi-Monte Carlo for option pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm as scipy_norm
from scipy.stats.qmc import Sobol

# Quasi-MC uses low-discrepancy sequences (Sobol, Halton) instead of
# pseudo-random numbers. Convergence: O(log(N)^d / N) vs O(1/sqrt(N)) for MC.
# Works best for smooth integrands (e.g., European options) in d <= 20 dims.

def european_call_qmc(S0, K, T, r, sigma, n_paths=65536, n_dims=1):
    """Price European call using Sobol QMC with inverse CDF transform."""
    sampler = Sobol(d=n_dims, scramble=True, seed=42)
    u = sampler.random(n_paths)           # shape (n_paths, n_dims)
    Z = scipy_norm.ppf(u[:, 0])           # inverse CDF: uniform -> Gaussian

    S_T   = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    payoff = np.maximum(S_T - K, 0)
    return np.exp(-r*T) * payoff.mean()

def european_call_mc(S0, K, T, r, sigma, n_paths=65536, seed=42):
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n_paths)
    S_T = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    return np.exp(-r*T) * np.maximum(S_T - K, 0).mean()

# Black-Scholes exact
def bs_call_exact(S0, K, T, r, sigma):
    d1 = (np.log(S0/K) + (r+0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return S0*scipy_norm.cdf(d1) - K*np.exp(-r*T)*scipy_norm.cdf(d1-sigma*np.sqrt(T))

exact = bs_call_exact(100, 100, 1, 0.05, 0.2)
qmc   = european_call_qmc(100, 100, 1, 0.05, 0.2)
mc    = european_call_mc(100, 100, 1, 0.05, 0.2)
print(f"Exact:  {exact:.6f}")
print(f"QMC:    {qmc:.6f}  error={abs(qmc-exact):.2e}")
print(f"MC:     {mc:.6f}  error={abs(mc-exact):.2e}")`,
    explanation: "Sobol sequences fill the hypercube more uniformly than pseudo-random numbers, achieving near-O(1/N) convergence for smooth integrands instead of O(1/√N); scrambling prevents the sequence's determinism from introducing bias, and scipy.stats.qmc provides production-ready implementations without requiring a C extension.",
  },
  {
    id: "pyfin-20260729-b1-risk-parity",
    language: "python",
    title: "Risk parity: equal risk contribution portfolio",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Risk parity: each asset contributes equally to total portfolio variance.
# MRC_i = w_i * (Sigma @ w)_i / (w.T @ Sigma @ w) = 1/N for all i.
# Solve via minimisation of sum of squared deviations from equal share.

def portfolio_risk(w, cov):
    return np.sqrt(w @ cov @ w)

def risk_contributions(w, cov):
    """Marginal risk contribution times weight = risk contribution."""
    port_vol = portfolio_risk(w, cov)
    mrc = cov @ w / port_vol       # marginal risk contributions
    return w * mrc                 # risk contributions (sum = port_vol)

def risk_parity_weights(cov, tol=1e-10):
    n = len(cov)
    def objective(w):
        rc = risk_contributions(w, cov)
        avg = rc.mean()
        return np.sum((rc - avg)**2)   # equal RC = zero objective

    constraints = [{'type': 'eq', 'fun': lambda w: w.sum() - 1}]
    bounds = [(1e-6, 1.0)] * n
    w0 = np.ones(n) / n
    res = minimize(objective, w0, method='SLSQP',
                   bounds=bounds, constraints=constraints,
                   options={'ftol': tol, 'maxiter': 1000})
    return res.x

# Example: 3-asset universe (equities, bonds, commodities)
cov = np.array([
    [0.04,   0.006,  0.002],
    [0.006,  0.0025, 0.001],
    [0.002,  0.001,  0.01 ],
])
w = risk_parity_weights(cov)
rc = risk_contributions(w, cov)
print("Risk parity weights:", np.round(w, 4))
print("Risk contributions:", np.round(rc, 6))
print("Equal share:", round(portfolio_risk(w, cov)/3, 6))`,
    explanation: "Risk parity equalises each asset's marginal contribution to portfolio volatility rather than its capital weight, dramatically reducing concentration to the highest-volatility asset; the solution is found via quadratic programming because the equal-contribution constraint is non-linear in weights, and the result is unique when the covariance matrix is positive definite.",
  },
  {
    id: "pyfin-20260729-b1-black-litterman",
    language: "python",
    title: "Black-Litterman model with investor views",
    tag: "finance",
    code: `import numpy as np

# Black-Litterman (1990): blends CAPM equilibrium returns (Pi) with
# investor views (Q = P @ mu + epsilon, epsilon ~ N(0, Omega)).
# Posterior: mu_BL = [(tau*Sigma)^-1 + P.T Omega^-1 P]^-1
#            * [(tau*Sigma)^-1 Pi + P.T Omega^-1 Q]

def black_litterman(Sigma, w_mkt, risk_aversion, tau, P, Q, Omega):
    """
    Sigma: (n,n) covariance matrix
    w_mkt: (n,) market cap weights
    risk_aversion: scalar lambda (typically 2.5-3.5)
    tau: uncertainty in prior (typically 0.025-0.05)
    P: (k,n) view matrix (k views)
    Q: (k,) view returns
    Omega: (k,k) view uncertainty (diagonal typically)
    """
    # CAPM implied equilibrium returns
    Pi = risk_aversion * Sigma @ w_mkt

    # Posterior mean (Black-Litterman formula)
    tSigma = tau * Sigma
    tSigma_inv = np.linalg.inv(tSigma)
    Omega_inv  = np.linalg.inv(Omega)

    M = tSigma_inv + P.T @ Omega_inv @ P
    mu_bl = np.linalg.solve(M, tSigma_inv @ Pi + P.T @ Omega_inv @ Q)

    # Posterior covariance
    Sigma_bl = Sigma + np.linalg.inv(M)

    # Optimal MV weights
    w_opt = np.linalg.solve(risk_aversion * Sigma_bl, mu_bl)
    w_opt /= w_opt.sum()   # renormalise to sum to 1
    return mu_bl, w_opt

# 3 assets: US equity, EU equity, EM equity
n = 3
Sigma = np.array([[0.04, 0.018, 0.012],
                  [0.018, 0.036, 0.014],
                  [0.012, 0.014, 0.09]])
w_mkt = np.array([0.50, 0.30, 0.20])

# View 1: US equity will outperform EU equity by 3%/yr
P     = np.array([[1, -1, 0]])
Q     = np.array([0.03])
Omega = np.array([[0.0001]])   # high confidence

mu_bl, w_bl = black_litterman(Sigma, w_mkt, 3.0, 0.025, P, Q, Omega)
print("BL expected returns:", np.round(mu_bl, 4))
print("BL optimal weights: ", np.round(w_bl, 4))`,
    explanation: "Black-Litterman starts from the market portfolio as a prior (eliminating the garbage-in-garbage-out problem of mean-variance with estimated returns) and shifts weights toward investor views proportionally to view confidence; a high-confidence view (small Omega) pulls the posterior strongly toward the view, while low confidence barely perturbs the equilibrium.",
  },
  {
    id: "pyfin-20260729-b1-ff3-regression",
    language: "python",
    title: "Fama-French 3-factor model OLS regression",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

# Fama-French (1993): excess return = alpha + b*Mkt + s*SMB + h*HML + e
# Mkt = market excess return, SMB = small-minus-big, HML = high-minus-low (book/price)

np.random.seed(42)
n = 120  # 10 years of monthly data

# Simulate FF factors
mkt = np.random.normal(0.006, 0.045, n)
smb = np.random.normal(0.002, 0.03,  n)
hml = np.random.normal(0.003, 0.025, n)

# True factor loadings for a small-cap value fund
alpha_true = 0.003   # 36 bp/month alpha
b, s, h = 1.1, 0.8, 0.6

portfolio_ret = alpha_true + b*mkt + s*smb + h*hml + np.random.normal(0, 0.015, n)

# OLS regression
X = sm.add_constant(np.column_stack([mkt, smb, hml]))
model = sm.OLS(portfolio_ret, X).fit()

print(model.summary().tables[1])
print(f"\\nAnnualised alpha: {model.params[0]*12:.4f}")
print(f"Information ratio: {model.params[0]/model.bse[0]:.2f}")

# Appraisal ratio: alpha / idiosyncratic vol (not total t-stat)
resid_std = model.resid.std() * np.sqrt(12)
print(f"Appraisal ratio: {model.params[0]*12 / resid_std:.3f}")`,
    explanation: "The Fama-French 3-factor regression decomposes a portfolio's return into systematic exposure to market, size, and value premia, with the intercept (alpha) measuring unexplained return after factor adjustment; the appraisal ratio (alpha / idiosyncratic vol) is more informative than raw alpha because it measures how much active risk is taken per unit of active return.",
  },
  {
    id: "pyfin-20260729-b1-pandas-multiindex",
    language: "python",
    title: "Pandas MultiIndex for OHLCV panel data",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

# MultiIndex: (date, ticker) -> (Open, High, Low, Close, Volume)
# Enables efficient cross-sectional and time-series operations.

np.random.seed(42)
dates   = pd.date_range('2024-01-02', periods=252, freq='B')
tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']

# Build panel from scratch
records = []
for tkr in tickers:
    price = 100.0
    for d in dates:
        ret = np.random.normal(0.0003, 0.015)
        price *= (1 + ret)
        records.append({
            'date': d, 'ticker': tkr,
            'close': round(price, 2),
            'volume': int(np.random.exponential(1e6)),
        })

df = pd.DataFrame(records).set_index(['date', 'ticker'])

# Cross-sectional rank: which stock is best on each date?
closes = df['close'].unstack('ticker')          # date x ticker pivot

# Daily returns
rets = closes.pct_change()

# Rolling 20-day correlation between AAPL and MSFT
roll_corr = rets['AAPL'].rolling(20).corr(rets['MSFT'])
print("Rolling 20d AAPL-MSFT corr (last 5):")
print(roll_corr.dropna().tail())

# Cross-sectional z-score on each date (useful for factor construction)
cs_zscore = rets.sub(rets.mean(axis=1), axis=0).div(rets.std(axis=1), axis=0)
print("\\nCross-sectional z-score sample:")
print(cs_zscore.tail(3).round(3))

# Groupby ticker: Sharpe per stock
def sharpe(s): return s.mean()/s.std() * np.sqrt(252)
print("\\nAnnualised Sharpe:")
print(rets.apply(sharpe).round(2))`,
    explanation: "A (date, ticker) MultiIndex is the natural structure for an equity panel: unstack('ticker') pivots to a date × ticker matrix for vectorised cross-sectional operations, while stack() reverses it; the cross-sectional z-score normalisation is standard for factor signal construction because it neutralises cross-date variation in the universe's average return.",
  },
  {
    id: "pyfin-20260729-b1-nelder-mead-calib",
    language: "python",
    title: "Nelder-Mead calibration of Heston parameters to market vols",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

# Calibrate Heston (kappa, theta, xi, rho, v0) by minimising
# sum of squared differences between model and market implied vols.

def heston_char_func(u, S0, K, T, r, kappa, theta, xi, rho, v0):
    """Heston characteristic function (Gatheral form)."""
    i = 1j
    lam = np.sqrt(xi**2*(u**2 + i*u) + (kappa - i*rho*xi*u)**2)
    omega = np.exp(i*u*np.log(S0) + i*u*r*T)
    g = (kappa - i*rho*xi*u - lam) / (kappa - i*rho*xi*u + lam)
    C = kappa*theta/xi**2 * ((kappa - i*rho*xi*u - lam)*T
         - 2*np.log((1 - g*np.exp(-lam*T))/(1 - g)))
    D = (kappa - i*rho*xi*u - lam)/xi**2 * (1 - np.exp(-lam*T))/(1 - g*np.exp(-lam*T))
    return np.exp(C + D*v0) * omega

def heston_call_price(S0, K, T, r, kappa, theta, xi, rho, v0, N=64):
    """Numerical integration via Gauss-Laguerre quadrature (simplified)."""
    from scipy.integrate import quad
    integrand = lambda u: np.real(
        np.exp(-1j*u*np.log(K)) * heston_char_func(u - 0.5j, S0, K, T, r, kappa, theta, xi, rho, v0)
        / (1j*u)
    )
    I, _ = quad(integrand, 1e-8, 200)
    return np.exp(-r*T) * (S0 - np.sqrt(S0*K*np.exp(-r*T)) * (0.5 - I/np.pi))

def bs_implied_vol(price, S0, K, T, r):
    """Newton-Raphson IV solver."""
    sigma = 0.3
    for _ in range(50):
        d1 = (np.log(S0/K) + (r+0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        bs = S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
        vega = S0*norm.pdf(d1)*np.sqrt(T)
        if abs(vega) < 1e-12: break
        sigma -= (bs - price) / vega
    return max(sigma, 1e-6)

# Toy market surface: flat 20% IV
S0, T, r = 100, 1.0, 0.05
strikes = np.array([80, 90, 100, 110, 120])
market_ivs = np.array([0.22, 0.21, 0.20, 0.21, 0.22])  # smile

def objective(params):
    kappa, theta, xi, rho, v0 = np.abs(params[0]), np.abs(params[1]), np.abs(params[2]), np.clip(params[3],-0.99,0.99), np.abs(params[4])
    try:
        model_ivs = np.array([
            bs_implied_vol(heston_call_price(S0, K, T, r, kappa, theta, xi, rho, v0), S0, K, T, r)
            for K in strikes
        ])
        return np.sum((model_ivs - market_ivs)**2)
    except Exception:
        return 1e10

x0 = [2.0, 0.04, 0.3, -0.7, 0.04]
res = minimize(objective, x0, method='Nelder-Mead',
               options={'maxiter': 2000, 'xatol': 1e-6, 'fatol': 1e-8})
kappa, theta, xi, rho, v0 = res.x
print(f"Calibrated: kappa={abs(kappa):.3f} theta={abs(theta):.4f} xi={abs(xi):.3f} rho={np.clip(rho,-0.99,0.99):.3f} v0={abs(v0):.4f}")`,
    explanation: "Heston calibration minimises the distance between model-implied and market-implied volatilities across the strike surface; Nelder-Mead is used instead of gradient methods because the objective is non-smooth (it contains a nested IV inversion) and the parameter space has known non-convexities, though in production a gradient-based method with analytic sensitivities would be faster.",
  },
  {
    id: "pyfin-20260729-b1-credit-var",
    language: "python",
    title: "Credit portfolio VaR via Monte Carlo with default correlation",
    tag: "finance",
    code: `import numpy as np

# Credit portfolio VaR: Monte Carlo with Gaussian copula for default correlation.
# Each obligor i defaults if Z_i < Phi^-1(PD_i) where Z_i = rho*M + sqrt(1-rho^2)*e_i,
# M = systemic factor, e_i = idiosyncratic factor.

from scipy.stats import norm

def credit_portfolio_var(pds, lgds, notionals, rho=0.20,
                          n_sims=100_000, confidence=0.99):
    """
    pds:       array of default probabilities per obligor
    lgds:      loss given default (fraction)
    notionals: exposure sizes
    rho:       asset correlation (same for all pairs, one-factor model)
    """
    n = len(pds)
    thresholds = norm.ppf(pds)   # default if Z_i < threshold
    sqrt_rho   = np.sqrt(rho)
    sqrt_1mrho = np.sqrt(1 - rho)

    losses = np.zeros(n_sims)
    M_draws = np.random.randn(n_sims)           # systemic factor

    for i in range(n):
        e_draws = np.random.randn(n_sims)       # idiosyncratic
        Z = sqrt_rho * M_draws + sqrt_1mrho * e_draws
        defaults = Z < thresholds[i]            # boolean array
        losses += defaults * lgds[i] * notionals[i]

    var   = np.percentile(losses, confidence*100)
    es    = losses[losses >= var].mean()
    el    = losses.mean()
    return {'EL': el, 'VaR_99': var, 'ES_99': es,
            'UL': var - el}  # unexpected loss

# 5 obligors: different PDs and exposures
pds       = np.array([0.01, 0.02, 0.005, 0.03, 0.015])
lgds      = np.array([0.45, 0.40, 0.60,  0.35, 0.50])
notionals = np.array([10e6, 5e6, 20e6, 3e6, 8e6])

result = credit_portfolio_var(pds, lgds, notionals, rho=0.20)
for k, v in result.items():
    print(f"{k}: {v/1e6:.3f}M")`,
    explanation: "The Gaussian one-factor copula decomposes each obligor's creditworthiness into a shared systemic component (M) and idiosyncratic shocks; correlation between defaults arises entirely through M, so drawing M once per scenario and then sampling idiosyncratic shocks is vectorisable — the 99th percentile of the loss distribution is the credit VaR, and the excess above expected loss is the unexpected loss that capital must absorb.",
  },
  {
    id: "pyfin-20260729-b1-dv01-duration",
    language: "python",
    title: "DV01, modified duration, and convexity for fixed-income",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bond_price(ytm, coupon, face, n_periods, periods_per_year=2):
    """Flat-yield present value of a coupon bond."""
    c = coupon * face / periods_per_year
    r = ytm / periods_per_year
    t = np.arange(1, n_periods + 1)
    pv_coupons = np.sum(c / (1+r)**t)
    pv_face    = face / (1+r)**n_periods
    return pv_coupons + pv_face

def ytm_solver(price, coupon, face, n_periods, periods_per_year=2):
    return brentq(lambda y: bond_price(y, coupon, face, n_periods, periods_per_year) - price,
                  1e-6, 2.0)

def bond_analytics(coupon, face, maturity_yrs, ytm, periods_per_year=2):
    n = int(maturity_yrs * periods_per_year)
    price = bond_price(ytm, coupon, face, n, periods_per_year)

    # Modified duration: -1/P * dP/dy
    dy    = 1e-4  # 1 bp
    p_up  = bond_price(ytm + dy, coupon, face, n, periods_per_year)
    p_dn  = bond_price(ytm - dy, coupon, face, n, periods_per_year)
    mod_dur  = -(p_up - p_dn) / (2 * dy * price)
    dv01     = -mod_dur * price * dy     # P&L for 1 bp move (price units)

    # Convexity: 1/P * d²P/dy²
    convexity = (p_up + p_dn - 2*price) / (dy**2 * price)

    # Macaulay duration = modified * (1 + y/m)
    mac_dur = mod_dur * (1 + ytm / periods_per_year)

    return {
        'price':      price,
        'ytm':        ytm,
        'mac_dur':    mac_dur,
        'mod_dur':    mod_dur,
        'DV01':       dv01,
        'convexity':  convexity,
    }

# 10-year 5% coupon bond, YTM = 4.5%
a = bond_analytics(coupon=0.05, face=1000, maturity_yrs=10, ytm=0.045)
for k, v in a.items():
    print(f"  {k:12s}: {v:.6f}")`,
    explanation: "DV01 (dollar value of a basis point) is the fundamental fixed-income risk measure for P&L attribution and hedging: a position with DV01 = -$500 loses $500 for every 1 bp rise in yield; convexity is the second-order correction that makes a long bond position benefit from large moves in either direction, which is why bonds with higher convexity trade at a premium.",
  },
  {
    id: "pyfin-20260729-b1-market-impact",
    language: "python",
    title: "Almgren-Chriss market impact model for optimal execution",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Almgren-Chriss (2001): minimise E[cost] + lambda*Var[cost] for
# liquidating X shares over T time steps.
# Permanent impact: linear in trade rate. Temporary impact: linear.
# Analytic solution: sinh-based trajectory.

def almgren_chriss_trajectory(X, T, N, sigma, eta, gamma, lam):
    """
    X:     shares to liquidate
    T:     total time (days)
    N:     number of intervals
    sigma: daily volatility ($/share)
    eta:   temporary impact coefficient
    gamma: permanent impact coefficient
    lam:   risk aversion
    """
    tau = T / N
    kappa2 = lam * sigma**2 / eta
    kappa  = np.sqrt(kappa2)

    # Optimal remaining inventory schedule: x(t) = X * sinh(kappa*(T-t)) / sinh(kappa*T)
    t = np.linspace(0, T, N+1)
    x = X * np.sinh(kappa*(T - t)) / np.sinh(kappa*T)

    # Trade rates (number of shares sold each interval)
    trades = -np.diff(x)    # positive = selling

    # Expected cost (implementation shortfall)
    EC = 0.5 * gamma * X**2 + eta * np.sum(trades**2) / tau

    # Variance of cost
    VC = sigma**2 * np.sum(x[:-1]**2 * tau)

    return x, trades, EC, VC

X     = 100_000   # shares
T, N  = 5, 20     # 5 days, 20 intervals (4 per day)
sigma = 1.50      # $1.50 daily vol
eta   = 2.5e-7    # temporary impact
gamma = 2.5e-8    # permanent impact
lam   = 1e-6      # risk aversion

x, trades, EC, VC = almgren_chriss_trajectory(X, T, N, sigma, eta, gamma, lam)
print(f"Expected cost: \${EC:,.0f}")
print(f"Std of cost:   \${np.sqrt(VC):,.0f}")
print(f"Trade schedule (shares per interval): {trades[:5].astype(int)} ...")`,
    explanation: "The Almgren-Chriss model solves the tension between trading slowly (lower market impact) and trading quickly (lower price risk) by finding the hyperbolic-sinh optimal trajectory; the risk aversion parameter lambda controls the efficient frontier between expected cost and variance, with lambda→0 giving VWAP (time-weighted uniform trading) and lambda→∞ giving immediate liquidation.",
  },
  {
    id: "pyfin-20260729-b1-statsmodels-arima",
    language: "python",
    title: "ARIMA(p,d,q) model for interest rate forecasting",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller

np.random.seed(42)

# Simulate a near-unit-root process (like a short rate)
n = 300
r = np.zeros(n)
r[0] = 0.03
for t in range(1, n):
    r[t] = 0.98 * r[t-1] + np.random.normal(0, 0.002)

# Step 1: ADF test for stationarity
adf_stat, p_val, _, _, crit, _ = adfuller(r, autolag='AIC')
print(f"ADF stat={adf_stat:.3f}  p={p_val:.4f}  {'stationary' if p_val < 0.05 else 'non-stationary'}")

# Step 2: Fit ARIMA(1,1,0) if non-stationary (difference once)
d = 0 if p_val < 0.05 else 1
model = ARIMA(r, order=(1, d, 1))
fitted = model.fit()
print(fitted.summary().tables[1])

# Step 3: Forecast 10 steps ahead
fc = fitted.get_forecast(steps=10)
fc_mean = fc.predicted_mean
fc_ci   = fc.conf_int(alpha=0.05)

print("\\n10-step ahead forecasts:")
for i, (m, lo, hi) in enumerate(zip(fc_mean, fc_ci.iloc[:,0], fc_ci.iloc[:,1])):
    print(f"  t+{i+1:02d}: {m:.4f}  95% CI [{lo:.4f}, {hi:.4f}]")

# Step 4: In-sample residual diagnostics
from statsmodels.stats.diagnostic import acorr_ljungbox
lb = acorr_ljungbox(fitted.resid, lags=10, return_df=True)
print("\\nLjung-Box Q-test (H0: no autocorrelation in residuals):")
print(lb[['lb_stat', 'lb_pvalue']].round(4))`,
    explanation: "ARIMA modelling of interest rates requires checking stationarity first because a unit root violates OLS assumptions; if the ADF test fails to reject the unit root, differencing (d=1) removes the trend and makes the series stationary — the Ljung-Box test on residuals confirms whether the fitted ARMA structure captured all autocorrelation.",
  },
  {
    id: "pyfin-20260729-b1-sklearn-rf-alpha",
    language: "python",
    title: "Random forest alpha signal with feature importance",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import classification_report

np.random.seed(42)
n = 1000

# Features: technical and fundamental signals
ret_1d  = np.random.normal(0, 0.015, n)
ret_5d  = np.random.normal(0, 0.03, n)
vol_20d = np.abs(ret_1d).rolling_mean if False else np.random.uniform(0.01, 0.03, n)
rsi     = np.random.uniform(20, 80, n)
pb      = np.random.uniform(0.5, 5.0, n)   # price-to-book

# Target: 1 if next-month return > 0
forward_ret = 0.3*ret_5d + 0.2*(rsi/100 - 0.5) - 0.1*(pb-2) + np.random.normal(0, 0.02, n)
y = (forward_ret > 0).astype(int)

X = pd.DataFrame({'ret_1d': ret_1d, 'ret_5d': ret_5d,
                  'vol_20d': vol_20d, 'rsi': rsi, 'pb': pb})

# Time-series CV: walk-forward validation (no look-ahead)
tscv = TimeSeriesSplit(n_splits=5)
rf = RandomForestClassifier(n_estimators=200, max_depth=5,
                             min_samples_leaf=20, random_state=42)

oos_preds, oos_true = [], []
for train_idx, test_idx in tscv.split(X):
    rf.fit(X.iloc[train_idx], y[train_idx])
    oos_preds.extend(rf.predict(X.iloc[test_idx]))
    oos_true.extend(y[test_idx])

print(classification_report(oos_true, oos_preds))

# Feature importance
rf.fit(X, y)
for feat, imp in sorted(zip(X.columns, rf.feature_importances_),
                         key=lambda x: -x[1]):
    print(f"  {feat:12s}: {imp:.4f}")`,
    explanation: "Time-series cross-validation is mandatory for financial ML because standard k-fold shuffles future data into training sets, producing optimistic out-of-sample estimates; TimeSeriesSplit enforces chronological ordering so each validation fold is strictly after its training fold, and min_samples_leaf prevents overfitting to individual noisy observations.",
  },
];
