import type { Snippet } from "./types";

export const pythonFinanceSnippets20260523B1: Snippet[] = [
  {
    id: "pyfin-20260523-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel yield curve fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(t: np.ndarray, b0, b1, b2, tau) -> np.ndarray:
    """
    Nelson-Siegel (1987) zero-rate model:
    y(t) = b0 + b1 * load1(t) + b2 * load2(t)
    load1 = (1 - exp(-t/tau)) / (t/tau)   -- slope factor
    load2 = load1 - exp(-t/tau)            -- curvature factor
    b0 = long-run level, b1 = initial slope, b2 = hump magnitude.
    """
    e  = np.exp(-t / tau)
    l1 = (1.0 - e) / (t / tau)
    l2 = l1 - e
    return b0 + b1 * l1 + b2 * l2

def fit_ns(maturities: np.ndarray, yields: np.ndarray) -> np.ndarray:
    def loss(p):
        b0, b1, b2, tau = p
        if tau <= 0 or b0 <= 0:
            return 1e10
        return float(np.sum((nelson_siegel(maturities, b0, b1, b2, tau) - yields)**2))

    res = minimize(loss, [0.04, -0.02, 0.02, 2.0],
                   method='Nelder-Mead',
                   options={'xatol': 1e-8, 'fatol': 1e-10, 'maxiter': 5000})
    return res.x  # [b0, b1, b2, tau]

mats   = np.array([0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0])
yields = np.array([0.046, 0.047, 0.048, 0.046, 0.044, 0.042, 0.040])
b0, b1, b2, tau = fit_ns(mats, yields)
print(f"b0={b0:.4f} b1={b1:.4f} b2={b2:.4f} tau={tau:.2f}")
print("RMSE:", np.sqrt(np.mean((nelson_siegel(mats, b0, b1, b2, tau) - yields)**2))*1e4, "bps")`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into three orthogonal factors — level, slope, and curvature — each with an economic interpretation. It is the standard parsimonious model for fitting, forecasting, and hedging yield curves; the Svensson extension adds a second curvature term for more complex shapes.",
  },
  {
    id: "pyfin-20260523-b1-heston-mc",
    language: "python",
    title: "Heston stochastic volatility model — Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def heston_call_mc(S0: float, K: float, r: float, T: float,
                    v0: float, kappa: float, theta: float,
                    sigma_v: float, rho: float,
                    n_steps: int = 252, n_paths: int = 100_000,
                    seed: int = 42) -> float:
    """
    Heston (1993) model: dS = r*S*dt + sqrt(v)*S*dW1
                         dv = kappa*(theta-v)*dt + sigma_v*sqrt(v)*dW2
    Corr(dW1, dW2) = rho.  Uses Milstein scheme for variance process.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * T)

    S = np.full(n_paths, S0)
    v = np.full(n_paths, v0)

    sqrt2 = np.sqrt(1.0 - rho**2)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rho * Z1 + sqrt2 * rng.standard_normal(n_paths)

        sv = np.sqrt(np.maximum(v, 0.0))
        # Milstein correction for variance: extra (sigma_v^2/4) * dt * (Z2^2 - 1)
        v  = np.maximum(
            v + kappa * (theta - v) * dt + sigma_v * sv * Z2 * np.sqrt(dt)
              + 0.25 * sigma_v**2 * dt * (Z2**2 - 1.0),
            0.0)  # full truncation to prevent negative variance

        S  = S * np.exp((r - 0.5 * np.maximum(v, 0.0)) * dt
                         + sv * Z1 * np.sqrt(dt))

    return float(disc * np.mean(np.maximum(S - K, 0.0)))

# Example: ATM call with moderate vol-of-vol and negative correlation (equity skew)
price = heston_call_mc(100, 100, 0.05, 1.0,
                        v0=0.04, kappa=2.0, theta=0.04,
                        sigma_v=0.3, rho=-0.7)
print(f"Heston call: {price:.4f}")`,
    explanation:
      "The Heston model captures the implied volatility smile through stochastic volatility. Negative rho (spot-vol correlation) generates negative skew — the empirical pattern in equity options. Full truncation (max(v, 0)) prevents the variance from going negative in the Milstein discretisation.",
  },
  {
    id: "pyfin-20260523-b1-sabr",
    language: "python",
    title: "SABR implied volatility (Hagan et al. 2002)",
    tag: "finance",
    code: `import numpy as np

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan et al. (2002) SABR approximate lognormal implied vol.
    F = forward, K = strike, T = expiry.
    alpha = initial vol, beta = CEV exponent, rho = correlation, nu = vol-of-vol.
    """
    if abs(F - K) < 1e-10:  # ATM formula
        FK_mid = F
        A = alpha / (FK_mid**(1.0 - beta))
        B = 1.0 + ((1-beta)**2/24 * alpha**2 / FK_mid**(2*(1-beta))
                   + 0.25 * rho * beta * nu * alpha / FK_mid**(1-beta)
                   + (2 - 3*rho**2)/24 * nu**2) * T
        return A * B

    # General formula (away from ATM)
    FK   = F * K
    ln   = np.log(F / K)
    FK_b = FK**((1.0 - beta) / 2.0)
    z    = nu / alpha * FK_b * ln
    chi  = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    A = alpha / (FK_b * (1 + (1-beta)**2/24 * ln**2
                          + (1-beta)**4/1920 * ln**4))
    B = z / chi if abs(chi) > 1e-10 else 1.0
    C = 1.0 + ((1-beta)**2/24 * alpha**2 / FK**(1-beta)
               + 0.25*rho*beta*nu*alpha / FK**((1-beta)/2)
               + (2 - 3*rho**2)/24 * nu**2) * T

    return A * B * C

# Build a smile: strikes around ATM
F    = 100.0
strikes = np.array([80, 90, 95, 100, 105, 110, 120], dtype=float)
smile = [sabr_vol(F, K, 1.0, alpha=0.2, beta=0.5, rho=-0.3, nu=0.4)
         for K in strikes]
for K, s in zip(strikes, smile):
    print(f"K={K:4.0f}  sigma={s:.4f}")`,
    explanation:
      "SABR (Stochastic Alpha Beta Rho) is the industry standard for interest rate vol surfaces. The beta parameter controls the backbone shape (0=normal, 1=lognormal); rho generates skew; nu controls the wing. The Hagan formula is an analytic approximation — accurate for moderate moneyness and short expiries.",
  },
  {
    id: "pyfin-20260523-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter dynamic hedge ratio for pairs trading",
    tag: "finance",
    code: `import numpy as np

def kalman_pairs(y: np.ndarray, x: np.ndarray,
                  delta: float = 1e-4, R: float = 1e-3) -> tuple:
    """
    State-space model: y_t = beta_t * x_t + alpha_t + eps_t
    State: [beta, alpha] evolves as random walk.
    Observation noise R, state noise Q = delta / (1-delta) * I.
    Returns: betas, alphas, spreads (residuals), Kalman gains.
    """
    n = len(y)
    Q = delta / (1.0 - delta) * np.eye(2)

    # State mean and covariance
    theta = np.zeros(2)         # [beta, alpha]
    P     = np.eye(2)

    betas   = np.zeros(n)
    alphas  = np.zeros(n)
    spreads = np.zeros(n)

    for t in range(n):
        F = np.array([x[t], 1.0])   # observation vector

        # Predict
        P = P + Q                   # state covariance grows each step

        # Update
        S     = float(F @ P @ F) + R      # innovation variance
        K_gn  = P @ F / S                 # Kalman gain (2,)
        innov = y[t] - float(F @ theta)   # innovation

        theta = theta + K_gn * innov
        P     = P - np.outer(K_gn, F) @ P

        betas[t]   = theta[0]
        alphas[t]  = theta[1]
        spreads[t] = innov

    return betas, alphas, spreads`,
    explanation:
      "The Kalman filter tracks a time-varying hedge ratio without a fixed lookback window — it allocates more weight to recent observations when state noise (delta) is high. The innovation sequence (spread) is the trading signal: trade when it exceeds a threshold and revert when it normalises.",
  },
  {
    id: "pyfin-20260523-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model regime detection",
    tag: "finance",
    code: `import numpy as np
# pip install hmmlearn
from hmmlearn.hmm import GaussianHMM

def fit_hmm_regimes(returns: np.ndarray, n_states: int = 2) -> dict:
    """
    Fit a 2-state Gaussian HMM to log returns.
    Typically identifies: low-vol / bull regime vs high-vol / bear regime.
    Uses Baum-Welch (EM) algorithm.
    """
    r = returns.reshape(-1, 1)

    model = GaussianHMM(
        n_components=n_states,
        covariance_type='full',
        n_iter=100,
        random_state=42
    )
    model.fit(r)

    states = model.predict(r)

    # Label regimes by volatility (regime 0 = low vol, 1 = high vol)
    vols  = [float(np.sqrt(model.covars_[i, 0, 0])) for i in range(n_states)]
    order = np.argsort(vols)   # ascending vol order

    result = {
        'states': states,
        'means': model.means_[order, 0],
        'vols':  np.array(vols)[order],
        'trans_matrix': model.transmat_[np.ix_(order, order)],
    }

    for i, s in enumerate(order):
        ann_vol = vols[s] * np.sqrt(252)
        ann_ret = model.means_[s, 0] * 252
        print(f"Regime {i}: ann_ret={ann_ret:.2%}  ann_vol={ann_vol:.2%}")

    return result`,
    explanation:
      "A 2-state HMM on returns typically extracts a 'calm' regime with low vol and positive drift, and a 'crisis' regime with high vol and negative drift. The transition matrix shows the regime persistence — typical equity calm periods last months, crisis periods weeks. Regime probabilities are used to adjust position sizes.",
  },
  {
    id: "pyfin-20260523-b1-importance-sampling",
    language: "python",
    title: "Importance sampling for deep OTM option pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def mc_call_is(S: float, K: float, r: float, sigma: float, T: float,
               n: int = 50_000, seed: int = 42) -> tuple:
    """
    Importance sampling for a deep OTM call.
    Shift the normal mean to mu_IS = ln(K/S*exp(-rT)) / (sigma*sqrt(T))
    so that a large fraction of paths end in the money.
    Re-weight by the likelihood ratio to restore an unbiased estimate.
    """
    rng = np.random.default_rng(seed)

    # Optimal IS mean: put the mass of the distribution near the strike
    lnS = np.log(S)
    lnK = np.log(K)
    mu_star = (lnK - lnS - (r - 0.5*sigma**2)*T) / (sigma * np.sqrt(T))

    Z    = rng.standard_normal(n) + mu_star   # shifted normals
    ST   = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    pay  = np.maximum(ST - K, 0.0)

    # Likelihood ratio: dP/dQ = exp(-mu_star*Z + 0.5*mu_star^2)
    lr   = np.exp(-mu_star * Z + 0.5 * mu_star**2)
    mc_is = float(np.exp(-r*T) * np.mean(pay * lr))

    # Naive MC for comparison
    Z2      = rng.standard_normal(n)
    ST2     = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z2)
    mc_plain = float(np.exp(-r*T) * np.maximum(ST2 - K, 0.0).mean())

    print(f"IS: {mc_is:.6f}  Plain: {mc_plain:.6f}  Var ratio: "
          f"{(pay*lr).std()/np.maximum(ST2-K,0).std():.2f}")
    return mc_is, mc_plain`,
    explanation:
      "For deep OTM options, plain MC wastes most paths on zero-payoff outcomes. Importance sampling shifts the sampling measure so paths land near or past the strike, then corrects for the measure change via the likelihood ratio. Variance reduction of 100x or more is typical for options 3+ standard deviations OTM.",
  },
  {
    id: "pyfin-20260523-b1-control-variates",
    language: "python",
    title: "Control variates — geometric Asian as CV for arithmetic",
    tag: "finance",
    code: `import numpy as np

def geometric_asian_analytic(S0, K, r, sigma, T, n_steps):
    """Geometric Asian call closed form (Kemna & Vorst 1990)."""
    sigma_G = sigma * np.sqrt((n_steps + 1) * (2*n_steps + 1) / (6*n_steps**2))
    b       = 0.5 * (r - 0.5*sigma**2 + sigma_G**2)
    d1      = (np.log(S0/K) + (b + 0.5*sigma_G**2)*T) / (sigma_G * np.sqrt(T))
    d2      = d1 - sigma_G * np.sqrt(T)
    from scipy.stats import norm
    return np.exp(-r*T) * (S0 * np.exp(b*T) * norm.cdf(d1) - K * norm.cdf(d2))

def asian_call_cv(S0, K, r, sigma, T, n_steps=50, n_paths=100_000, seed=42):
    """
    Arithmetic Asian call via Monte Carlo with geometric Asian as control variate.
    CV estimator: price_A_hat = plain_MC_A + beta * (analytic_G - MC_G)
    Optimal beta = Cov(payoff_A, payoff_G) / Var(payoff_G).
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    d    = (r - 0.5*sigma**2)*dt
    v    = sigma * np.sqrt(dt)
    disc = np.exp(-r*T)

    A_pays = np.zeros(n_paths)
    G_pays = np.zeros(n_paths)

    for p in range(n_paths):
        S = S0; log_sum = 0.0; arith_sum = 0.0
        Z = rng.standard_normal(n_steps)
        for i in range(n_steps):
            S *= np.exp(d + v * Z[i])
            arith_sum += S
            log_sum   += np.log(S)
        A_pays[p] = max(arith_sum/n_steps - K, 0.0)
        G_pays[p] = max(np.exp(log_sum/n_steps) - K, 0.0)

    beta_cv   = np.cov(A_pays, G_pays)[0,1] / np.var(G_pays)
    g_analytic = geometric_asian_analytic(S0, K, r, sigma, T, n_steps)
    mc_arith   = float(disc * A_pays.mean())
    mc_cv      = float(disc * (A_pays - beta_cv*(G_pays - g_analytic/disc)).mean())

    print(f"Plain MC: {mc_arith:.4f}  CV: {mc_cv:.4f}  g_analytic: {g_analytic:.4f}")
    print(f"Variance reduction: {A_pays.var()/((A_pays - beta_cv*G_pays).var()):.1f}x")
    return mc_cv`,
    explanation:
      "Control variates exploit the correlation between the target (arithmetic Asian) and a tractable proxy (geometric Asian with known analytic price). The optimal beta minimises residual variance; a well-chosen control variate routinely gives 10-50x variance reduction for Asian option MC.",
  },
  {
    id: "pyfin-20260523-b1-evt-pot",
    language: "python",
    title: "EVT Peaks-over-Threshold (GPD) tail risk",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize_scalar

def evt_var_es(losses: np.ndarray, confidence: float = 0.99,
               threshold_quantile: float = 0.90) -> dict:
    """
    Extreme Value Theory — Peaks-over-Threshold with Generalised Pareto.
    Models the tail distribution of losses above a high threshold u.
    xi > 0: heavy-tailed (Frechet), xi = 0: exponential, xi < 0: bounded.
    """
    u       = np.quantile(losses, threshold_quantile)
    excesses = losses[losses > u] - u
    n_total  = len(losses)
    n_u      = len(excesses)

    # Fit GPD to the excesses
    xi, loc, beta = genpareto.fit(excesses, floc=0)

    print(f"Threshold u={u:.4f}, n_exceedances={n_u}, xi={xi:.3f}, beta={beta:.4f}")

    # VaR from GPD:  VaR(p) = u + (beta/xi) * ((n/n_u*(1-p))^(-xi) - 1)
    p    = confidence
    Fn_u = n_u / n_total       # empirical P(X > u)
    if abs(xi) < 1e-6:         # exponential tail
        var = u + beta * np.log(Fn_u / (1-p))
    else:
        var = u + (beta/xi) * ((Fn_u/(1-p))**xi - 1)

    # ES: E[X | X > VaR] = (VaR + beta - xi*u) / (1 - xi)
    es  = (var + beta - xi*u) / (1.0 - xi) if abs(1-xi) > 1e-8 else float('inf')

    print(f"EVT VaR({int(confidence*100)}%): {var:.4f}  ES: {es:.4f}")
    return {"var": var, "es": es, "xi": xi, "beta": beta, "threshold": u}`,
    explanation:
      "EVT provides theoretically grounded tail estimates beyond what parametric (Gaussian) models give. For financial losses, xi > 0 (heavy tail) is the empirical finding — the Pareto tail implies that both VaR and ES grow with a power law, not exponentially. Regulators require EVT-based tail analysis under FRTB.",
  },
  {
    id: "pyfin-20260523-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula credit portfolio loss simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def copula_portfolio_loss(
    n_names: int = 100,
    pd_flat: float = 0.02,        # flat default probability per name
    lgd: float = 0.60,            # loss given default
    notional: float = 1_000_000,  # per name
    rho: float = 0.30,            # pairwise correlation (single-factor)
    n_sims: int = 100_000,
    seed: int = 42
) -> dict:
    """
    Single-factor Gaussian copula (Li 2000):
    X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i  where M, Z_i ~ N(0,1).
    Default if X_i < Phi^{-1}(PD_i).
    Used by Basel CDO tranche pricing and structured credit models.
    """
    rng    = np.random.default_rng(seed)
    thresh = norm.ppf(pd_flat)          # default threshold

    losses = np.zeros(n_sims)
    for sim in range(n_sims):
        M    = rng.standard_normal()                       # systematic factor
        Z    = rng.standard_normal(n_names)                # idiosyncratic
        X    = np.sqrt(rho) * M + np.sqrt(1-rho) * Z
        n_defaults = int((X < thresh).sum())
        losses[sim] = n_defaults * lgd * notional

    total_notional = n_names * notional
    var_99  = np.quantile(losses, 0.99) / total_notional
    es_99   = losses[losses >= np.quantile(losses, 0.99)].mean() / total_notional
    exp_loss = losses.mean() / total_notional

    print(f"EL={exp_loss:.3%}  VaR(99%)={var_99:.3%}  ES(99%)={es_99:.3%}")
    return {"el": exp_loss, "var_99": var_99, "es_99": es_99}`,
    explanation:
      "The Gaussian copula became infamous post-2008 for underestimating correlation in stress — when the market factor M is extreme, ALL names default together. The key parameter is rho: even rho=0.3 produces a fat-tailed loss distribution, but the Gaussian tail underweights extreme market scenarios versus a t-copula.",
  },
  {
    id: "pyfin-20260523-b1-fama-french",
    language: "python",
    title: "Fama-French 3-factor model (OLS betas + alpha)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def fama_french_3f(asset_returns: pd.Series,
                    mkt_rf: pd.Series,
                    smb: pd.Series,
                    hml: pd.Series,
                    rf: pd.Series) -> dict:
    """
    Regress excess asset returns on 3 Fama-French factors:
    MKT-RF: market excess return (equity risk premium)
    SMB:    Small Minus Big (size premium)
    HML:    High Minus Low book-to-market (value premium)

    Returns alpha (annualised), betas, t-stats, R².
    """
    excess = asset_returns - rf

    X = pd.DataFrame({
        'MKT-RF': mkt_rf,
        'SMB':    smb,
        'HML':    hml,
    }, index=asset_returns.index)
    X = sm.add_constant(X.dropna())
    y = excess.reindex(X.index).dropna()
    X = X.reindex(y.index)

    res = sm.OLS(y, X).fit(cov_type='HAC', cov_kwds={'maxlags': 5})

    result = {
        'alpha_daily':    res.params['const'],
        'alpha_annual':   res.params['const'] * 252,
        'alpha_tstat':    res.tvalues['const'],
        'beta_mkt':       res.params['MKT-RF'],
        'beta_smb':       res.params['SMB'],
        'beta_hml':       res.params['HML'],
        'r_squared':      res.rsquared,
    }

    print(f"Annual alpha: {result['alpha_annual']:.2%}  t-stat: {result['alpha_tstat']:.2f}")
    print(f"Betas: MKT={result['beta_mkt']:.2f}  SMB={result['beta_smb']:.2f}  HML={result['beta_hml']:.2f}")
    print(f"R²: {result['r_squared']:.3f}")
    return result`,
    explanation:
      "Fama-French (1993) shows that most cross-sectional return variation is explained by market beta, size, and value exposures. A statistically significant alpha (t > 2) after controlling for all three factors is the bar for claiming genuine skill. HAC standard errors (Newey-West) correct for return autocorrelation.",
  },
  {
    id: "pyfin-20260523-b1-pca-returns",
    language: "python",
    title: "PCA factor extraction from equity returns",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def pca_factors(returns: pd.DataFrame, n_factors: int = 5) -> dict:
    """
    PCA on the covariance matrix of asset returns.
    PC1 is almost always 'the market' (all positive loadings).
    PC2 is typically a 'large vs small cap' contrast.
    PC3 is often a 'value vs growth' contrast.
    Returns factor returns, loadings, and variance explained.
    """
    R = returns.dropna().values        # (T, N)
    T, N = R.shape

    # De-mean cross-sectionally (each date)
    R_dm = R - R.mean(axis=1, keepdims=True)

    # Sample covariance (annualised)
    cov = np.cov(R_dm, rowvar=False) * 252   # (N, N)

    # Eigendecomposition — eigh for symmetric matrices (stable, sorted ascending)
    vals, vecs = np.linalg.eigh(cov)
    idx  = np.argsort(vals)[::-1]            # sort descending
    vals = vals[idx]
    vecs = vecs[:, idx]                       # (N, n_factors) loadings

    loadings      = vecs[:, :n_factors]       # (N, n_factors)
    factor_rets   = R_dm @ loadings           # (T, n_factors) time series
    var_explained = vals[:n_factors] / vals.sum()

    for i in range(n_factors):
        print(f"PC{i+1}: {var_explained[i]:.1%} variance explained")

    return {
        "loadings":       pd.DataFrame(loadings, index=returns.columns),
        "factor_returns": pd.DataFrame(factor_rets, index=returns.index),
        "var_explained":  var_explained,
        "eigenvalues":    vals[:n_factors],
    }`,
    explanation:
      "The first principal component of an equity covariance matrix typically explains 30-60% of variance and corresponds to the market factor — all loadings are positive. This is why a long-only portfolio almost always has high PC1 exposure regardless of its stated style.",
  },
  {
    id: "pyfin-20260523-b1-hrp",
    language: "python",
    title: "Hierarchical Risk Parity (HRP) portfolio construction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, leaves_list
from scipy.spatial.distance import squareform

def hrp_weights(returns: pd.DataFrame) -> pd.Series:
    """
    Lopez de Prado (2016) Hierarchical Risk Parity:
    1. Compute correlation-based distance matrix.
    2. Cluster assets via single-linkage hierarchical clustering.
    3. Recursive bisection: allocate inverse-variance within each cluster.
    Unlike MVO, HRP requires no matrix inversion — robust to noisy covariance.
    """
    cov   = returns.cov().values
    corr  = returns.corr().values
    n     = len(returns.columns)

    # Distance matrix: d(i,j) = sqrt(0.5*(1 - rho_ij))
    dist = np.sqrt(0.5 * (1.0 - corr))
    np.fill_diagonal(dist, 0.0)

    # Hierarchical clustering (single linkage on upper triangle)
    link    = linkage(squareform(dist), method='single')
    order   = leaves_list(link)   # reordering of assets by similarity

    # Recursive bisection
    weights = pd.Series(1.0, index=returns.columns)

    def bisect(items):
        if len(items) <= 1:
            return
        mid   = len(items) // 2
        left  = items[:mid]
        right = items[mid:]

        # Inverse variance of each cluster
        def cluster_var(idx):
            sub_cov = cov[np.ix_(idx, idx)]
            w       = 1.0 / np.diag(sub_cov)
            w      /= w.sum()
            return float(w @ sub_cov @ w)

        cv_l = cluster_var(left)
        cv_r = cluster_var(right)
        alpha = 1.0 - cv_l / (cv_l + cv_r)   # fraction to right cluster

        weights.iloc[right] *= alpha
        weights.iloc[left]  *= (1.0 - alpha)
        bisect(left)
        bisect(right)

    bisect(order)
    return weights / weights.sum()`,
    explanation:
      "HRP clusters assets by correlation distance and recursively allocates risk between sub-clusters via inverse-variance weighting. It avoids the matrix inversion in MVO (which amplifies estimation error) while still achieving risk diversification — producing more stable and out-of-sample robust portfolios.",
  },
  {
    id: "pyfin-20260523-b1-margrabe",
    language: "python",
    title: "Spread option pricing — Margrabe formula",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def margrabe_spread(S1: float, S2: float,
                    sigma1: float, sigma2: float, rho: float,
                    q1: float, q2: float,
                    T: float) -> float:
    """
    Margrabe (1978) formula: price of max(S1 - S2, 0) at T.
    Useful for: crack spreads (oil-gasoline), crush spreads (soybean),
    bond futures calendar spreads, equity pairs.
    sigma_spread = sqrt(sigma1^2 + sigma2^2 - 2*rho*sigma1*sigma2).
    """
    sigma = np.sqrt(sigma1**2 + sigma2**2 - 2*rho*sigma1*sigma2)
    F1    = S1 * np.exp(-q1 * T)    # forward of S1
    F2    = S2 * np.exp(-q2 * T)    # forward of S2

    d1 = (np.log(F1 / F2) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    call = F1 * norm.cdf(d1) - F2 * norm.cdf(d2)
    # Delta w.r.t. S1: exp(-q1*T)*N(d1); w.r.t. S2: -exp(-q2*T)*N(d2)
    delta1 = np.exp(-q1*T) * norm.cdf(d1)
    delta2 = -np.exp(-q2*T) * norm.cdf(d2)

    print(f"Spread call: {call:.4f}  delta1: {delta1:.4f}  delta2: {delta2:.4f}")
    return call

# Example: crude-gasoline crack spread option
margrabe_spread(S1=90.0, S2=85.0, sigma1=0.30, sigma2=0.25,
                rho=0.85, q1=0.0, q2=0.0, T=0.5)`,
    explanation:
      "Margrabe's formula prices exchange options (option to swap one asset for another) as a Black-Scholes call on the ratio F1/F2. The effective vol is the spread vol — lower than either individual vol when the correlation is high, reflecting the diversification of the spread. Used extensively in commodity trading.",
  },
  {
    id: "pyfin-20260523-b1-lookback-mc",
    language: "python",
    title: "Floating-strike lookback option Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def lookback_call_mc(S0: float, r: float, sigma: float, T: float,
                      n_steps: int = 252, n_paths: int = 100_000,
                      seed: int = 42) -> dict:
    """
    Floating-strike lookback call: payoff = S_T - min(S_t, 0<=t<=T).
    Buy at the cheapest price observed — maximum hindsight.
    Also compute the fixed-strike lookback: payoff = max(max(S_t) - K, 0).
    """
    rng   = np.random.default_rng(seed)
    dt    = T / n_steps
    drift = (r - 0.5*sigma**2)*dt
    vol   = sigma * np.sqrt(dt)
    disc  = np.exp(-r*T)

    Z     = rng.standard_normal((n_paths, n_steps))
    lr    = np.exp(drift + vol * Z)          # log-return increments
    paths = np.hstack([np.ones((n_paths, 1)) * S0,
                       np.cumprod(lr, axis=1) * S0])  # (n_paths, n_steps+1)
    paths[:, 1:] = np.cumprod(lr, axis=1) * S0

    S_T   = paths[:, -1]
    S_min = paths.min(axis=1)
    S_max = paths.max(axis=1)

    float_call  = float(disc * np.mean(S_T - S_min))
    fixed_call  = float(disc * np.mean(np.maximum(S_max - S0, 0.0)))  # ATM

    print(f"Float lookback call: {float_call:.4f}")
    print(f"Fixed lookback call (K=S0): {fixed_call:.4f}")
    return {"float": float_call, "fixed_atm": fixed_call}`,
    explanation:
      "Lookback options are the most expensive path-dependent structure — delta is always near 1 for the floating-strike call. The vectorised simulation stores full paths in a matrix and uses numpy's min/max over the time axis, making it fast despite computing all path extrema.",
  },
  {
    id: "pyfin-20260523-b1-variance-swap",
    language: "python",
    title: "Variance swap replication and fair strike",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def variance_swap_strike(F: float, r: float, T: float,
                           strike_grid: np.ndarray,
                           call_prices: np.ndarray,
                           put_prices:  np.ndarray) -> float:
    """
    Britten-Jones & Neuberger (2000) / Carr-Madan replication:
    K_var = (2/T) * [sum(P(K)/K^2 * dK for K < F) + sum(C(K)/K^2 * dK for K >= F)]
    Converted to log-space: K_var = (2/T) * integral of option_price/K^2 dK.
    The fair variance strike is the expected realised variance under Q.
    """
    dK = np.diff(strike_grid)   # assumes uniform grid for simplicity

    pv_calls = call_prices[:-1][(strike_grid[:-1] >= F)]
    pv_puts  = put_prices[:-1][(strike_grid[:-1] < F)]
    K_calls  = strike_grid[:-1][(strike_grid[:-1] >= F)]
    K_puts   = strike_grid[:-1][(strike_grid[:-1] < F)]
    dK_c     = dK[(strike_grid[:-1] >= F)]
    dK_p     = dK[(strike_grid[:-1] < F)]

    integral = (np.sum(pv_calls / K_calls**2 * dK_c)
              + np.sum(pv_puts  / K_puts**2  * dK_p))
    K_var = (2.0 / T) * np.exp(r * T) * integral   # annualised variance
    K_vol = np.sqrt(K_var)

    print(f"Fair variance strike: {K_var:.4f}  Implied vol: {K_vol:.4f}")
    return K_var`,
    explanation:
      "A variance swap pays realised variance minus the fair strike, with the strike set so the contract is worth zero at inception. The model-free replication formula integrates all OTM option prices weighted by 1/K² — it works for any continuous underlying dynamics, not just Black-Scholes.",
  },
  {
    id: "pyfin-20260523-b1-fd-greeks",
    language: "python",
    title: "Greeks via finite difference (bump-and-reval)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, q, sigma, T):
    if T <= 0 or sigma <= 0: return max(S - K, 0.0)
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / sT
    d2 = d1 - sT
    return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def fd_greeks(S, K, r, q, sigma, T,
               dS=0.01, dsigma=0.001, dT=1/252, dr=0.0001) -> dict:
    """
    Bump-and-reval finite difference Greeks.
    Central differences are second-order accurate: f'(x) ≈ (f(x+h) - f(x-h)) / 2h.
    Gamma uses second difference: f''(x) ≈ (f(x+h) - 2f(x) + f(x-h)) / h^2.
    """
    V     = bs_call(S, K, r, q, sigma, T)
    V_Su  = bs_call(S+dS, K, r, q, sigma, T)
    V_Sd  = bs_call(S-dS, K, r, q, sigma, T)
    V_vu  = bs_call(S, K, r, q, sigma+dsigma, T)
    V_vd  = bs_call(S, K, r, q, sigma-dsigma, T)
    V_Tu  = bs_call(S, K, r, q, sigma, T+dT)
    V_Td  = bs_call(S, K, r, q, sigma, T-dT) if T > dT else V
    V_ru  = bs_call(S, K, r+dr, q, sigma, T)

    return {
        "price":  V,
        "delta":  (V_Su - V_Sd) / (2*dS),
        "gamma":  (V_Su - 2*V + V_Sd) / (dS**2),
        "vega":   (V_vu - V_vd) / (2*dsigma) * 0.01,   # per 1% vol move
        "theta":  (V_Td - V_Tu) / (2*dT),               # per day
        "rho":    (V_ru - V)    / dr * 0.01,             # per 1% rate move
    }`,
    explanation:
      "Finite-difference Greeks (bump-and-reval) are model-agnostic: they work for any pricing function including MC, PDE, or tree pricers. Central differences are second-order accurate at the cost of two function evaluations per Greek. For MC greeks, the pathwise and likelihood-ratio methods are more efficient at high dimension.",
  },
  {
    id: "pyfin-20260523-b1-credit-migration",
    language: "python",
    title: "Credit rating migration matrix (Markov chain)",
    tag: "finance",
    code: `import numpy as np

# Moody's-style 7-state annual transition matrix (simplified):
# States: Aaa, Aa, A, Baa, Ba, B, Default
MIGRATION = np.array([
    [0.921, 0.070, 0.007, 0.001, 0.001, 0.000, 0.000],  # Aaa
    [0.008, 0.907, 0.074, 0.008, 0.002, 0.001, 0.000],  # Aa
    [0.001, 0.022, 0.911, 0.055, 0.008, 0.002, 0.001],  # A
    [0.000, 0.003, 0.051, 0.873, 0.057, 0.013, 0.003],  # Baa
    [0.000, 0.001, 0.006, 0.067, 0.820, 0.087, 0.019],  # Ba
    [0.000, 0.001, 0.002, 0.013, 0.067, 0.836, 0.081],  # B
    [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 1.000],  # Default (absorbing)
])

def default_probs_horizon(initial_state: int, horizon_years: int,
                           M: np.ndarray = MIGRATION) -> np.ndarray:
    """Compute default probabilities at each year up to horizon via matrix powers."""
    Mk = M.copy()
    pds = np.zeros(horizon_years)
    for t in range(horizon_years):
        pds[t] = Mk[initial_state, -1]   # probability of being in Default at year t+1
        Mk = Mk @ M

    return pds

def conditional_default_prob(initial_state: int, year: int,
                               M: np.ndarray = MIGRATION) -> float:
    """P(default in year t | alive at year t-1) = marginal hazard rate."""
    M_t   = np.linalg.matrix_power(M[:-1, :-1], year-1)   # transient submatrix
    M_t1  = np.linalg.matrix_power(M[:-1, :-1], year)
    pd_t  = 1.0 - M_t1[initial_state].sum()
    pd_t1 = 1.0 - M_t[initial_state].sum()
    return (pd_t - pd_t1) / max(pd_t1, 1e-12)`,
    explanation:
      "Rating migration matrices encode the Markov chain of credit quality. The default column is absorbing (once in default, stay there). Matrix exponentiation gives multi-year default probabilities; the conditional annual default probability (hazard rate) is used to bootstrap CDS curves and price credit derivatives.",
  },
  {
    id: "pyfin-20260523-b1-black-karasinski",
    language: "python",
    title: "Black-Karasinski log-normal short-rate simulation",
    tag: "finance",
    code: `import numpy as np

def black_karasinski_sim(a: float, sigma: float,
                           theta_t,   # callable: theta_t(t) -> float
                           r0: float, T: float,
                           n_steps: int = 252,
                           n_paths: int = 10_000,
                           seed: int = 42) -> np.ndarray:
    """
    Black-Karasinski: d(ln r) = [theta(t) - a*ln(r)] dt + sigma*dW
    r = exp(x),  x follows mean-reverting OU process in log space.
    theta(t) is calibrated to fit the initial term structure.
    Uses Euler-Maruyama; exact update exists (same as Vasicek in log space).
    Returns: (n_paths, n_steps+1) array of short rates.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    sqrt_dt = np.sqrt(dt)

    ln_r = np.full(n_paths, np.log(r0))      # log-rate paths
    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = r0

    for i in range(n_steps):
        t = i * dt
        Z = rng.standard_normal(n_paths)
        ln_r = (ln_r
                + (theta_t(t) - a * ln_r) * dt
                + sigma * sqrt_dt * Z)
        paths[:, i+1] = np.exp(ln_r)   # back to rate space

    return paths

# Example: flat theta calibrated to reproduce r0 = 5% in expectation
bk_paths = black_karasinski_sim(
    a=0.15, sigma=0.12,
    theta_t=lambda t: np.log(0.05) * 0.15 + 0.5 * 0.12**2,  # flat term structure
    r0=0.05, T=5.0, n_steps=252*5, n_paths=5000)
print(f"Mean terminal rate: {bk_paths[:, -1].mean():.4f}")
print(f"Std terminal rate:  {bk_paths[:, -1].std():.4f}")`,
    explanation:
      "Black-Karasinski is log-normal in the short rate, guaranteeing positive rates — the key advantage over the Gaussian Vasicek/Hull-White models. It loses the analytic bond price formula but can be calibrated to both the term structure and cap vol surface. Used for products where negative-rate scenarios are economically implausible.",
  },
  {
    id: "pyfin-20260523-b1-market-impact",
    language: "python",
    title: "Almgren-Chriss market impact in a vectorised backtest",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def backtest_with_impact(prices: pd.Series,
                          signal: pd.Series,
                          eta: float = 2.5e-6,    # temporary impact: $ per (share/ADV)
                          gamma: float = 1.0e-6,  # permanent impact
                          adv: float = 1e6,        # average daily volume (shares)
                          cost_bps: float = 1.0) -> pd.DataFrame:
    """
    Add Almgren-Chriss market impact to a vectorised backtest.
    Temporary impact: cost of trading at rate v = dX/dt is eta * (v/ADV)^alpha.
    Simple linear approximation: temp_impact ~ eta * |trade_qty| / ADV.
    Permanent impact: shifts the price permanently by gamma * signed_qty / ADV.
    """
    pos     = signal.shift(1).fillna(0.0).clip(-1, 1)   # target position
    trade   = pos.diff().fillna(0.0)                      # signed trade

    ret     = np.log(prices / prices.shift(1))

    # Temporary impact cost per trade
    temp_impact = eta * trade.abs() / adv

    # Permanent impact adjusts the effective execution price
    perm_impact = gamma * trade / adv

    # Simple flat commission
    commission  = trade.abs() * cost_bps * 1e-4

    pnl_gross = pos * ret
    pnl_net   = pnl_gross - temp_impact - perm_impact.abs() - commission

    result = pd.DataFrame({
        'position':   pos,
        'trade':      trade,
        'ret':        ret,
        'pnl_gross':  pnl_gross,
        'pnl_net':    pnl_net,
        'cum_net':    pnl_net.cumsum().apply(np.exp),
    })

    sharpe_net = np.sqrt(252) * pnl_net.mean() / pnl_net.std(ddof=1)
    print(f"Sharpe (gross): {np.sqrt(252)*pnl_gross.mean()/pnl_gross.std():.2f}")
    print(f"Sharpe (net):   {sharpe_net:.2f}")
    return result`,
    explanation:
      "Market impact is frequently the largest cost for institutional strategies. Temporary impact (proportional to participation rate) reflects the intraday pressure of your own trading; permanent impact (price moves away permanently) models information leakage. Together they determine the minimum signal strength needed to justify trading.",
  },
  {
    id: "pyfin-20260523-b1-yield-pca",
    language: "python",
    title: "Yield curve PCA — level, slope, curvature factors",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def yield_curve_pca(yields_df: pd.DataFrame, n_factors: int = 3) -> dict:
    """
    PCA on daily yield changes (not levels — levels are non-stationary).
    PC1 ≈ 'level' (parallel shift): all loadings same sign.
    PC2 ≈ 'slope' (twist): short end vs long end loadings of opposite sign.
    PC3 ≈ 'curvature' (butterfly): belly moves vs wings.
    Explains ~95-99% of daily yield variance in practice.
    """
    dy = yields_df.diff().dropna()   # daily changes (stationary)
    dy_vals = dy.values              # (T, N_maturities)

    # Covariance matrix of yield changes
    C = np.cov(dy_vals, rowvar=False)

    vals, vecs = np.linalg.eigh(C)
    # Sort descending
    idx  = np.argsort(vals)[::-1]
    vals = vals[idx]
    vecs = vecs[:, idx]

    # Convention: PC1 loadings should be positive (level = parallel up shift)
    for k in range(n_factors):
        if vecs[:, k].mean() < 0:
            vecs[:, k] *= -1.0

    var_exp   = vals[:n_factors] / vals.sum()
    factors   = dy_vals @ vecs[:, :n_factors]  # (T, n_factors) factor shocks
    mats      = yields_df.columns.astype(float).tolist()

    for i, label in enumerate(['Level', 'Slope', 'Curvature'][:n_factors]):
        print(f"PC{i+1} ({label}): {var_exp[i]:.1%} variance explained")

    return {
        "loadings":   pd.DataFrame(vecs[:, :n_factors], index=yields_df.columns,
                                   columns=[f'PC{i+1}' for i in range(n_factors)]),
        "factors":    pd.DataFrame(factors, index=dy.index,
                                   columns=[f'PC{i+1}' for i in range(n_factors)]),
        "var_explained": var_exp,
    }`,
    explanation:
      "Yield curve PCA is the standard tool for identifying and hedging rate exposures. A DV01-neutral position is not curvature-neutral: a butterfly trade with PC2 and PC3 neutrality requires three instruments. The three-factor model typically explains 95%+ of yield variance, leaving only idiosyncratic noise.",
  },
];
