import type { Snippet } from "./types";

export const pythonFinanceSnippets20260528B1: Snippet[] = [
  {
    id: "pyfin-20260528-b1-fama-french",
    language: "python",
    title: "Fama-French 3-factor model regression",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def fama_french_3f(asset_returns: pd.Series,
                    ff_factors: pd.DataFrame) -> dict:
    """
    Regress excess asset returns on the FF3 factors:
      R_i - Rf = alpha + beta_mkt*(Rm-Rf) + beta_smb*SMB + beta_hml*HML + eps

    ff_factors must have columns: ['Mkt-RF', 'SMB', 'HML', 'RF']
    (as provided by Ken French's data library).
    """
    common = asset_returns.index.intersection(ff_factors.index)
    r      = asset_returns.loc[common]
    ff     = ff_factors.loc[common]

    excess_r = r - ff['RF']           # excess return over risk-free
    X = sm.add_constant(ff[['Mkt-RF', 'SMB', 'HML']])

    model = sm.OLS(excess_r, X).fit(cov_type='HC3')  # heteroskedasticity-robust SE

    return {
        'alpha':    model.params['const'],
        'beta_mkt': model.params['Mkt-RF'],
        'beta_smb': model.params['SMB'],
        'beta_hml': model.params['HML'],
        't_alpha':  model.tvalues['const'],
        'r2':       model.rsquared,
        'residuals': model.resid,
        'summary':  model.summary(),
    }

# Simulate FF factors and asset returns for demo
rng    = np.random.default_rng(42)
n      = 252 * 5
dates  = pd.date_range('2019-01-01', periods=n, freq='B')

# Simulated FF factors (daily, as fractions not %)
mkt_rf = rng.normal(0.0004, 0.010, n)   # market excess return
smb    = rng.normal(0.0001, 0.005, n)   # small-minus-big
hml    = rng.normal(0.0001, 0.005, n)   # high-minus-low (value)
rf     = np.full(n, 0.04 / 252)         # 4% annual risk-free

# Asset return: value stock with beta_mkt=1.1, beta_hml=0.5, alpha=0.0002
asset_r = 0.0002 + 1.1*mkt_rf + 0.3*smb + 0.5*hml + rng.normal(0, 0.005, n)

ff_df = pd.DataFrame({'Mkt-RF': mkt_rf, 'SMB': smb, 'HML': hml, 'RF': rf},
                      index=dates)
asset_series = pd.Series(asset_r, index=dates, name='ASSET')

result = fama_french_3f(asset_series, ff_df)
print(f"Alpha: {result['alpha']*252*100:.2f}% annualised  t={result['t_alpha']:.2f}")
print(f"Beta_mkt={result['beta_mkt']:.3f}  Beta_smb={result['beta_smb']:.3f}  Beta_hml={result['beta_hml']:.3f}")
print(f"R^2: {result['r2']:.3f}")`,
    explanation:
      "The Fama-French 3-factor model decomposes returns into market beta, size exposure (SMB), and value exposure (HML). An alpha that survives FF3 is harder to attribute to known risk premia than a plain CAPM alpha. HC3 heteroskedasticity-robust standard errors are essential because daily return residuals are fat-tailed and mildly autocorrelated.",
  },
  {
    id: "pyfin-20260528-b1-pca-risk",
    language: "python",
    title: "PCA factor decomposition for equity portfolios",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

def pca_factor_decomposition(returns: pd.DataFrame,
                               n_factors: int = 5) -> dict:
    """
    PCA on the cross-sectional return covariance matrix.
    PC1 is almost always the 'market factor' (highest eigenvalue).
    Subsequent PCs capture sector, style, or country rotations.

    Returns factor returns, loadings, and explained variance.
    """
    scaler = StandardScaler(with_std=False)   # demean but don't scale (use raw vols)
    R = scaler.fit_transform(returns.fillna(0))

    pca = PCA(n_components=n_factors)
    factor_scores = pca.fit_transform(R)         # (T, n_factors): factor returns per day
    loadings      = pca.components_.T            # (N assets, n_factors): factor betas

    factor_df = pd.DataFrame(factor_scores, index=returns.index,
                              columns=[f'PC{i+1}' for i in range(n_factors)])

    explained_var = pca.explained_variance_ratio_

    # Factor return covariance matrix (diagonal in PC space).
    factor_cov = np.diag(pca.explained_variance_)

    # Reconstruct idiosyncratic (residual) returns.
    reconstructed = factor_scores @ pca.components_
    residuals      = R - reconstructed

    # Risk decomposition: % of each stock's variance from systematic vs idiosyncratic.
    total_var    = returns.var(ddof=1)
    sys_var      = pd.Series(
        np.diag(loadings @ factor_cov @ loadings.T),
        index=returns.columns
    )
    idio_var = total_var - sys_var

    return {
        'factors':        factor_df,
        'loadings':       pd.DataFrame(loadings, index=returns.columns,
                                        columns=factor_df.columns),
        'explained_var':  explained_var,
        'factor_cov':     factor_cov,
        'residuals':      pd.DataFrame(residuals, index=returns.index,
                                        columns=returns.columns),
        'r_squared':      sys_var / (sys_var + idio_var),   # systematic R²
    }

# Simulate 10 stocks, 500 days
rng    = np.random.default_rng(42)
n_s, n_t = 10, 500
market   = rng.normal(0, 0.01, n_t)
returns  = pd.DataFrame(
    {f'STK{i}': 0.8*market + rng.normal(0, 0.01*np.sqrt(1-0.64), n_t)
     for i in range(n_s)}
)

res = pca_factor_decomposition(returns, n_factors=3)
print("Explained variance:", np.round(res['explained_var'] * 100, 1), "%")
print("Average systematic R²:", res['r_squared'].mean().round(3))
print("PC1 loadings (market beta proxies):", res['loadings']['PC1'].round(3).tolist())`,
    explanation:
      "The first principal component of the equity covariance matrix is almost universally the 'market factor' and typically explains 30–60% of cross-sectional return variance in a diversified universe. Subsequent PCs often correspond to sector bets or growth vs value tilts. The idiosyncratic residuals — what's left after projecting onto the top factors — are used for stock-specific alpha research and market-neutral portfolio construction.",
  },
  {
    id: "pyfin-20260528-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter pairs trading — dynamic hedge ratio estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def kalman_pairs_filter(y: np.ndarray, x: np.ndarray,
                          delta: float = 1e-5,
                          R_obs: float = 1e-3) -> dict:
    """
    Kalman filter for the state-space model:
      Observation: y_t = [1, x_t] @ theta_t + eps_t   eps ~ N(0, R)
      State:       theta_t = theta_{t-1} + eta_t        eta ~ N(0, Q)

    theta = [alpha, beta] tracks time-varying hedge ratio.
    delta: state transition noise (higher = faster adaptation).
    R_obs: observation noise variance.

    Returns time series of (alpha, beta, spread, spread_zscore).
    """
    n = len(y)
    Q = delta / (1 - delta) * np.eye(2)   # state noise covariance

    # Kalman state: theta = [alpha, beta]
    theta = np.zeros((n, 2))
    P_t   = np.zeros((n, 2, 2))   # state covariance

    # Initialise
    theta[0] = [0.0, 1.0]           # start with beta = 1 (equal weight)
    P_t[0]   = np.eye(2) * 10.0    # diffuse prior

    spreads = np.zeros(n)

    for t in range(1, n):
        H = np.array([[1.0, x[t]]])   # observation matrix

        # Predict
        theta_pred = theta[t-1]
        P_pred     = P_t[t-1] + Q

        # Innovation
        y_pred  = (H @ theta_pred).item()
        nu_t    = y[t] - y_pred
        S_t     = (H @ P_pred @ H.T + R_obs).item()

        # Kalman gain
        K_t = (P_pred @ H.T / S_t)   # (2,1)

        # Update
        theta[t] = theta_pred + K_t.ravel() * nu_t
        P_t[t]   = P_pred - K_t * H @ P_pred

        spreads[t] = nu_t   # innovation = spread from kalman perspective

    # Z-score of the spread using rolling std of the spread innovations
    window = 30
    spread_series = pd.Series(spreads)
    z = (spread_series - spread_series.rolling(window).mean()) \
        / spread_series.rolling(window).std()

    return {
        'alpha':    theta[:, 0],
        'beta':     theta[:, 1],
        'spread':   spreads,
        'zscore':   z.values,
    }

# Demo: cointegrated pair with drifting beta
rng = np.random.default_rng(42)
n   = 1000
x   = np.cumsum(rng.normal(0, 1, n))           # random walk
beta_true = 0.8 + 0.0005 * np.arange(n)        # slowly drifting beta
y   = beta_true * x + 0.5 * np.cumsum(rng.normal(0, 0.1, n))

res = kalman_pairs_filter(y, x, delta=5e-5, R_obs=0.1)
print(f"Final beta estimate: {res['beta'][-1]:.3f}  (true: {beta_true[-1]:.3f})")
print(f"Non-NaN z-scores >= 2: {(np.abs(res['zscore'][30:]) >= 2).sum()} entry signals")`,
    explanation:
      "The Kalman filter is the optimal Bayesian updater for a linear state-space model: it tracks a time-varying hedge ratio that a static OLS regression would miss. The `delta` parameter controls mean reversion speed of beta — higher values let the filter adapt faster to structural breaks but increase noise sensitivity. A z-score of the spread innovations (not raw levels) is the correct entry signal because it accounts for the changing uncertainty in the hedge ratio estimate.",
  },
  {
    id: "pyfin-20260528-b1-sabr",
    language: "python",
    title: "SABR model — Hagan approximation and calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F: float, K: float, T: float,
              alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan et al. (2002) SABR implied vol approximation.
    F: forward price, K: strike, T: expiry.
    alpha: initial vol, beta: CEV exponent [0,1], rho: corr, nu: vol-of-vol.
    """
    if abs(F - K) < 1e-10:
        # ATM approximation
        FK_mid = F ** (1 - beta)
        return alpha / FK_mid * (
            1 + ((1 - beta)**2 / 24 * alpha**2 / FK_mid**2
                 + 0.25 * rho * beta * nu * alpha / FK_mid
                 + (2 - 3*rho**2) / 24 * nu**2) * T
        )

    log_FK  = np.log(F / K)
    FK_beta = (F * K) ** ((1 - beta) / 2)

    z       = nu / alpha * FK_beta * log_FK
    chi_z   = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    num_1   = alpha
    num_2   = 1 + ((1 - beta)**2 / 24 * alpha**2 / FK_beta**2
                   + 0.25 * rho * beta * nu * alpha / FK_beta
                   + (2 - 3*rho**2) / 24 * nu**2) * T

    denom_1 = FK_beta
    denom_2 = (1 + (1 - beta)**2 / 24 * log_FK**2
                 + (1 - beta)**4 / 1920 * log_FK**4)

    return num_1 / denom_1 / denom_2 * (z / chi_z) * num_2


def calibrate_sabr(F: float, T: float, strikes: np.ndarray,
                    market_vols: np.ndarray,
                    beta: float = 0.5) -> dict:
    """
    Fit SABR (alpha, rho, nu) for fixed beta via least squares.
    beta is usually fixed externally (0 = normal, 0.5 = CIR, 1 = log-normal).
    """
    def objective(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e10
        model_vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu)
                                for K in strikes])
        return np.sum((model_vols - market_vols)**2) * 1e6

    res = minimize(objective, x0=[0.20, -0.30, 0.40],
                   method='Nelder-Mead',
                   options={'xatol': 1e-7, 'fatol': 1e-7, 'maxiter': 5000})
    alpha, rho, nu = res.x

    model_vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu)
                            for K in strikes])
    return {'alpha': alpha, 'rho': rho, 'nu': nu, 'beta': beta,
            'rmse': np.sqrt(np.mean((model_vols - market_vols)**2)),
            'model_vols': model_vols}


# EUR/USD swaption smile: F=5%, 5Y expiry, market vols (normal basis)
F = 0.05; T = 5.0
strikes = np.array([0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08])
market_vols = np.array([0.28, 0.24, 0.21, 0.20, 0.21, 0.23, 0.26])   # vol smile

res = calibrate_sabr(F, T, strikes, market_vols, beta=0.5)
print(f"SABR fit: alpha={res['alpha']:.4f}  rho={res['rho']:.4f}  nu={res['nu']:.4f}")
print(f"RMSE: {res['rmse']*100:.3f} vol points")
for K, mv, sv in zip(strikes, market_vols, res['model_vols']):
    print(f"  K={K:.2f}  mkt={mv:.4f}  SABR={sv:.4f}")`,
    explanation:
      "SABR is the industry-standard smile model for interest rate derivatives (swaptions, caps) because its parameters have intuitive economic interpretations: alpha is the initial vol level, beta controls the vol backbone (0=normal, 1=log-normal), rho captures the leverage effect (negative for rates in upward-sloping curves), and nu is vol-of-vol (controls smile curvature). Beta is typically fixed from empirical analysis rather than calibrated, because the data cannot distinguish between beta and alpha simultaneously.",
  },
  {
    id: "pyfin-20260528-b1-dupire",
    language: "python",
    title: "Dupire local vol surface from call prices",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(strikes: np.ndarray, maturities: np.ndarray,
                      call_prices: np.ndarray,
                      S0: float, r: float, q: float = 0.0) -> np.ndarray:
    """
    Dupire (1994) local volatility surface from observed call prices C(K, T).
    The local vol sigma(K, T) satisfies:
      sigma^2(K,T) = [dC/dT + (r-q)*K*dC/dK + q*C] /
                     [0.5 * K^2 * d^2C/dK^2]

    Numerically sensitive: requires a smooth, arbitrage-free call surface.
    Uses spline interpolation for the partial derivatives.

    Returns local_vol array of shape (len(maturities), len(strikes)).
    """
    # Fit a smooth surface via 2D spline.
    # calls[i,j] = C(K=strikes[j], T=maturities[i])
    spline = RectBivariateSpline(maturities, strikes, call_prices, kx=3, ky=3)

    n_T = len(maturities)
    n_K = len(strikes)
    local_vol = np.zeros((n_T, n_K))

    for i, T in enumerate(maturities):
        for j, K in enumerate(strikes):
            C   = float(spline(T, K))
            dCdT  = float(spline(T, K, dx=1, dy=0))   # derivative in T direction
            dCdK  = float(spline(T, K, dx=0, dy=1))   # first K-derivative
            d2CdK2 = float(spline(T, K, dx=0, dy=2))  # second K-derivative

            numerator   = dCdT + (r - q) * K * dCdK + q * C
            denominator = 0.5 * K**2 * d2CdK2

            if denominator < 1e-10 or numerator < 0:
                local_vol[i, j] = np.nan
            else:
                local_vol[i, j] = np.sqrt(numerator / denominator)

    return local_vol


# Generate a smooth synthetic call surface from BS with a smile
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

S0 = 100.0; r = 0.05
strikes    = np.linspace(70, 130, 20)
maturities = np.linspace(0.25, 3.0, 10)

# Implied vol with a smile: sigma(K,T) = 0.20 + 0.05*(log(K/S0))^2 - 0.01*sqrt(T)
calls = np.array([
    [bs_call(S0, K, r, 0.20 + 0.05*(np.log(K/S0))**2 - 0.01*np.sqrt(T), T)
     for K in strikes]
    for T in maturities
])

lv = dupire_local_vol(strikes, maturities, calls, S0, r)
print(f"Local vol at ATM (K=100), 1Y: {lv[3, 9]:.4f}")
print(f"Local vol at OTM (K=130), 1Y: {lv[3, -1]:.4f}")`,
    explanation:
      "Dupire's formula converts implied vol smiles (cross-section of option prices by strike/maturity) into a local vol surface — a deterministic function σ(S,t) that matches all vanilla prices exactly. The local vol surface is often smoother than the implied vol surface because it removes redundant information. In practice, numerical differentiation of market prices is noisy and requires regularisation; practitioners use parametric interpolation (SVI, SSVI) before applying Dupire.",
  },
  {
    id: "pyfin-20260528-b1-heston-mc",
    language: "python",
    title: "Heston stochastic volatility model — Euler-Maruyama MC",
    tag: "finance",
    code: `import numpy as np

def heston_mc(S0: float, K: float, r: float, T: float,
               kappa: float, theta: float, xi: float,
               rho: float, v0: float,
               n_paths: int = 50000, n_steps: int = 252,
               seed: int = 42) -> dict:
    """
    Heston (1993) model:
      dS = r*S*dt + sqrt(v)*S*dW1
      dv = kappa*(theta - v)*dt + xi*sqrt(v)*dW2
      corr(dW1, dW2) = rho

    Full truncation scheme: v = max(v, 0) to avoid negative variance.
    Returns European call price and variance path statistics.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps

    # Correlated Brownian increments via Cholesky
    L = np.array([[1.0, 0.0], [rho, np.sqrt(1 - rho**2)]])

    S = np.full(n_paths, S0, dtype=float)
    v = np.full(n_paths, v0, dtype=float)

    var_paths = np.zeros((n_steps + 1, n_paths))
    var_paths[0] = v

    for i in range(n_steps):
        Z = rng.standard_normal((2, n_paths))
        dW = (L @ Z) * np.sqrt(dt)       # correlated pair

        v_pos = np.maximum(v, 0.0)       # full truncation scheme

        dS = r * S * dt + np.sqrt(v_pos) * S * dW[0]
        dv = kappa * (theta - v_pos) * dt + xi * np.sqrt(v_pos) * dW[1]

        S += dS
        v += dv
        var_paths[i+1] = v

    payoff = np.maximum(S - K, 0.0)
    price  = np.exp(-r * T) * payoff.mean()
    se     = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)

    # Realised variance as time-average of v
    realised_var = var_paths.mean(axis=0).mean()

    return {
        'price':        price,
        'std_error':    se,
        'realised_var': realised_var,
        'implied_vol':  np.sqrt(theta),   # long-run vol
    }


# Typical Heston calibration for an equity index
# kappa=2 (fast reversion), theta=0.04 (20% long-run vol),
# xi=0.5 (moderate vol-of-vol), rho=-0.7 (negative leverage), v0=0.04
result = heston_mc(
    S0=100, K=100, r=0.05, T=1.0,
    kappa=2.0, theta=0.04, xi=0.5, rho=-0.70, v0=0.04,
    n_paths=100000, n_steps=252
)
print(f"Heston call price: {result['price']:.4f}  +/- {result['std_error']:.4f}")
print(f"Realised variance: {result['realised_var']:.4f}  (theta={0.04})")`,
    explanation:
      "The Heston model captures two empirical features that Black-Scholes misses: mean-reverting variance clustering (kappa, theta) and a negative correlation between spot and vol (rho ≈ −0.7 for equity indices — the leverage effect). Full truncation (max(v, 0)) is the simplest fix for negative variance in Euler discretisation; the Andersen QE scheme (see yesterday's batch) is more accurate for large time steps.",
  },
  {
    id: "pyfin-20260528-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory — GPD tail fitting via MLE",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import genpareto

def fit_gpd_mle(exceedances: np.ndarray) -> tuple[float, float]:
    """
    Fit Generalized Pareto Distribution (GPD) to exceedances above a threshold u
    via Maximum Likelihood Estimation.
    GPD PDF: g(y; xi, sigma) = (1/sigma) * (1 + xi*y/sigma)^(-(1+1/xi))
    xi > 0: heavy tail (Pareto family); xi = 0: exponential; xi < 0: bounded tail.
    """
    def neg_log_lik(params):
        xi, sigma = params
        if sigma <= 0:
            return 1e10
        y = exceedances
        if xi != 0:
            if np.any(1 + xi * y / sigma <= 0):
                return 1e10
            ll = -len(y) * np.log(sigma) \
                 - (1 + 1/xi) * np.sum(np.log(1 + xi * y / sigma))
        else:
            ll = -len(y) * np.log(sigma) - np.sum(y) / sigma
        return -ll

    # Initial estimate: method of moments
    m1 = exceedances.mean()
    m2 = exceedances.var()
    xi0 = 0.5 * (m1**2 / m2 - 1)
    s0  = 0.5 * m1 * (m1**2 / m2 + 1)

    res = minimize(neg_log_lik, [xi0, max(s0, 1e-6)], method='Nelder-Mead')
    xi, sigma = res.x
    return xi, sigma


def evt_var_es(returns: np.ndarray, confidence: float = 0.99,
                threshold_pct: float = 0.90) -> dict:
    """
    POT (Peaks Over Threshold) approach:
    1. Choose threshold u at threshold_pct empirical quantile of losses.
    2. Fit GPD to exceedances above u.
    3. Extrapolate VaR and ES at confidence level.
    """
    losses   = -returns                         # sign flip: work with losses
    u        = np.quantile(losses, threshold_pct)
    exceed   = losses[losses > u] - u          # exceedances above threshold
    Nu       = len(exceed)                      # number of exceedances
    n        = len(losses)

    xi, sigma = fit_gpd_mle(exceed)

    # VaR extrapolation: q(alpha) = u + sigma/xi * ((n/Nu * (1-alpha))^(-xi) - 1)
    if abs(xi) < 1e-8:
        var = u + sigma * np.log(n / (Nu * (1 - confidence)))
    else:
        var = u + sigma / xi * ((n / Nu * (1 - confidence))**(-xi) - 1)

    # Expected Shortfall: ES = VaR/(1-xi) + (sigma - xi*u)/(1-xi)
    if xi < 1.0:
        es = (var + sigma - xi * u) / (1 - xi)
    else:
        es = np.inf

    # Benchmark: historical ES for comparison
    hist_var = np.quantile(losses, confidence)
    hist_es  = losses[losses > hist_var].mean()

    return {'xi': xi, 'sigma': sigma, 'threshold': u,
            'n_exceed': Nu, 'evt_var': var, 'evt_es': es,
            'hist_var': hist_var, 'hist_es': hist_es}


rng = np.random.default_rng(42)
# Fat-tailed returns (Student-t with 3 dof)
returns = np.random.standard_t(df=3, size=2520) * 0.01

res = evt_var_es(returns, confidence=0.99)
print(f"GPD xi={res['xi']:.3f} (>0 = heavy tail)  sigma={res['sigma']:.4f}")
print(f"EVT VaR(99%): {res['evt_var']*100:.2f}%  Historical: {res['hist_var']*100:.2f}%")
print(f"EVT ES(99%):  {res['evt_es']*100:.2f}%  Historical: {res['hist_es']*100:.2f}%")`,
    explanation:
      "EVT/GPD estimates tail risk more accurately than parametric VaR for fat-tailed return distributions by explicitly fitting the tail rather than assuming normality throughout. The shape parameter xi > 0 indicates a Pareto-type heavy tail — a critical finding for any strategy with substantial tail exposure. The 99% EVT VaR is typically 20–50% higher than Gaussian VaR for equity strategies, which explains why regulators mandate extreme stress tests alongside standard VaR.",
  },
  {
    id: "pyfin-20260528-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula — joint default simulation for credit portfolios",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_sample(n_paths: int, correlation: np.ndarray,
                             pd_vector: np.ndarray,
                             seed: int = 42) -> np.ndarray:
    """
    Gaussian copula simulation for n assets with given pair-wise correlations.
    1. Draw Z ~ N(0, Sigma) using Cholesky decomposition.
    2. Convert to uniform marginals: U = Phi(Z).
    3. Apply each asset's marginal distribution via quantile transform.
       For default simulation: default if U_i < PD_i (Bernoulli marginal).

    Returns (n_paths, n_assets) boolean array: True = default.
    """
    rng  = np.random.default_rng(seed)
    n    = len(pd_vector)
    L    = np.linalg.cholesky(correlation)            # Cholesky of Sigma

    # Draw correlated standard normals
    Z    = rng.standard_normal((n_paths, n))
    Z_corr = (L @ Z.T).T                              # (n_paths, n)

    # Convert to uniform marginals via standard normal CDF
    U    = norm.cdf(Z_corr)                           # (n_paths, n)

    # Default indicator: default if U_i < PD_i
    defaults = U < pd_vector[np.newaxis, :]            # broadcast PD vector

    return defaults


def cdo_tranche_loss(defaults: np.ndarray, lgd_vector: np.ndarray,
                      notionals: np.ndarray,
                      attachment: float, detachment: float) -> np.ndarray:
    """
    Compute CDO tranche losses given a default simulation.
    Tranche bears losses in [attachment, detachment] of the total pool.
    """
    total_notional = notionals.sum()

    # Portfolio loss per scenario (as fraction of total notional)
    loss_per_path = (defaults * lgd_vector * notionals).sum(axis=1) / total_notional

    # Tranche absorbs losses between attachment and detachment points
    tranche_size = detachment - attachment
    tranche_loss = np.clip(loss_per_path - attachment, 0, tranche_size)

    return tranche_loss / tranche_size   # normalise to tranche notional


# 5-asset correlated credit portfolio (e.g., same sector)
n_assets = 5
rho      = 0.40   # intra-sector correlation
corr     = np.full((n_assets, n_assets), rho)
np.fill_diagonal(corr, 1.0)

pd_vec       = np.array([0.02, 0.03, 0.02, 0.05, 0.04])   # annual PD per issuer
lgd          = np.full(n_assets, 0.60)                      # 60% loss given default
notionals    = np.array([10e6, 15e6, 12e6, 8e6, 10e6])

n_paths = 100000
defaults = gaussian_copula_sample(n_paths, corr, pd_vec)

# Equity tranche: 0-5%; Mezzanine: 5-20%
eq_loss  = cdo_tranche_loss(defaults, lgd, notionals, 0.00, 0.05)
mez_loss = cdo_tranche_loss(defaults, lgd, notionals, 0.05, 0.20)

print(f"Expected pool loss: {(defaults * lgd).mean(axis=0) @ notionals / notionals.sum() * 100:.2f}%")
print(f"Equity  E[loss]:   {eq_loss.mean()*100:.2f}%  std={eq_loss.std()*100:.2f}%")
print(f"Mezzanine E[loss]: {mez_loss.mean()*100:.2f}%  std={mez_loss.std()*100:.2f}%")`,
    explanation:
      "The Gaussian copula became infamous during the 2008 financial crisis because it underestimated the probability of simultaneous defaults in a correlated credit portfolio — it modelled correlation through normal marginals, which have thin joint tails. The equity tranche absorbs the first losses and is extremely sensitive to correlation (higher rho = higher equity loss); the senior tranche is only hit by catastrophic joint defaults and behaves more like the portfolio mean loss. The t-copula with heavy-tailed marginals gives materially different (higher) joint tail probabilities.",
  },
  {
    id: "pyfin-20260528-b1-kelly-multiasset",
    language: "python",
    title: "Multi-asset Kelly criterion via quadratic program",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def kelly_continuous(mu: np.ndarray, Sigma: np.ndarray,
                      r_f: float = 0.0,
                      max_leverage: float = 3.0) -> dict:
    """
    Continuous-time Kelly criterion: maximise E[log W].
    For log-normal assets: f* = Sigma^{-1} * (mu - r_f)
    This is equivalent to the Merton (1969) portfolio problem.

    max  mu^T w - r_f - 0.5 * w^T Sigma w
    s.t. sum(|w_i|) <= max_leverage
         w >= -1.0   (at most 100% short any single asset)

    Returns optimal weights, expected growth rate, and Sharpe.
    """
    n = len(mu)
    w = cp.Variable(n)

    # Kelly growth rate = E[return] - 0.5 * variance
    excess_return = mu @ w - r_f
    portfolio_var = cp.quad_form(w, Sigma)
    growth_rate   = excess_return - 0.5 * portfolio_var

    constraints = [
        cp.sum(cp.abs(w)) <= max_leverage,  # leverage constraint
        w >= -1.0,                           # max 100% short
    ]

    prob = cp.Problem(cp.Maximize(growth_rate), constraints)
    prob.solve(solver=cp.CLARABEL, verbose=False)

    if prob.status not in ['optimal', 'optimal_inaccurate']:
        return {'weights': np.ones(n) / n}

    w_opt = np.array(w.value)
    port_vol = float(np.sqrt(w_opt @ Sigma @ w_opt))
    port_ret = float(mu @ w_opt)
    sharpe   = (port_ret - r_f) / port_vol if port_vol > 0 else 0.0

    # Unconstrained Kelly for comparison (Sigma^{-1} * excess_mu)
    unconstrained = np.linalg.solve(Sigma, mu - r_f)

    return {
        'weights':       w_opt,
        'leverage':      np.abs(w_opt).sum(),
        'growth_rate':   float(growth_rate.value),
        'port_return':   port_ret,
        'port_vol':      port_vol,
        'sharpe':        sharpe,
        'unconstrained': unconstrained,   # full Kelly (may be very leveraged)
    }


# 4-asset universe
mu    = np.array([0.10, 0.07, 0.12, 0.06])   # annual expected returns
sigma = np.array([0.20, 0.15, 0.25, 0.10])   # annual vols
corr  = np.array([
    [1.00, 0.40, 0.50, 0.10],
    [0.40, 1.00, 0.30, 0.20],
    [0.50, 0.30, 1.00, 0.15],
    [0.10, 0.20, 0.15, 1.00],
])
Sigma = np.outer(sigma, sigma) * corr

for lev in [1.0, 2.0, 3.0]:
    res = kelly_continuous(mu, Sigma, r_f=0.05, max_leverage=lev)
    print(f"Max lev {lev:.0f}x:  weights={np.round(res['weights'],2)}  "
          f"Sharpe={res['sharpe']:.2f}  growth={res['growth_rate']*100:.2f}%")`,
    explanation:
      "The multi-asset Kelly criterion is equivalent to Merton's continuous-time portfolio: the unconstrained optimum is Σ⁻¹·(μ − r_f), which concentrates aggressively in high-Sharpe strategies and can exceed 10× leverage. In practice, a leverage constraint converts the unconstrained solution into an SOCP, providing a principled shrinkage toward lower risk. The optimal constrained Kelly weights are the highest geometric growth achievable within the leverage budget.",
  },
  {
    id: "pyfin-20260528-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal execution — VWAP trajectory",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss(X: float, T: float, N: int,
                    sigma: float, eta: float,
                    lam: float = 0.0,
                    gamma: float = 0.0) -> dict:
    """
    Almgren-Chriss (2001) optimal liquidation of X shares over T days.

    Parameters:
      X:     total shares to sell (positive = sell)
      T:     total liquidation time (days)
      N:     number of trading intervals
      sigma: daily stock vol (as a fraction of price)
      eta:   temporary market impact coefficient (linear impact per share)
      lam:   risk aversion (0 = VWAP; higher = faster execution)
      gamma: permanent impact coefficient

    Returns the optimal trade list and expected cost.
    The trajectory x_k = X * sinh(kappa*(T-t_k)) / sinh(kappa*T)
    where kappa = sqrt(lam / eta) controls front-loading.
    """
    dt  = T / N
    kappa = np.sqrt(lam / (eta + 1e-15)) if lam > 0 else 0.0

    times  = np.linspace(0, T, N + 1)
    if kappa > 1e-9:
        # Risk-averse: front-load (sell more early to reduce vol exposure)
        x_t = X * np.sinh(kappa * (T - times)) / np.sinh(kappa * T)
    else:
        # Risk-neutral (lam=0): constant rate = VWAP trajectory
        x_t = X * (1 - times / T)

    # Trade sizes per interval
    trades = -np.diff(x_t)   # shares sold in each interval

    # Temporary impact cost: eta * trade_rate^2 * dt per interval
    trade_rate    = trades / dt
    temp_impact   = eta * np.sum(trade_rate**2 * dt)

    # Permanent impact: (gamma/2) * sum(trades^2) (price walks permanently)
    perm_impact   = gamma / 2 * np.sum(trades**2)

    # Expected shortfall vs arrival price
    expected_cost = 0.5 * gamma * X**2 + temp_impact

    # Variance of execution cost
    cost_variance = sigma**2 * np.sum(x_t[:-1]**2 * dt)

    # Efficient frontier: expected_cost vs sqrt(cost_variance)
    return {
        'holdings':       x_t,
        'trades':         trades,
        'times':          times,
        'expected_cost':  expected_cost,
        'cost_std':       np.sqrt(cost_variance),
        'participation':  trades / (X / N),   # pct of uniform schedule
    }


def efficient_frontier(X, T, N, sigma, eta, lam_range):
    """Trace the Almgren-Chriss efficient frontier."""
    results = [almgren_chriss(X, T, N, sigma, eta, lam) for lam in lam_range]
    return {
        'cost':   np.array([r['expected_cost'] for r in results]),
        'vol':    np.array([r['cost_std']      for r in results]),
        'lambda': lam_range,
    }

# Sell 1M shares over 5 days, 20% daily vol, eta=0.01 ($/share^2 impact)
X, T, N = 1_000_000, 5.0, 5
sigma, eta = 0.20 / 252, 0.0001

print("Strategy         Holdings: D1    D2    D3    D4    D5")
for lam, label in [(0.0, 'VWAP (lam=0)'), (1e-6, 'Risk-averse')]:
    r = almgren_chriss(X, T, N, sigma, eta, lam=lam)
    h = r['holdings'][1:]
    print(f"{label:<20} {h[0]/1e6:.2f}M  {h[1]/1e6:.2f}M  {h[2]/1e6:.2f}M  "
          f"{h[3]/1e6:.2f}M  {h[4]/1e6:.2f}M")`,
    explanation:
      "Almgren-Chriss shows the fundamental trade-off in optimal execution: selling too fast incurs high temporary impact; selling too slowly exposes the position to adverse price moves. The kappa parameter κ = √(λ/η) sets how aggressively to front-load: κ → 0 gives equal-rate VWAP, κ → ∞ gives immediate liquidation. In practice η is calibrated from real-time market impact regression (|Δprice| vs trade size / ADV).",
  },
  {
    id: "pyfin-20260528-b1-bond-duration",
    language: "python",
    title: "Bond duration, modified duration, convexity and price sensitivity",
    tag: "finance",
    code: `import numpy as np

def bond_analytics(coupon: float, ytm: float, maturity: float,
                    face: float = 100.0, freq: int = 2) -> dict:
    """
    Compute full set of bond analytics for a fixed-rate bond.
    coupon: annual coupon rate (fraction)
    ytm:    yield to maturity (fraction)
    freq:   coupon frequency per year (2 = semi-annual)
    """
    n      = int(round(maturity * freq))
    y      = ytm / freq
    c      = coupon / freq * face
    times  = np.arange(1, n + 1) / freq    # cash flow times in years

    # Cash flows: coupons + face at maturity
    cf = np.full(n, c)
    cf[-1] += face

    # Discount factors
    dfs = 1.0 / (1 + y) ** np.arange(1, n + 1)

    # Present value of each cash flow
    pv = cf * dfs
    price = pv.sum()

    # Macaulay duration: weighted average time of cash flows
    mac_dur = np.sum(times * pv) / price

    # Modified duration: price sensitivity to yield change
    mod_dur = mac_dur / (1 + y)

    # Convexity: second-order price sensitivity
    convexity = np.sum(times * (times + 1/freq) * pv) / (price * (1 + y)**2)

    # DV01: dollar value of 1 basis point (parallel shift)
    dv01 = mod_dur * price / 10000.0    # in $ per $face

    # Price-yield scenarios (full repricing)
    def reprice(shift_bps):
        ytm_new = ytm + shift_bps / 10000.0
        y_new   = ytm_new / freq
        dfs_new = 1.0 / (1 + y_new) ** np.arange(1, n + 1)
        return (cf * dfs_new).sum()

    p_plus  = reprice(+100)
    p_minus = reprice(-100)

    # Verify convexity approximation: delta_P / P approx -mod_dur*dy + 0.5*convexity*dy^2
    dy = 0.01   # 100 bps
    price_approx = price * (1 - mod_dur * dy + 0.5 * convexity * dy**2)

    return {
        'price':        price,
        'mac_duration': mac_dur,
        'mod_duration': mod_dur,
        'convexity':    convexity,
        'dv01':         dv01,
        'p_ytm_p100':  p_plus,    # price if ytm +100bps
        'p_ytm_m100':  p_minus,   # price if ytm -100bps
        'price_approx_p100': price_approx,
        'convexity_pnl': 0.5 * convexity * dy**2 * price,  # convexity gain
    }

# 10-year 5% bond at par (ytm = 5%)
bond = bond_analytics(coupon=0.05, ytm=0.05, maturity=10.0)
print(f"Price:         {bond['price']:.4f}")
print(f"Mac Duration:  {bond['mac_duration']:.4f} years")
print(f"Mod Duration:  {bond['mod_duration']:.4f}")
print(f"Convexity:     {bond['convexity']:.4f}")
print(f"DV01:          {bond['dv01']:.4f} per 100 face")
print(f"+100bps price: {bond['p_ytm_p100']:.4f}  (approx {bond['price_approx_p100']:.4f})")
print(f"Convexity PnL: {bond['convexity_pnl']:.4f} per 100 face per 100bps move")`,
    explanation:
      "Modified duration is the first-order approximation of price sensitivity: a 10-year par bond with ~7.7 years mod duration loses ~7.7% per 100bps rate rise. Convexity corrects the linear approximation — a long position in convexity gains symmetrically when rates move in either direction. Bond investors are long convexity (they benefit from large moves); pay-fixed swap receivers are short convexity. The convexity PnL is what makes callable bonds (negative convexity) trade cheap relative to bullet bonds.",
  },
  {
    id: "pyfin-20260528-b1-credit-migration",
    language: "python",
    title: "Credit rating migration — Markov chain N-step transition matrix",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def credit_migration(annual_transition: np.ndarray, horizon_years: int,
                      initial_rating: int) -> dict:
    """
    Credit migration model: ratings evolve as a Markov chain.
    annual_transition[i,j]: probability of migrating from rating i to j in 1Y.
    Ratings: 0=AAA, 1=AA, 2=A, 3=BBB, 4=BB, 5=B, 6=CCC, 7=D (absorbing).

    N-year transition: Q^N via matrix exponentiation.
    Survival probability over N years: 1 - cumulative PD.
    """
    Q = annual_transition.copy()

    # Validate: each row sums to 1, all entries >= 0.
    assert np.allclose(Q.sum(axis=1), 1.0, atol=1e-6), "Rows must sum to 1"
    assert (Q >= 0).all(), "All probabilities must be non-negative"

    # N-year transition via matrix power
    Q_n = np.linalg.matrix_power(Q, horizon_years)

    # Distribution after N years, starting from initial_rating
    dist = Q_n[initial_rating]

    # Cumulative default probability up to each year
    cum_default = []
    Q_k = np.eye(len(Q))
    for k in range(1, horizon_years + 1):
        Q_k = Q_k @ Q
        cum_default.append(Q_k[initial_rating, 7])   # 7 = Default

    # Expected rating (exclude default state)
    n_live = len(Q) - 1
    exp_rating = sum(i * dist[i] for i in range(n_live)) / max(dist[:n_live].sum(), 1e-9)

    rating_labels = ['AAA','AA','A','BBB','BB','B','CCC','D']
    dist_series = pd.Series(dist, index=rating_labels)

    return {
        'Q_n':           Q_n,
        'distribution':  dist_series,
        'cum_default':   np.array(cum_default),
        'exp_rating':    exp_rating,
    }


# Stylised S&P annual average transition matrix (8x8, rows sum to 1)
Q = np.array([
#  AAA    AA      A     BBB     BB      B     CCC     D
 [0.920, 0.065, 0.008, 0.004, 0.002, 0.001, 0.000, 0.000],  # AAA
 [0.006, 0.895, 0.076, 0.016, 0.004, 0.002, 0.001, 0.000],  # AA
 [0.001, 0.020, 0.889, 0.073, 0.010, 0.004, 0.002, 0.001],  # A
 [0.000, 0.003, 0.040, 0.857, 0.070, 0.021, 0.005, 0.004],  # BBB
 [0.000, 0.001, 0.005, 0.067, 0.812, 0.086, 0.020, 0.009],  # BB
 [0.000, 0.001, 0.003, 0.010, 0.065, 0.821, 0.060, 0.040],  # B
 [0.000, 0.000, 0.001, 0.005, 0.020, 0.100, 0.700, 0.174],  # CCC
 [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 1.000],  # D (absorbing)
])

for yr in [1, 3, 5, 10]:
    res = credit_migration(Q, yr, initial_rating=3)   # start: BBB
    print(f"BBB -> {yr}Y PD: {res['cum_default'][-1]*100:.3f}%  "
          f"D-dist: {res['distribution']['D']*100:.3f}%")`,
    explanation:
      "Credit migration matrices formalise rating changes as a Markov chain: the N-year transition matrix is simply Q^N (matrix exponentiation). The cumulative default probability from BBB over 5 years (~2.5%) is materially higher than the 1-year PD (~0.4%), and grows nonlinearly because a downgraded BBB bond has a higher marginal default probability. Investment-grade (IG) bond pricing models use these transition matrices to estimate expected loss, while non-investment-grade (HY) models focus primarily on the 1-year hazard rate.",
  },
  {
    id: "pyfin-20260528-b1-risk-parity",
    language: "python",
    title: "Risk parity — equal risk contribution (ERC) portfolio",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def erc_portfolio(Sigma: np.ndarray, tol: float = 1e-8) -> np.ndarray:
    """
    Equal Risk Contribution (ERC) portfolio: each asset contributes the same
    marginal risk to portfolio variance.
    Risk contribution of asset i: RC_i = w_i * (Sigma @ w)_i / (w^T Sigma w)
    ERC condition: RC_i = 1/N for all i.

    Solve via: minimise sum_i sum_j (RC_i - RC_j)^2
    The problem is convex in log-weights; transform z = log(w), w = exp(z).
    """
    n = Sigma.shape[0]

    def risk_contributions(w):
        port_var = w @ Sigma @ w
        mrc = Sigma @ w             # marginal risk contribution (vector)
        rc  = w * mrc / port_var    # risk contribution per asset
        return rc

    def objective(z):
        w = np.exp(z)
        w /= w.sum()                # normalise to sum to 1
        rc = risk_contributions(w)
        target = 1.0 / n
        return np.sum((rc - target)**2)

    # Initial: inverse-vol weights
    diag_vols = np.sqrt(np.diag(Sigma))
    w0 = 1.0 / diag_vols
    w0 /= w0.sum()

    res = minimize(objective, np.log(w0), method='L-BFGS-B',
                   options={'ftol': tol**2, 'gtol': tol, 'maxiter': 1000})
    w_opt = np.exp(res.x)
    w_opt /= w_opt.sum()
    return w_opt


def compare_portfolios(mu: np.ndarray, Sigma: np.ndarray):
    n = len(mu)
    diag_vols = np.sqrt(np.diag(Sigma))

    w_eq   = np.ones(n) / n
    w_invol = 1.0 / diag_vols / (1.0 / diag_vols).sum()
    w_erc  = erc_portfolio(Sigma)
    w_mvo  = np.linalg.solve(Sigma, mu - 0.04); w_mvo = np.maximum(w_mvo, 0); w_mvo /= w_mvo.sum()

    print(f"{'Portfolio':<18}  {'HHI':>6}  {'Ann Vol':>8}  {'Ret':>6}  {'Sharpe':>7}")
    for label, w in [('Equal weight', w_eq), ('Inverse vol', w_invol),
                     ('ERC / Risk parity', w_erc), ('MVO (long-only)', w_mvo)]:
        port_vol = np.sqrt(w @ Sigma @ w * 252)
        port_ret = (mu @ w)
        sharpe   = (port_ret - 0.04) / port_vol
        hhi      = np.sum(w**2)
        print(f"{label:<18}  {hhi:.4f}  {port_vol*100:.2f}%  {port_ret*100:.2f}%  {sharpe:.2f}")

n = 4
mu     = np.array([0.08, 0.10, 0.07, 0.12])
sigma  = np.array([0.15, 0.20, 0.10, 0.30])
corr   = np.array([[1,0.5,0.3,0.2],[0.5,1,0.4,0.3],[0.3,0.4,1,0.1],[0.2,0.3,0.1,1]])
Sigma  = np.outer(sigma, sigma) * corr / 252   # daily covariance

compare_portfolios(mu / 252, Sigma)`,
    explanation:
      "Risk parity equalises each asset's contribution to portfolio variance — not its dollar weight. The key insight is that equal dollar weights give very unequal risk exposure: a 25% position in a 30%-vol stock contributes 9× more variance than a 25% position in a 10%-vol bond. ERC portfolios are more robust to estimation error in expected returns (they don't require a mu estimate), which explains their popularity in multi-asset allocation after the 2008 crisis.",
  },
  {
    id: "pyfin-20260528-b1-variance-swap",
    language: "python",
    title: "Variance swap fair strike via log-contract replication",
    tag: "finance",
    code: `import numpy as np
from scipy.integrate import quad
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    if T <= 0 or sigma <= 0: return max(S - K, 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, sigma, T):
    c = bs_call(S, K, r, sigma, T)
    return c - S + K * np.exp(-r*T)   # put-call parity

def variance_swap_strike(S0: float, r: float, T: float,
                           implied_vol_fn,
                           n_strikes: int = 200) -> dict:
    """
    Carr-Madan (1998) variance swap replication:
    E^Q[sigma_realised^2 * T] = (2/T) * integral [C(K)/K^2 dK + P(K)/K^2 dK]

    where the integral is split at F = S0*exp(r*T) (forward price):
    - OTM calls for K > F
    - OTM puts  for K < F

    implied_vol_fn: callable K -> implied vol at that strike
    """
    F = S0 * np.exp(r * T)   # forward price

    # Discrete replication using a finite set of strikes
    K_min  = 0.5 * F
    K_max  = 2.0 * F
    strikes = np.linspace(K_min, K_max, n_strikes)
    dK     = strikes[1] - strikes[0]

    total = 0.0
    for K in strikes:
        sigma = implied_vol_fn(K)
        if K < F:
            price = bs_put(S0, K, r, sigma, T)
        else:
            price = bs_call(S0, K, r, sigma, T)
        total += 2.0 / T * price / K**2 * dK

    # Log-contract correction (continuous-time version)
    # K_var = 2/T * [r*T - (F/S0 - 1) - log(F/S0)] + replication_sum
    # For zero-drift assumption (r=0), this simplifies.
    correction = 2.0 / T * (r * T - (F/S0 - 1) - np.log(F/S0))

    fair_var   = total + correction
    fair_vol   = np.sqrt(max(fair_var, 0))

    # Flat vol benchmark (ATM implied vol as reference)
    atm_vol = implied_vol_fn(F)

    return {
        'fair_var':   fair_var,
        'fair_vol':   fair_vol,    # sqrt of fair variance = variance swap vol
        'atm_vol':    atm_vol,
        'var_premium': (fair_vol - atm_vol) * 10000,  # convexity premium in bps
    }

# Smile: higher implied vol for OTM strikes (negative skew)
def smile_vol(K, S0=100, atm=0.20, skew=-0.05, curv=0.10):
    log_m = np.log(K / S0)
    return max(atm + skew * log_m + curv * log_m**2, 0.01)

result = variance_swap_strike(S0=100, r=0.05, T=1.0,
                               implied_vol_fn=lambda K: smile_vol(K))
print(f"Fair vol:    {result['fair_vol']*100:.3f}%")
print(f"ATM vol:     {result['atm_vol']*100:.3f}%")
print(f"Var premium: {result['var_premium']:.2f} bps (smile convexity)")`,
    explanation:
      "A variance swap pays the difference between realised and fair variance. The fair variance strike is higher than ATM implied vol because the swap buyer is long the 'smile' convexity: any vol smile (higher OTM implied vols) increases the replication portfolio's fair value above ATM vol. The premium grows with skew and curvature — so CBOE VIX² is effectively the fair variance strike for the S&P 500, computed daily via the same Carr-Madan integral.",
  },
  {
    id: "pyfin-20260528-b1-gamma-scalping",
    language: "python",
    title: "Gamma scalping — delta-hedge P&L decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import norm

def bs_greeks_call(S, K, r, sigma, T):
    if T <= 1e-6: return {'delta': float(S > K), 'gamma': 0.0, 'vega': 0.0, 'price': max(S-K, 0)}
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    phi = norm.pdf(d1)
    price = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
    delta = norm.cdf(d1)
    gamma = phi / (S * sigma * np.sqrt(T))
    vega  = S * phi * np.sqrt(T)
    return {'price': price, 'delta': delta, 'gamma': gamma, 'vega': vega}

def gamma_scalping_pnl(S0: float, K: float, r: float, sigma_imp: float,
                        T: float, n_steps: int = 252,
                        sigma_realised: float = None, seed: int = 42) -> dict:
    """
    Simulate daily delta-hedging of a long call option.
    P&L per day = 0.5 * Gamma * S^2 * (realised_move^2 - sigma_imp^2 * dt)

    The option owner is long gamma: profits when realised vol > implied vol.
    Rebalance delta at end of each day.
    """
    if sigma_realised is None:
        sigma_realised = sigma_imp   # at-the-money, P&L ≈ 0

    rng = np.random.default_rng(seed)
    dt  = T / n_steps

    S = S0
    t = T

    # Initial option and hedge
    g = bs_greeks_call(S, K, r, sigma_imp, t)
    option_value  = g['price']
    hedge_cash    = -g['delta'] * S  # short delta shares, invest proceeds
    stock_holding = g['delta']

    pnl_history = []
    gamma_pnl   = []
    theta_pnl   = []

    for step in range(n_steps):
        t -= dt
        dW = rng.standard_normal() * np.sqrt(dt)
        dS = S * (r * dt + sigma_realised * dW)

        # Delta P&L from stock position
        stock_pnl = stock_holding * dS

        # Update option value
        S_new = S + dS
        g_new = bs_greeks_call(S_new, K, r, sigma_imp, max(t, 1e-6))

        option_pnl = g_new['price'] - g['price']

        # Hedge rebalance cost
        delta_change    = g_new['delta'] - stock_holding
        rebalance_cost  = -delta_change * S_new

        # Daily P&L (option + hedge + rebalance)
        daily_pnl = option_pnl + stock_pnl + hedge_cash * r * dt

        # Decomposition: gamma P&L = 0.5 * Gamma * (dS)^2 - 0.5 * sigma^2 * S^2 * Gamma * dt
        gm_pnl = 0.5 * g['gamma'] * (dS**2 - sigma_imp**2 * S**2 * dt)

        pnl_history.append(daily_pnl)
        gamma_pnl.append(gm_pnl)
        theta_pnl.append(-g['price'] * 0.01 * dt)   # approximate theta

        # Update state
        stock_holding = g_new['delta']
        hedge_cash   += rebalance_cost + r * hedge_cash * dt
        S  = S_new
        g  = g_new

    pnl_series = pd.Series(pnl_history)
    return {
        'total_pnl':  pnl_series.sum(),
        'pnl_std':    pnl_series.std(),
        'gamma_pnl':  pd.Series(gamma_pnl).sum(),
        'pnl_series': pnl_series,
    }


# Long call: imp_vol = 20%, realised = 25% -> should profit
res = gamma_scalping_pnl(S0=100, K=100, r=0.05,
                          sigma_imp=0.20, sigma_realised=0.25, T=1.0)
print(f"Total P&L:  {res['total_pnl']:.2f}")
print(f"Gamma P&L:  {res['gamma_pnl']:.2f}  (from vol gap)")
print(f"P&L Sharpe: {res['total_pnl'] / (res['pnl_std'] * np.sqrt(252)):.2f}")`,
    explanation:
      "Gamma scalping P&L per day equals 0.5 × Γ × S² × (σ²_realised − σ²_implied) × dt: positive when the market moves more than the option's implied vol predicts, negative when it moves less. A delta-hedged long straddle is a 'long gamma' position — it profits from high realised vol regardless of direction. The annualised Gamma P&L relative to its standard deviation is the volatility trader's Sharpe ratio, which depends on the difference σ_realised − σ_implied.",
  },
  {
    id: "pyfin-20260528-b1-keyrate-dv01",
    language: "python",
    title: "Key-rate DV01 — tenor-by-tenor rate sensitivity",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import interp1d

def interpolate_df(tenors: np.ndarray, dfs: np.ndarray, t: float) -> float:
    """Log-linear interpolation of discount factors."""
    if t <= tenors[0]:  return dfs[0]
    if t >= tenors[-1]: return dfs[-1]
    f = interp1d(tenors, np.log(dfs), kind='linear')
    return float(np.exp(f(t)))

def bond_price_from_curve(coupon: float, maturity: float, freq: int,
                            tenors: np.ndarray, dfs: np.ndarray,
                            face: float = 100.0) -> float:
    """Price a bond from an arbitrary discount curve (not flat yield)."""
    n    = int(round(maturity * freq))
    c    = coupon / freq * face
    cf   = np.full(n, c)
    cf[-1] += face
    times = np.arange(1, n + 1) / freq
    pv = sum(cf_i * interpolate_df(tenors, dfs, t_i)
             for cf_i, t_i in zip(cf, times))
    return pv

def key_rate_dv01(coupon: float, maturity: float, freq: int,
                   tenors: np.ndarray, dfs: np.ndarray,
                   bump_bps: float = 1.0) -> dict:
    """
    Key-rate DV01: sensitivity of bond price to a 1bp shift in each tenor node.
    Each tenor is bumped independently while all others are held fixed.
    Sum of key-rate DV01s ≈ parallel shift DV01.
    """
    base_price = bond_price_from_curve(coupon, maturity, freq, tenors, dfs)
    bump       = bump_bps / 10000.0
    krdv01     = {}

    for i, tenor in enumerate(tenors):
        # Shift discount factor at tenor i by +1bp (rate increases -> df decreases)
        dfs_up = dfs.copy()
        dfs_up[i] = dfs[i] * np.exp(-bump * tenor)   # approximate shift

        price_up = bond_price_from_curve(coupon, maturity, freq, tenors, dfs_up)
        krdv01[f'{tenor:.2f}Y'] = base_price - price_up   # positive = rate rise hurts

    total_dv01 = sum(krdv01.values())
    return {'base_price': base_price, 'krdv01': krdv01, 'total_dv01': total_dv01}

# Discount curve: approximately 5% flat
tenors = np.array([0.25, 0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0])
dfs    = np.exp(-0.05 * tenors)

# 10-year 5% annual coupon bond
res = key_rate_dv01(coupon=0.05, maturity=10.0, freq=2, tenors=tenors, dfs=dfs)
print(f"Price:       {res['base_price']:.4f}")
print(f"Total DV01:  {res['total_dv01']:.4f}")
print("Key-rate DV01 profile:")
for tenor, krd in res['krdv01'].items():
    bar = '#' * int(abs(krd) * 1000)
    print(f"  {tenor:>8}: {krd:.4f}  {bar}")`,
    explanation:
      "Key-rate DV01 (KRDV01) measures a bond's sensitivity to non-parallel interest rate shifts — essential for hedging curve risk. A 10-year bond has its largest KRDV01 at the 10-year tenor node; but cash flows at 1Y through 9Y still have non-zero sensitivity. KRDV01 hedging requires duration-matching not just at the portfolio level but at each tenor bucket: a 10Y bond hedged with only a 5Y instrument has residual exposure to the 5Y-10Y slope.",
  },
  {
    id: "pyfin-20260528-b1-svensson",
    language: "python",
    title: "Svensson extended Nelson-Siegel yield curve (6 parameters)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_yield(t: float, b: np.ndarray) -> float:
    """
    Svensson (1994) extended Nelson-Siegel:
    y(t) = b0 + b1*f1(t,tau1) + b2*f2(t,tau1) + b3*f2(t,tau2)
    where f1(t,tau) = (1 - exp(-t/tau)) / (t/tau)
          f2(t,tau) = f1(t,tau) - exp(-t/tau)    [hump factor]
    b = [b0, b1, b2, b3, tau1, tau2]
    """
    b0, b1, b2, b3, tau1, tau2 = b
    if t < 1e-6:
        return b0 + b1    # limit as t -> 0 (short rate = b0 + b1)

    x1 = t / tau1
    ex1 = np.exp(-x1)
    f1   = (1 - ex1) / x1
    hump1 = f1 - ex1

    x2 = t / tau2
    ex2 = np.exp(-x2)
    hump2 = (1 - ex2) / x2 - ex2

    return b0 + b1*f1 + b2*hump1 + b3*hump2


def fit_svensson(maturities: np.ndarray, yields: np.ndarray,
                  n_tries: int = 10, seed: int = 42) -> np.ndarray:
    """
    Fit Svensson to observed par yields via least-squares.
    Multi-start to avoid local minima (tau1, tau2 are non-convex).
    """
    rng = np.random.default_rng(seed)
    best_sse, best_params = np.inf, None

    def objective(b):
        if b[4] < 0.1 or b[5] < 0.1 or b[4] == b[5]:
            return 1e10
        y_hat = np.array([svensson_yield(t, b) for t in maturities])
        return np.sum((y_hat - yields)**2)

    for _ in range(n_tries):
        b0_guess = yields[-1]                        # long-run level ≈ long yield
        b1_guess = yields[0] - yields[-1]            # slope = short - long
        b2_guess = rng.uniform(-0.02, 0.02)
        b3_guess = rng.uniform(-0.02, 0.02)
        tau1 = rng.uniform(0.5, 5.0)
        tau2 = rng.uniform(5.0, 15.0)
        x0 = [b0_guess, b1_guess, b2_guess, b3_guess, tau1, tau2]

        res = minimize(objective, x0, method='Nelder-Mead',
                       options={'xatol': 1e-8, 'maxiter': 10000})
        if res.fun < best_sse:
            best_sse, best_params = res.fun, res.x

    return best_params

# US Treasury par yield curve (hypothetical, inverted)
mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.053, 0.054, 0.054, 0.052, 0.050, 0.048, 0.047, 0.046, 0.044, 0.044])

params = fit_svensson(mats, yields)
b0, b1, b2, b3, tau1, tau2 = params
print(f"Svensson: b0={b0:.4f}  b1={b1:.4f}  b2={b2:.4f}  b3={b3:.4f}")
print(f"          tau1={tau1:.2f}Y  tau2={tau2:.2f}Y")

for t in [0.5, 1, 2, 5, 10, 30]:
    fitted = svensson_yield(t, params)
    obs    = np.interp(t, mats, yields)
    print(f"  {t:4.1f}Y: fitted={fitted*100:.4f}%  market={obs*100:.4f}%")`,
    explanation:
      "Svensson extends Nelson-Siegel by adding a second hump factor with its own decay tau2, enabling it to fit two-humped yield curves that occur during sharp monetary policy transitions. Central banks (ECB, SNB, Bundesbank, Fed) use Svensson for daily curve estimation. The extra two parameters (b3, tau2) make the optimisation non-convex — multi-start is essential because the model is highly sensitive to the initial tau values.",
  },
  {
    id: "pyfin-20260528-b1-bachelier",
    language: "python",
    title: "Bachelier (normal) model — pricing for negative interest rates",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def bachelier_call(F: float, K: float, sigma_n: float, T: float,
                    df: float = 1.0) -> float:
    """
    Bachelier (1900) normal model: dF = sigma_n * dW
    (no drift in the risk-neutral measure).
    Call price: df * [(F-K)*Phi(d) + sigma_n*sqrt(T)*phi(d)]
    where d = (F-K) / (sigma_n * sqrt(T))

    sigma_n: absolute (normal) volatility in the same units as F.
    Use case: interest rate caps/floors where rates can be negative.
    """
    if sigma_n < 1e-9 or T < 1e-9:
        return df * max(F - K, 0.0)

    sT = sigma_n * np.sqrt(T)
    d  = (F - K) / sT
    return df * ((F - K) * norm.cdf(d) + sT * norm.pdf(d))


def bachelier_put(F: float, K: float, sigma_n: float, T: float,
                   df: float = 1.0) -> float:
    """Bachelier put via put-call parity: P = C - df*(F-K)."""
    return bachelier_call(F, K, sigma_n, T, df) - df * (F - K)


def bachelier_iv(price: float, F: float, K: float, T: float,
                  df: float = 1.0, kind: str = 'call') -> float:
    """
    Invert Bachelier price to get normal implied vol sigma_n.
    Brent's method bracketed in [1e-8, 10*abs(F)].
    """
    fn = bachelier_call if kind == 'call' else bachelier_put
    def f(sigma_n):
        return fn(F, K, sigma_n, T, df) - price

    try:
        return brentq(f, 1e-8, 10 * max(abs(F), abs(K), 0.01), xtol=1e-9)
    except ValueError:
        return np.nan


def bs_to_bachelier(F: float, K: float, sigma_ln: float, T: float) -> float:
    """
    Convert log-normal (BS) vol to normal (Bachelier) vol.
    Approximate formula for near-ATM options:
    sigma_n ≈ sigma_ln * F * [1 + (1-12*ln(F/K)^2 / (1+...) * ...)]
    For ATM: sigma_n ≈ sigma_ln * F * sqrt(T/T) = sigma_ln * F (at T=0)
    More accurate: sigma_n ≈ sigma_ln * (F+K)/2 (simple mid approximation)
    """
    return sigma_ln * (F + K) / 2.0   # ATM approximation


# Demo: EUR 5Y swap (EURIBOR fixed, can go negative)
# Forward swap rate F = -0.005 (-50bps), sigma_n = 60bps absolute vol
F, K, sigma_n, T = -0.005, -0.010, 0.0060, 5.0
df = np.exp(-0.0 * T)   # zero discounting for demo

c  = bachelier_call(F, K, sigma_n, T, df)
p  = bachelier_put(F, K, sigma_n, T, df)
atm = bachelier_call(F, F, sigma_n, T, df)

print(f"Bachelier call (F=-0.5%, K=-1%):  {c*10000:.4f} bps")
print(f"Bachelier put  (F=-0.5%, K=-1%):  {p*10000:.4f} bps")
print(f"ATM call (K=F=-0.5%):             {atm*10000:.4f} bps  ≈ sigma_n*sqrt(T)/(2*pi^0.5)")

# Verify put-call parity
parity_check = c - p - df * (F - K)
print(f"Put-call parity error: {parity_check:.2e}  (should be ~0)")

# Invert to get implied vol back
iv = bachelier_iv(c, F, K, T, df, kind='call')
print(f"Implied normal vol:  {iv*10000:.2f}bps  (input was {sigma_n*10000:.2f}bps)")`,
    explanation:
      "The Bachelier model assumes rates follow arithmetic Brownian motion — the natural choice when rates can go negative (EUR/CHF/JPY post-2015). Unlike Black-Scholes's log-normal assumption, the normal model assigns positive probability to negative forwards. The 'normal vol' sigma_n is quoted in absolute units (e.g., 60bps per annum for EUR swaptions), making it directly comparable to the expected daily rate move. Market conventions flipped from log-normal to normal vols for EUR swaptions during the negative rate era.",
  },
  {
    id: "pyfin-20260528-b1-futures-roll",
    language: "python",
    title: "Futures roll, basis, and cost-of-carry decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def cost_of_carry_fair_value(spot: float, r: float, q: float,
                               storage: float, T: float) -> float:
    """
    Fair futures price via cost of carry:
    F = S * exp((r - q + storage) * T)
    r:       risk-free rate
    q:       dividend yield (equity) or convenience yield (commodity)
    storage: storage cost rate (commodities; 0 for equity/FX)
    T:       time to expiry (years)
    """
    return spot * np.exp((r - q + storage) * T)

def calendar_spread(F_near: float, F_far: float, T_near: float,
                     T_far: float, r: float) -> dict:
    """
    Calendar spread: F_far / F_near should equal exp(r*(T_far - T_near)).
    Implied forward rate from the spread (commodity carry approximation).
    """
    ratio        = F_far / F_near if F_near > 0 else np.nan
    dt           = T_far - T_near
    implied_rate = np.log(ratio) / dt if dt > 0 else np.nan

    return {'ratio': ratio, 'implied_carry': implied_rate,
            'theoretical': np.exp(r * dt)}

def roll_cost(F_expiring: float, F_next: float, n_contracts: int,
               multiplier: float = 1.0) -> dict:
    """
    Cost of rolling from the expiring front contract to the next expiry.
    For backwardated markets (F_next < F_expiring): roll has positive carry.
    For contangoed markets (F_next > F_expiring): roll has negative carry.
    """
    roll_return  = (F_expiring - F_next) / F_expiring   # positive in backwardation
    dollar_cost  = (F_next - F_expiring) * n_contracts * multiplier

    return {
        'roll_return':  roll_return,
        'dollar_cost':  dollar_cost,
        'market_state': 'backwardation' if F_next < F_expiring else 'contango',
    }

def implied_dividend_yield(spot: float, futures: float,
                            r: float, T: float) -> float:
    """
    Infer dividend yield from spot and futures price (equity futures).
    F = S * exp((r - q) * T) => q = r - log(F/S) / T
    """
    return r - np.log(futures / spot) / T

# Demo: S&P 500 equity index futures
S      = 5000.0   # spot index level
r      = 0.053    # 5.3% risk-free
q      = 0.015    # 1.5% dividend yield
T_near = 3/12     # 3-month front contract
T_far  = 6/12     # 6-month back contract

F_near_fair = cost_of_carry_fair_value(S, r, q, 0, T_near)
F_far_fair  = cost_of_carry_fair_value(S, r, q, 0, T_far)

print(f"Spot: {S:.2f}   r={r*100:.1f}%   q={q*100:.1f}%")
print(f"3M fair futures:  {F_near_fair:.2f}")
print(f"6M fair futures:  {F_far_fair:.2f}")

spread = calendar_spread(F_near_fair, F_far_fair, T_near, T_far, r)
print(f"Calendar ratio:   {spread['ratio']:.4f}  (theoretical: {spread['theoretical']:.4f})")
print(f"Implied carry:    {spread['implied_carry']*100:.3f}%  (actual r-q: {(r-q)*100:.3f}%)")

# Roll analysis: if near is at 5075 and far is at 5050 (backwardation)
roll = roll_cost(F_expiring=F_near_fair, F_next=F_near_fair*0.998,
                  n_contracts=100, multiplier=50)
print(f"Roll: {roll['market_state']}  roll_return={roll['roll_return']*100:.3f}%  "
      f"dollar_cost={roll['dollar_cost']:,.0f}")`,
    explanation:
      "Futures roll cost is the recurring tax on passive long positions in contangoed markets (e.g., VIX futures, front-month crude oil): the investor sells the cheap expiring contract and buys the expensive next contract, locking in a negative roll yield. In equities, futures typically trade below the fair cost-of-carry price during periods of high demand for downside protection (market-implied dividend yield embedded in the basis). The calendar spread directly reveals the market's forward carry rate, which deviates from the risk-free rate when dividends are uncertain.",
  },
  {
    id: "pyfin-20260528-b1-factor-ic-decay",
    language: "python",
    title: "Factor IC decay — signal half-life and horizon analysis",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import spearmanr

def compute_ic_decay(factor_scores: pd.DataFrame,
                      returns: pd.DataFrame,
                      horizons: list[int] = [1, 5, 10, 20, 60],
                      method: str = 'spearman') -> pd.DataFrame:
    """
    Compute cross-sectional IC (Information Coefficient) for each horizon.
    IC = correlation between factor ranks today and forward returns at horizon h.
    Spearman rank correlation is robust to outliers and non-linearity.

    A factor with high IC at 1D but near-zero at 20D is a short-horizon signal.
    Signals with decaying ICs are often exploitable for 1-5D holding periods.
    """
    results = []

    for h in horizons:
        # Forward return: return from t to t+h
        fwd_ret = returns.shift(-h)   # shift back to align with today's factor

        daily_ics = []
        for date in factor_scores.index[:-h]:
            f = factor_scores.loc[date].dropna()
            r = fwd_ret.loc[date].dropna()
            common = f.index.intersection(r.index)
            if len(common) < 5:
                continue

            if method == 'spearman':
                ic, _ = spearmanr(f.loc[common], r.loc[common])
            else:
                ic = f.loc[common].corr(r.loc[common])   # Pearson

            daily_ics.append(ic)

        ic_arr = np.array(daily_ics)
        results.append({
            'horizon':    h,
            'mean_ic':    np.nanmean(ic_arr),
            'icir':       np.nanmean(ic_arr) / (np.nanstd(ic_arr) + 1e-8),
            'pct_pos':    np.nanmean(ic_arr > 0),
            'ic_std':     np.nanstd(ic_arr),
        })

    return pd.DataFrame(results).set_index('horizon')


def estimate_signal_halflife(ic_decay: pd.DataFrame) -> float:
    """
    Fit IC(h) = IC(1) * exp(-h / halflife) via log-linear regression.
    Halflife tells you the effective signal horizon.
    """
    ics   = ic_decay['mean_ic'].values
    h     = ic_decay.index.values.astype(float)
    ics   = np.maximum(ics, 1e-8)   # avoid log(0)

    # OLS on log(IC) = log(IC0) - h/HL
    A = np.column_stack([np.ones(len(h)), h])
    coef, _, _, _ = np.linalg.lstsq(A, np.log(ics), rcond=None)
    halflife = -1.0 / coef[1] if coef[1] < 0 else np.inf
    return halflife


# Simulate a fast-decaying momentum signal
rng  = np.random.default_rng(42)
T    = 500
N    = 30   # 30 stocks
dates = pd.date_range('2020-01-01', periods=T, freq='B')

# True factor: yesterday's return (1-day momentum, decays fast)
ret_df   = pd.DataFrame(rng.normal(0, 0.01, (T, N)),
                          index=dates, columns=[f'STK{i}' for i in range(N)])
factor   = ret_df.shift(1)   # lagged return as factor

ic_df = compute_ic_decay(factor, ret_df, horizons=[1, 3, 5, 10, 20, 60])
print(ic_df.round(4))
hl = estimate_signal_halflife(ic_df)
print(f"\\nEstimated signal half-life: {hl:.1f} days")`,
    explanation:
      "IC decay analysis is the primary tool for understanding a signal's optimal holding period: a momentum factor with IC of 3% at 1-day that decays to 0.5% at 20-days should be traded with a 1-5 day horizon to maximise the ICIR before the signal dissipates. The ICIR (IC / IC_std) is the signal-level Sharpe ratio and the core input to portfolio allocation: ICIR × √(breadth) = expected Sharpe per Grinold's Fundamental Law of Active Management.",
  },
  {
    id: "pyfin-20260528-b1-cir",
    language: "python",
    title: "CIR short rate model — closed-form ZCB and simulation",
    tag: "finance",
    code: `import numpy as np

def cir_zcb(r0: float, kappa: float, theta: float, sigma: float,
             T: float) -> float:
    """
    Cox-Ingersoll-Ross (1985) closed-form zero-coupon bond price.
    dr = kappa*(theta - r)*dt + sigma*sqrt(r)*dW

    P(0,T) = A(T) * exp(-B(T) * r0)

    gamma = sqrt(kappa^2 + 2*sigma^2)
    B(T)  = 2*(exp(gamma*T) - 1) / [(gamma+kappa)*(exp(gamma*T)-1) + 2*gamma]
    A(T)  = [2*gamma*exp((kappa+gamma)*T/2) /
              ((gamma+kappa)*(exp(gamma*T)-1) + 2*gamma)]^(2*kappa*theta/sigma^2)
    """
    gamma  = np.sqrt(kappa**2 + 2 * sigma**2)
    eγT    = np.exp(gamma * T)

    denom  = (gamma + kappa) * (eγT - 1) + 2 * gamma
    B_T    = 2 * (eγT - 1) / denom
    A_log  = (2 * kappa * theta / sigma**2) * (
                np.log(2 * gamma) + (kappa + gamma) * T / 2 - np.log(denom)
             )
    return np.exp(A_log - B_T * r0)


def cir_zero_rate(r0: float, kappa: float, theta: float,
                   sigma: float, T: float) -> float:
    """Continuously compounded zero rate implied by CIR ZCB."""
    P = cir_zcb(r0, kappa, theta, sigma, T)
    return -np.log(P) / T if T > 0 else r0


def cir_simulate(r0: float, kappa: float, theta: float,
                  sigma: float, T: float,
                  n_paths: int = 10000, n_steps: int = 252,
                  seed: int = 42) -> np.ndarray:
    """
    Simulate CIR paths via exact simulation (Broadie-Kaya method requires
    non-central chi-squared; here we use full-truncation Euler as an approx).
    Full truncation: r_t = max(r_{t-1} + drift + diffusion, 0).
    For kappa*theta > sigma^2/2 (Feller condition), r never hits 0 continuously
    but discrete Euler can still produce negatives — truncation handles this.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps

    r = np.full(n_paths, r0)
    paths = np.zeros((n_steps + 1, n_paths))
    paths[0] = r

    for i in range(n_steps):
        r_pos = np.maximum(r, 0.0)
        dr    = kappa * (theta - r_pos) * dt \
                + sigma * np.sqrt(r_pos * dt) * rng.standard_normal(n_paths)
        r     = r_pos + dr
        paths[i+1] = r

    return paths


# CIR calibrated to a typical USD environment
kappa, theta, sigma, r0 = 0.8, 0.04, 0.10, 0.03

print(f"CIR yield curve (r0={r0*100:.1f}%, theta={theta*100:.1f}%, kappa={kappa})")
for T in [0.5, 1, 2, 5, 10, 20, 30]:
    zr = cir_zero_rate(r0, kappa, theta, sigma, T)
    df = cir_zcb(r0, kappa, theta, sigma, T)
    print(f"  {T:4.1f}Y: zero_rate={zr*100:.4f}%  DF={df:.6f}")

# Verify MC vs closed-form at 1Y
paths = cir_simulate(r0, kappa, theta, sigma, T=1.0, n_paths=200000)
# ZCB ≈ E[exp(-integral r dt)] via riemann sum
mc_zcb = np.exp(-paths.mean(axis=0) * 1.0).mean()
print(f"MC ZCB at 1Y: {mc_zcb:.6f}  Closed-form: {cir_zcb(r0, kappa, theta, sigma, 1.0):.6f}")`,
    explanation:
      "The CIR model guarantees non-negative interest rates (unlike Vasicek) because the diffusion term is proportional to √r, which goes to zero as r approaches zero. The Feller condition 2κθ > σ² is the stronger guarantee that r stays strictly positive with probability 1. Unlike affine models with normal factors, CIR can produce term structures with multiple shapes (normal, inverted, humped) depending on kappa and theta. CIR is the short-rate model underpinning standard LIBOR market models and credit default intensity models.",
  },
];
