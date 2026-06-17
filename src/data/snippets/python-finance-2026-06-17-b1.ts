import { Snippet } from "./types";

export const pythonFinanceSnippets20260617B1: Snippet[] = [
  {
    id: "pyfin-20260617-b1-cds-hazard",
    language: "python",
    title: "CDS Hazard Rate Bootstrapping",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard(tenors, spreads_bps, recovery=0.4, dt=0.25):
    """Bootstrap piecewise-constant hazard rates from CDS par spreads."""
    spreads = [s / 10000 for s in spreads_bps]
    hazards = []
    surv = [1.0]  # survival probs at each tenor boundary

    for i, (T, s) in enumerate(zip(tenors, spreads)):
        prev_T = tenors[i - 1] if i > 0 else 0.0
        prev_surv = surv[-1]

        def pv_equation(h):
            # Accrue over current period
            t_grid = np.arange(prev_T + dt, T + 1e-9, dt)
            local_surv = prev_surv * np.exp(-h * (t_grid - prev_T))
            df = np.exp(-0.05 * t_grid)  # flat 5% risk-free
            pv_prem = (s * dt * local_surv * df).sum()
            pv_prot = ((1 - recovery) * local_surv * (1 - np.exp(-h * dt)) * df).sum()
            return pv_prem - pv_prot

        h_sol = brentq(pv_equation, 1e-6, 5.0)
        hazards.append(h_sol)
        surv.append(prev_surv * np.exp(-h_sol * (T - prev_T)))

    return hazards

tenors  = [1, 3, 5, 7, 10]
spreads = [50, 80, 110, 130, 150]  # bps
h = bootstrap_hazard(tenors, spreads)
for T, hi in zip(tenors, h):
    print(f"T={T}y  h={hi:.4f}  ({hi*10000:.1f} bps)")`,
    explanation: "Bootstraps piecewise-constant hazard rates from CDS par spreads by solving for each tenor's hazard rate so that the PV of premium leg equals the PV of protection leg, using survival probabilities from previously bootstrapped pillars.",
  },
  {
    id: "pyfin-20260617-b1-heston-cf",
    language: "python",
    title: "Heston Pricing via Characteristic Function",
    tag: "derivatives",
    code: `import numpy as np
from scipy.integrate import quad

def heston_price(S, K, T, r, kappa, theta, sigma, rho, v0, option='call'):
    """Heston model via Gil-Pelaez inversion of characteristic function."""
    def char_fn(u, j):
        d = np.sqrt((rho*sigma*1j*u - (kappa - rho*sigma*(1-j)*1j))**2
                    + sigma**2 * (1j*u + u**2 - (1-j)*1j*u))
        # Avoid branch cuts
        g = (kappa - rho*sigma*1j*u*(1-j) - d) / (kappa - rho*sigma*1j*u*(1-j) + d)
        C = r*1j*u*T + (kappa*theta/sigma**2)*(
            (kappa - rho*sigma*1j*u*(1-j) - d)*T
            - 2*np.log((1 - g*np.exp(-d*T))/(1 - g)))
        D = ((kappa - rho*sigma*1j*u*(1-j) - d)/sigma**2
             * (1 - np.exp(-d*T))/(1 - g*np.exp(-d*T)))
        return np.exp(C + D*v0 + 1j*u*np.log(S))

    def integrand(u, j):
        return np.real(np.exp(-1j*u*np.log(K)) * char_fn(u, j) / (1j*u))

    P1, _ = quad(integrand, 1e-6, 200, args=(1,), limit=200)
    P0, _ = quad(integrand, 1e-6, 200, args=(0,), limit=200)
    P1 = 0.5 + P1/np.pi
    P0 = 0.5 + P0/np.pi
    call = S*P1 - K*np.exp(-r*T)*P0
    return call if option == 'call' else call - S + K*np.exp(-r*T)

price = heston_price(100, 100, 1.0, 0.05, 2.0, 0.04, 0.3, -0.7, 0.04)
print(f"Heston call: \${price:.4f}")`,
    explanation: "Prices European options under the Heston stochastic-volatility model using the Gil-Pelaez Fourier inversion formula. The two characteristic function evaluations (j=0 and j=1) yield risk-neutral probabilities P0 and P1 analogous to the Black-Scholes N(d1)/N(d2) terms.",
  },
  {
    id: "pyfin-20260617-b1-dupire-lv",
    language: "python",
    title: "Dupire Local Volatility from Call Grid",
    tag: "derivatives",
    code: `import numpy as np

def dupire_local_vol(K_grid, T_grid, C_grid, r=0.05, q=0.0):
    """
    Dupire's formula:  sigma_loc^2 = (dC/dT + (r-q)*K*dC/dK + q*C)
                                    / (0.5 * K^2 * d2C/dK2)
    C_grid shape: (len(T_grid), len(K_grid))
    """
    dT = np.gradient(C_grid, T_grid, axis=0)
    dK = np.gradient(C_grid, K_grid, axis=1)
    d2K = np.gradient(dK, K_grid, axis=1)

    K2d = (K_grid[None, :] ** 2) * d2K
    num = dT + (r - q) * K_grid[None, :] * dK + q * C_grid
    sigma2 = np.where(K2d > 1e-10, 2 * num / K2d, np.nan)
    return np.sqrt(np.clip(sigma2, 0, None))

# Build a toy flat-vol call grid for testing
from scipy.stats import norm
S, r, q = 100, 0.05, 0.0
T_grid = np.linspace(0.1, 2.0, 10)
K_grid = np.linspace(70, 130, 25)
sig = 0.20

def bs_call(S, K, T, r, q, sig):
    d1 = (np.log(S/K) + (r-q+0.5*sig**2)*T) / (sig*np.sqrt(T))
    d2 = d1 - sig*np.sqrt(T)
    return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

C_grid = bs_call(S, K_grid[None,:], T_grid[:,None], r, q, sig)
lv = dupire_local_vol(K_grid, T_grid, C_grid, r, q)
print("Local vol surface (should be ~0.20):")
print(np.round(lv[3, 10:15], 4))`,
    explanation: "Implements Dupire's formula to extract the local volatility surface from a grid of European call prices. Finite differences approximate the partial derivatives; the result is the unique diffusion coefficient consistent with observed market prices.",
  },
  {
    id: "pyfin-20260617-b1-copula-gaussian",
    language: "python",
    title: "Gaussian Copula for Portfolio Loss",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_loss(n=125, rho=0.3, pd=0.01, lgd=1.0,
                          n_sim=200_000, seed=42):
    """
    Single-factor Gaussian copula (Li 2000).
    Factor M ~ N(0,1) drives latent variables: X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i
    Default when X_i < Phi^{-1}(PD).
    """
    rng = np.random.default_rng(seed)
    threshold = norm.ppf(pd)

    M = rng.standard_normal(n_sim)
    Z = rng.standard_normal((n_sim, n))
    X = np.sqrt(rho)*M[:, None] + np.sqrt(1 - rho)*Z
    defaults = (X < threshold).sum(axis=1)
    losses = defaults * lgd / n  # portfolio loss fraction

    el  = losses.mean()
    ul  = losses.std()
    var99 = np.percentile(losses, 99)
    es99 = losses[losses >= var99].mean()
    print(f"EL={el:.4f}  UL={ul:.4f}  99%VaR={var99:.4f}  99%ES={es99:.4f}")
    return losses

_ = gaussian_copula_loss()`,
    explanation: "Simulates portfolio credit losses using the single-factor Gaussian copula. A common market factor M induces default correlation; conditionally on M each name defaults independently. Widely used for CDO tranching despite its known tail-risk limitations.",
  },
  {
    id: "pyfin-20260617-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor OLS",
    tag: "factor-models",
    code: `import numpy as np

def fama_french_ols(ret, mkt, smb, hml, rf):
    """
    OLS regression: ret - rf = alpha + beta_m*(mkt-rf) + beta_smb*smb + beta_hml*hml + e
    Returns (alpha, betas, t-stats, R2).
    """
    y = ret - rf
    X = np.column_stack([np.ones(len(y)), mkt - rf, smb, hml])
    beta, res, _, _ = np.linalg.lstsq(X, y, rcond=None)
    yhat = X @ beta
    sse = np.sum((y - yhat)**2)
    sst = np.sum((y - y.mean())**2)
    r2 = 1 - sse/sst
    sigma2 = sse / (len(y) - X.shape[1])
    cov = sigma2 * np.linalg.inv(X.T @ X)
    se = np.sqrt(np.diag(cov))
    t = beta / se
    labels = ['alpha', 'beta_mkt', 'beta_smb', 'beta_hml']
    for lbl, b, tv in zip(labels, beta, t):
        print(f"  {lbl:12s}  {b:+.4f}  t={tv:+.2f}")
    print(f"  R2 = {r2:.4f}")
    return beta, t, r2

rng = np.random.default_rng(0)
T = 120
mkt = rng.normal(0.008, 0.05, T)
smb = rng.normal(0.002, 0.03, T)
hml = rng.normal(0.001, 0.03, T)
rf  = np.full(T, 0.0003)
# True: alpha=0, betas=[1.1, 0.3, 0.2]
ret = rf + 1.1*(mkt-rf) + 0.3*smb + 0.2*hml + rng.normal(0, 0.02, T)
fama_french_ols(ret, mkt, smb, hml, rf)`,
    explanation: "Estimates Fama-French 3-factor loadings via OLS. The design matrix includes an intercept (alpha), the market excess return, SMB (small-minus-big), and HML (high-minus-low). Standard errors use the classical homoskedastic formula; in practice Newey-West HAC SEs are preferred.",
  },
  {
    id: "pyfin-20260617-b1-kelly-multi",
    language: "python",
    title: "Multi-Asset Kelly Criterion",
    tag: "portfolio",
    code: `import numpy as np

def kelly_multi(mu, Sigma, rf=0.0, fraction=1.0):
    """
    Full Kelly: f* = Sigma^{-1} * (mu - rf)
    fraction < 1 gives fractional Kelly for drawdown control.
    """
    excess = mu - rf
    f_full = np.linalg.solve(Sigma, excess)
    f = fraction * f_full
    # Expected log-growth rate (approximation)
    g = rf + fraction*(excess @ f_full) - 0.5*fraction**2*(f_full @ Sigma @ f_full)
    return f, g

rng = np.random.default_rng(1)
n = 4
# Annualised parameters
mu = np.array([0.12, 0.10, 0.08, 0.15])
vols = np.array([0.20, 0.18, 0.15, 0.25])
corr = np.array([[1.0,  0.4,  0.2,  0.3],
                 [0.4,  1.0,  0.3,  0.2],
                 [0.2,  0.3,  1.0,  0.1],
                 [0.3,  0.2,  0.1,  1.0]])
Sigma = np.diag(vols) @ corr @ np.diag(vols)

for frac in [1.0, 0.5, 0.25]:
    f, g = kelly_multi(mu, Sigma, rf=0.05, fraction=frac)
    print(f"fraction={frac:.2f}  weights={np.round(f,3)}  E[log-g]={g:.4f}")`,
    explanation: "Computes the multi-asset Kelly optimal portfolio, which maximises long-run expected log-wealth. The full Kelly solution is Sigma^{-1}*(mu-rf); fractional Kelly reduces bet size to control variance of outcomes at the cost of lower expected log-growth.",
  },
  {
    id: "pyfin-20260617-b1-cointegration",
    language: "python",
    title: "Engle-Granger Cointegration Test",
    tag: "stat-arb",
    code: `import numpy as np
from scipy.stats import t as t_dist

def engle_granger(y, x, lags=5):
    """
    Step 1: regress y on x, get residuals.
    Step 2: ADF test on residuals (no constant, no trend).
    Critical values (n~250): -3.34 (1%), -2.86 (5%), -2.57 (10%).
    """
    # OLS cointegrating regression
    X = np.column_stack([np.ones(len(x)), x])
    b, *_ = np.linalg.lstsq(X, y, rcond=None)
    resid = y - X @ b

    # ADF on residuals
    n = len(resid)
    dy = np.diff(resid)
    lagged = resid[:-1]
    # Build augmented regressors
    Z_rows = min(lags, n - 2)
    rows = n - 1 - Z_rows
    Y_adf = dy[Z_rows:]
    XZ = np.column_stack(
        [lagged[Z_rows:]] + [dy[Z_rows-k:n-1-k] for k in range(1, Z_rows+1)]
    )
    g, *_ = np.linalg.lstsq(XZ, Y_adf, rcond=None)
    resid_adf = Y_adf - XZ @ g
    sigma2 = resid_adf.var()
    se = np.sqrt(sigma2 * np.linalg.inv(XZ.T @ XZ)[0, 0])
    adf_stat = g[0] / se

    crit = {1: -3.34, 5: -2.86, 10: -2.57}
    sig = next((pct for pct, cv in crit.items() if adf_stat < cv), None)
    print(f"Beta={b[1]:.4f}  ADF={adf_stat:.3f}  "
          f"{'cointegrated at ' + str(sig) + '%' if sig else 'NOT cointegrated'}")
    return b[1], adf_stat

rng = np.random.default_rng(7)
x = np.cumsum(rng.normal(0, 1, 300))
y = 2.5 * x + np.cumsum(rng.normal(0, 0.3, 300))  # cointegrated pair
engle_granger(y, x)`,
    explanation: "Implements the two-step Engle-Granger cointegration test. First estimates the cointegrating vector via OLS, then runs an Augmented Dickey-Fuller test on the residuals. Rejection of the unit-root null implies the pair is cointegrated — the basis for pairs trading strategies.",
  },
  {
    id: "pyfin-20260617-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Interest Rate Tree",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_tree(yields, vols, dt=1.0):
    """
    Build BDT recombining tree calibrated to par yields and vol term structure.
    yields: [y1, y2, ...], vols: [sigma1, sigma2, ...]
    Returns short-rate tree (list of arrays).
    """
    n = len(yields)
    r_tree = []
    pu = pd = 0.5

    # Period 0
    r0 = yields[0]
    r_tree.append(np.array([r0]))

    for i in range(1, n):
        T = (i + 1) * dt
        sigma = vols[i]

        def calibrate(r_low):
            rates = r_low * np.exp(2 * sigma * dt * np.arange(i + 1))
            # Price zero coupon of maturity i+1
            # Backward induction starting from maturity node
            prices = 1.0 / (1 + rates * dt)
            for step in range(i - 1, -1, -1):
                r_step = r_tree[step]
                prices = 0.5 * (prices[:-1] + prices[1:]) / (1 + r_step * dt)
            target_price = np.prod([1/(1 + yields[k]) for k in range(i+1)])
            return prices[0] - target_price

        r_low = brentq(calibrate, 1e-6, 1.0)
        rates = r_low * np.exp(2 * sigma * dt * np.arange(i + 1))
        r_tree.append(rates)

    return r_tree

yields = [0.03, 0.035, 0.04, 0.045, 0.05]
vols   = [0.15,  0.14, 0.13,  0.12, 0.11]
tree = bdt_tree(yields, vols)
for i, layer in enumerate(tree):
    print(f"T={i+1}: {np.round(layer, 4)}")`,
    explanation: "Calibrates a Black-Derman-Toy recombining binomial interest rate tree to a given yield curve and volatility term structure. At each maturity the low rate is found via root-finding so that the tree correctly prices the corresponding zero-coupon bond.",
  },
  {
    id: "pyfin-20260617-b1-barrier-mc",
    language: "python",
    title: "Down-and-Out Barrier Option Monte Carlo",
    tag: "derivatives",
    code: `import numpy as np

def barrier_mc(S, K, B, T, r, sigma, n_steps=252, n_paths=200_000, seed=42):
    """
    Down-and-out call: pays max(S_T - K, 0) if min(S_t) >= B over [0,T].
    Uses continuous monitoring via Brownian bridge correction.
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    Z = rng.standard_normal((n_paths, n_steps))
    log_ret = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    log_S = np.log(S) + np.cumsum(log_ret, axis=1)
    S_paths = np.exp(log_S)

    # Brownian bridge correction for barrier hit probability between steps
    S_prev = np.hstack([np.full((n_paths, 1), S), S_paths[:, :-1]])
    S_curr = S_paths
    # P(min < B | endpoints) = exp(-2*ln(S_prev/B)*ln(S_curr/B) / (sigma^2*dt))
    a = np.log(S_prev / B)
    b = np.log(S_curr / B)
    p_hit = np.exp(-2 * a * b / (sigma**2 * dt))
    p_hit = np.where((a < 0) | (b < 0), 1.0, p_hit)
    survived_step = (rng.random((n_paths, n_steps)) > p_hit)
    survived = survived_step.all(axis=1)

    payoff = np.maximum(S_paths[:, -1] - K, 0) * survived
    price = np.exp(-r * T) * payoff.mean()
    se = payoff.std() / np.sqrt(n_paths)
    print(f"Barrier call price: \${price:.4f} +/- \${1.96*se:.4f} (95% CI)")
    return price

barrier_mc(S=100, K=100, B=90, T=1.0, r=0.05, sigma=0.25)`,
    explanation: "Prices a down-and-out barrier call option via Monte Carlo with Brownian bridge correction. The bridge adjustment accounts for the probability that the barrier was crossed between discrete monitoring dates, substantially reducing discretisation bias compared to naive path simulation.",
  },
  {
    id: "pyfin-20260617-b1-black-litterman",
    language: "python",
    title: "Black-Litterman Portfolio Model",
    tag: "portfolio",
    code: `import numpy as np

def black_litterman(Sigma, w_mkt, P, Q, Omega, delta=2.5, tau=0.05):
    """
    Black-Litterman posterior expected returns.
    Pi   = delta * Sigma * w_mkt       (implied equilibrium)
    mu_BL = [(tau*Sigma)^{-1} + P'*Omega^{-1}*P]^{-1}
            * [(tau*Sigma)^{-1}*Pi + P'*Omega^{-1}*Q]
    """
    Pi = delta * Sigma @ w_mkt
    tauSig_inv = np.linalg.inv(tau * Sigma)
    Omega_inv  = np.linalg.inv(Omega)
    M_inv = tauSig_inv + P.T @ Omega_inv @ P
    M = np.linalg.inv(M_inv)
    mu_bl = M @ (tauSig_inv @ Pi + P.T @ Omega_inv @ Q)
    w_bl = np.linalg.solve(delta * Sigma, mu_bl)
    return mu_bl, w_bl / w_bl.sum()

n = 4
vols = np.array([0.16, 0.20, 0.18, 0.22])
corr = np.array([[1.0,0.4,0.3,0.2],[0.4,1.0,0.5,0.3],
                 [0.3,0.5,1.0,0.4],[0.2,0.3,0.4,1.0]])
Sigma = np.diag(vols) @ corr @ np.diag(vols)
w_mkt = np.array([0.35, 0.30, 0.20, 0.15])

# View: asset 0 outperforms asset 2 by 2% per annum
P = np.array([[1, 0, -1, 0]], dtype=float)
Q = np.array([0.02])
Omega = np.array([[0.0004]])  # view uncertainty

mu_bl, w_bl = black_litterman(Sigma, w_mkt, P, Q, Omega)
print("BL expected returns:", np.round(mu_bl, 4))
print("BL optimal weights: ", np.round(w_bl, 4))`,
    explanation: "Implements the Black-Litterman model, which combines market-implied equilibrium returns (reverse-optimised from market cap weights) with investor views via Bayesian updating. The result is a more stable posterior return estimate that avoids the extreme concentration of unconstrained MVO.",
  },
  {
    id: "pyfin-20260617-b1-cvxpy-mvo",
    language: "python",
    title: "CVXPY Mean-Variance Optimisation",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def efficient_frontier(mu, Sigma, n_points=30, w_min=0.0, w_max=0.4):
    """Trace the efficient frontier with long-only box constraints."""
    n = len(mu)
    w = cp.Variable(n)
    target = cp.Parameter()
    constraints = [
        cp.sum(w) == 1,
        w >= w_min,
        w <= w_max,
        mu @ w >= target,
    ]
    objective = cp.Minimize(cp.quad_form(w, Sigma))
    prob = cp.Problem(objective, constraints)

    frontier = []
    mu_lo = mu.min() * 1.01
    mu_hi = mu.max() * 0.99
    for mu_t in np.linspace(mu_lo, mu_hi, n_points):
        target.value = mu_t
        try:
            prob.solve(solver=cp.CLARABEL, warm_start=True)
            if prob.status in ("optimal", "optimal_inaccurate"):
                vol = np.sqrt(w.value @ Sigma @ w.value)
                frontier.append((mu_t, vol, w.value.copy()))
        except Exception:
            pass
    return frontier

rng = np.random.default_rng(3)
n = 6
mu = rng.uniform(0.06, 0.18, n)
A = rng.normal(0, 1, (n, n)); Sigma = (A @ A.T) / n + np.eye(n) * 0.01

frontier = efficient_frontier(mu, Sigma)
print(f"{'Target mu':>10}  {'Vol':>8}  {'Sharpe':>8}")
for mu_t, vol, w in frontier[::5]:
    print(f"  {mu_t:.4f}    {vol:.4f}    {(mu_t-0.05)/vol:.4f}")`,
    explanation: "Uses CVXPY to trace the efficient frontier under long-only box constraints. The return target is a parameter so a single compiled problem is solved repeatedly (warm-started) for each target return, producing the risk-return trade-off curve efficiently.",
  },
  {
    id: "pyfin-20260617-b1-antithetic",
    language: "python",
    title: "Antithetic Variates for Option Pricing",
    tag: "monte-carlo",
    code: `import numpy as np

def bs_call_antithetic(S, K, T, r, sigma, n_paths=50_000, seed=42):
    """
    Antithetic variates: use Z and -Z to reduce variance.
    Variance reduction factor = (1 + rho)/2 where rho = corr(f(Z), f(-Z)).
    """
    rng = np.random.default_rng(seed)
    Z = rng.standard_normal(n_paths)
    factor = np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    factor_anti = np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*(-Z))
    ST      = S * factor
    ST_anti = S * factor_anti
    payoff      = np.maximum(ST - K, 0)
    payoff_anti = np.maximum(ST_anti - K, 0)
    combined = 0.5 * (payoff + payoff_anti)
    price = np.exp(-r*T) * combined.mean()
    se_crude = payoff.std() / np.sqrt(n_paths) * np.exp(-r*T)
    se_anti  = combined.std() / np.sqrt(n_paths) * np.exp(-r*T)
    print(f"Price: \${price:.4f}")
    print(f"SE crude: {se_crude:.6f}   SE antithetic: {se_anti:.6f}")
    print(f"Variance reduction: {se_crude**2 / se_anti**2:.1f}x")
    return price

# BS analytical for comparison
from scipy.stats import norm
S,K,T,r,sig=100,100,1,0.05,0.2
d1=(np.log(S/K)+(r+0.5*sig**2)*T)/(sig*np.sqrt(T)); d2=d1-sig*np.sqrt(T)
print(f"BS exact: \${S*norm.cdf(d1)-K*np.exp(-r*T)*norm.cdf(d2):.4f}")
bs_call_antithetic(S,K,T,r,sig)`,
    explanation: "Antithetic variates pairs each random draw Z with its reflection -Z. Because the call payoff is monotone in the terminal stock price, the two payoffs are negatively correlated, reducing estimator variance by roughly half compared to crude Monte Carlo for the same computational budget.",
  },
  {
    id: "pyfin-20260617-b1-gpd-evt",
    language: "python",
    title: "GPD / Extreme Value Theory Tail Estimation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses, u_quantile=0.90):
    """
    Peaks-over-threshold: fit GPD to exceedances above threshold u.
    VaR_p = u + (sigma/xi)*((n/Nu*(1-p))^{-xi} - 1)   for xi != 0
    """
    u = np.quantile(losses, u_quantile)
    exceedances = losses[losses > u] - u
    Nu = len(exceedances)
    n  = len(losses)
    print(f"Threshold u={u:.4f}  exceedances Nu={Nu}")

    # MLE for GPD(xi, sigma)
    xi0, sigma0 = 0.1, exceedances.mean()

    def neg_ll(params):
        xi, sigma = params
        if sigma <= 0:
            return 1e10
        if xi == 0:
            return Nu * np.log(sigma) + exceedances.sum() / sigma
        arg = 1 + xi * exceedances / sigma
        if (arg <= 0).any():
            return 1e10
        return Nu*np.log(sigma) + (1 + 1/xi)*np.log(arg).sum()

    res = minimize(neg_ll, [xi0, sigma0], method='Nelder-Mead')
    xi, sigma = res.x

    def var_gpd(p):
        return u + sigma/xi * ((n/Nu*(1-p))**(-xi) - 1)

    def es_gpd(p):
        return (var_gpd(p) + sigma - xi*u) / (1 - xi)

    for p in [0.99, 0.999, 0.9999]:
        print(f"p={p}  VaR={var_gpd(p):.4f}  ES={es_gpd(p):.4f}")
    return xi, sigma, u

rng = np.random.default_rng(5)
losses = rng.pareto(3.0, 10000)  # heavy tail
fit_gpd_tail(losses)`,
    explanation: "Fits a Generalised Pareto Distribution to losses exceeding a threshold using peaks-over-threshold maximum likelihood. GPD tail extrapolation provides more reliable extreme quantile estimates than historical simulation, critical for stress VaR and regulatory capital calculations.",
  },
  {
    id: "pyfin-20260617-b1-mkt-impact",
    language: "python",
    title: "Square-Root Market Impact Model",
    tag: "execution",
    code: `import numpy as np

def optimal_twap(Q, sigma, eta, gamma, T, n_slices=20):
    """
    Almgren-Chriss linear-impact simplified: permanent impact alpha*(Q/T),
    temporary impact eta*(v_t). Optimal TWAP minimises E[Cost] + lambda*Var[Cost].
    For purely linear + sqrt approximation:
      optimal rate v* = Q/T (TWAP) when no risk aversion;
      with risk aversion: front-load.
    Here we illustrate the sqrt impact cost calculation.
    """
    dt = T / n_slices
    v = Q / T  # TWAP rate (shares/time)
    t_grid = np.linspace(0, T, n_slices + 1)
    q_remaining = Q - v * t_grid  # inventory

    # Temporary impact cost per slice
    impact_per_share = eta * np.sqrt(v / (Q / T))  # normalised
    temp_cost = eta * v**0.5 * dt * n_slices
    # Permanent impact
    perm_cost = 0.5 * gamma * v * T

    # Volatility risk
    var_cost = (sigma**2 * dt * (q_remaining[:-1]**2)).sum()

    print(f"TWAP execution rate : {v:.2f} shares/unit-time")
    print(f"Temp impact cost    : {temp_cost:.4f}")
    print(f"Perm impact cost    : {perm_cost:.4f}")
    print(f"Variance of cost    : {var_cost:.4f}")
    print(f"Total expected cost : {temp_cost + perm_cost:.4f}")

optimal_twap(Q=10000, sigma=0.02, eta=0.1, gamma=0.0001, T=1.0)`,
    explanation: "Models execution cost under a square-root temporary market impact and linear permanent impact. The TWAP strategy is optimal when risk-aversion is zero; with positive risk-aversion (lambda>0) the optimal strategy front-loads to reduce inventory risk at the cost of higher impact.",
  },
  {
    id: "pyfin-20260617-b1-breakeven-infl",
    language: "python",
    title: "TIPS Breakeven Inflation Extraction",
    tag: "rates",
    code: `import numpy as np

def tips_breakeven(nominal_yields, real_yields, tenors):
    """
    Breakeven inflation = nominal yield - real yield (Fisher decomposition).
    Also computes inflation risk premium proxy using survey expectations.
    """
    breakevens = np.array(nominal_yields) - np.array(real_yields)

    # Carry on inflation position: roll-down + carry
    carry = np.diff(breakevens) / np.diff(tenors)  # slope (bps/year)

    print(f"{'Tenor':>6}  {'Nominal':>8}  {'Real':>8}  {'Breakeven':>10}")
    for T, n, r, be in zip(tenors, nominal_yields, real_yields, breakevens):
        print(f"  {T:4.0f}y   {n*100:6.2f}%   {r*100:6.2f}%   {be*100:8.2f}%")

    print(f"\\nCurve slope (BEI bps/yr): {np.round(carry*10000, 2)}")

    # TIPS carry: hold 5y TIPS for dt, roll to 5-dt maturity
    def tips_carry(real_yield_5, real_yield_4, dt=1/12):
        roll_down = (real_yield_5 - real_yield_4) * 5  # price change approx
        carry_yield = real_yield_5 * dt
        return carry_yield + roll_down * dt

    tc = tips_carry(real_yields[2], real_yields[1])
    print(f"TIPS 5y carry+roll (1m): {tc*10000:.2f} bps")
    return breakevens

nominal = [0.048, 0.047, 0.046, 0.045, 0.044]
real    = [0.018, 0.017, 0.016, 0.015, 0.014]
tenors  = [2, 5, 7, 10, 30]
tips_breakeven(nominal, real, tenors)`,
    explanation: "Decomposes TIPS breakeven inflation from nominal minus real yields. The breakeven represents the market-implied average inflation rate over the bond's life. The slope of the breakeven curve and carry-roll calculations are used to assess relative value in inflation-linked bond strategies.",
  },
  {
    id: "pyfin-20260617-b1-regime-switch",
    language: "python",
    title: "Two-State Regime Switching (Hamilton Filter)",
    tag: "econometrics",
    code: `import numpy as np
from scipy.optimize import minimize

def hamilton_filter(y, params):
    """
    2-state Markov-switching: y_t | s_t ~ N(mu[s], sigma[s]).
    params: [mu0, mu1, log_sig0, log_sig1, logit_p00, logit_p11]
    Returns log-likelihood and smoothed state probabilities.
    """
    mu = params[:2]
    sig = np.exp(params[2:4])
    p00 = 1/(1+np.exp(-params[4]))
    p11 = 1/(1+np.exp(-params[5]))
    P = np.array([[p00, 1-p11], [1-p00, p11]])

    T = len(y)
    filtered = np.zeros((T, 2))
    xi = np.array([0.5, 0.5])
    ll = 0.0
    from scipy.stats import norm

    for t in range(T):
        eta = np.array([norm.pdf(y[t], mu[s], sig[s]) for s in range(2)])
        xi_pred = P @ xi
        xi_filt = eta * xi_pred
        f = xi_filt.sum()
        if f < 1e-300:
            return -np.inf, filtered
        ll += np.log(f)
        xi = xi_filt / f
        filtered[t] = xi

    return ll, filtered

# Generate regime-switching data
rng = np.random.default_rng(9)
T = 300
states = np.zeros(T, int)
for t in range(1, T):
    states[t] = 0 if (states[t-1]==0 and rng.random()<0.97) else (
                 1 if (states[t-1]==1 and rng.random()<0.95) else 1-states[t-1])
y = np.where(states==0, rng.normal(0.08, 0.10, T), rng.normal(-0.20, 0.25, T))

p0 = [0.05, -0.15, np.log(0.12), np.log(0.22), 2.0, 2.0]
res = minimize(lambda p: -hamilton_filter(y, p)[0], p0, method='Nelder-Mead',
               options={'maxiter': 5000})
ll, filt = hamilton_filter(y, res.x)
print(f"Log-likelihood: {ll:.2f}")
print(f"P(bull|last 5): {filt[-5:,0].round(3)}")`,
    explanation: "Implements the Hamilton (1989) filter for a two-state Markov-switching model. The filter computes filtered state probabilities recursively using the prediction-update cycle; MLE parameters are found via numerical optimisation of the log-likelihood. Common for modelling bull/bear equity regimes.",
  },
  {
    id: "pyfin-20260617-b1-vix-formula",
    language: "python",
    title: "Model-Free VIX Formula Replication",
    tag: "derivatives",
    code: `import numpy as np

def compute_vix(calls, puts, strikes, F, T, r):
    """
    CBOE VIX formula (model-free implied variance):
    sigma^2 = (2/T) * sum_i [dK_i/K_i^2 * exp(rT) * Q(K_i)] - (1/T)*(F/K0 - 1)^2
    Q(K) = put price for K < F0, call price for K > F0.
    """
    # Find K0: largest strike <= F
    k_arr = np.array(strikes, dtype=float)
    K0_idx = np.searchsorted(k_arr, F) - 1
    K0 = k_arr[K0_idx]

    # Select OTM options
    Q = np.where(k_arr <= F, puts, calls)
    # Use midpoint for ATM
    Q[K0_idx] = 0.5 * (calls[K0_idx] + puts[K0_idx])

    # Compute dK: half the distance between adjacent strikes
    dK = np.zeros_like(k_arr)
    dK[0]  = k_arr[1] - k_arr[0]
    dK[-1] = k_arr[-1] - k_arr[-2]
    dK[1:-1] = (k_arr[2:] - k_arr[:-2]) / 2

    sigma2 = (2/T) * np.sum(dK / k_arr**2 * np.exp(r*T) * Q)
    sigma2 -= (1/T) * (F/K0 - 1)**2
    vix = 100 * np.sqrt(sigma2)
    print(f"Model-free IV (VIX-style): {vix:.2f}")
    return vix

# Synthetic options: flat 20% vol
from scipy.stats import norm
S, r, T = 100, 0.05, 30/365
F = S * np.exp(r*T)
strikes = np.arange(80, 121, 2.5)
d1 = (np.log(F/strikes) + 0.5*0.20**2*T)/(0.20*np.sqrt(T))
d2 = d1 - 0.20*np.sqrt(T)
calls = np.exp(-r*T)*(F*norm.cdf(d1) - strikes*norm.cdf(d2))
puts  = calls - np.exp(-r*T)*(F - strikes)
compute_vix(calls, puts, strikes, F, T, r)`,
    explanation: "Replicates the CBOE VIX methodology: a model-free measure of 30-day implied variance obtained by integrating OTM option prices across all strikes. The formula prices a variance swap replication portfolio, providing the expected variance without assuming a specific model for the underlying.",
  },
  {
    id: "pyfin-20260617-b1-carry-trade",
    language: "python",
    title: "FX Carry Trade Decomposition",
    tag: "fx",
    code: `import numpy as np

def carry_decomposition(spot_start, spot_end, r_dom, r_for, T=1.0):
    """
    UIP: E[dS/S] = r_dom - r_for  (covered interest parity)
    Carry return = (r_dom - r_for)*T  (interest differential)
    FX return    = (S_end - S_start) / S_start
    Total return = carry + FX return
    Carry excess = carry - FX return  (profit from UIP deviation)
    """
    fx_ret = (spot_end - spot_start) / spot_start
    carry  = (r_dom - r_for) * T
    total  = carry + fx_ret  # from base-currency investor PoV (approx)
    uip_dev = carry - fx_ret  # positive = carry wins vs UIP

    print(f"Carry (int diff): {carry*100:.2f}%")
    print(f"FX spot return : {fx_ret*100:.2f}%")
    print(f"Total return   : {total*100:.2f}%")
    print(f"UIP deviation  : {uip_dev*100:.2f}%  "
          f"({'UIP holds' if abs(uip_dev)<0.005 else 'carry wins' if uip_dev>0 else 'carry loses'})")
    return carry, fx_ret, total

# Simulate carry trade basket
rng = np.random.default_rng(11)
pairs = [("AUDUSD", 0.04, 0.05), ("USDTRY", 0.05, 0.30),
         ("EURUSD", 0.05, 0.04), ("USDJPY", 0.05, 0.001)]
print(f"{'Pair':>8}  {'Carry':>7}  {'FX ret':>7}  {'Total':>7}")
total_port = 0
for pair, r_dom, r_for in pairs:
    fx = rng.normal(-(r_dom - r_for)*0.5, 0.10)  # partial UIP
    carry = (r_dom - r_for)
    total = carry + fx
    total_port += total / len(pairs)
    print(f"  {pair:6s}    {carry*100:5.1f}%   {fx*100:5.1f}%   {total*100:5.1f}%")
print(f"  {'Portfolio':6s}  {'':7}  {'':7}   {total_port*100:5.1f}%")`,
    explanation: "Decomposes FX carry trade returns into the interest rate differential (carry) and the spot FX move. Under uncovered interest parity the carry should be fully offset by currency depreciation; in practice currencies of high-rate countries tend to appreciate on average, yielding a carry premium.",
  },
  {
    id: "pyfin-20260617-b1-factor-risk",
    language: "python",
    title: "Barra-Style Factor Risk Decomposition",
    tag: "factor-models",
    code: `import numpy as np

def factor_risk_decomp(w, B, F, D):
    """
    Portfolio variance decomposition:
    Sigma = B*F*B' + D  (Barra structure)
    w: portfolio weights (n,)
    B: factor exposure matrix (n, k)
    F: factor covariance matrix (k, k)
    D: diagonal specific risk (n, n)
    Returns: total_var, factor_var, specific_var, factor_MCR
    """
    # Factor covariance contribution
    Bf = B @ np.linalg.cholesky(F)  # (n,k)
    factor_cov = Bf @ Bf.T
    specific_cov = D

    total_var = w @ (factor_cov + specific_cov) @ w
    factor_var   = w @ factor_cov @ w
    specific_var = w @ specific_cov @ w

    # Marginal contribution to risk (factor)
    mcr = (factor_cov + specific_cov) @ w / np.sqrt(total_var)

    print(f"Total vol         : {np.sqrt(total_var)*100:.2f}%")
    print(f"Factor risk share : {factor_var/total_var*100:.1f}%")
    print(f"Specific risk %   : {specific_var/total_var*100:.1f}%")
    print(f"MCR (top 3)       : {np.round(np.sort(mcr)[::-1][:3]*100,3)}")
    return total_var, factor_var, specific_var, mcr

rng = np.random.default_rng(4)
n, k = 50, 5
B = rng.normal(0, 0.5, (n, k))
B[:, 0] = 1.0  # market factor all exposed
A = rng.normal(0, 1, (k, k)); F = A @ A.T / k + np.eye(k)*0.01
spec_vols = rng.uniform(0.05, 0.20, n)
D = np.diag(spec_vols**2)
w = np.ones(n) / n  # equal weight

factor_risk_decomp(w, B, F, D)`,
    explanation: "Implements Barra-style factor risk decomposition for a multi-factor equity model. Portfolio variance is split into factor variance (driven by exposure to systematic factors) and specific variance (idiosyncratic). Marginal contribution to risk guides de-risking decisions for each holding.",
  },
  {
    id: "pyfin-20260617-b1-convertible-tree",
    language: "python",
    title: "Convertible Bond Binomial Tree",
    tag: "derivatives",
    code: `import numpy as np

def convertible_bond(S, K_conv, face, coupon, T, r, sigma, cr_spread,
                     n_steps=100):
    """
    Convertible bond valued on binomial tree.
    At each node: hold = bond value, convert = S_t * conv_ratio.
    Discounting uses r + cr_spread for credit risk.
    """
    dt = T / n_steps
    conv_ratio = face / K_conv
    u = np.exp(sigma * np.sqrt(dt))
    d = 1 / u
    p = (np.exp((r - cr_spread) * dt) - d) / (u - d)  # risk-neutral prob
    disc = np.exp(-(r + cr_spread) * dt)

    # Terminal stock prices
    j = np.arange(n_steps + 1)
    S_T = S * u**j * d**(n_steps - j)

    # Terminal bond value
    V = np.maximum(S_T * conv_ratio, face)  # convert or par

    # Backward induction with coupon payments
    coupon_amt = face * coupon * dt
    for step in range(n_steps - 1, -1, -1):
        S_node = S * u**np.arange(step + 1) * d**(step - np.arange(step + 1))
        V = disc * (p * V[1:step+2] + (1-p) * V[:step+1])
        V += coupon_amt  # add coupon
        V = np.maximum(V, S_node * conv_ratio)  # conversion floor

    print(f"Convertible bond price: \${V[0]:.4f}  (face=\${face})")
    print(f"Conversion value now : \${S * conv_ratio:.4f}")
    print(f"Conversion premium   : {(V[0]/(S*conv_ratio)-1)*100:.2f}%")
    return V[0]

convertible_bond(S=80, K_conv=100, face=100, coupon=0.04,
                 T=5, r=0.05, sigma=0.30, cr_spread=0.02)`,
    explanation: "Values a convertible bond on a binomial tree incorporating both equity optionality and credit risk. At each node the holder chooses between holding the bond (discounted at r + credit spread) and converting to equity. The backward induction applies the conversion floor at every node, not just at maturity.",
  },
  {
    id: "pyfin-20260617-b1-cva-mc",
    language: "python",
    title: "CVA Monte Carlo Estimation",
    tag: "credit",
    code: `import numpy as np

def cva_mc(notional, T, r, sigma, kappa, hazard, recovery,
           n_paths=50_000, n_steps=50, seed=42):
    """
    CVA = (1-R) * integral_0^T EE(t) * lambda * exp(-lambda*t) * df(t) dt
    EE(t): Expected Exposure at time t (simplified: forward rate swap exposure)
    Uses GBM proxy for exposure (e.g. IR swap MTM ~ rate move * DV01).
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    t_grid = np.linspace(dt, T, n_steps)
    df = np.exp(-r * t_grid)
    surv = np.exp(-hazard * t_grid)

    # Simulate exposure paths (proxy: lognormal rate move)
    Z = rng.standard_normal((n_paths, n_steps))
    log_ret = (kappa - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    exposure = notional * 0.05 * np.exp(np.cumsum(log_ret, axis=1))
    exposure = np.maximum(exposure, 0)  # exposure >= 0 (netting floor)

    EE = exposure.mean(axis=0)  # expected exposure profile
    integrand = EE * hazard * surv * df
    cva = (1 - recovery) * np.trapz(integrand, t_grid)

    print(f"CVA: \${cva:.4f}  ({cva/notional*10000:.1f} bps of notional)")
    print(f"Peak EE at {t_grid[EE.argmax()]:.1f}y: \${EE.max():.2f}")
    return cva

cva_mc(notional=10_000_000, T=5, r=0.04, sigma=0.25,
       kappa=0.02, hazard=0.02, recovery=0.4)`,
    explanation: "Estimates CVA (Credit Valuation Adjustment) via Monte Carlo by simulating exposure paths and integrating the expected positive exposure against the probability of default. The CVA represents the cost of counterparty credit risk and is the difference between the risk-free and risky derivative prices.",
  },
];
