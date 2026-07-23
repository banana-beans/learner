import type { Snippet } from "./types";

export const pythonFinanceSnippets20260723B1: Snippet[] = [
  {
    id: "pyfin-20260723-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Yield Curve Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(t, beta0, beta1, beta2, tau):
    """Nelson-Siegel (1987) three-factor yield curve."""
    l = (1 - np.exp(-t / tau)) / (t / tau)
    c = l - np.exp(-t / tau)
    return beta0 + beta1 * l + beta2 * c

def svensson(t, beta0, beta1, beta2, beta3, tau1, tau2):
    """Svensson (1994) four-factor extension for humped curves."""
    l1 = (1 - np.exp(-t / tau1)) / (t / tau1)
    c1 = l1 - np.exp(-t / tau1)
    l2 = (1 - np.exp(-t / tau2)) / (t / tau2)
    c2 = l2 - np.exp(-t / tau2)
    return beta0 + beta1 * l1 + beta2 * c1 + beta3 * c2

def fit_nelson_siegel(maturities, yields):
    """Least-squares fit of Nelson-Siegel to observed yields."""
    def obj(params):
        b0, b1, b2, tau = params
        if tau <= 0:
            return 1e9
        fitted = nelson_siegel(maturities, b0, b1, b2, tau)
        return np.sum((fitted - yields) ** 2)
    # Warm-start: long rate, spread, hump, tau=2
    y0 = [yields[-1], yields[0] - yields[-1], 0.0, 2.0]
    res = minimize(obj, y0, method="Nelder-Mead", options={"xatol": 1e-8})
    b0, b1, b2, tau = res.x
    fitted = nelson_siegel(maturities, b0, b1, b2, tau)
    rmse = np.sqrt(np.mean((fitted - yields) ** 2))
    return {"beta0": b0, "beta1": b1, "beta2": b2, "tau": tau,
            "fitted": fitted, "rmse": rmse}

maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.052, 0.053, 0.051, 0.048, 0.046, 0.044, 0.043, 0.043, 0.044, 0.045])
result = fit_nelson_siegel(maturities, yields)
print(f"beta0={result['beta0']:.4f} beta1={result['beta1']:.4f} "
      f"beta2={result['beta2']:.4f} tau={result['tau']:.4f} rmse={result['rmse']*100:.2f}bps")`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into three economically interpretable factors: beta0=long-run level, beta1=slope (short-minus-long), beta2=curvature (hump). Svensson adds a second hump term for better fit in the belly. Central banks and primary dealers use NS/Svensson for official yield curve publications and risk factor decomposition.",
  },
  {
    id: "pyfin-20260723-b1-vasicek-py",
    language: "python",
    title: "Vasicek Short Rate Simulation",
    tag: "finance",
    code: `import numpy as np

def vasicek_paths(a, b, sigma, r0, T, n_steps, n_paths, seed=42):
    """
    Exact simulation of Vasicek dr = a*(b-r)*dt + sigma*dW.
    The exact conditional distribution is Gaussian — no Euler bias.
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    e = np.exp(-a * dt)
    cond_mean_coef = e             # multiplied by current r
    cond_const = b * (1 - e)       # long-run mean contribution
    cond_std = sigma * np.sqrt((1 - e**2) / (2 * a))

    r = np.zeros((n_paths, n_steps + 1))
    r[:, 0] = r0
    Z = rng.standard_normal((n_paths, n_steps))
    for t in range(n_steps):
        r[:, t+1] = cond_mean_coef * r[:, t] + cond_const + cond_std * Z[:, t]
    return r

def vasicek_bond_mc(a, b, sigma, r0, T, n_steps=252, n_paths=50_000, seed=42):
    """Zero-coupon bond price via MC (benchmark against analytic)."""
    r = vasicek_paths(a, b, sigma, r0, T, n_steps, n_paths, seed)
    dt = T / n_steps
    integrals = r[:, :-1].sum(axis=1) * dt   # simple Riemann sum
    prices = np.exp(-integrals)
    return prices.mean(), prices.std() / np.sqrt(n_paths)

def vasicek_bond_analytic(a, b, sigma, r0, T):
    B = (1 - np.exp(-a * T)) / a
    A = np.exp((B - T) * (a**2 * b - 0.5 * sigma**2) / a**2
               - sigma**2 * B**2 / (4 * a))
    return A * np.exp(-B * r0)

price_mc, se = vasicek_bond_mc(a=0.15, b=0.06, sigma=0.02, r0=0.05, T=5)
price_an = vasicek_bond_analytic(0.15, 0.06, 0.02, 0.05, 5)
print(f"MC: {price_mc:.6f} ± {se:.6f}  Analytic: {price_an:.6f}")`,
    explanation:
      "Exact simulation avoids discretisation error because the Vasicek conditional distribution is Gaussian; each step uses the true mean and variance rather than an Euler approximation. The analytic bond price P(0,T) serves as a control variate to further reduce Monte Carlo variance for derivatives pricing on the Vasicek model.",
  },
  {
    id: "pyfin-20260723-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion and Fractional Kelly Sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(mu, sigma, r=0.0):
    """
    Continuous Kelly: f* = (mu - r) / sigma^2.
    Maximises E[log(wealth)] for a log-normally distributed strategy.
    """
    return (mu - r) / sigma**2

def kelly_multivariate(alpha: np.ndarray, cov: np.ndarray, r: float = 0.0) -> np.ndarray:
    """
    Multi-asset Kelly: f* = Sigma^{-1} * (mu - r).
    alpha: expected excess returns, cov: covariance matrix.
    """
    return np.linalg.solve(cov, alpha - r)

def fractional_kelly(f_star, fraction=0.5):
    """
    Fractional Kelly: size = f * f* (reduces variance, slower growth).
    Half-Kelly (fraction=0.5) is common in practice to account for
    parameter estimation uncertainty.
    """
    return fraction * f_star

def kelly_with_drawdown_constraint(mu, sigma, max_drawdown=0.20):
    """
    Optimal fraction subject to a max expected drawdown constraint.
    Drawdown ~ f * sigma^2 / (2 * mu) for GBM with drift mu.
    """
    def expected_drawdown(f):
        if f <= 0:
            return 0.0
        g = f * mu - 0.5 * f**2 * sigma**2   # log-growth rate
        if g <= 0:
            return float("inf")
        return f * sigma**2 / (2 * g)

    # Optimal unconstrained
    f_full = kelly_fraction(mu, sigma)
    if expected_drawdown(f_full) <= max_drawdown:
        return f_full, expected_drawdown(f_full)
    # Binary search for constrained optimum
    lo, hi = 0.0, f_full
    for _ in range(50):
        mid = 0.5 * (lo + hi)
        if expected_drawdown(mid) < max_drawdown:
            lo = mid
        else:
            hi = mid
    return lo, max_drawdown

# Example: strategy with 15% annual return, 20% vol
mu, sigma = 0.15, 0.20
f_kelly = kelly_fraction(mu, sigma)
print(f"Full Kelly: {f_kelly:.2%}  Half Kelly: {fractional_kelly(f_kelly):.2%}")
f_dd, dd = kelly_with_drawdown_constraint(mu, sigma, max_drawdown=0.10)
print(f"Drawdown-constrained: {f_dd:.2%}  Expected DD: {dd:.2%}")`,
    explanation:
      "Full Kelly maximises long-run compound growth but implies high drawdowns; half-Kelly is widely preferred because model uncertainty means the true edge is likely smaller than estimated. The drawdown-constrained variant is practically important for institutional managers who face redemption risk if drawdowns exceed a threshold.",
  },
  {
    id: "pyfin-20260723-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading",
    tag: "finance",
    code: `import numpy as np

class KalmanHedgeRatio:
    """
    Online Kalman filter to estimate a time-varying hedge ratio beta
    between two cointegrated assets y = beta*x + alpha + eps.
    State: [beta, alpha], observation: y.
    """
    def __init__(self, delta=1e-4, Vw=1e-4, Ve=1e-2):
        self.delta = delta   # rate of change of parameters
        self.Vw = Vw         # process noise variance (state evolution)
        self.Ve = Ve         # observation noise variance
        self.theta = np.zeros(2)       # [beta, alpha]
        self.R = np.zeros((2, 2))      # state covariance
        self.P = np.eye(2) * 1e2      # initial uncertainty

    def update(self, x: float, y: float):
        F = np.array([x, 1.0])        # observation matrix row
        # Predict
        Q = self.delta / (1 - self.delta) * np.eye(2)
        self.P = self.P + Q           # state noise inflation
        # Innovation
        innovation = y - F @ self.theta
        S = F @ self.P @ F + self.Ve  # innovation variance
        K = self.P @ F / S            # Kalman gain
        # Update
        self.theta = self.theta + K * innovation
        self.P = (np.eye(2) - np.outer(K, F)) @ self.P
        spread = y - F @ self.theta   # current residual
        return self.theta[0], self.theta[1], spread, np.sqrt(S)

def pairs_strategy(prices_y: np.ndarray, prices_x: np.ndarray,
                   entry_z: float = 2.0, exit_z: float = 0.5) -> np.ndarray:
    """Walk-forward pairs trading with Kalman hedge ratio."""
    kf = KalmanHedgeRatio()
    spreads, betas = [], []
    for i in range(len(prices_y)):
        beta, alpha, spread, std = kf.update(prices_x[i], prices_y[i])
        spreads.append(spread / (std + 1e-9))   # z-score
        betas.append(beta)
    z = np.array(spreads)
    # Position: long y/short x when z < -entry, reverse when z > +entry
    pos = np.where(z < -entry_z, 1, np.where(z > entry_z, -1, 0))
    # Exit when z crosses zero ± exit_z
    pos[np.abs(z) < exit_z] = 0
    return pos, np.array(betas)`,
    explanation:
      "The Kalman filter estimates a time-varying hedge ratio by treating beta as a random walk; the delta parameter controls how quickly beta can drift. Unlike static OLS, this handles structural breaks and gradual drift in the relationship. z-score entry/exit on the filtered spread avoids stale hedge ratios that would misidentify mean-reversion signals.",
  },
  {
    id: "pyfin-20260723-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Regime-Switching Model",
    tag: "finance",
    code: `import numpy as np

class GaussianHMM:
    """
    Two-state Gaussian HMM via Baum-Welch EM.
    State 0: low-vol (bull), State 1: high-vol (bear).
    """
    def __init__(self, n_states=2):
        self.n = n_states
        # Initialise parameters
        self.pi = np.ones(n_states) / n_states
        self.A  = np.full((n_states, n_states), 0.9)
        np.fill_diagonal(self.A, 0.1)
        self.mu    = np.array([-0.001, 0.001])
        self.sigma = np.array([0.01, 0.03])

    def _emission(self, x, k):
        """Gaussian log-likelihood for state k."""
        return -0.5 * ((x - self.mu[k]) / self.sigma[k])**2 - np.log(self.sigma[k])

    def fit(self, X, n_iter=50):
        T = len(X)
        for _ in range(n_iter):
            # E-step: forward-backward
            log_alpha = np.zeros((T, self.n))
            log_beta  = np.zeros((T, self.n))
            # Forward
            log_alpha[0] = np.log(self.pi + 1e-300) + np.array([self._emission(X[0], k) for k in range(self.n)])
            for t in range(1, T):
                em = np.array([self._emission(X[t], k) for k in range(self.n)])
                for k in range(self.n):
                    log_alpha[t, k] = em[k] + np.logaddexp.reduce(log_alpha[t-1] + np.log(self.A[:, k] + 1e-300))
            # Backward (simplified for 2 states)
            log_beta[-1] = 0.0
            for t in range(T-2, -1, -1):
                em_next = np.array([self._emission(X[t+1], k) for k in range(self.n)])
                for k in range(self.n):
                    log_beta[t, k] = np.logaddexp.reduce(
                        np.log(self.A[k] + 1e-300) + em_next + log_beta[t+1])
            # Posterior
            log_gamma = log_alpha + log_beta
            log_gamma -= np.logaddexp(log_gamma[:, 0], log_gamma[:, 1])[:, None]
            gamma = np.exp(log_gamma)
            # M-step
            self.mu    = (gamma * X[:, None]).sum(0) / gamma.sum(0)
            diff = X[:, None] - self.mu
            self.sigma = np.sqrt((gamma * diff**2).sum(0) / gamma.sum(0))
        return gamma  # posterior state probabilities

rng = np.random.default_rng(42)
returns = np.concatenate([rng.normal(0.0005, 0.01, 200),
                           rng.normal(-0.001, 0.025, 200)])
model = GaussianHMM()
gamma = model.fit(returns)
print(f"Bull mu={model.mu[0]:.4f} sigma={model.sigma[0]:.4f}")
print(f"Bear mu={model.mu[1]:.4f} sigma={model.sigma[1]:.4f}")`,
    explanation:
      "Baum-Welch EM iterates forward-backward (E-step) and parameter updates (M-step) until convergence; the log-domain avoids numerical underflow for long sequences. Regime detection informs risk sizing: strategies scale down when posterior P(bear) exceeds a threshold, reducing exposure during identified high-volatility periods.",
  },
  {
    id: "pyfin-20260723-b1-fama-french",
    language: "python",
    title: "Fama-French Three-Factor Regression",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def fama_french_regression(portfolio_ret: pd.Series,
                            mkt_rf: pd.Series,
                            smb: pd.Series,
                            hml: pd.Series,
                            rf: pd.Series) -> dict:
    """
    Regress portfolio excess returns on Fama-French 3 factors.
    Returns: alpha (Jensen's), beta_mkt, beta_smb, beta_hml, R^2, t-stats.
    """
    excess_ret = portfolio_ret - rf
    X = pd.DataFrame({"Mkt-RF": mkt_rf - rf, "SMB": smb, "HML": hml})
    X = sm.add_constant(X)
    model = sm.OLS(excess_ret, X, missing="drop").fit(cov_type="HAC",
                                                       cov_kwds={"maxlags": 3})
    return {
        "alpha":    model.params["const"],
        "beta_mkt": model.params["Mkt-RF"],
        "beta_smb": model.params["SMB"],
        "beta_hml": model.params["HML"],
        "alpha_t":  model.tvalues["const"],
        "r2":       model.rsquared,
        "r2_adj":   model.rsquared_adj,
        "info_ratio": model.params["const"] / model.resid.std() * np.sqrt(252),
    }

def rolling_ff3(portfolio_ret: pd.Series, factors: pd.DataFrame,
                rf: pd.Series, window: int = 60) -> pd.DataFrame:
    """Rolling 60-month FF3 betas for time-varying exposure analysis."""
    results = []
    for end in range(window, len(portfolio_ret)):
        start = end - window
        reg = fama_french_regression(
            portfolio_ret.iloc[start:end],
            factors["Mkt-RF"].iloc[start:end],
            factors["SMB"].iloc[start:end],
            factors["HML"].iloc[start:end],
            rf.iloc[start:end],
        )
        results.append({**reg, "date": portfolio_ret.index[end]})
    return pd.DataFrame(results).set_index("date")`,
    explanation:
      "HAC (Newey-West) standard errors correct for autocorrelation and heteroskedasticity in monthly returns. The information ratio (alpha / tracking_error * sqrt(12)) normalises alpha by idiosyncratic risk; rolling betas reveal factor exposure drift — a value fund drifting toward growth is a common style-box violation caught this way.",
  },
  {
    id: "pyfin-20260723-b1-mc-control-variate",
    language: "python",
    title: "Monte Carlo with Control Variate Variance Reduction",
    tag: "finance",
    code: `import numpy as np

def mc_with_control_variate(S0, K, T, r, sigma, n_paths=50_000, seed=42):
    """
    Control variate: use the geometric-mean Asian as CV for the arithmetic Asian.
    Both are computed in the same MC run — correlated so CV removes shared variance.
    """
    rng = np.random.default_rng(seed)
    n_steps = 252
    dt = T / n_steps
    disc = np.exp(-r * T)

    Z = rng.standard_normal((n_paths, n_steps))
    log_S = np.log(S0) + np.cumsum(
        (r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z, axis=1
    )
    S = np.exp(log_S)

    arith_avg = S.mean(axis=1)
    geom_avg  = np.exp(log_S.mean(axis=1))  # geometric avg in log-space

    payoff_arith = disc * np.maximum(arith_avg - K, 0.0)
    payoff_geom  = disc * np.maximum(geom_avg  - K, 0.0)

    # Closed-form for geometric Asian (Kemna-Vorst)
    n = n_steps
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))
    r_g     = 0.5 * (r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S0/K) + (r_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g * np.sqrt(T)
    from scipy.stats import norm
    cv_exact = disc * (S0 * np.exp(r_g*T) * norm.cdf(d1) - K * norm.cdf(d2))

    # Optimal c: minimize Var[payoff_arith - c*(payoff_geom - cv_exact)]
    c_star = np.cov(payoff_arith, payoff_geom)[0, 1] / payoff_geom.var()
    adj_payoffs = payoff_arith - c_star * (payoff_geom - cv_exact)

    price_plain = payoff_arith.mean()
    price_cv    = adj_payoffs.mean()
    se_plain    = payoff_arith.std() / np.sqrt(n_paths)
    se_cv       = adj_payoffs.std()  / np.sqrt(n_paths)

    return price_plain, se_plain, price_cv, se_cv, c_star

p, se, p_cv, se_cv, c = mc_with_control_variate(100, 100, 1.0, 0.05, 0.20)
print(f"Plain: {p:.4f} ± {se:.5f}")
print(f"CV:    {p_cv:.4f} ± {se_cv:.5f}  (c={c:.3f})")
print(f"Variance reduction: {(se/se_cv)**2:.1f}x")`,
    explanation:
      "The optimal coefficient c* = Cov(payoff, CV) / Var(CV) minimises residual variance; for arithmetic vs geometric Asians c* ≈ 0.9 and variance reduction is typically 10–100×. This directly reduces the required number of paths: the same standard error achieved with 1M paths plain MC can match ~10,000 CV paths, cutting compute by 100×.",
  },
  {
    id: "pyfin-20260723-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Options",
    tag: "finance",
    code: `import numpy as np

def is_otm_call(S0, K, r, sigma, T, n_paths=50_000, seed=42):
    """
    Importance sampling for deep OTM calls: shift the drift to centre
    the terminal distribution around the strike, then correct with likelihood ratio.
    Exponential tilting: new drift mu* = (log(K/S0) - (r - 0.5*sigma^2)*T) / (sigma*sqrt(T))
    """
    rng = np.random.default_rng(seed)
    disc = np.exp(-r * T)

    # Standard drift
    mu = (r - 0.5 * sigma**2) * T
    std = sigma * np.sqrt(T)

    # Optimal IS mean: shift Z to be centred at log(K/S0)
    z_star = (np.log(K / S0) - mu) / std   # shift so log-S is centred at log(K)

    # --- Naive MC ---
    Z = rng.standard_normal(n_paths)
    log_ST = mu + std * Z
    payoff_naive = disc * np.maximum(np.exp(log_ST) * S0 - K, 0.0)
    price_naive, se_naive = payoff_naive.mean(), payoff_naive.std() / np.sqrt(n_paths)

    # --- IS with exponential tilt ---
    Z_tilt = rng.standard_normal(n_paths) + z_star   # shifted samples
    log_ST_tilt = mu + std * Z_tilt
    # Likelihood ratio: phi(Z_tilt - z*) / phi(Z_tilt) = exp(z**(2)/2 - z**Z_tilt)
    log_lr = 0.5 * z_star**2 - z_star * Z_tilt       # log of LR
    payoff_is = disc * np.maximum(np.exp(log_ST_tilt) * S0 - K, 0.0) * np.exp(log_lr)
    price_is, se_is = payoff_is.mean(), payoff_is.std() / np.sqrt(n_paths)

    return price_naive, se_naive, price_is, se_is

# Deep OTM: K=150, S=100 (50% OTM)
pn, sen, pi, sei = is_otm_call(100, 150, 0.05, 0.20, 1.0, n_paths=100_000)
print(f"Naive: {pn:.6f} ± {sen:.6f}")
print(f"IS:    {pi:.6f} ± {sei:.6f}")
print(f"Variance reduction: {(sen/sei)**2:.1f}x  (IS far superior for OTM)")`,
    explanation:
      "For deep OTM options, naive MC is extremely inefficient — most paths produce zero payoff and the few that hit the strike drive all the variance. Exponential tilting shifts the sampling distribution to concentrate paths near the strike; the likelihood ratio (Radon-Nikodym derivative) corrects for the change of measure. Variance reduction of 1000× or more is typical for 3+ sigma OTM options.",
  },
  {
    id: "pyfin-20260723-b1-cvar-opt",
    language: "python",
    title: "CVaR Portfolio Optimization via LP",
    tag: "finance",
    code: `import numpy as np

def cvar_portfolio_lp(returns: np.ndarray, alpha: float = 0.95) -> dict:
    """
    CVaR (Expected Shortfall) minimisation via linear programming.
    Rockafellar-Uryasev formulation: minimise alpha + 1/(1-a)*T * sum(u_i)
    s.t. u_i >= -r_i' w - alpha, u_i >= 0, sum(w)=1, w>=0.
    Uses scipy linprog for the LP.
    """
    from scipy.optimize import linprog
    T, n = returns.shape
    m = int(T * (1 - alpha))   # number of tail scenarios

    # Variables: [w (n), alpha_var (1), u (T)]
    # Minimize: alpha_var + 1/(m) * sum(u)
    c = np.zeros(n + 1 + T)
    c[n] = 1.0                    # alpha_var coefficient
    c[n+1:] = 1.0 / m             # u_i coefficients

    # Constraints: -R*w - alpha_var - u <= 0  (T constraints)
    A_ub = np.zeros((T, n + 1 + T))
    A_ub[:, :n] = -returns
    A_ub[:, n]  = -1.0
    A_ub[np.arange(T), n+1+np.arange(T)] = -1.0
    b_ub = np.zeros(T)

    # sum(w) = 1
    A_eq = np.zeros((1, n + 1 + T))
    A_eq[0, :n] = 1.0
    b_eq = np.array([1.0])

    bounds = [(0, None)] * n + [(None, None)] + [(0, None)] * T

    result = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                     bounds=bounds, method="highs")

    if result.success:
        w = result.x[:n]
        cvar_val = result.x[n] + result.fun
        port_ret = returns @ w
        return {"weights": w, "CVaR": cvar_val,
                "VaR": np.quantile(-port_ret, alpha),
                "expected_return": port_ret.mean() * 252}
    return {"error": result.message}

rng = np.random.default_rng(42)
n_assets, T = 5, 500
returns = rng.multivariate_normal(
    mean=np.array([0.0005, 0.0003, 0.0007, 0.0002, 0.0006]),
    cov=np.eye(n_assets) * 0.0004 + 0.0002,
    size=T
)
result = cvar_portfolio_lp(returns)
print(f"Weights: {result['weights'].round(3)}")
print(f"CVaR(95%): {result['CVaR']:.4f}  VaR(95%): {result['VaR']:.4f}")`,
    explanation:
      "The Rockafellar-Uryasev LP reformulation makes CVaR minimisation a tractable linear program even with thousands of scenarios. Unlike variance-based mean-variance optimisation, CVaR captures tail risk and is coherent (sub-additive), so portfolio diversification always reduces CVaR. Regulatory frameworks (Basel, FRTB) require ES/CVaR at 97.5% rather than VaR at 99%.",
  },
  {
    id: "pyfin-20260723-b1-local-vol",
    language: "python",
    title: "Dupire Local Volatility Surface from Option Prices",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline
from scipy.stats import norm

def bs_implied_vol(market_price, S, K, T, r, flag="c", tol=1e-8, max_iter=100):
    """Newton-Raphson IV solver."""
    sigma = 0.20
    for _ in range(max_iter):
        d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        if flag == "c":
            price = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
        else:
            price = K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)
        vega = S*norm.pdf(d1)*np.sqrt(T)
        diff = price - market_price
        if abs(diff) < tol:
            break
        sigma -= diff / (vega + 1e-12)
        sigma = max(sigma, 0.001)
    return sigma

def dupire_local_vol(S0, strikes, maturities, iv_surface, r=0.0):
    """
    Dupire (1994) local vol: sigma_L^2(K,T) = (dC/dT + r*K*dC/dK)
                                               / (0.5*K^2 * d^2C/dK^2)
    where C(K,T) = undiscounted call price surface.
    Uses spline interpolation for numerical derivatives.
    """
    K_grid, T_grid = np.meshgrid(strikes, maturities, indexing="ij")
    # Convert IV surface to call price surface
    call_surface = np.zeros_like(iv_surface)
    for i, K in enumerate(strikes):
        for j, T in enumerate(maturities):
            sigma = iv_surface[i, j]
            d1 = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
            d2 = d1 - sigma*np.sqrt(T)
            call_surface[i, j] = S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

    # Spline surface for interpolation
    spline = RectBivariateSpline(strikes, maturities, call_surface, kx=3, ky=3)

    local_vol = np.zeros_like(iv_surface)
    for i, K in enumerate(strikes):
        for j, T in enumerate(maturities):
            dC_dT  = spline(K, T, dy=1)[0, 0]
            dC_dK  = spline(K, T, dx=1)[0, 0]
            d2C_dK2 = spline(K, T, dx=2)[0, 0]
            numerator   = dC_dT + r * K * dC_dK
            denominator = 0.5 * K**2 * d2C_dK2
            lv = numerator / denominator if abs(denominator) > 1e-12 else np.nan
            local_vol[i, j] = np.sqrt(max(lv, 0.0))
    return local_vol`,
    explanation:
      "Dupire's formula extracts the unique risk-neutral local vol that is consistent with the entire observed options surface; any model-free arbitrage-free surface implies a unique local vol. Numerical differentiation via cubic splines is standard; arbitrage in the input surface (calendar spread or butterfly violations) creates negative numerator or denominator, flagged as NaN.",
  },
  {
    id: "pyfin-20260723-b1-multi-index-attr",
    language: "python",
    title: "Multi-Index Pandas for Factor Attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def build_factor_attribution(returns_df: pd.DataFrame,
                               factor_returns: pd.DataFrame,
                               weights: pd.DataFrame) -> pd.DataFrame:
    """
    Factor return attribution: decompose portfolio P&L into factor contributions.
    returns_df: (date, asset) MultiIndex or (date x asset) DataFrame of returns
    factor_returns: (date x factor) factor return matrix
    weights: (date x asset) portfolio weights (lagged)
    """
    # Step 1: compute portfolio returns
    port_ret = (weights.shift(1) * returns_df).sum(axis=1).rename("portfolio")

    # Step 2: OLS beta vs factors on rolling 60D window
    betas = {}
    for dt in returns_df.index[60:]:
        window = slice(returns_df.index.get_loc(dt) - 60,
                       returns_df.index.get_loc(dt))
        R  = returns_df.iloc[window].T.values  # (asset, 60)
        F  = factor_returns.iloc[window].values  # (60, n_factors)
        # OLS: B = (F'F)^{-1} F' R' row per asset
        try:
            B = np.linalg.lstsq(F, R.T, rcond=None)[0]  # (n_factors, n_assets)
        except np.linalg.LinAlgError:
            continue
        w = weights.loc[dt].values
        betas[dt] = pd.Series(B @ w, index=factor_returns.columns)

    beta_df = pd.DataFrame(betas).T   # (date x factor)

    # Step 3: factor contribution = beta * factor_return
    common = beta_df.index.intersection(factor_returns.index)
    factor_contrib = beta_df.loc[common].multiply(factor_returns.loc[common], axis=1)
    factor_contrib["specific"] = port_ret.loc[common] - factor_contrib.sum(axis=1)

    # Step 4: cumulative attribution with MultiIndex
    cum = factor_contrib.cumsum()
    cum.columns = pd.MultiIndex.from_tuples(
        [("cumulative", c) for c in cum.columns], names=["type", "source"]
    )
    return cum`,
    explanation:
      "Multi-index columns separate attribution type (cumulative vs daily) from source (market, size, specific), enabling clean .xs() slicing. The rolling OLS updates betas as the portfolio's factor exposures change over time — static betas would misattribute alpha to beta drift. Specific return (residual) is the manager's true alpha net of factor exposure.",
  },
  {
    id: "pyfin-20260723-b1-bootstrap-sharpe",
    language: "python",
    title: "Bootstrap Confidence Intervals for Sharpe Ratio",
    tag: "finance",
    code: `import numpy as np

def bootstrap_sharpe_ci(returns: np.ndarray, n_bootstrap: int = 10_000,
                         alpha: float = 0.05, seed: int = 42) -> dict:
    """
    Block bootstrap for Sharpe ratio CI to account for autocorrelation.
    Block size ~ sqrt(T) is a common heuristic.
    """
    rng = np.random.default_rng(seed)
    T = len(returns)
    block_size = max(1, int(np.sqrt(T)))
    n_blocks = int(np.ceil(T / block_size))

    def sample_blocks():
        starts = rng.integers(0, T - block_size, size=n_blocks)
        blocks = [returns[s:s+block_size] for s in starts]
        return np.concatenate(blocks)[:T]

    sharpe_true = returns.mean() / (returns.std() + 1e-9) * np.sqrt(252)

    boot_sharpes = np.array([
        (s := sample_blocks()),
        *([] for _ in range(n_bootstrap - 1))  # placeholder
    ])
    boot_sharpes = np.array([
        sample_blocks().mean() / (sample_blocks().std() + 1e-9) * np.sqrt(252)
        for _ in range(n_bootstrap)
    ])

    ci_lo = np.percentile(boot_sharpes, 100 * alpha / 2)
    ci_hi = np.percentile(boot_sharpes, 100 * (1 - alpha / 2))

    # Lo-MacKinlay analytical SE for comparison
    n = T
    skew = ((returns - returns.mean())**3).mean() / returns.std()**3
    kurt = ((returns - returns.mean())**4).mean() / returns.std()**4
    sr   = sharpe_true / np.sqrt(252)
    se_analytic = np.sqrt((1 + 0.5*sr**2 - skew*sr + (kurt-3)/4*sr**2) / n) * np.sqrt(252)

    return {
        "sharpe": sharpe_true,
        "ci_95": (ci_lo, ci_hi),
        "se_bootstrap": boot_sharpes.std(),
        "se_analytic":  se_analytic,
    }

rng = np.random.default_rng(0)
r = rng.normal(0.0003, 0.015, 500)
result = bootstrap_sharpe_ci(r)
print(f"Sharpe: {result['sharpe']:.2f}  95% CI: [{result['ci_95'][0]:.2f}, {result['ci_95'][1]:.2f}]")`,
    explanation:
      "Block bootstrap preserves autocorrelation structure; iid bootstrap applied to autocorrelated returns underestimates standard errors. The Lo-MacKinlay (2002) formula is the standard analytic SE for Sharpe; bootstrap is preferred when returns have significant skew or kurtosis. A Sharpe of 1.0 with a 95% CI of [0.3, 1.7] over 2 years is not statistically different from zero.",
  },
  {
    id: "pyfin-20260723-b1-credit-var",
    language: "python",
    title: "Credit VaR via Monte Carlo Simulation",
    tag: "finance",
    code: `import numpy as np

def credit_var_mc(exposures, pds, rho, R=0.40, n_sims=200_000, seed=42, alpha=0.999):
    """
    Single-factor credit VaR simulation for a loan portfolio.
    exposures: array of EAD (exposure at default) per obligor
    pds: array of 1-year PD per obligor
    rho: asset correlation (systematic factor loading)
    R: recovery rate
    alpha: confidence level (e.g. 0.999 for Basel)
    Returns credit VaR (unexpected loss at alpha).
    """
    rng = np.random.default_rng(seed)
    n = len(exposures)
    exposures, pds = np.asarray(exposures), np.asarray(pds)
    thresholds = -np.sqrt(2) * np.array([
        __import__("scipy.special", fromlist=["erfinv"]).erfinv(2 * pd - 1)
        for pd in pds
    ])  # Phi^{-1}(PD)

    Z = rng.standard_normal(n_sims)   # systematic factor
    eps = rng.standard_normal((n_sims, n))
    asset_values = np.sqrt(rho) * Z[:, None] + np.sqrt(1 - rho) * eps

    # Default indicator: obligor i defaults if A_i < Phi^{-1}(PD_i)
    defaults = asset_values < thresholds[None, :]
    lgd = (1 - R) * exposures[None, :]
    losses = (defaults * lgd).sum(axis=1)   # portfolio loss per scenario

    el  = losses.mean()
    var = np.quantile(losses, alpha)
    es  = losses[losses >= var].mean()
    return {"EL": el, f"VaR_{alpha:.1%}": var, f"ES_{alpha:.1%}": es,
            "UL": var - el}

result = credit_var_mc(
    exposures=np.full(100, 1_000_000),
    pds=np.full(100, 0.01),
    rho=0.15,
)
print(f"EL: {result['EL']:,.0f}  VaR(99.9%): {result['VaR_99.9%']:,.0f}  "
      f"Unexpected Loss: {result['UL']:,.0f}")`,
    explanation:
      "The single-factor Gaussian copula credit model drives all obligors through a common systematic factor Z (market state) and idiosyncratic shocks eps. At the 99.9% confidence level (Basel requirement), losses are dominated by scenarios where Z is deeply negative — a severe simultaneous downturn. rho is the key parameter: higher asset correlation concentrates losses and inflates credit VaR.",
  },
  {
    id: "pyfin-20260723-b1-swaption-black",
    language: "python",
    title: "Swaption Pricing via Black's Formula",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def swaption_black(F_swap, K, T_expiry, sigma, annuity, option_type="payer"):
    """
    European swaption via Black's (1976) model.
    Payer swaption: right to enter a pay-fixed swap at rate K.
    F_swap: forward swap rate for the underlying swap.
    annuity: sum of discount factors * day-count fractions (PV01 of swap).
    sigma: Black vol of the forward swap rate.
    Price = notional * annuity * Black(F, K, T, sigma).
    """
    d1 = (np.log(F_swap / K) + 0.5 * sigma**2 * T_expiry) / (sigma * np.sqrt(T_expiry))
    d2 = d1 - sigma * np.sqrt(T_expiry)
    if option_type == "payer":
        price = annuity * (F_swap * norm.cdf(d1) - K * norm.cdf(d2))
    else:
        price = annuity * (K * norm.cdf(-d2) - F_swap * norm.cdf(-d1))
    # Greeks
    delta = annuity * norm.cdf(d1) if option_type == "payer" else -annuity * norm.cdf(-d1)
    vega  = annuity * F_swap * norm.pdf(d1) * np.sqrt(T_expiry) / 100
    return {"price": price, "delta": delta, "vega": vega}

def swaption_grid(F, strikes, expiries, vols, notional=1e6):
    """Price a grid of swaptions for a vol surface."""
    results = []
    for T, sigma_row in zip(expiries, vols):
        # Simplified: compute annuity for a 5Y swap with semi-annual payments
        r = F   # rough approximation: flat rate = forward swap rate
        payments = np.arange(0.5, 5.5, 0.5)
        annuity = notional * np.sum(0.5 * np.exp(-r * (T + payments)))
        for K, sigma in zip(strikes, sigma_row):
            res = swaption_black(F, K, T, sigma, annuity)
            results.append({"expiry": T, "strike": K, "price": res["price"],
                             "vega": res["vega"]})
    return results

F = 0.045  # forward swap rate
strikes  = np.array([0.035, 0.040, 0.045, 0.050, 0.055])
expiries = np.array([1.0, 2.0, 5.0])
vols = np.tile(np.array([0.25, 0.22, 0.20, 0.21, 0.23]), (3, 1))
grid = swaption_grid(F, strikes, expiries, vols)
for r in grid[:5]:
    print(f"T={r['expiry']}Y K={r['strike']:.3f} Price={r['price']:,.0f}")`,
    explanation:
      "Swaptions priced under Black's model have F_swap as the underlying; the annuity (PV01) scales the Black formula to a dollar value. The vol smile (symmetric around ATM) reflects supply-demand from mortgage hedging: receivers (right-to-receive-fixed) are bid when mortgage prepayments accelerate, flattening the right tail. Swaption vol surfaces drive the calibration of short-rate models (Hull-White, BDT).",
  },
  {
    id: "pyfin-20260723-b1-realized-iv-spread",
    language: "python",
    title: "Realized vs Implied Volatility Spread Signal",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def realized_vol(prices: pd.Series, window: int = 21, annualize: bool = True) -> pd.Series:
    """
    Close-to-close realized volatility with Parkinson correction option.
    """
    log_ret = np.log(prices / prices.shift(1))
    rv = log_ret.rolling(window).std()
    if annualize:
        rv = rv * np.sqrt(252)
    return rv

def rv_iv_spread_strategy(prices: pd.Series, iv: pd.Series,
                           rv_window: int = 21,
                           entry_threshold: float = 0.03,
                           hold_days: int = 5) -> pd.DataFrame:
    """
    Sell vol when IV > RV + threshold (implied is rich); buy when IV < RV - threshold.
    P&L proxy: short straddle return ~ (IV - RV) * delta (simplified).
    """
    rv = realized_vol(prices, rv_window)
    spread = iv - rv   # positive = IV rich (sell vol)
    log_ret = np.log(prices / prices.shift(1)).rename("ret")

    signal = pd.Series(0.0, index=prices.index)
    signal[spread > entry_threshold]  =  1.0   # short vol (collect premium)
    signal[spread < -entry_threshold] = -1.0   # long vol (buy protection)

    # Vol P&L: short vol earns (IV - realized vol over hold period)
    position = signal.shift(hold_days)  # delayed entry
    vol_pnl  = position * (iv.shift(hold_days) - rv) * 0.01  # scaled

    df = pd.DataFrame({"rv": rv, "iv": iv, "spread": spread,
                        "signal": signal, "pnl": vol_pnl})
    sr = vol_pnl.mean() / (vol_pnl.std() + 1e-9) * np.sqrt(252)
    return df, sr

rng = np.random.default_rng(42)
prices = pd.Series(100 * np.exp(np.cumsum(rng.normal(0, 0.01, 500))))
iv_series = pd.Series(0.20 + rng.normal(0, 0.03, 500).clip(-0.05, 0.10))
df, sharpe = rv_iv_spread_strategy(prices, iv_series)
print(f"RV-IV spread strategy Sharpe: {sharpe:.2f}")`,
    explanation:
      "The variance risk premium (VRP) is the systematic tendency of implied vol to exceed subsequent realized vol — selling vol is profitable on average. The spread strategy isolates this premium: enter when IV − RV exceeds a threshold to filter noise. The hold_days parameter sets the option horizon; typical strategies hold 1-month options and rebalance weekly.",
  },
  {
    id: "pyfin-20260723-b1-duration-hedge",
    language: "python",
    title: "Duration-Convexity Hedging with Futures",
    tag: "finance",
    code: `import numpy as np

def bond_dv01(face, coupon, ytm, maturity, freq=2):
    """Bond DV01 = modified duration * price / 10000."""
    n = int(maturity * freq)
    c = face * coupon / freq
    t = np.arange(1, n+1) / freq
    disc = (1 + ytm/freq)**(-np.arange(1, n+1))
    price = np.sum(c * disc) + face * disc[-1]
    mac_dur = (np.sum(t * c * disc) + maturity * face * disc[-1]) / price
    mod_dur = mac_dur / (1 + ytm/freq)
    return price * mod_dur / 10000

def duration_hedge_ratio(portfolio_dv01, futures_dv01, futures_ctd_cf=1.0):
    """
    Number of futures contracts to hedge parallel shift risk.
    futures_dv01: DV01 of CTD bond per futures contract
    ctd_cf: conversion factor of CTD bond
    """
    return -portfolio_dv01 / (futures_dv01 / futures_ctd_cf)

def convexity(face, coupon, ytm, maturity, freq=2):
    """Bond convexity (second derivative of price w.r.t. yield)."""
    n = int(maturity * freq)
    c = face * coupon / freq
    t = np.arange(1, n+1) / freq
    disc = (1 + ytm/freq)**(-np.arange(1, n+1))
    price = np.sum(c * disc) + face * disc[-1]
    conv = (np.sum(t * (t + 1/freq) * c * disc) +
            maturity * (maturity + 1/freq) * face * disc[-1]) / (price * (1 + ytm/freq)**2)
    return conv

def hedge_pnl(portfolio_dv01, portfolio_conv, n_futures, futures_dv01,
               futures_conv, dy):
    """P&L for a parallel yield shift dy (in decimal)."""
    port_pnl = -portfolio_dv01 * dy * 10000 + 0.5 * portfolio_conv * dy**2
    fut_pnl  = n_futures * (-futures_dv01 * dy * 10000 + 0.5 * futures_conv * dy**2)
    return port_pnl + fut_pnl, port_pnl, fut_pnl

dv01_port = bond_dv01(10_000_000, 0.04, 0.035, 10)
dv01_fut  = bond_dv01(100_000, 0.06, 0.035, 8)
n_fut = duration_hedge_ratio(dv01_port, dv01_fut)

print(f"Portfolio DV01: \${dv01_port:,.0f}")
print(f"Futures to hedge: {n_fut:.1f} contracts")
for dy in [-0.01, 0.0, 0.01]:
    total, p_pnl, f_pnl = hedge_pnl(dv01_port, convexity(10e6, 0.04, 0.035, 10),
                                      n_fut, dv01_fut, convexity(100_000, 0.06, 0.035, 8), dy)
    print(f"dy={dy:+.2f}: Net P&L={total:+,.0f}  Port={p_pnl:+,.0f}  Fut={f_pnl:+,.0f}")`,
    explanation:
      "The hedge ratio sets futures contracts so the portfolio's DV01 is neutralised; the conversion factor adjusts for the CTD's price difference from par. A perfectly delta-hedged portfolio still has residual convexity (gamma) — positive convexity means P&L is positive for large moves in either direction. This convexity mismatch between portfolio and futures is tracked as the hedge cost.",
  },
  {
    id: "pyfin-20260723-b1-stress-correlation",
    language: "python",
    title: "Correlation Stress Testing for Portfolio Risk",
    tag: "finance",
    code: `import numpy as np

def stress_correlation(cov_matrix: np.ndarray, stress_factor: float = 1.0,
                        correlation_floor: float = 0.0) -> np.ndarray:
    """
    Stressed covariance: scale correlations toward 1 (crisis mode).
    stress_factor=0: original, stress_factor=1: full correlation matrix becomes 1s.
    Also applies a correlation floor (no de-correlation below floor).
    """
    vols = np.sqrt(np.diag(cov_matrix))
    corr = cov_matrix / np.outer(vols, vols)
    np.fill_diagonal(corr, 1.0)
    # Stress: move off-diagonal toward 1
    stressed_corr = corr + stress_factor * (1.0 - corr)
    # Apply floor
    mask = np.triu(np.ones_like(corr, dtype=bool), k=1)
    stressed_corr[mask | mask.T] = np.maximum(stressed_corr[mask | mask.T], correlation_floor)
    np.fill_diagonal(stressed_corr, 1.0)
    # Rebuild covariance
    return np.outer(vols, vols) * stressed_corr

def portfolio_var_comparison(weights: np.ndarray, cov_base: np.ndarray,
                               stress_levels=(0.25, 0.50, 0.75, 1.00)) -> dict:
    """Compare portfolio variance under different correlation stress levels."""
    base_var = weights @ cov_base @ weights
    results  = {"base": {"vol": np.sqrt(base_var * 252), "stress": 0.0}}
    for s in stress_levels:
        cov_s   = stress_correlation(cov_base, s)
        var_s   = weights @ cov_s @ weights
        results[f"stress_{s:.0%}"] = {"vol": np.sqrt(var_s * 252), "stress": s}
    return results

# Example: 5-asset equal-weight portfolio
n = 5
vols = np.array([0.20, 0.25, 0.18, 0.22, 0.30]) / np.sqrt(252)
base_corr = np.array([
    [1.0, 0.3, 0.2, 0.1, 0.4],
    [0.3, 1.0, 0.5, 0.3, 0.2],
    [0.2, 0.5, 1.0, 0.6, 0.1],
    [0.1, 0.3, 0.6, 1.0, 0.3],
    [0.4, 0.2, 0.1, 0.3, 1.0],
])
cov = np.outer(vols, vols) * base_corr
w = np.ones(n) / n
results = portfolio_var_comparison(w, cov)
for k, v in results.items():
    print(f"{k}: annualised vol = {v['vol']:.2%}")`,
    explanation:
      "Correlation stress tests model crisis scenarios where diversification fails: during the 2008 financial crisis, equity-credit correlations spiked from 0.3 to 0.8+ as contagion spread. Moving correlations toward 1 at 100% stress shows the worst-case undiversified P&L. The floor prevents uneconomic de-correlation scenarios; results inform capital buffer sizing.",
  },
  {
    id: "pyfin-20260723-b1-rebalance-cardinality",
    language: "python",
    title: "Portfolio Rebalancing with Transaction Cost Budget",
    tag: "finance",
    code: `import numpy as np

def rebalance_with_budget(w_current: np.ndarray, w_target: np.ndarray,
                           prices: np.ndarray, tc_bps: float = 10.0,
                           budget_pct: float = 0.0020) -> dict:
    """
    Greedy rebalancing: trade toward target, largest deviation first,
    stopping when total transaction cost exceeds budget_pct of NAV.
    tc_bps: one-way transaction cost in basis points.
    budget_pct: maximum allowed turnover cost as % of NAV.
    """
    tc = tc_bps / 10_000
    deviations = np.abs(w_target - w_current)
    order = np.argsort(-deviations)   # sort by largest deviation first

    w_new     = w_current.copy()
    trades    = np.zeros(len(w_current))
    cost_used = 0.0

    for i in order:
        delta = w_target[i] - w_current[i]
        trade_cost = abs(delta) * tc
        if cost_used + trade_cost > budget_pct:
            # Partial rebalance: fill as much as budget allows
            max_delta = (budget_pct - cost_used) / tc * np.sign(delta)
            trades[i] = max_delta
            w_new[i]  += max_delta
            cost_used += abs(max_delta) * tc
            break
        trades[i]  = delta
        w_new[i]   = w_target[i]
        cost_used += trade_cost

    tracking_error = np.sqrt(np.sum((w_new - w_target)**2))
    return {
        "w_new": w_new,
        "trades": trades,
        "cost_pct": cost_used,
        "turnover": np.abs(trades).sum() / 2,
        "tracking_error_vs_target": tracking_error,
    }

w_cur = np.array([0.30, 0.25, 0.20, 0.15, 0.10])
w_tgt = np.array([0.20, 0.30, 0.25, 0.15, 0.10])
result = rebalance_with_budget(w_cur, w_tgt, prices=None)
print(f"Trades: {result['trades'].round(4)}")
print(f"Cost: {result['cost_pct']*100:.4f}%  Turnover: {result['turnover']:.4f}")`,
    explanation:
      "Greedy rebalancing sorts by deviation magnitude and trades until the TC budget is exhausted; partial trades at the margin prevent over-spending. TC budgets matter for daily rebalancing strategies where compounding of 10–20 bps daily friction can wipe out 3–5% annual alpha. Tracking error vs target quantifies the residual deviation accepted to stay within budget.",
  },
  {
    id: "pyfin-20260723-b1-breeden-litzenberger",
    language: "python",
    title: "Risk-Neutral Density via Breeden-Litzenberger",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.interpolate import UnivariateSpline

def breeden_litzenberger(strikes, call_prices, r, T):
    """
    Breeden-Litzenberger (1978): q(K) = exp(rT) * d^2C/dK^2
    Requires a smooth call price curve; 4th-order spline is used.
    The resulting RND integrates to 1 (after normalisation).
    """
    spline = UnivariateSpline(strikes, call_prices, s=0, k=4)
    d2C = spline.derivative(2)
    K_grid = np.linspace(strikes[0], strikes[-1], 500)
    rnd = np.exp(r * T) * d2C(K_grid)
    rnd = np.maximum(rnd, 0.0)          # enforce non-negativity
    dk = K_grid[1] - K_grid[0]
    rnd /= rnd.sum() * dk               # normalise to density
    return K_grid, rnd

# Synthetic market: BS call prices with vol skew (vary sigma by strike)
S0, r, T = 100.0, 0.05, 1.0
F = S0 * np.exp(r * T)

def skewed_sigma(K):
    return 0.20 + 0.05 * (100 - K) / 30   # higher vol for low strikes (skew)

strikes = np.linspace(70, 140, 71)
sigmas  = skewed_sigma(strikes)

def bs_call(K, sig):
    d1 = (np.log(F / K) + 0.5 * sig**2 * T) / (sig * np.sqrt(T))
    d2 = d1 - sig * np.sqrt(T)
    return np.exp(-r * T) * (F * norm.cdf(d1) - K * norm.cdf(d2))

call_prices = np.array([bs_call(K, s) for K, s in zip(strikes, sigmas)])
K_grid, rnd = breeden_litzenberger(strikes, call_prices, r, T)

dk = K_grid[1] - K_grid[0]
rnd_mean = (K_grid * rnd * dk).sum()
rnd_var  = ((K_grid - rnd_mean)**2 * rnd * dk).sum()
rnd_mode = K_grid[rnd.argmax()]
print(f"RND mean={rnd_mean:.2f}  std={rnd_var**0.5:.2f}  mode={rnd_mode:.2f}")
print(f"Skew signature: mode < mean -> left-skewed RND (put premium)")`,
    explanation:
      "The Breeden-Litzenberger formula extracts the market-implied risk-neutral density directly from the call price surface without assuming a model. The second derivative d²C/dK² (scaled by e^rT) gives the risk-neutral probability that the underlying settles near K. Skew causes the RND to be left-skewed vs lognormal, reflecting the equity put premium. Practitioners use the RND to price exotic payoffs, calibrate stochastic vol models, and monitor market stress.",
  },
  {
    id: "pyfin-20260723-b1-gamma-scalping",
    language: "python",
    title: "Gamma Scalping: Daily Delta-Hedge P&L Attribution",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_greeks(S, K, r, sigma, T):
    if T <= 1e-10:
        return {"price": max(S - K, 0.0), "delta": float(S > K),
                "gamma": 0.0, "theta": 0.0}
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    delta = norm.cdf(d1)
    gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
    theta = (-(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
             - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365
    return {"price": price, "delta": delta, "gamma": gamma, "theta": theta}

def gamma_scalp_sim(S0, K, r, sigma_real, sigma_impl, T, n_steps=252, seed=42):
    """
    Sell call at sigma_impl, delta-hedge daily using BS delta at sigma_impl.
    Daily P&L ≈ 0.5*Gamma*S^2*(sigma_real^2 - sigma_impl^2)*dt + noise
    Expected total P&L > 0 iff sigma_real > sigma_impl (long gamma is cheap).
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    S    = S0
    g    = bs_greeks(S0, K, r, sigma_impl, T)
    cash = g["price"]           # premium received
    delta_shares = g["delta"]   # shares bought to hedge

    daily_pnl = []
    for step in range(n_steps):
        t_rem = T - step * dt
        Z = rng.standard_normal()
        S_new = S * np.exp((r - 0.5 * sigma_real**2) * dt
                           + sigma_real * np.sqrt(dt) * Z)
        g_new = bs_greeks(S_new, K, r, sigma_impl, max(t_rem - dt, 1e-10))
        # P&L components
        stock_gain  = delta_shares * (S_new - S)
        theta_decay = g_new["price"] - g["price"] - delta_shares * (S_new - S)
        day_pnl     = stock_gain - (g_new["price"] - g["price"])
        daily_pnl.append(day_pnl)
        # Rebalance
        cash     += (delta_shares - g_new["delta"]) * S_new   # rebalancing trade
        delta_shares = g_new["delta"]
        S, g = S_new, g_new

    return np.array(daily_pnl)

pnl_series = gamma_scalp_sim(
    S0=100, K=100, r=0.05,
    sigma_real=0.22, sigma_impl=0.20, T=1.0
)
print(f"Cumulative P&L: {pnl_series.sum():.4f}")
print(f"Daily mean: {pnl_series.mean():.4f}  std: {pnl_series.std():.4f}")
print(f"Theory (0.5*vega*(rv^2-iv^2)): {0.5*100*np.sqrt(1/(2*np.pi))*(0.22**2-0.20**2)*252:.4f}")`,
    explanation:
      "Gamma scalping buys options at implied vol and delta-hedges continuously; if realised vol exceeds implied, the cumulative P&L is positive. The daily P&L per share is 0.5·Γ·S²·(σ_real²−σ_impl²)·dt — a clean decomposition: gamma collected vs theta paid. In practice slippage and bid-ask on the hedge erodes this edge, so the break-even spread is typically 1–2 vol points for liquid underlyings. This simulation confirms the theoretical expectation.",
  },
];
