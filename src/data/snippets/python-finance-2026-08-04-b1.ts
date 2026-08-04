import type { Snippet } from "./types";

export const pythonFinanceSnippets20260804B1: Snippet[] = [
  {
    id: "pyfin-20260804-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Term Structure Fitting",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(t: np.ndarray, beta0, beta1, beta2, tau) -> np.ndarray:
    """
    Nelson-Siegel yield curve model:
    y(t) = b0 + b1*(1-exp(-t/tau))/(t/tau)
           + b2*((1-exp(-t/tau))/(t/tau) - exp(-t/tau))
    """
    x = t / tau
    ex = np.exp(-x)
    f1 = (1 - ex) / x
    return beta0 + beta1 * f1 + beta2 * (f1 - ex)

def fit_nelson_siegel(maturities: np.ndarray, yields: np.ndarray):
    def err(params):
        b0, b1, b2, tau = params
        if tau <= 0:
            return 1e9
        return np.sum((nelson_siegel(maturities, b0, b1, b2, tau) - yields)**2)
    res = minimize(err, [0.04, -0.02, 0.01, 2.0], method='Nelder-Mead')
    b0, b1, b2, tau = res.x
    fitted = nelson_siegel(maturities, b0, b1, b2, tau)
    return dict(beta0=b0, beta1=b1, beta2=b2, tau=tau, fitted=fitted)

mats = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
ylds = np.array([0.050, 0.049, 0.048, 0.046, 0.045, 0.044, 0.043, 0.042, 0.041, 0.040])
result = fit_nelson_siegel(mats, ylds)
print("beta0 (long rate):", round(result['beta0'], 4))
print("beta1 (slope)    :", round(result['beta1'], 4))
print("tau (hump pos)   :", round(result['tau'], 4))
print("Max fit error bps:", round(np.abs(result['fitted'] - ylds).max() * 1e4, 2))`,
    explanation: "Nelson-Siegel decomposes the yield curve into level (beta0), slope (beta1), and curvature (beta2) components. Beta0 is the long-run yield, beta1 captures the yield spread (inverted curves have negative beta1), and beta2 governs the mid-maturity hump. Tau controls where the curvature peaks and is typically calibrated near 2-3 years for USD curves."
  },
  {
    id: "pyfin-20260804-b1-svensson",
    language: "python",
    title: "Svensson Extension: Two-Hump Term Structure",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson(t: np.ndarray, b0, b1, b2, b3, tau1, tau2) -> np.ndarray:
    """Svensson (1994): Nelson-Siegel + second curvature term."""
    x1, x2 = t / tau1, t / tau2
    ex1, ex2 = np.exp(-x1), np.exp(-x2)
    f1 = (1 - ex1) / x1
    f2 = (1 - ex2) / x2
    return b0 + b1*f1 + b2*(f1 - ex1) + b3*(f2 - ex2)

def fit_svensson(mats: np.ndarray, yields: np.ndarray):
    best_res, best_err = None, np.inf
    # Multi-start to escape local minima
    for t1_init in [0.5, 1.5, 3.0]:
        for t2_init in [5.0, 8.0, 12.0]:
            def err(p):
                b0, b1, b2, b3, t1, t2 = p
                if t1 <= 0 or t2 <= 0 or abs(t1 - t2) < 0.1:
                    return 1e9
                return np.sum((svensson(mats, b0, b1, b2, b3, t1, t2) - yields)**2)
            res = minimize(err, [0.04, -0.02, 0.01, 0.005, t1_init, t2_init],
                           method='Nelder-Mead',
                           options={'xatol': 1e-8, 'fatol': 1e-12, 'maxiter': 5000})
            if res.fun < best_err:
                best_err, best_res = res.fun, res
    b0, b1, b2, b3, t1, t2 = best_res.x
    return dict(b0=b0, b1=b1, b2=b2, b3=b3, tau1=t1, tau2=t2,
                rmse=np.sqrt(best_err / len(mats)))

mats = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
ylds = np.array([0.053, 0.051, 0.048, 0.045, 0.044, 0.043, 0.042, 0.041, 0.040, 0.039])
r = fit_svensson(mats, ylds)
print("Svensson params:", {k: round(v, 5) for k, v in r.items() if k != 'rmse'})
print(f"RMSE: {r['rmse']*1e4:.2f} bps")`,
    explanation: "Svensson adds a second curvature term (beta3, tau2) to Nelson-Siegel, allowing the model to fit humped curves that Nelson-Siegel cannot reproduce — common in EUR curves with two peaks from central bank signalling. Multi-start optimisation is essential because the Svensson loss surface has many local minima depending on the initial tau values."
  },
  {
    id: "pyfin-20260804-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Volatility Monte Carlo",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def heston_mc(S0, K, r, T, kappa, theta, xi, rho, v0,
              n_paths=100_000, n_steps=200, seed=42):
    """
    Full-truncation Euler scheme for Heston model.
    kappa: mean-reversion speed
    theta: long-run variance
    xi:    vol-of-vol
    rho:   spot-vol correlation
    v0:    initial variance
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    sdt  = np.sqrt(dt)
    disc = np.exp(-r * T)

    S = np.full(n_paths, S0, dtype=np.float64)
    v = np.full(n_paths, v0, dtype=np.float64)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * rng.standard_normal(n_paths)

        # Full truncation: clamp variance before use (no negative vol)
        v_pos = np.maximum(v, 0.0)
        sqv   = np.sqrt(v_pos)

        S *= np.exp((r - 0.5 * v_pos) * dt + sqv * sdt * Z1)
        v  = v_pos + kappa * (theta - v_pos) * dt + xi * sqv * sdt * Z2

    call = disc * np.maximum(S - K, 0.0).mean()
    put  = disc * np.maximum(K - S, 0.0).mean()
    return call, put

call, put = heston_mc(100, 100, 0.05, 1.0,
                      kappa=2.0, theta=0.04, xi=0.3, rho=-0.7, v0=0.04)
print(f"Heston MC call: {call:.4f}  put: {put:.4f}")
# Check put-call parity
pcp = call - put - 100 + 100*np.exp(-0.05)
print(f"Put-call parity error: {pcp:.6f}")`,
    explanation: "Full-truncation (Andersen 2008) clamps variance to max(v, 0) before use in the diffusion term, preventing variance from going negative in the Euler step — a known issue with the naive Euler scheme for Heston when xi is large. The correlated normals are constructed via Z2 = rho*Z1 + sqrt(1-rho^2)*Z_ind, preserving the instantaneous correlation between spot and vol increments."
  },
  {
    id: "pyfin-20260804-b1-ledoit-wolf-shrinkage",
    language: "python",
    title: "Ledoit-Wolf Covariance Shrinkage for Portfolio Optimisation",
    tag: "portfolio",
    code: `import numpy as np
from sklearn.covariance import LedoitWolf

def ledoit_wolf_portfolio(returns: np.ndarray, risk_free: float = 0.0):
    """
    Minimum-variance portfolio using Ledoit-Wolf shrunk covariance.
    returns: (T, N) matrix of asset returns
    """
    lw = LedoitWolf()
    lw.fit(returns)
    Sigma_hat = lw.covariance_
    alpha     = lw.shrinkage_

    # Minimum-variance weights: w = Sigma^-1 * 1 / (1' * Sigma^-1 * 1)
    ones = np.ones(Sigma_hat.shape[0])
    Sigma_inv_1 = np.linalg.solve(Sigma_hat, ones)
    w_mv = Sigma_inv_1 / (ones @ Sigma_inv_1)

    port_vol = np.sqrt(w_mv @ Sigma_hat @ w_mv) * np.sqrt(252)
    port_ret = (returns.mean(axis=0) @ w_mv) * 252

    return dict(weights=w_mv, shrinkage=alpha,
                annual_vol=port_vol, annual_ret=port_ret)

rng = np.random.default_rng(21)
T, N = 120, 30   # short history relative to large universe — shrinkage helps most
# True covariance has factor structure
F = rng.normal(0, 1, (T, 3))
B = rng.normal(0, 0.5, (3, N))
R = F @ B + rng.normal(0, 0.01, (T, N))

res = fit = ledoit_wolf_portfolio(R)
print(f"Shrinkage alpha: {res['shrinkage']:.4f}")
print(f"Annual vol     : {res['annual_vol']:.4f}")
print(f"Weights sum    : {res['weights'].sum():.6f}")
print(f"Weights range  : [{res['weights'].min():.4f}, {res['weights'].max():.4f}]")`,
    explanation: "Ledoit-Wolf shrinkage pulls the sample covariance matrix toward a structured target (typically the identity scaled by average variance) by a data-driven coefficient alpha. This drastically reduces estimation error in high-dimensional portfolios (N > T/5) where the sample covariance matrix is poorly conditioned — yielding more stable minimum-variance weights."
  },
  {
    id: "pyfin-20260804-b1-garch-fit",
    language: "python",
    title: "GARCH(1,1) Maximum Likelihood Estimation",
    tag: "risk",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def garch11_loglik(params, returns):
    """Log-likelihood of GARCH(1,1) under normal innovations."""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10
    n     = len(returns)
    h     = np.zeros(n)
    h[0]  = np.var(returns)
    for t in range(1, n):
        h[t] = omega + alpha * returns[t-1]**2 + beta * h[t-1]
    # Sum of normal log-likelihoods
    ll = -0.5 * np.sum(np.log(h) + returns**2 / h)
    return -ll   # negate for minimisation

def fit_garch11(returns: np.ndarray):
    init = [1e-6, 0.08, 0.90]
    res  = minimize(garch11_loglik, init, args=(returns,),
                    method='L-BFGS-B',
                    bounds=[(1e-9, None), (0, 1), (0, 1)])
    omega, alpha, beta = res.x
    # Long-run variance and volatility
    uncond_var  = omega / (1 - alpha - beta)
    uncond_vol  = np.sqrt(uncond_var * 252)
    # Forecast 5-day variance
    h_now = omega + alpha * returns[-1]**2
    h5 = [h_now]
    for _ in range(4):
        h5.append(omega + (alpha + beta) * h5[-1])
    return dict(omega=omega, alpha=alpha, beta=beta,
                uncond_annual_vol=uncond_vol,
                forecast_5d_vol=np.sqrt(np.mean(h5) * 252),
                loglik=-res.fun)

rng  = np.random.default_rng(33)
rets = rng.normal(0, 0.01, 1000)
# Inject mild clustering
for t in range(1, 1000):
    rets[t] *= 1 + 0.5 * abs(rets[t-1]) / 0.01
result = fit_garch11(rets)
print(result)`,
    explanation: "GARCH(1,1) captures volatility clustering: h_t = omega + alpha*r_{t-1}^2 + beta*h_{t-1}. MLE under normal innovations maximises sum(-0.5*(log(h_t) + r_t^2/h_t)), where stationarity requires alpha + beta < 1. The long-run unconditional variance is omega/(1-alpha-beta), which annualises to the structural volatility level."
  },
  {
    id: "pyfin-20260804-b1-risk-parity",
    language: "python",
    title: "Risk Parity Portfolio via Equal Risk Contribution",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_contributions(w: np.ndarray, Sigma: np.ndarray) -> np.ndarray:
    """RC_i = w_i * (Sigma @ w)_i / sqrt(w @ Sigma @ w)"""
    sigma_w = Sigma @ w
    vol     = np.sqrt(w @ sigma_w)
    return w * sigma_w / vol

def risk_parity(Sigma: np.ndarray, max_iter: int = 1000) -> np.ndarray:
    """
    Equal Risk Contribution: minimise sum_i,j (RC_i - RC_j)^2
    subject to w > 0, sum(w) = 1.
    """
    n = Sigma.shape[0]
    target = 1.0 / n   # equal share of portfolio vol

    def obj(w):
        rc = risk_contributions(w, Sigma)
        return np.sum((rc - target)**2)

    def obj_grad(w):
        rc  = risk_contributions(w, Sigma)
        vol = np.sqrt(w @ Sigma @ w)
        drc = (Sigma * w[:, None] + np.diag(Sigma @ w)) / vol - \
              np.outer(w * (Sigma @ w), Sigma @ w) / vol**3
        return 2 * drc.T @ (rc - target)

    w0  = np.full(n, 1.0/n)
    res = minimize(obj, w0,
                   jac=obj_grad,
                   method='SLSQP',
                   bounds=[(1e-6, 1)] * n,
                   constraints={'type': 'eq', 'fun': lambda w: w.sum() - 1})
    w = res.x / res.x.sum()
    return w

rng  = np.random.default_rng(55)
vols = np.array([0.10, 0.15, 0.20, 0.25, 0.30])
corr = np.full((5, 5), 0.3); np.fill_diagonal(corr, 1.0)
Sig  = np.outer(vols, vols) * corr
w_rp = risk_parity(Sig)
rc   = risk_contributions(w_rp, Sig)
print("Weights :", np.round(w_rp, 4))
print("RC share:", np.round(rc / rc.sum(), 4))  # should be ~[0.2, 0.2, ...]`,
    explanation: "Risk parity allocates capital so each asset contributes equally to total portfolio volatility. High-vol assets receive lower weights than in equal-weight portfolios. The ERC objective is minimised via SLSQP because it has an analytic gradient. Risk parity implicitly leverages low-volatility assets — a structural feature that can be compared against equal-weight Sharpe."
  },
  {
    id: "pyfin-20260804-b1-black-litterman",
    language: "python",
    title: "Black-Litterman Model with Absolute Views",
    tag: "portfolio",
    code: `import numpy as np

def black_litterman(Sigma: np.ndarray, w_mkt: np.ndarray, delta: float,
                    P: np.ndarray, Q: np.ndarray, Omega: np.ndarray,
                    tau: float = 0.025):
    """
    Black-Litterman posterior expected returns.
    Sigma:  N x N covariance matrix
    w_mkt:  market-cap weights (N,)
    delta:  risk-aversion coefficient (~2.5)
    P:      K x N pick matrix (K views)
    Q:      K-vector of view expected returns
    Omega:  K x K view uncertainty (diagonal)
    tau:    scalar uncertainty on prior (~0.025)
    """
    # Implied equilibrium returns (reverse-optimised)
    Pi = delta * Sigma @ w_mkt

    # BL posterior
    tS   = tau * Sigma
    inv1 = np.linalg.inv(tS)
    inv2 = np.linalg.inv(Omega)
    # Posterior precision
    M_inv = inv1 + P.T @ inv2 @ P
    M     = np.linalg.inv(M_inv)
    # Posterior mean
    mu_bl = M @ (inv1 @ Pi + P.T @ inv2 @ Q)
    # Posterior covariance
    Sigma_bl = Sigma + M

    # Maximum-Sharpe weights under posterior
    Sigma_inv = np.linalg.inv(Sigma_bl)
    w_bl      = Sigma_inv @ mu_bl
    w_bl     /= w_bl.sum()
    return dict(mu_prior=Pi, mu_bl=mu_bl, Sigma_bl=Sigma_bl, weights=w_bl)

n = 5
rng    = np.random.default_rng(7)
vols   = np.array([0.15, 0.20, 0.18, 0.22, 0.17])
corr   = np.full((n, n), 0.35); np.fill_diagonal(corr, 1.0)
Sigma  = np.outer(vols, vols) * corr
w_mkt  = np.array([0.25, 0.20, 0.20, 0.20, 0.15])
# View: asset 0 outperforms asset 1 by 3%
P      = np.array([[1, -1, 0, 0, 0]], dtype=float)
Q      = np.array([0.03])
Omega  = np.diag([0.0009])
res    = black_litterman(Sigma, w_mkt, delta=2.5, P=P, Q=Q, Omega=Omega)
print("BL weights :", np.round(res['weights'], 4))
print("BL mu      :", np.round(res['mu_bl'], 4))`,
    explanation: "Black-Litterman blends a market-equilibrium prior (reverse-optimised from CAPM) with investor views via Bayesian update. The pick matrix P encodes relative or absolute views: a row [1,-1,0,...] means 'asset 0 beats asset 1'. Omega (view uncertainty) controls how strongly the views override the prior — diagonal Omega is the standard proportional-to-variance specification."
  },
  {
    id: "pyfin-20260804-b1-hull-white-sim",
    language: "python",
    title: "Hull-White Short Rate Simulation and Zero-Coupon Bond Pricing",
    tag: "fixed-income",
    code: `import numpy as np

def hull_white_simulate(a: float, sigma: float, theta_t,
                         r0: float, T: float, n_paths: int = 10_000,
                         n_steps: int = 100, seed: int = 42):
    """
    dr_t = (theta(t) - a*r_t) dt + sigma dW_t
    theta_t: callable(t) returning mean-reversion level at t
    Returns: (n_paths, n_steps+1) rate paths
    """
    dt   = T / n_steps
    sdt  = np.sqrt(dt)
    rng  = np.random.default_rng(seed)
    r    = np.full((n_paths, n_steps + 1), r0)

    for i in range(n_steps):
        t    = i * dt
        dW   = rng.standard_normal(n_paths) * sdt
        r[:, i+1] = r[:, i] + (theta_t(t) - a * r[:, i]) * dt + sigma * dW

    return r

def zcb_price_hw(r_paths: np.ndarray, T: float) -> float:
    """
    Zero-coupon bond price P(0,T) = E[exp(-integral_0^T r_t dt)]
    Approximated via trapezoidal rule on simulated paths.
    """
    n_steps   = r_paths.shape[1] - 1
    dt        = T / n_steps
    # Trapezoidal integration of each path
    integral  = np.trapz(r_paths, dx=dt, axis=1)
    return np.exp(-integral).mean()

# Calibrated theta(t) for flat yield curve at 5%
a, sigma, r0 = 0.15, 0.01, 0.05
theta = lambda t: a * r0 + sigma**2 * (1 - np.exp(-2*a*t)) / (2*a)

r_paths = hull_white_simulate(a, sigma, theta, r0, T=5.0)
zcb5    = zcb_price_hw(r_paths, T=5.0)
exact   = np.exp(-r0 * 5.0)   # flat curve: P(0,5) = exp(-r0*5)
print(f"ZCB P(0,5) MC   : {zcb5:.6f}")
print(f"ZCB P(0,5) exact: {exact:.6f}")
print(f"5y zero rate MC : {-np.log(zcb5)/5:.4f}")`,
    explanation: "Hull-White is mean-reverting (Ornstein-Uhlenbeck) with a time-dependent drift theta(t) chosen to exactly fit the initial yield curve. The Euler-Maruyama discretisation is exact for this linear SDE — no truncation needed. ZCB pricing by Monte Carlo validates the calibration: P(0,T) should reproduce observed discount factors."
  },
  {
    id: "pyfin-20260804-b1-pca-returns",
    language: "python",
    title: "PCA Factor Decomposition of Equity Returns",
    tag: "factor-models",
    code: `import numpy as np
from sklearn.decomposition import PCA
import warnings; warnings.filterwarnings('ignore')

def pca_factor_model(returns: np.ndarray, n_factors: int = 5):
    """
    Decompose returns into PCA factors.
    returns: (T, N) excess-return matrix
    Returns factor loadings, scores, idiosyncratic variance.
    """
    # Standardise (optional: remove mean, unit vol)
    mu   = returns.mean(axis=0)
    sig  = returns.std(axis=0) + 1e-9
    R_std = (returns - mu) / sig

    pca  = PCA(n_components=n_factors)
    F    = pca.fit_transform(R_std)    # (T, k) factor scores
    B    = pca.components_.T           # (N, k) loadings
    expl = pca.explained_variance_ratio_

    # Reconstruct and compute idiosyncratic variance
    R_hat     = F @ B.T * sig + mu        # back to original scale
    residuals = returns - R_hat
    idio_var  = residuals.var(axis=0)

    # Factor risk contribution
    factor_var = (B**2 * pca.explained_variance_[None, :]).sum(axis=1)

    return dict(loadings=B, factor_scores=F, explained=expl,
                idio_var=idio_var, factor_var=factor_var)

rng = np.random.default_rng(13)
T, N = 252, 100
# 3-factor DGP
F_true = rng.normal(0, [0.01, 0.007, 0.005], (T, 3))
B_true = rng.normal(0, 1, (N, 3))
R = F_true @ B_true.T + rng.normal(0, 0.005, (T, N))

result = pca_factor_model(R, n_factors=5)
print("Explained variance by factor:", np.round(result['explained'] * 100, 1), "%")
print("Mean idiosyncratic vol (ann):",
      round(np.sqrt(result['idio_var'].mean() * 252), 4))
print("Top-5 loadings on PC1:", np.round(result['loadings'][:5, 0], 4))`,
    explanation: "PCA on returns extracts orthogonal statistical factors ordered by explained variance. The first principal component of equity returns typically captures the market (comparable to beta), subsequent components capture sector/style tilts. PCA loadings serve as factor exposures for risk decomposition without imposing a priori economic structure."
  },
  {
    id: "pyfin-20260804-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def mc_deep_otm_naive(S0, K, r, sigma, T, n_paths=1_000_000, seed=0):
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n_paths)
    ST  = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    pay = np.maximum(ST - K, 0)
    return np.exp(-r*T) * pay.mean(), np.exp(-r*T) * pay.std() / np.sqrt(n_paths)

def mc_deep_otm_is(S0, K, r, sigma, T, n_paths=100_000, seed=0):
    """
    Importance sampling: shift the sampling distribution mean
    so paths hit the deep-OTM payoff region frequently.
    Optimal drift: theta* = log(K/F) / (sigma*sqrt(T))
    where F = S0 * exp(r*T) is the forward.
    """
    F      = S0 * np.exp(r * T)
    # Shift Z so E[Z_tilted] centres on log(K/F)/(sigma*sqrt(T))
    theta  = np.log(K / F) / (sigma * np.sqrt(T))

    rng    = np.random.default_rng(seed)
    Z      = rng.standard_normal(n_paths) + theta  # tilted draws

    ST     = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    pay    = np.maximum(ST - K, 0)

    # Likelihood ratio: dP/dQ = exp(-theta*Z_orig + 0.5*theta^2)
    Z_orig = Z - theta
    lr     = np.exp(-theta * Z_orig - 0.5 * theta**2)
    adj    = np.exp(-r*T) * pay * lr

    price = adj.mean()
    se    = adj.std() / np.sqrt(n_paths)
    return price, se

K = 140   # deep OTM (S0=100, sigma=0.2, T=1)
p_naive, se_naive = mc_deep_otm_naive(100, K, 0.05, 0.20, 1.0)
p_is,    se_is    = mc_deep_otm_is   (100, K, 0.05, 0.20, 1.0)
print(f"Naive IS : {p_naive:.8f}  SE={se_naive:.8f}")
print(f"IS price : {p_is:.8f}    SE={se_is:.8f}")
print(f"Variance reduction: {(se_naive/se_is)**2:.0f}x")`,
    explanation: "Importance sampling shifts the sampling measure so that rare events (the deep-OTM region) occur frequently, then corrects via the likelihood ratio (Radon-Nikodym derivative). The optimal drift theta centres the log-return distribution exactly on the strike, focusing simulation effort where payoffs are non-zero and reducing variance by factors of 100–10000 for deep-OTM options."
  },
  {
    id: "pyfin-20260804-b1-copula-tail",
    language: "python",
    title: "Gaussian and Student-t Copula for Tail Risk Dependence",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm, t as t_dist
from scipy.special import gammaln

def simulate_gaussian_copula(Rho: np.ndarray, n: int, seed=42) -> np.ndarray:
    """Simulate from Gaussian copula; returns uniform marginals."""
    rng   = np.random.default_rng(seed)
    L     = np.linalg.cholesky(Rho)
    Z     = rng.standard_normal((n, Rho.shape[0]))
    X     = Z @ L.T          # correlated normals
    return norm.cdf(X)       # map to [0,1] via N(0,1) CDF

def simulate_student_copula(Rho: np.ndarray, nu: float,
                              n: int, seed=42) -> np.ndarray:
    """Simulate from Student-t copula (fatter joint tails than Gaussian)."""
    rng   = np.random.default_rng(seed)
    L     = np.linalg.cholesky(Rho)
    Z     = rng.standard_normal((n, Rho.shape[0]))
    W     = rng.chisquare(nu, size=n) / nu    # chi^2 mixing
    X     = (Z @ L.T) / np.sqrt(W[:, None])  # t-distributed correlated
    return t_dist.cdf(X, df=nu)              # uniform marginals via t CDF

# Demonstration: count joint tail exceedances
def joint_tail_prob(U: np.ndarray, quantile: float = 0.05) -> float:
    """P(U1 < q AND U2 < q): left-tail co-exceedance probability."""
    return np.mean((U[:, 0] < quantile) & (U[:, 1] < quantile))

Rho = np.array([[1.0, 0.6], [0.6, 1.0]])
n   = 500_000

U_gauss = simulate_gaussian_copula(Rho, n)
U_t5    = simulate_student_copula(Rho, nu=5.0, n=n)

q = 0.05
p_gauss = joint_tail_prob(U_gauss, q)
p_t5    = joint_tail_prob(U_t5, q)
independent = q**2

print(f"Independent P(joint tail)       : {independent:.5f}")
print(f"Gaussian copula P(joint tail)   : {p_gauss:.5f}")
print(f"Student-t(5) P(joint tail)      : {p_t5:.5f}")
print(f"t vs Gaussian tail ratio        : {p_t5/p_gauss:.2f}x")`,
    explanation: "Gaussian copulas encode linear correlation but have zero tail dependence: conditional on both assets being extreme, the probability of joint exceedance converges to the independence probability as the quantile approaches 0. The Student-t copula has nonzero tail dependence parameter lambda = 2*t_{nu+1}(-sqrt((nu+1)*(1-rho)/(1+rho))), making joint tail crashes far more likely — a critical distinction for stress-testing correlated positions."
  },
  {
    id: "pyfin-20260804-b1-binomial-american",
    language: "python",
    title: "Cox-Ross-Rubinstein Binomial Tree for American Options",
    tag: "derivatives",
    code: `import numpy as np

def crr_american(S0, K, r, sigma, T, N=500, option='put'):
    """
    CRR binomial tree for American option.
    N: number of steps (convergence: N~500 for 4dp accuracy)
    """
    dt = T / N
    u  = np.exp(sigma * np.sqrt(dt))
    d  = 1.0 / u
    p  = (np.exp(r * dt) - d) / (u - d)
    disc = np.exp(-r * dt)

    # Terminal asset prices (vectorised)
    j   = np.arange(N + 1)
    ST  = S0 * u**j * d**(N - j)

    # Terminal payoffs
    if option == 'put':
        V = np.maximum(K - ST, 0.0)
    else:
        V = np.maximum(ST - K, 0.0)

    # Backward induction
    for i in range(N - 1, -1, -1):
        j   = np.arange(i + 1)
        Si  = S0 * u**j * d**(i - j)
        V   = disc * (p * V[1:i+2] + (1-p) * V[0:i+1])
        if option == 'put':
            intrinsic = np.maximum(K - Si, 0.0)
        else:
            intrinsic = np.maximum(Si - K, 0.0)
        V = np.maximum(V, intrinsic)

    return V[0]

call_eu = crr_american(100, 100, 0.05, 0.20, 1.0, N=500, option='call')
put_am  = crr_american(100, 100, 0.05, 0.20, 1.0, N=500, option='put')
put_eu  = crr_american(100, 100, 0.05, 0.20, 1.0, N=500, option='put')
print(f"American put  : {put_am:.4f}")
print(f"Early exercise premium: {put_am - put_eu:.6f}")`,
    explanation: "The CRR tree constructs binomial stock prices using u=exp(sigma*sqrt(dt)), d=1/u, which ensures that as N→infinity the discrete-time distribution converges to GBM. American early exercise is enforced at each node by taking max(continuation, intrinsic). Vectorised backward induction computes all N+1 node values in a single numpy operation, making N=500 steps feasible in milliseconds."
  },
  {
    id: "pyfin-20260804-b1-momentum-alpha",
    language: "python",
    title: "Cross-Sectional Momentum Factor Construction",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd

def momentum_alpha(returns: pd.DataFrame, lookback: int = 12,
                   skip: int = 1, n_quantiles: int = 5) -> pd.Series:
    """
    Cross-sectional momentum: rank assets on past (lookback-skip) month returns,
    long top quantile, short bottom quantile.
    returns: (T, N) DataFrame of monthly returns
    Returns monthly strategy returns.
    """
    T, N = returns.shape
    strat_rets = []

    for t in range(lookback, T - 1):
        # Formation period: lookback months ago to skip months ago
        form_rets = returns.iloc[t - lookback : t - skip + 1].add(1).prod() - 1
        rank      = form_rets.rank(pct=True, ascending=True)

        # Top/bottom quantile
        thresh_lo = 1.0 / n_quantiles
        thresh_hi = 1.0 - 1.0 / n_quantiles
        long_mask  = rank > thresh_hi
        short_mask = rank < thresh_lo

        n_long  = long_mask.sum()
        n_short = short_mask.sum()
        if n_long == 0 or n_short == 0:
            strat_rets.append(0.0)
            continue

        # Equal-weight long-short
        next_ret   = returns.iloc[t + 1]
        long_ret   = next_ret[long_mask].mean()
        short_ret  = next_ret[short_mask].mean()
        strat_rets.append(long_ret - short_ret)

    idx = returns.index[lookback + 1 : T]
    return pd.Series(strat_rets, index=idx, name='momentum')

rng = np.random.default_rng(77)
T, N = 120, 50
# Add momentum: yesterday's winners tend to persist
R = rng.normal(0.005, 0.08, (T, N))
for t in range(1, T):
    R[t] += 0.15 * R[t-1]   # autocorrelation
df_rets  = pd.DataFrame(R, columns=[f'A{i}' for i in range(N)])
mom_rets = momentum_alpha(df_rets, lookback=12, skip=1)
sharpe   = mom_rets.mean() / mom_rets.std() * np.sqrt(12)
print(f"Momentum mean   : {mom_rets.mean()*100:.3f}%/month")
print(f"Momentum Sharpe : {sharpe:.3f} (annualised)")`,
    explanation: "Cross-sectional momentum ranks assets by past returns and goes long winners vs short losers. The skip-1 convention avoids the one-month reversal effect (bid-ask bounce). Equal-weight long-short is self-financing and dollar-neutral. The strategy is capacity-constrained in practice — Sharpe degrades quickly with AUM because winners become crowded."
  },
  {
    id: "pyfin-20260804-b1-cva-calculation",
    language: "python",
    title: "CVA (Credit Valuation Adjustment) for Swap Portfolio",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def bs_swaption_npv(F, K, sigma_n, T, annuity):
    """Bachelier (normal) swaption: NPV = annuity*(F-K)*N(d) + annuity*sigma*sqrt(T)*n(d)."""
    if T <= 0:
        return max(F - K, 0) * annuity
    d   = (F - K) / (sigma_n * np.sqrt(T))
    return annuity * ((F - K) * norm.cdf(d) + sigma_n * np.sqrt(T) * norm.pdf(d))

def compute_cva(pd_curve: np.ndarray, lgd: float,
                epe_profile: np.ndarray, dt: float) -> float:
    """
    CVA = LGD * sum_i [ (P(0,t_i) - P(0,t_{i+1})) * EPE(t_i) ]
    pd_curve:  survival probabilities Q(0, t_i)
    epe_profile: Expected Positive Exposure at each t_i
    lgd:       Loss Given Default (1 - recovery)
    """
    n          = len(epe_profile)
    dPD        = np.diff(np.concatenate([[1.0], pd_curve]))  # marginal default probs
    # CVA: integrate over default probability density * EPE
    cva        = lgd * np.sum(-dPD[:n] * epe_profile)
    return cva

# Toy IR swap EPE profile: peaks near mid-life, then decays to 0
T      = 5.0
n_pts  = 20
dt     = T / n_pts
t_grid = np.linspace(dt, T, n_pts)

# EPE profile: roughly triangular (hump at T/2)
epe = np.where(t_grid <= T/2,
               t_grid / (T/2) * 100,
               (T - t_grid) / (T/2) * 100)

# Hazard rate 200 bps (2% / year default intensity)
hazard    = 0.02
pd_curve  = np.exp(-hazard * t_grid)   # survival: Q(0,t) = exp(-lambda*t)

cva = compute_cva(pd_curve, lgd=0.60, epe_profile=epe, dt=dt)
print(f"CVA: {cva:.4f} notional units")
print(f"CVA bp of notional: {cva / 1000 * 10000:.2f} bps")`,
    explanation: "CVA is the expected loss from counterparty default: the integral of the marginal default probability density times the Expected Positive Exposure. EPE peaks near the mid-life of a plain vanilla swap (the convexity hump) and decays to zero at maturity. LGD=60% corresponds to recovery=40%, the ISDA standard for senior unsecured. Unilateral CVA ignores DVA (own credit risk) for simplicity."
  },
  {
    id: "pyfin-20260804-b1-evt-tail",
    language: "python",
    title: "Extreme Value Theory (GEV/GPD) for Tail Risk",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto, genextreme

def evt_gpd_var(losses: np.ndarray, threshold_pct: float = 0.90,
                conf: float = 0.99) -> dict:
    """
    Peaks-Over-Threshold (POT) method:
    Fit Generalised Pareto Distribution to exceedances above u.
    """
    u       = np.quantile(losses, threshold_pct)
    exceed  = losses[losses > u] - u   # exceedances
    n_total = len(losses)
    n_u     = len(exceed)

    if n_u < 10:
        return dict(error="Too few exceedances")

    # MLE fit of GPD
    xi, _, scale = genpareto.fit(exceed, floc=0)

    # VaR beyond u: quantile of GPD exceedance distribution
    p_tail  = (1 - conf) / (n_u / n_total)   # prob conditional on exceeding u
    if xi >= 0:
        var_exc = scale / xi * ((p_tail)**(-xi) - 1)
    else:
        var_exc = -scale / xi * (1 - p_tail**(-xi))

    VaR_gpd = u + var_exc

    # ES (Expected Shortfall = CVaR)
    if xi < 1:
        ES_gpd = (VaR_gpd + scale - xi * u) / (1 - xi)
    else:
        ES_gpd = np.inf

    return dict(threshold=u, shape=xi, scale=scale,
                n_exceedances=n_u, VaR=VaR_gpd, ES=ES_gpd)

rng   = np.random.default_rng(99)
# Fat-tailed losses (Student-t with df=4)
from scipy.stats import t as t_dist
losses = -t_dist.rvs(df=4, size=5000, random_state=99) * 0.02  # simulate daily losses
losses = losses[losses > 0]   # keep positive (loss) side

result = evt_gpd_var(losses, threshold_pct=0.90, conf=0.99)
print(f"GPD shape (xi)  : {result['shape']:.4f}  (>0 = fat tail)")
print(f"99% VaR (EVT)   : {result['VaR']:.4f}")
print(f"99% ES  (EVT)   : {result['ES']:.4f}")
print(f"n exceedances   : {result['n_exceedances']}")`,
    explanation: "The Peaks-Over-Threshold method fits a Generalised Pareto Distribution to losses exceeding a high threshold u. The GPD shape parameter xi determines tail heaviness: xi>0 (Pareto tail, e.g. equity returns), xi=0 (exponential tail, e.g. FX), xi<0 (bounded tail). EVT VaR is more accurate than parametric normal VaR for very high confidence levels (99.9%) where historical data is sparse."
  },
  {
    id: "pyfin-20260804-b1-carry-strategy",
    language: "python",
    title: "FX Carry Trade: Building and Backtesting",
    tag: "macro",
    code: `import numpy as np
import pandas as pd

def fx_carry_backtest(spot_returns: pd.DataFrame,
                      interest_diff: pd.DataFrame,
                      n_long: int = 3, n_short: int = 3,
                      transaction_cost: float = 0.0005) -> pd.Series:
    """
    FX carry trade: long high-yield currencies, short low-yield currencies.
    spot_returns: (T, N) DataFrame of daily spot FX returns vs USD
    interest_diff: (T, N) daily interest rate differential (local - USD)
    Returns daily strategy returns.
    """
    T, N = spot_returns.shape
    strat_rets = []
    prev_pos   = np.zeros(N)

    for t in range(T):
        # Rank by interest rate differential
        irate = interest_diff.iloc[t].values
        ranks = pd.Series(irate).rank(ascending=True)
        pos   = np.zeros(N)
        # Long top n_long, short bottom n_short
        long_idx  = np.argsort(irate)[-n_long:]
        short_idx = np.argsort(irate)[:n_short]
        pos[long_idx]  = 1.0 / n_long
        pos[short_idx] = -1.0 / n_short

        # P&L: spot return + carry (interest earned)
        if t > 0:
            ret     = spot_returns.iloc[t].values
            carry   = interest_diff.iloc[t].values / 252   # daily carry
            turnover = np.abs(pos - prev_pos).sum()
            tc      = turnover * transaction_cost
            pnl     = np.dot(prev_pos, ret + carry) - tc
            strat_rets.append(pnl)

        prev_pos = pos.copy()

    return pd.Series(strat_rets, index=spot_returns.index[1:], name='carry')

rng = np.random.default_rng(17)
T, N = 1000, 8
# Simulate: higher yield currencies have positive drift (carry premium)
yield_diff = rng.uniform(-0.03, 0.08, (T, N)) / 252
spot_rets  = rng.normal(0, 0.007, (T, N)) + 0.3 * yield_diff   # carry + noise

df_spot  = pd.DataFrame(spot_rets)
df_yield = pd.DataFrame(yield_diff)
carry_ret = fx_carry_backtest(df_spot, df_yield, n_long=3, n_short=3)
sharpe    = carry_ret.mean() / carry_ret.std() * np.sqrt(252)
print(f"Carry Sharpe: {sharpe:.3f}")
print(f"Annual return: {carry_ret.mean()*252*100:.2f}%")
print(f"Max drawdown : {((carry_ret+1).cumprod() / (carry_ret+1).cumprod().cummax() - 1).min()*100:.2f}%")`,
    explanation: "FX carry earns the interest rate differential and mean-reverts during risk-off episodes, creating the characteristic positive carry/negative skewness tradeoff. Transaction costs from turnover are the main drag — quarterly rebalancing cuts cost by ~75% vs daily. The Sharpe ratio of a diversified carry basket (8+ currencies) typically ranges from 0.4 to 0.7 net of costs historically."
  },
  {
    id: "pyfin-20260804-b1-spread-duration",
    language: "python",
    title: "Spread Duration and DV01 for Credit Portfolios",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def ytm_to_price(ytm: float, coupon: float, face: float,
                  periods: int, freq: int = 2) -> float:
    """Price a bond given YTM."""
    r   = ytm / freq
    t   = np.arange(1, periods + 1)
    cf  = np.full(periods, coupon * face / freq)
    cf[-1] += face
    return np.sum(cf / (1 + r)**t)

def price_to_ytm(price: float, coupon: float, face: float,
                  periods: int, freq: int = 2) -> float:
    return brentq(lambda y: ytm_to_price(y, coupon, face, periods, freq) - price,
                  0.001, 0.5)

def dv01(price: float, coupon: float, face: float,
          periods: int, freq: int = 2, bp: float = 0.0001) -> float:
    """Dollar value of 1 basis point rise in yield."""
    ytm  = price_to_ytm(price, coupon, face, periods, freq)
    p_up = ytm_to_price(ytm + bp, coupon, face, periods, freq)
    return abs(p_up - price)

def spread_duration(price: float, coupon: float, face: float,
                     periods: int, spread: float = 0.0, freq: int = 2) -> float:
    """Spread duration ≈ modified duration evaluated at OAS-adjusted yield."""
    ytm   = price_to_ytm(price, coupon, face, periods, freq)
    dv01_ = dv01(price, coupon, face, periods, freq)
    # Modified duration = DV01 / price / (1 bp)
    return dv01_ / price * 10000   # in years

# Example: 5-year 5% semi-annual bond, 3% Z-spread
face, coupon, periods, freq = 1000, 0.05, 10, 2
price = ytm_to_price(0.04, coupon, face, periods, freq)   # priced at 4% YTM
ytm   = price_to_ytm(price, coupon, face, periods)
d01   = dv01(price, coupon, face, periods)
sd    = spread_duration(price, coupon, face, periods)

print(f"Price   : {price:.4f}")
print(f"YTM     : {ytm*100:.4f}%")
print(f"DV01    : {d01:.4f} per 1bp move")
print(f"Spread duration: {sd:.4f} years")
print(f"P&L for +10bp spread widening: {-sd * price * 10 / 10000:.2f}")`,
    explanation: "Spread duration measures how much a bond's price changes per 1bp move in credit spread, holding the risk-free rate constant. For a flat spread curve, spread duration ≈ modified duration. DV01 (dollar value of 01) is the absolute price change per 1bp, used for hedging: notional * DV01 gives the risk in dollar terms, which must be matched by the hedge notional * DV01_hedge."
  },
  {
    id: "pyfin-20260804-b1-kalman-filter-factors",
    language: "python",
    title: "Kalman Filter for Latent Factor Extraction in Yields",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def kalman_llk(params, yields: np.ndarray, mats: np.ndarray):
    """
    State space: yields_t = Z @ f_t + epsilon_t, epsilon ~ N(0, R)
    f_t = A @ f_{t-1} + eta_t,                  eta ~ N(0, Q)
    Z is fixed Nelson-Siegel loading matrix.
    Estimate state f_t (level, slope, curvature) via Kalman filter.
    """
    a, q_diag, r_sig = params[0], params[1:4], abs(params[4])
    T, n = yields.shape
    k    = 3  # state dimension (level, slope, curvature)
    tau  = 2.0  # fixed hump location

    # Nelson-Siegel loadings matrix (n x k)
    x   = mats / tau
    ex  = np.exp(-x)
    Z   = np.column_stack([np.ones(n), (1-ex)/x, (1-ex)/x - ex])

    A   = np.diag([a, a, a])           # mean-reversion (diagonal)
    Q   = np.diag(np.abs(q_diag))      # process noise
    R   = r_sig**2 * np.eye(n)         # observation noise

    # Kalman filter
    f   = np.zeros(k)
    P   = np.eye(k) * 1.0
    llk = 0.0

    for t in range(T):
        y_pred = Z @ f
        S      = Z @ P @ Z.T + R
        innov  = yields[t] - y_pred
        # Log-likelihood contribution
        sign, logdet = np.linalg.slogdet(S)
        if sign <= 0:
            return 1e9
        llk += -0.5 * (logdet + innov @ np.linalg.solve(S, innov))
        # Update
        K = P @ Z.T @ np.linalg.inv(S)
        f = A @ f + K @ innov
        P = (np.eye(k) - K @ Z) @ P @ A.T + Q

    return -llk  # negate for minimisation

# Toy yield curve panel
rng  = np.random.default_rng(31)
mats = np.array([0.5, 1, 2, 5, 10, 30], dtype=float)
T    = 200
# Simulate a declining rate environment
base = np.linspace(0.06, 0.02, T)[:, None]
panel = base + np.outer(np.linspace(-0.01, 0.01, T),
                        np.array([-1.5, -1.0, -0.5, 0.2, 0.8, 1.2]))
panel += rng.normal(0, 0.002, (T, 6))

res = minimize(kalman_llk, [0.95, 0.001, 0.001, 0.001, 0.002],
               args=(panel, mats), method='Nelder-Mead')
print("Mean-reversion a:", round(res.x[0], 4))
print("Process noise Q :", np.round(np.abs(res.x[1:4]) * 1e4, 3), "bps^2")`,
    explanation: "The dynamic Nelson-Siegel model treats level, slope, and curvature as latent AR(1) factors extracted by a Kalman filter. The filter recursively updates factor estimates as new yield observations arrive; MLE of the parameters (mean reversion, noise covariances) is done by maximising the prediction-error likelihood. This is the standard central bank approach to yield curve modelling."
  },
  {
    id: "pyfin-20260804-b1-vol-swap",
    language: "python",
    title: "Variance Swap Fair Value via Replication Portfolio",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)

def variance_swap_strike(S0: float, F: float, r: float, T: float,
                          strike_grid: np.ndarray,
                          iv_surface) -> float:
    """
    Carr-Madan replication: K_var = (2/T) * integral [C(K)/K^2 dk + P(K)/K^2 dk]
    iv_surface: callable(K) -> implied vol at strike K
    """
    K_atm = F  # split at ATM forward
    K_otm_call = strike_grid[strike_grid >= K_atm]
    K_otm_put  = strike_grid[strike_grid <  K_atm]

    # OTM calls
    call_int = np.trapz(
        [bs_call(S0, K, r, iv_surface(K), T) / K**2 for K in K_otm_call],
        K_otm_call)

    # OTM puts
    put_int  = np.trapz(
        [bs_put(S0, K, r, iv_surface(K), T)  / K**2 for K in K_otm_put],
        K_otm_put)

    K_var = (2 / T) * (call_int + put_int)
    return np.sqrt(K_var)   # strike in vol units (vol swap approximation)

S0, r, T = 100.0, 0.05, 1.0
F  = S0 * np.exp(r * T)
K_grid = np.linspace(70, 135, 200)

# Flat vol surface → strike should equal 20%
flat_vol = lambda K: 0.20
K_var_flat = variance_swap_strike(S0, F, r, T, K_grid, flat_vol)
print(f"Var swap strike (flat 20% smile): {K_var_flat*100:.4f}%")

# Skewed smile: lower strikes have higher vol (equity smile)
skew_vol = lambda K: 0.20 + 0.10 * np.log(F / K)
K_var_skew = variance_swap_strike(S0, F, r, T, K_grid, skew_vol)
print(f"Var swap strike (skew smile)    : {K_var_skew*100:.4f}%")`,
    explanation: "The Carr-Madan variance swap replication expresses the fair variance as a model-free integral of OTM option prices weighted by 1/K², capturing the entire implied vol smile. With a flat smile, the strike equals the implied vol exactly. With a negatively skewed smile (equity), the variance swap strike exceeds the ATM vol because it overweights OTM puts — a key reason variance swaps trade above ATM straddle vol."
  },
  {
    id: "pyfin-20260804-b1-alpha-decay",
    language: "python",
    title: "Signal Alpha Decay Analysis via Rolling Information Coefficient",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd

def rolling_ic(signals: pd.DataFrame, returns: pd.DataFrame,
               horizons: list[int] = [1, 5, 10, 20]) -> pd.DataFrame:
    """
    Compute Information Coefficient (IC) = rank correlation(signal_t, return_{t+h})
    for each horizon h in trading days.
    signals:  (T, N) DataFrame
    returns:  (T, N) DataFrame of daily returns
    """
    results = {}
    for h in horizons:
        # Forward h-day cumulative return
        fwd_ret = returns.shift(-h).rolling(h).sum()
        ic_t    = []
        for t in range(len(signals) - h):
            sig_rank = signals.iloc[t].rank()
            ret_rank = fwd_ret.iloc[t].rank()
            # Spearman IC (rank correlation)
            ic = sig_rank.corr(ret_rank, method='spearman')
            ic_t.append(ic)
        results[f'IC_h{h}'] = ic_t
    return pd.DataFrame(results)

def icir(ic_series: pd.Series) -> float:
    """Information Coefficient IR = mean(IC) / std(IC)"""
    return ic_series.mean() / (ic_series.std() + 1e-9)

rng = np.random.default_rng(41)
T, N = 500, 50
# Signal with half-life of ~5 days (decays quickly)
raw_signal = rng.normal(0, 1, (T, N))
signal = np.zeros_like(raw_signal)
for t in range(1, T):
    signal[t] = 0.85 * signal[t-1] + 0.15 * raw_signal[t]   # MA smoothing

rets = 0.02 * signal + rng.normal(0, 0.01, (T, N))  # small alpha + noise

df_sig  = pd.DataFrame(signal)
df_rets = pd.DataFrame(rets)
ic_df   = rolling_ic(df_sig, df_rets, horizons=[1, 5, 10, 20])

for col in ic_df.columns:
    print(f"{col}: mean IC={ic_df[col].mean():.4f}  ICIR={icir(ic_df[col]):.3f}")`,
    explanation: "Alpha decay analysis shows how predictive power degrades across holding horizons — a signal with ICIR>0.3 at h=1 but ICIR<0.05 at h=20 should drive daily rebalancing rather than monthly. Spearman rank IC is preferred over Pearson because returns are fat-tailed; rank correlation is robust to extreme observations. ICIR>0.5 is the industry threshold for considering a signal for live trading."
  },
];
